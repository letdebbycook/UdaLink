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

  // 1. Proteksi Halaman Dashboard (/dashboard/...)
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = new URL("/masuk", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
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

    if (!membership || membership.role !== "admin") {
      // Jika bukan admin, lempar ke dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Jika sudah login, cegah buka halaman /masuk
  if (user && pathname === "/masuk") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Cek akun dinonaktifkan (is_suspended) untuk user yang sudah login di rute terproteksi
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isSuspendedPage = pathname === "/akun-dinonaktifkan";

  if (user && isProtectedRoute && !isSuspendedPage) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("is_suspended")
      .eq("user_id", user.id)
      .single();

    if (membership?.is_suspended === true) {
      return NextResponse.redirect(new URL("/akun-dinonaktifkan", request.url));
    }
  }

  // 5. Jika sudah login dan tidak suspended, cegah akses ke halaman dinonaktifkan
  if (user && isSuspendedPage) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("is_suspended")
      .eq("user_id", user.id)
      .single();

    if (!membership?.is_suspended) {
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
