import { MarketplaceType } from "@/types/database";

export function detectMarketplace(url: string): MarketplaceType {
  const trimmed = url.trim();
  if (!trimmed) return "lainnya";

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    // Shopee Indonesia & shortlinks
    if (
      host.endsWith("shopee.co.id") ||
      host === "shp.ee" ||
      host.endsWith("shope.ee") ||
      (host.endsWith("shopee.com") && (path.includes("/product/") || host.startsWith("affiliate.")))
    ) {
      return "shopee";
    }

    // Tokopedia & shortlinks
    if (
      host.endsWith("tokopedia.com") ||
      host.endsWith("tokopedia.link") ||
      host === "tkp.me"
    ) {
      return "tokopedia";
    }

    // TikTok Shop: subdomain shop atau path produk/toko khusus
    if (
      host === "shop.tiktok.com" ||
      host.endsWith(".shop.tiktok.com") ||
      (host.endsWith("tiktok.com") &&
        (path.includes("/product/") ||
         path.includes("/shop/") ||
         path.includes("/view/product/") ||
         path.startsWith("/t/")))
    ) {
      return "tiktok";
    }

    // Lazada Indonesia & shortlinks
    if (host.endsWith("lazada.co.id") || (host.endsWith("lazada.com") && path.includes("/products/"))) {
      return "lazada";
    }
  } catch {
    const lower = trimmed.toLowerCase();
    if (lower.includes("shopee.co.id") || lower.includes("shp.ee")) return "shopee";
    if (lower.includes("tokopedia.com") || lower.includes("tokopedia.link")) return "tokopedia";
    if (lower.includes("shop.tiktok.com") || lower.includes("tiktok.com/view/product")) return "tiktok";
    if (lower.includes("lazada.co.id")) return "lazada";
  }

  return "lainnya";
}

export const MARKETPLACE_CONFIG: Record<
  MarketplaceType,
  { label: string; color: string; badgeClass: string }
> = {
  shopee: {
    label: "Shopee",
    color: "#EE4D2D",
    badgeClass: "bg-[#EE4D2D]/10 text-[#EE4D2D] border-[#EE4D2D]/30",
  },
  tokopedia: {
    label: "Tokopedia",
    color: "#03AC0E",
    badgeClass: "bg-[#03AC0E]/10 text-[#03AC0E] border-[#03AC0E]/30",
  },
  tiktok: {
    label: "TikTok Shop",
    color: "#000000",
    badgeClass: "bg-slate-900/10 text-slate-900 border-slate-900/30",
  },
  lazada: {
    label: "Lazada",
    color: "#0F146D",
    badgeClass: "bg-[#0F146D]/10 text-[#0F146D] border-[#0F146D]/30",
  },
  lainnya: {
    label: "Tautan Toko",
    color: "#64748B",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
};
