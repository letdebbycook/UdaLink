import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function GoBannerRedirectPage({ params }: Props) {
  const { id } = await params;

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_REGEX.test(id)) {
    notFound();
  }

  const supabase = getServerSupabase();

  const { data: banner, error } = await supabase
    .from("banners")
    .select("id, link_url, is_active, user_id")
    .eq("id", id)
    .single();

  if (error || !banner || !banner.is_active || !banner.link_url) {
    notFound();
  }

  // Normalize URL
  const targetUrl = banner.link_url.trim();
  const finalUrl =
    targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
      ? targetUrl
      : `https://${targetUrl}`;

  redirect(finalUrl);
}
