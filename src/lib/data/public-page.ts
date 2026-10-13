import { PublicPageData, dummyPublicPage } from "@/lib/dummy-data";

/**
 * Data access layer for public storefront pages.
 * In Sprint 1, this reads from dummy data.
 * In Sprint 2, this will be connected directly to Supabase RPC get_public_page(p_username).
 */
export async function getPublicPage(username: string): Promise<PublicPageData | null> {
  // Normalize username
  const cleanUsername = username.toLowerCase().trim();

  if (cleanUsername === "nando") {
    return dummyPublicPage;
  }

  // If testing other usernames in sprint 1, return dummy data with modified username
  if (cleanUsername === "demo") {
    return {
      ...dummyPublicPage,
      profile: {
        ...dummyPublicPage.profile,
        username: "demo",
        display_name: "Demo Affiliator",
        is_pro: false,
      },
      show_branding: true,
    };
  }

  return null;
}
