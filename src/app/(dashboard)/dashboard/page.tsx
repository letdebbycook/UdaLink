"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Copy, ExternalLink, Package, MousePointerClick,
  ShieldCheck, CheckCircle2, Circle, Loader2, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { MyPlanResponse, MyStatsResponse } from "@/types/database";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DashboardOverviewPage() {
  const [plan, setPlan] = useState<MyPlanResponse | null>(null);
  const [stats, setStats] = useState<MyStatsResponse | null>(null);
  const [username, setUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [siteUrl, setSiteUrl] = useState("");

  const [profileComplete, setProfileComplete] = useState(false);
  const [hasSocialOrCopied, setHasSocialOrCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Deteksi URL dinamis (lokal atau Vercel)
      setSiteUrl(window.location.origin);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil username dan info profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, bio, instagram, tiktok, youtube, whatsapp")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setDisplayName(profile.display_name);
        // Profile dianggap lengkap jika ada foto DAN bio
        setProfileComplete(!!(profile.avatar_url && profile.bio?.trim()));
        const hasSocial = Boolean(profile.instagram || profile.tiktok || profile.youtube || profile.whatsapp);
        const hasCopiedBefore = typeof window !== "undefined" && localStorage.getItem("udalink_shared_bio") === "true";
        setHasSocialOrCopied(hasSocial || hasCopiedBefore);
      }

      // Ambil plan dan stats secara paralel
      const [planRes, statsRes] = await Promise.all([
        supabase.rpc("get_my_plan"),
        supabase.rpc("get_my_stats", { p_days: 7 }),
      ]);

      if (planRes.data) setPlan(planRes.data as MyPlanResponse);
      if (statsRes.data) setStats(statsRes.data as MyStatsResponse);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const etalaseUrl = username ? `${siteUrl}/${username}` : "";
  const etalaseDomain = siteUrl.replace(/^https?:\/\//, "");

  const handleCopy = () => {
    if (!etalaseUrl) return;
    navigator.clipboard.writeText(etalaseUrl);
    if (typeof window !== "undefined") {
      localStorage.setItem("udalink_shared_bio", "true");
    }
    setHasSocialOrCopied(true);
    toast.success("Link etalase disalin!");
  };

  const isPro = plan?.is_pro ?? false;
  const proUntilStr = plan?.pro_until
    ? format(new Date(plan.pro_until), "d MMM yyyy", { locale: localeId })
    : null;

  const checklist = [
    { label: "Lengkapi foto profil dan bio etalase", done: profileComplete },
    { label: "Tambahkan produk affiliate pertamamu", done: (plan?.product_count ?? 0) > 0 },
    { label: "Pasang link etalase di bio media sosialmu", done: hasSocialOrCopied },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Ringkasan</h1>
        <p className="text-sm text-[#64748B]">
          Pantau performa etalase dan produk affiliate-mu di sini.
        </p>
      </div>

      {/* Kartu Link Etalase */}
      <Card className="border-[#BBF7D0] bg-gradient-to-r from-[#F0FDF4] to-white">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider">
              Link Etalasemu
            </span>
            <div className="text-base sm:text-lg font-bold font-mono break-all">
              {username ? (
                <>
                  <span className="text-[#94A3B8] font-normal">{etalaseDomain}/</span>
                  <span className="text-[#16A34A]">{username}</span>
                </>
              ) : (
                <span className="text-[#94A3B8]">...</span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Pasang link ini di bio Instagram, TikTok, dan bio YouTube-mu.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleCopy}
              disabled={!etalaseUrl}
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Salin Link</span>
            </Button>
            {etalaseUrl && (
              <Link href={`/${username}`} target="_blank">
                <Button size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Lihat Halaman</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3 Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Produk */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Total Produk Aktif</span>
              <Package className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">
                {plan?.product_count ?? 0}
              </span>
              <span className="text-xs text-[#64748B]">
                / {isPro ? "Unlimited (Pro)" : `${plan?.free_product_limit ?? 30} (Gratis)`}
              </span>
            </div>
            {!isPro && plan && (
              <div className="mt-2 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((plan.product_count) / (plan.free_product_limit)) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Klik 7 Hari */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Klik / 7 Hari Terakhir</span>
              <MousePointerClick className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">
                {stats?.total_clicks?.toLocaleString("id-ID") ?? 0}
              </span>
              {(stats?.total_clicks ?? 0) > 0 && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  klik
                </span>
              )}
            </div>
            {!isPro && (
              <p className="text-[10px] text-[#94A3B8] mt-1">Upgrade Pro untuk statistik lengkap</p>
            )}
          </CardContent>
        </Card>

        {/* Status Paket */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Status Paket</span>
              <ShieldCheck className={`h-4 w-4 ${isPro ? "text-amber-500" : "text-[#94A3B8]"}`} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isPro ? (
                <Badge className="bg-amber-100 text-amber-800 gap-1 font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  PRO AKTIF
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[#64748B]">Gratis</Badge>
              )}
            </div>
            {isPro && proUntilStr && (
              <p className="text-[11px] text-[#64748B] mt-1">s.d. {proUntilStr}</p>
            )}
            {!isPro && (
              <Link href="/dashboard/langganan">
                <p className="text-[11px] text-[#16A34A] font-semibold mt-1 hover:underline">
                  Upgrade ke Pro →
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5 Produk Terlaris (PRD Bagian 7 & 8) */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#16A34A]" />
              <span>5 Produk Terlaris</span>
            </h3>
            <Link
              href="/dashboard/statistik"
              className="text-xs text-[#16A34A] font-medium hover:underline"
            >
              Lihat Statistik Lengkap →
            </Link>
          </div>

          {!stats?.products_stats || stats.products_stats.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#64748B]">
              Belum ada data klik produk. Pasang link etalase di bio untuk mulai memantau produk terlaris!
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {stats.products_stats.slice(0, 5).map((prod) => (
                <div key={prod.product_id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-bold text-xs text-[#16A34A] w-6 shrink-0">
                      #{prod.number}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] truncate">{prod.name}</p>
                      <p className="text-[11px] text-[#64748B] capitalize">{prod.marketplace}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0] shrink-0">
                    {prod.click_count} klik
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Memulai (Hilang jika semua langkah selesai sesuai PRD) */}
      {!checklist.every((item) => item.done) && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm text-[#0F172A]">Checklist Memulai Etalase</h3>
            <div className="space-y-2.5">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-[#CBD5E1] shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      item.done
                        ? "text-[#94A3B8] line-through"
                        : "text-[#374151] font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
