import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validasi format UUID: jika bukan UUID valid, kembalikan HTTP 404
  if (!id || !UUID_REGEX.test(id)) {
    return new NextResponse("Tautan produk tidak valid atau tidak ditemukan.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const supabase = getServerSupabase();

  // Dapatkan session ID dari cookie atau generate dari IP + User-Agent
  let sessionId = request.cookies.get("udalink_session")?.value;
  let isNewSession = false;
  if (!sessionId) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anon";
    const ua = request.headers.get("user-agent")?.slice(0, 40) || "unknown";
    sessionId = `${ip}_${ua}`;
    isNewSession = true;
  }

  let targetUrl: string | null = null;

  // Catat klik via RPC record_click (di sisi server, dengan proteksi deduplikasi)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc("record_click", {
      p_product_id: id,
      p_session_id: sessionId,
    });

    if (rpcData && typeof rpcData === "object" && "affiliate_url" in rpcData) {
      targetUrl = (rpcData as { affiliate_url: string }).affiliate_url;
    } else if (rpcErr) {
      console.warn("RPC record_click warning/fallback:", rpcErr.message);
    }
  } catch (err) {
    console.warn("RPC record_click exception:", err);
  }

  // Fallback: jika RPC gagal atau mengembalikan kosong, query langsung tabel products
  if (!targetUrl) {
    const { data: product } = await supabase
      .from("products")
      .select("affiliate_url, is_active")
      .eq("id", id)
      .single();

    if (!product || !product.is_active || !product.affiliate_url) {
      return new NextResponse("Produk tidak ditemukan atau sedang tidak aktif.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    targetUrl = product.affiliate_url;
  }

  if (!targetUrl) {
    return new NextResponse("Produk tidak ditemukan atau sedang tidak aktif.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Normalisasi URL tujuan
  const finalUrl =
    targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
      ? targetUrl
      : `https://${targetUrl}`;

  // Redirect 302 ke marketplace
  const response = NextResponse.redirect(finalUrl, { status: 302 });

  if (isNewSession) {
    response.cookies.set("udalink_session", sessionId, {
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
