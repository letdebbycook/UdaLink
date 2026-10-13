import { MarketplaceType } from "@/types/database";

export function detectMarketplace(url: string): MarketplaceType {
  const lower = url.toLowerCase().trim();
  if (lower.includes("shopee.co.id") || lower.includes("shp.ee") || lower.includes("shopee.com")) {
    return "shopee";
  }
  if (lower.includes("tokopedia.com") || lower.includes("tokopedia.link")) {
    return "tokopedia";
  }
  if (lower.includes("tiktok.com")) {
    return "tiktok";
  }
  if (lower.includes("lazada.co.id") || lower.includes("lazada.com")) {
    return "lazada";
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
