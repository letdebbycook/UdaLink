import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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

  // Membership diambil sekali dan dipakai ulang oleh semua pemeriksaan di bawah
  const membership = user
    ? (
        await supabase
          .from("memberships")
          .select("role, is_suspended, pro_until")
          .eq("user_id", user.id)
          .single()
      ).data
    : null;

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

    if (!membership || membership.role !== "admin") {
      // Jika bukan admin, lempar ke dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Jika sudah login, cegah buka halaman /masuk
  //    Admin diarahkan ke panel admin, pengguna lain ke dashboard,
  //    kecuali ada param redirect yang aman (path lokal).
  if (user && pathname === "/masuk") {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const safeRedirect =
      redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : null;
    const fallback = membership?.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(safeRedirect ?? fallback, request.url));
  }

  // 4. Cek akun dinonaktifkan (is_suspended) untuk user yang sudah login di rute terproteksi
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isSuspendedPage = pathname === "/akun-dinonaktifkan";

  if (user && isProtectedRoute && !isSuspendedPage) {
    if (membership?.is_suspended === true) {
      return NextResponse.redirect(new URL("/akun-dinonaktifkan", request.url));
    }
  }

  // 5. Jika sudah login dan tidak suspended, cegah akses ke halaman dinonaktifkan
  if (user && isSuspendedPage) {
    if (!membership?.is_suspended) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 6. Halaman statistik khusus pengguna Pro (pemeriksaan di sisi server)
  const isPro =
    membership?.pro_until != null && new Date(membership.pro_until).getTime() > Date.now();

  if (user && pathname.startsWith("/dashboard/statistik") && !isPro) {
    const redirectUrl = new URL("/dashboard/langganan", request.url);
    redirectUrl.searchParams.set("upgrade", "statistik");
    return NextResponse.redirect(redirectUrl);
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
