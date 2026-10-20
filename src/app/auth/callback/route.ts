import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(`${origin}/masuk?error=missing_config`);
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Context where setAll cannot mutate response cookies directly
          }
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Periksa apakah pengguna memiliki peran admin
      const { data: membership } = await supabase
        .from("memberships")
        .select("role, is_suspended")
        .eq("user_id", data.user.id)
        .single();

      if (membership?.is_suspended) {
        return NextResponse.redirect(`${origin}/akun-dinonaktifkan`);
      }

      if (membership?.role === "admin") {
        // Role admin langsung diarahkan ke panel admin saja
        return NextResponse.redirect(`${origin}/admin`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Jika gagal tukar token atau tidak ada code
  return NextResponse.redirect(`${origin}/masuk?error=oauth_failed`);
}
