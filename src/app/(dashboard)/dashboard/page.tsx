"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Copy, ExternalLink, Package, MousePointerClick,
  ShieldCheck, CheckCircle2, Circle, Loader2, TrendingUp,
  QrCode, Check, X, Download, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { MyPlanResponse, MyStatsResponse } from "@/types/database";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { QrCodeSvg } from "@/components/ui/qr-code";

export default function DashboardOverviewPage() {
  const [plan, setPlan] = useState<MyPlanResponse | null>(null);
  const [stats, setStats] = useState<MyStatsResponse | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [siteUrl, setSiteUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [profileComplete, setProfileComplete] = useState(false);
  const [hasSocialOrCopied, setHasSocialOrCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSiteUrl(window.location.origin);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, bio, instagram, tiktok, youtube, whatsapp")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setProfileComplete(!!(profile.avatar_url && profile.bio?.trim()));
        const hasSocial = Boolean(profile.instagram || profile.tiktok || profile.youtube || profile.whatsapp);
        const hasCopiedBefore = typeof window !== "undefined" && localStorage.getItem("udalink_shared_bio") === "true";
        setHasSocialOrCopied(hasSocial || hasCopiedBefore);
      }

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
    setCopiedLink(true);
    setHasSocialOrCopied(true);
    toast.success("Link etalase disalin!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = () => {
    const svgElement = document.getElementById("dashboard-qr-code");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 50, 50, 500, 500);

      const png = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Etalase-${username}.png`;
      downloadLink.href = png;
      downloadLink.click();
      toast.success("QR Code berhasil diunduh!");
    };
    image.src = blobURL;
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
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Ringkasan</h1>
        <p className="text-sm text-[#64748B]">
          Pantau performa etalase dan produk affiliate-mu di sini.
        </p>
      </div>

      {/* Kartu Link Etalase */}
      <Card className="border-[#BBF7D0] bg-gradient-to-r from-[#F0FDF4] via-white to-white shadow-xs hover:shadow-md transition-shadow">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Link Etalasemu
            </span>
            <div className="text-base sm:text-lg font-bold font-mono break-all text-[#0F172A]">
              {username ? (
                <>
                  <span className="text-[#94A3B8] font-normal">{etalaseDomain}/</span>
                  <span className="text-[#16A34A] underline decoration-emerald-200 underline-offset-4">{username}</span>
                </>
              ) : (
                <span className="text-[#94A3B8]">...</span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Pasang link ini di bio Instagram, TikTok, dan YouTube untuk konversi maksimal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 font-semibold active:scale-95 transition-all"
              onClick={handleCopy}
              disabled={!etalaseUrl}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Tersalin!" : "Salin Link"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 font-semibold active:scale-95 transition-all"
              onClick={() => setShowQrModal(true)}
              disabled={!etalaseUrl}
              title="Lihat QR Code"
            >
              <QrCode className="h-3.5 w-3.5 text-slate-700" />
              <span className="hidden xs:inline">QR Code</span>
            </Button>

            {etalaseUrl && (
              <Link href={`/${username}`} target="_blank">
                <Button size="sm" className="gap-1.5 text-xs h-9 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 transition-all text-white font-bold">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka Etalase</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3 Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Produk */}
        <Card className="border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B]">Total Produk Aktif</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#0F172A]">
                {plan?.product_count ?? 0}
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                / {isPro ? "Unlimited (Pro)" : `${plan?.free_product_limit ?? 30} (Gratis)`}
              </span>
            </div>
            {!isPro && plan && (
              <div className="mt-2.5 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((plan.product_count) / (plan.free_product_limit)) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Klik 7 Hari */}
        <Card className="border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B]">Klik / 7 Hari Terakhir</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <MousePointerClick className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#0F172A]">
                {stats?.total_clicks?.toLocaleString("id-ID") ?? 0}
              </span>
              {(stats?.total_clicks ?? 0) > 0 && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  klik
                </span>
              )}
            </div>
            {!isPro && (
              <p className="text-[10px] text-[#94A3B8] mt-1.5">Upgrade Pro untuk analitik lengkap</p>
            )}
          </CardContent>
        </Card>

        {/* Status Paket */}
        <Card className="border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B]">Status Akun</span>
              <div className={`h-8 w-8 rounded-lg ${isPro ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400"} flex items-center justify-center`}>
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isPro ? (
                <Badge className="bg-amber-100 text-amber-800 gap-1 font-bold">
                  <ShieldCheck className="h-3 w-3" />
                  PRO AKTIF
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[#64748B] font-semibold">Gratis</Badge>
              )}
            </div>
            {isPro && proUntilStr && (
              <p className="text-[11px] text-[#64748B] mt-1.5 font-medium">s.d. {proUntilStr}</p>
            )}
            {!isPro && (
              <Link href="/dashboard/langganan">
                <p className="text-[11px] text-[#16A34A] font-bold mt-1.5 hover:underline flex items-center gap-1">
                  <span>Upgrade ke Pro</span>
                  <span>→</span>
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5 Produk Terlaris */}
      <Card className="border-slate-200/90 shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#16A34A]" />
              <span>5 Produk Paling Sering Diklik</span>
            </h3>
            <Link
              href="/dashboard/statistik"
              className="text-xs text-[#16A34A] font-bold hover:underline"
            >
              Lihat Statistik Lengkap →
            </Link>
          </div>

          {!stats?.products_stats || stats.products_stats.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              Belum ada data klik produk. Pasang link etalase di bio untuk mulai memantau produk terlaris!
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {stats.products_stats.slice(0, 5).map((prod, index) => {
                const rankBadges = [
                  "bg-amber-100 text-amber-800 border-amber-300",
                  "bg-slate-100 text-slate-700 border-slate-300",
                  "bg-orange-100 text-orange-800 border-orange-300",
                ];
                const rankStyle = index < 3 ? rankBadges[index] : "bg-slate-50 text-slate-500 border-slate-200";

                return (
                  <div key={prod.product_id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-6 w-6 rounded-md text-[11px] font-black flex items-center justify-center border shrink-0 ${rankStyle}`}>
                        {index + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate group-hover:text-[#16A34A] transition-colors">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Nomor #{prod.number} · <span className="capitalize">{prod.marketplace}</span>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-black text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0] shrink-0">
                      {prod.click_count} klik
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Memulai */}
      {!checklist.every((item) => item.done) && (
        <Card className="border-slate-200/90 shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-3">
            <h3 className="font-bold text-sm text-[#0F172A]">Checklist Memulai Etalase</h3>
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
                        : "text-[#374151] font-semibold"
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

      {/* QR Code Modal for Dashboard */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 bg-white shadow-2xl border border-slate-200 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto mb-2">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-base text-[#0F172A]">
              QR Code Etalasemu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cetak atau tampilkan di live streaming / konten video
            </p>

            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 inline-block shadow-inner">
              <div id="dashboard-qr-code">
                <QrCodeSvg
                  value={etalaseUrl}
                  size={190}
                  fgColor="#0F172A"
                  bgColor="#FFFFFF"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleDownloadQr}
                className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs gap-1.5 h-10 shadow-xs"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Gambar QR (PNG)</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full text-xs font-semibold h-10 gap-1.5"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Tautan Disalin!" : "Salin Tautan Etalase"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
