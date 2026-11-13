import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Helper tunggal untuk query membership dengan penanganan maybeSingle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMembership(supabase: any, userId: string) {
  const { data: membership } = await supabase
    .from("memberships")
    .select("role, is_suspended")
    .eq("user_id", userId)
    .maybeSingle();
  return membership;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Otomatis tangkap dan teruskan code OAuth dari Google/Supabase jika mendarat di luar /auth/callback
  const searchParams = request.nextUrl.searchParams;
  if (searchParams.has("code") && !pathname.startsWith("/auth/callback")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  // Fail-closed jika environment Supabase belum disetel (S1-06)
  if (!supabaseUrl || !supabaseAnonKey) {
    const isProtectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
    if (isProtectedPath) {
      return new NextResponse(
        "Kesalahan Konfigurasi Server: Kunci Supabase belum disetel di server environment.",
        { status: 500 }
      );
    }
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

  // 1. Proteksi dan Redireksi Halaman Dashboard (/dashboard/...)
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = new URL("/masuk", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const membership = await getMembership(supabase, user.id);

    // Fail-closed jika akun user tidak memiliki data membership valid (S1-04)
    if (!membership) {
      const redirectUrl = new URL("/masuk", request.url);
      redirectUrl.searchParams.set("error", "membership_not_found");
      return NextResponse.redirect(redirectUrl);
    }

    if (membership.is_suspended === true) {
      return NextResponse.redirect(new URL("/akun-dinonaktifkan", request.url));
    }

    if (membership.role === "admin") {
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

    const membership = await getMembership(supabase, user.id);

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
    const membership = await getMembership(supabase, user.id);

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
    const membership = await getMembership(supabase, user.id);

    if (!membership?.is_suspended) {
      if (membership?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 5. Cegah caching browser / bfcache untuk halaman terproteksi (Dashboard & Admin)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/masuk",
    "/daftar",
    "/akun-dinonaktifkan",
  ],
};
