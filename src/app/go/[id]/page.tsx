import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Server-side Supabase client (anon key — relies on RLS + SECURITY DEFINER RPCs)
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

export default async function GoRedirectPage({ params }: Props) {
  const { id } = await params;

  // Validate UUID format — anything else is a 404 immediately
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_REGEX.test(id)) {
    notFound();
  }

  const supabase = getServerSupabase();

  // Get referrer for deduplication hint (best-effort)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Call RPC record_click on the server to prevent browser-side console exposure
  let targetUrl: string | null = null;

  const { data: rpcData, error: rpcErr } = await supabase.rpc("record_click", {
    p_product_id: id,
  });

  if (rpcData && typeof rpcData === "object" && "affiliate_url" in rpcData) {
    targetUrl = (rpcData as { affiliate_url: string }).affiliate_url;
  }

  // Fallback: direct query (in case RPC returns no URL but click was recorded)
  if (!targetUrl && !rpcErr) {
    const { data: product } = await supabase
      .from("products")
      .select("affiliate_url, is_active")
      .eq("id", id)
      .single();

    if (!product) notFound();
    if (!product.is_active) notFound();
    targetUrl = product.affiliate_url;
  }

  if (!targetUrl) {
    notFound();
  }

  // Normalize URL
  const finalUrl =
    targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
      ? targetUrl
      : `https://${targetUrl}`;

  redirect(finalUrl);
}
