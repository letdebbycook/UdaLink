import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0";
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  // Remove any whitespace (including non-breaking space \u00a0) between Rp and digits, then add single space
  return formatted.replace(/^Rp[\s\u00a0]*/, "Rp ");
}

export function formatTanggal(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy", { locale: id });
}

export function getSiteDomain(): string {
  if (typeof window !== "undefined" && window.location?.host) {
    return window.location.host;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://udalink.vercel.app";
  return siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function getSiteUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "https://udalink.vercel.app";
}
