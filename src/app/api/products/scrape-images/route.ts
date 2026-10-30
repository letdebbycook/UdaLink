import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Normalisasi URL gambar jika berupa relative path atau scheme-relative
 */
function normalizeImageUrl(rawUrl: string, baseUrl: string): string | null {
  try {
    let clean = rawUrl.trim();
    if (!clean) return null;

    if (clean.startsWith("//")) {
      clean = `https:${clean}`;
    } else if (clean.startsWith("/")) {
      const parsedBase = new URL(baseUrl);
      clean = `${parsedBase.origin}${clean}`;
    }

    const parsed = new URL(clean);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Akses ditolak: pengguna belum login." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL produk tidak valid." },
        { status: 400 }
      );
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    // Lakukan HTTP GET dengan headers yang menyerupai browser pengguna nyata
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 detik timeout

    let html = "";
    let finalUrl = targetUrl;

    try {
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Sec-Ch-Ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
        },
        redirect: "follow",
        next: { revalidate: 0 },
      });

      finalUrl = response.url || targetUrl;
      html = await response.text();
    } catch (fetchErr: unknown) {
      const isAbort =
        fetchErr instanceof Error && fetchErr.name === "AbortError";
      return NextResponse.json(
        {
          error: isAbort
            ? "Waktu permintaan habis saat mengakses link e-commerce."
            : "Gagal mengakses link e-commerce. Pastikan tautan aktif dan dapat diakses.",
        },
        { status: 504 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!html) {
      return NextResponse.json(
        { error: "Halaman e-commerce tidak mengembalikan konten." },
        { status: 422 }
      );
    }

    const imageCandidates: string[] = [];

    // 1. Ekstrak meta Open Graph & Twitter Card
    const ogPatterns = [
      /<meta\s+[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/gi,
      /<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/gi,
      /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi,
      /<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/gi,
      /<meta\s+[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/gi,
      /<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/gi,
      /<link\s+[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/gi,
    ];

    for (const pattern of ogPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        if (match[1]) imageCandidates.push(match[1]);
      }
    }

    // 2. Ekstrak JSON-LD schema (schema.org/Product)
    const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let ldMatch;
    while ((ldMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const rawJson = ldMatch[1].trim();
        const parsed = JSON.parse(rawJson);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          if (
            item &&
            (item["@type"] === "Product" || item["@type"] === "IndividualProduct")
          ) {
            if (typeof item.image === "string") {
              imageCandidates.push(item.image);
            } else if (Array.isArray(item.image)) {
              for (const img of item.image) {
                if (typeof img === "string") imageCandidates.push(img);
                else if (img && typeof img.url === "string")
                  imageCandidates.push(img.url);
              }
            }
          }
        }
      } catch {
        // Abaikan parse error pada script JSON-LD yang invalid
      }
    }

    // 3. Ekstrak CDN image patterns khas marketplace di Indonesia
    // Shopee CDN: cf.shopee.co.id/file/... atau down-id.img.susercontent.com/file/...
    const shopeeRegex = /https:\/\/(?:cf\.shopee\.co\.id|down-id\.img\.susercontent\.com|down-ws-id\.img\.susercontent\.com)\/file\/([a-zA-Z0-9_-]{20,})/gi;
    let spMatch;
    while ((spMatch = shopeeRegex.exec(html)) !== null) {
      imageCandidates.push(spMatch[0]);
    }

    // Tokopedia CDN: images.tokopedia.net/img/cache/...
    const tokpedRegex = /https:\/\/images\.tokopedia\.net\/img\/cache\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)/gi;
    let tpMatch;
    while ((tpMatch = tokpedRegex.exec(html)) !== null) {
      // Saring bukan logo / avatar tokopedia
      if (!tpMatch[0].includes("avatar") && !tpMatch[0].includes("icon")) {
        imageCandidates.push(tpMatch[0]);
      }
    }

    // 4. Normalisasi dan deduplikasi
    const uniqueImages: string[] = [];
    const seen = new Set<string>();

    for (const raw of imageCandidates) {
      const normalized = normalizeImageUrl(raw, finalUrl);
      if (normalized && !seen.has(normalized)) {
        // Saring icon / pixel tracker / badge kecil
        if (
          !normalized.includes("favicon") &&
          !normalized.includes("logo") &&
          !normalized.includes("placeholder") &&
          !normalized.includes("badge") &&
          !normalized.endsWith(".svg")
        ) {
          seen.add(normalized);
          uniqueImages.push(normalized);
        }
      }
      if (uniqueImages.length >= 8) break;
    }

    // Ekstrak perkiraan judul produk (og:title atau <title>)
    let detectedTitle: string | undefined = undefined;
    const titleOgMatch = /<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(
      html
    );
    if (titleOgMatch && titleOgMatch[1]) {
      detectedTitle = titleOgMatch[1].trim();
    } else {
      const titleTagMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
      if (titleTagMatch && titleTagMatch[1]) {
        detectedTitle = titleTagMatch[1].trim();
      }
    }

    // Bersihkan suffix title yang umum di marketplace (misal: " | Shopee Indonesia", " - Tokopedia")
    if (detectedTitle) {
      detectedTitle = detectedTitle
        .replace(/\s*[-|]\s*(Shopee|Tokopedia|Lazada|TikTok Shop|Blibli).*$/i, "")
        .replace(/^Jual\s+/i, "")
        .trim();
    }

    if (uniqueImages.length === 0) {
      return NextResponse.json({
        success: false,
        message:
          "Tidak ditemukan foto produk pada link ini (kemungkinan karena proteksi halaman atau login e-commerce). Silakan gunakan opsi upload foto lokal atau salin link gambar langsung.",
        images: [],
        title: detectedTitle,
      });
    }

    return NextResponse.json({
      success: true,
      images: uniqueImages.slice(0, 5), // Maksimal 5 gambar
      title: detectedTitle,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Terjadi kesalahan saat memproses link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
