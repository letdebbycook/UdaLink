import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getServerUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "URL gambar tidak valid atau kosong." },
        { status: 400 }
      );
    }

    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "URL gambar harus berawalan http:// atau https://" },
        { status: 400 }
      );
    }

    // Unduh gambar dari URL
    const response = await fetch(trimmedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Gagal mengunduh gambar dari sumber (HTTP ${response.status}). Pastikan link dapat diakses publik.`,
        },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.startsWith("image/") &&
      !contentType.includes("octet-stream")
    ) {
      return NextResponse.json(
        { error: "Tautan yang dimasukkan bukan merupakan file gambar yang valid." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Batasi ukuran maksimal 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran gambar terlalu besar (maksimal 5 MB)." },
        { status: 400 }
      );
    }

    // Tentukan ekstensi file
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";
    else if (contentType.includes("jpeg")) ext = "jpg";

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    const supabase = await createSupabaseServerClient();
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: contentType || `image/${ext}`,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Gagal menyimpan gambar ke penyimpanan: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      originalUrl: trimmedUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
