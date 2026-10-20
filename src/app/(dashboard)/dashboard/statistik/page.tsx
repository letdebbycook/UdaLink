"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart2, MousePointerClick, TrendingUp, Sparkles,
  Lock, Calendar, Package, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/utils";
import { MARKETPLACE_CONFIG } from "@/lib/marketplace";
import type { MyStatsResponse, MyPlanResponse } from "@/types/database";

export default function StatistikPage() {
  const [stats, setStats] = useState<MyStatsResponse | null>(null);
  const [plan, setPlan] = useState<MyPlanResponse | null>(null);
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);

  const isPro = plan?.is_pro ?? false;

  const loadStats = useCallback(async (selectedDays: number) => {
    try {
      setLoading(true);
      const [statsRes, planRes] = await Promise.all([
        supabase.rpc("get_my_stats", { p_days: selectedDays }),
        supabase.rpc("get_my_plan"),
      ]);

      if (statsRes.data) setStats(statsRes.data as MyStatsResponse);
      if (planRes.data) setPlan(planRes.data as MyPlanResponse);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat statistik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(days);
  }, [days, loadStats]);

  function handleSelectDays(newDays: number) {
    if (newDays === 30 && !isPro) {
      toast.error("Rentang statistik 30 hari hanya tersedia untuk pelanggan PRO");
      return;
    }
    setDays(newDays);
  }

  const totalClicks = stats?.total_clicks ?? 0;
  const productsStats = stats?.products_stats ?? [];
  const topProduct = productsStats.length > 0 ? productsStats[0] : null;
  const avgDaily = Math.round((totalClicks / days) * 10) / 10;

  // Jika bukan PRO, kunci seluruh menu statistik dengan layar promosi PRO
  if (!loading && !isPro) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Statistik Klik Etalase
            </h1>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-semibold">
              Fitur Eksklusif PRO
            </Badge>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Pantau seberapa sering produkmu dikunjungi dan diklik oleh calon pembeli.
          </p>
        </div>

        {/* PRO LOCK HERO PAYWALL */}
        <div className="relative rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 via-white to-emerald-50/30 p-8 sm:p-12 overflow-hidden shadow-sm text-center">
          {/* Subtle background icons decoration */}
          <div className="absolute top-4 right-6 opacity-10 pointer-events-none">
            <BarChart2 className="w-48 h-48 text-amber-600" />
          </div>

          <div className="max-w-xl mx-auto relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                Menu Statistik Terkunci
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Menu analisis klik produk dan performa pengunjung hanya dapat dibuka setelah akun Anda di-upgrade ke <strong>UdaLink PRO</strong>.
              </p>
            </div>

            {/* Benefit Bullets */}
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-5 border border-slate-200/80 text-left shadow-2xs space-y-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Yang akan Anda dapatkan di PRO:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <span>Total klik etalase real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <span>Peringkat produk terlaris</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <span>Rentang riwayat 30 hari</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <span>Pelacakan per marketplace</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/dashboard/langganan" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm px-6 h-11 gap-2 shadow-md shadow-emerald-600/20">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Buka Menu Statistik — Upgrade PRO</span>
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-11 text-xs font-semibold px-4">
                  Kembali ke Ringkasan
                </Button>
              </Link>
            </div>

            <p className="text-[11px] text-slate-400">
              Tersedia paket bulanan (Rp 29.000) dan tahunan hemat 28% (Rp 249.000).
            </p>
          </div>
        </div>

        {/* Blurred Teaser Preview */}
        <div className="relative opacity-40 select-none pointer-events-none filter blur-[2px] transition-all">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-slate-500">Total Klik Produk</span>
                <div className="text-3xl font-bold text-[#0F172A] mt-2">1.420</div>
                <p className="text-[11px] text-slate-400 mt-1">Dalam rentang 30 hari</p>
              </CardContent>
            </Card>
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-slate-500">Rata-rata Klik / Hari</span>
                <div className="text-3xl font-bold text-[#0F172A] mt-2">47,3</div>
                <p className="text-[11px] text-slate-400 mt-1">Klik per hari</p>
              </CardContent>
            </Card>
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-slate-500">Produk Terpopuler</span>
                <div className="text-lg font-bold text-[#0F172A] mt-2 truncate">Kemeja Linen Pria</div>
                <p className="text-[11px] text-slate-400 mt-1">340 klik total</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Rentang Hari */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Statistik Klik Etalase
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
              PRO Aktif
            </Badge>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Pantau seberapa sering produkmu dikunjungi dan diklik oleh calon pembeli.
          </p>
        </div>

        {/* Tab Pilihan Rentang Waktu */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E2E8F0] rounded-xl self-start sm:self-auto shadow-xs">
          <button
            onClick={() => handleSelectDays(7)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              days === 7
                ? "bg-[#16A34A] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => handleSelectDays(30)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              days === 30
                ? "bg-[#16A34A] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Klik */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Klik Produk</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                totalClicks.toLocaleString("id-ID")
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Dalam rentang {days} hari</p>
          </CardContent>
        </Card>

        {/* Rata-rata Harian */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Rata-rata Klik / Hari</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                avgDaily
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Klik per hari</p>
          </CardContent>
        </Card>

        {/* Produk Terpopuler */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Produk Terpopuler</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-[#0F172A] truncate">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : topProduct ? (
                `#${topProduct.number} ${topProduct.name}`
              ) : (
                "Belum ada data"
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {topProduct ? `${topProduct.click_count} klik` : "Menunggu klik pertama"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table / Breakdown */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">
                Peringkat Produk Berdasarkan Klik
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Produk yang paling banyak menarik perhatian pembeli
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {productsStats.length} produk tercatat
            </Badge>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-[#64748B]">
              <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mb-3" />
              <p className="text-sm">Memuat data klik...</p>
            </div>
          ) : productsStats.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <BarChart2 className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-semibold text-sm text-slate-800">Belum Ada Klik Produk</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Bagikan link etalasemu di bio Instagram, TikTok, atau WhatsApp untuk mulai
                mendapatkan klik dari calon pembeli.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {productsStats.map((item, idx) => {
                const percentage =
                  totalClicks > 0
                    ? Math.round((item.click_count / totalClicks) * 100)
                    : 0;
                const mpConfig =
                  MARKETPLACE_CONFIG[item.marketplace] || MARKETPLACE_CONFIG.lainnya;

                return (
                  <div key={item.product_id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 font-bold text-xs text-slate-400 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400 m-auto mt-2" />
                          )}
                        </div>
                        <span className="font-bold text-xs text-[#16A34A] shrink-0">
                          #{item.number}
                        </span>
                        <span className="font-medium text-slate-800 truncate text-xs sm:text-sm">
                          {item.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`hidden sm:inline-flex text-[10px] py-0 ${mpConfig.badgeClass}`}
                        >
                          {mpConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {item.click_count} klik
                        </span>
                        <span className="text-xs text-slate-400 w-10 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden ml-7 sm:ml-8">
                      <div
                        className="h-full rounded-full bg-[#16A34A] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
