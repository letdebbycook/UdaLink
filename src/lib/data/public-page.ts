import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { PublicPageData, dummyPublicPage } from "@/lib/dummy-data";
import type { PublicPageResponse } from "@/types/database";

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Data access layer untuk halaman etalase publik (Server Component & Metadata).
 * Memanggil RPC Supabase get_public_page(p_username) dengan React cache() deduplication.
 */
export const getPublicPage = cache(async (username: string): Promise<PublicPageData | null> => {
  const cleanUsername = username.toLowerCase().trim();
  if (!cleanUsername) return null;

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc("get_public_page", {
      p_username: cleanUsername,
    });

    if (error) {
      console.error(`Gagal memuat get_public_page untuk @${cleanUsername}:`, error.message);
    }

    if (data) {
      const raw = data as PublicPageResponse;
      return {
        profile: {
          id: raw.profile.id,
          username: raw.profile.username,
          display_name: raw.profile.display_name,
          bio: raw.profile.bio,
          avatar_url: raw.profile.avatar_url,
          whatsapp: raw.profile.whatsapp,
          instagram: raw.profile.instagram,
          tiktok: raw.profile.tiktok,
          youtube: raw.profile.youtube,
          theme: raw.effective_theme || "hijau",
          is_pro: raw.is_pro,
        },
        categories: raw.categories || [],
        products: (raw.products || []).map((p) => ({
          id: p.id,
          number: p.number,
          name: p.name,
          price: p.price,
          image_url: p.image_url,
          affiliate_url: `/go/${p.id}`,
          marketplace: p.marketplace,
          category_id: p.category_id,
          is_active: true,
          is_featured: Boolean(p.is_featured),
        })),
        banners: (raw.banners || []).map((b) => ({
          id: b.id,
          image_url: b.image_url,
          title: b.title,
          link_url: b.link_url,
          sort_order: b.sort_order,
          is_active: true,
        })),
        theme: raw.effective_theme || "hijau",
        show_branding: raw.show_branding,
      };
    }
  } catch (err) {
    console.error("Kesalahan fetch getPublicPage:", err);
  }

  // Fallback ke data contoh jika akun demo "nando" belum ada di database (hanya saat development)
  if (process.env.NODE_ENV === "development" && cleanUsername === "nando") {
    return dummyPublicPage;
  }

  return null;
});
