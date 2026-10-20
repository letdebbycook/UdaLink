import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Callback OAuth (mis. Google) dengan flow PKCE.
 * Supabase menukar `code` menjadi sesi melalui server client di sini,
 * lalu sesi disimpan sebagai cookie httpOnly.
 */

// Tujuan redirect hanya boleh path internal yang dikenal, mencegah open redirect
const SAFE_REDIRECT_PATHS = ["/dashboard", "/admin"];

function safeInternalPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }
  return SAFE_REDIRECT_PATHS.find((p) => raw === p || raw.startsWith(`${p}/`)) ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  // 1. Google atau Supabase mengembalikan error (login dibatalkan, akses ditolak, dsb.)
  const oauthError =
    searchParams.get("error") ||
    searchParams.get("error_description") ||
    searchParams.get("error_code");

  if (oauthError) {
    const url = new URL("/masuk", origin);
    url.searchParams.set("error", oauthError);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL("/masuk", origin);
    url.searchParams.set("error", "Kode otorisasi tidak ditemukan. Silakan coba lagi.");
    return NextResponse.redirect(url);
  }

  const supabase = await createSupabaseServerClient();

  // 2. Tukar code menjadi sesi (PKCE)
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    const url = new URL("/masuk", origin);
    url.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(url);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/masuk", origin);
    url.searchParams.set("error", "Sesi tidak valid setelah login. Silakan coba lagi.");
    return NextResponse.redirect(url);
  }

  // 3. Konfirmasi Google: verifikasi bahwa email pengguna terverifikasi
  //    oleh penyedia identitas (Google), bukan dari input client.
  //    Untuk akun email/password (tanpa identitas OAuth), pemeriksaan dilewati.
  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google"
  );

  if (googleIdentity) {
    const emailVerified =
      (googleIdentity.identity_data as { email_verified?: boolean } | null)
        ?.email_verified === true;

    if (!emailVerified) {
      await supabase.auth.signOut();
      const url = new URL("/masuk", origin);
      url.searchParams.set(
        "error",
        "Email akun Google kamu belum terverifikasi. Verifikasi dulu emailmu di Google, lalu coba masuk lagi."
      );
      return NextResponse.redirect(url);
    }
  }

  // 4. Redirect sesuai role: admin ke panel admin, pengguna lain ke tujuan yang aman
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (membership?.role === "admin" && (!next || !next.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/admin", origin));
  }

  return NextResponse.redirect(new URL(next ?? "/dashboard", origin));
}
