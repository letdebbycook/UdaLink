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

  if (!id || !UUID_REGEX.test(id)) {
    return new NextResponse("Tautan banner tidak valid atau tidak ditemukan.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const supabase = getServerSupabase();

  // Dapatkan session ID untuk deduplikasi klik
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

  // Catat klik via RPC record_banner_click
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "record_banner_click",
      {
        p_banner_id: id,
        p_session_id: sessionId,
      }
    );

    if (rpcData && typeof rpcData === "object" && "link_url" in rpcData) {
      targetUrl = (rpcData as { link_url: string }).link_url;
    } else if (rpcErr) {
      console.warn("RPC record_banner_click fallback:", rpcErr.message);
    }
  } catch (err) {
    console.warn("RPC record_banner_click exception:", err);
  }

  // Fallback: direct query jika RPC belum mengembalikan link_url
  if (!targetUrl) {
    const { data: banner, error } = await supabase
      .from("banners")
      .select("id, link_url, is_active")
      .eq("id", id)
      .single();

    if (error || !banner || !banner.is_active || !banner.link_url) {
      return new NextResponse("Banner tidak ditemukan atau tautan tidak tersedia.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    targetUrl = banner.link_url;
  }

  if (!targetUrl) {
    return new NextResponse("Banner tidak ditemukan atau tautan tidak tersedia.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const finalUrl =
    targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
      ? targetUrl
      : `https://${targetUrl}`;

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
