/**
 * Utility untuk mendeteksi platform pengunjung berdasarkan User-Agent, Referrer, dan URL parameter ?ref=
 */

export type PlatformSource =
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "twitter"
  | "facebook"
  | "youtube"
  | "telegram"
  | "threads"
  | "direct"
  | "lainnya";

export interface PlatformInfo {
  label: string;
  badgeClass: string;
  dotColor: string;
}

export const PLATFORM_CONFIG: Record<string, PlatformInfo> = {
  instagram: {
    label: "Instagram",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    dotColor: "#E1306C",
  },
  tiktok: {
    label: "TikTok",
    badgeClass: "bg-slate-900 text-white border-slate-900",
    dotColor: "#000000",
  },
  whatsapp: {
    label: "WhatsApp",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "#25D366",
  },
  twitter: {
    label: "X (Twitter)",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    dotColor: "#1DA1F2",
  },
  facebook: {
    label: "Facebook",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "#1877F2",
  },
  youtube: {
    label: "YouTube",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    dotColor: "#FF0000",
  },
  telegram: {
    label: "Telegram",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dotColor: "#229ED9",
  },
  threads: {
    label: "Threads",
    badgeClass: "bg-neutral-100 text-neutral-800 border-neutral-300",
    dotColor: "#101010",
  },
  direct: {
    label: "Direct / Browser",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    dotColor: "#64748B",
  },
  lainnya: {
    label: "Lainnya",
    badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
    dotColor: "#94A3B8",
  },
};

/**
 * Mendeteksi platform secara akurat dari param ref, referrer, dan user-agent.
 */
export function detectPlatform(options: {
  refParam?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
}): PlatformSource {
  const { refParam, referrer, userAgent } = options;

  // 1. Cek parameter eksplisit ?ref= atau ?utm_source= atau ?source=
  if (refParam) {
    const cleanRef = refParam.toLowerCase().trim();
    if (cleanRef.includes("ig") || cleanRef.includes("instagram")) return "instagram";
    if (cleanRef.includes("tiktok") || cleanRef.includes("tt")) return "tiktok";
    if (cleanRef.includes("wa") || cleanRef.includes("whatsapp")) return "whatsapp";
    if (cleanRef.includes("twitter") || cleanRef.includes("x.com")) return "twitter";
    if (cleanRef.includes("fb") || cleanRef.includes("facebook")) return "facebook";
    if (cleanRef.includes("yt") || cleanRef.includes("youtube")) return "youtube";
    if (cleanRef.includes("tele") || cleanRef.includes("telegram")) return "telegram";
    if (cleanRef.includes("threads")) return "threads";
  }

  // 2. Cek Referrer
  if (referrer) {
    const ref = referrer.toLowerCase();
    if (ref.includes("instagram.com") || ref.includes("l.instagram.com")) return "instagram";
    if (ref.includes("tiktok.com")) return "tiktok";
    if (ref.includes("whatsapp.com") || ref.includes("api.whatsapp.com")) return "whatsapp";
    if (ref.includes("twitter.com") || ref.includes("t.co") || ref.includes("x.com")) return "twitter";
    if (ref.includes("facebook.com") || ref.includes("l.facebook.com") || ref.includes("fb.com")) return "facebook";
    if (ref.includes("youtube.com") || ref.includes("youtu.be")) return "youtube";
    if (ref.includes("telegram.org") || ref.includes("t.me")) return "telegram";
    if (ref.includes("threads.net")) return "threads";
  }

  // 3. Cek User-Agent (In-App Browser detection)
  if (userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes("instagram")) return "instagram";
    if (ua.includes("tiktok") || ua.includes("bytedance") || ua.includes("musical_ly")) return "tiktok";
    if (ua.includes("whatsapp")) return "whatsapp";
    if (ua.includes("twitter")) return "twitter";
    if (ua.includes("fban") || ua.includes("fbav")) return "facebook";
    if (ua.includes("telegram")) return "telegram";
    if (ua.includes("threads")) return "threads";
  }

  return "direct";
}
