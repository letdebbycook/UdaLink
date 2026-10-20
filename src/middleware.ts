import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Otomatis tangkap dan teruskan code OAuth dari Google/Supabase jika mendarat di luar /auth/callback
  const searchParams = request.nextUrl.searchParams;
  if (searchParams.has("code") && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Proteksi dan Redireksi Halaman Dashboard (/dashboard/...)
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = new URL("/masuk", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Role admin langsung diarahkan ke panel admin saja
    const { data: membership } = await supabase
      .from("memberships")
      .select("role, is_suspended")
      .eq("user_id", user.id)
      .single();

    if (membership?.is_suspended === true) {
      return NextResponse.redirect(new URL("/akun-dinonaktifkan", request.url));
    }

    if (membership?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 2. Proteksi Halaman Admin (/admin/...)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = new URL("/masuk", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Cek role admin dari tabel memberships
    const { data: membership } = await supabase
      .from("memberships")
      .select("role, is_suspended")
      .eq("user_id", user.id)
      .single();

    if (membership?.is_suspended === true) {
      return NextResponse.redirect(new URL("/akun-dinonaktifkan", request.url));
    }

    if (!membership || membership.role !== "admin") {
      // Jika bukan admin, lempar ke dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Jika sudah login, cegah buka halaman /masuk atau /daftar
  if (user && (pathname === "/masuk" || pathname === "/daftar")) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role, is_suspended")
      .eq("user_id", user.id)
      .single();

    if (membership?.is_suspended === true) {
      return NextResponse.redirect(new URL("/akun-dinonaktifkan", request.url));
    }

    if (membership?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Cek akses ke halaman akun-dinonaktifkan
  const isSuspendedPage = pathname === "/akun-dinonaktifkan";
  if (user && isSuspendedPage) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role, is_suspended")
      .eq("user_id", user.id)
      .single();

    if (!membership?.is_suspended) {
      if (membership?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/masuk",
    "/daftar",
    "/akun-dinonaktifkan",
  ],
};
