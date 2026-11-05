"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

export function EarningsCalculator() {
  const [followers, setFollowers] = useState<number>(25000);
  const [clickRate, setClickRate] = useState<number>(4);

  // Calculations based on standard Indonesian TikTok/Instagram affiliate metrics
  const stats = useMemo(() => {
    // Monthly bio visitors estimating 1.2 visits per engaged user
    const monthlyBioVisitors = Math.round(followers * (clickRate / 100) * 1.2);
    // Product click rate inside showcase ~65%
    const productClicks = Math.round(monthlyBioVisitors * 0.65);
    // Checkout conversion rate on marketplace ~3.8%
    const successfulOrders = Math.round(productClicks * 0.038);
    // Average affiliate commission per completed order in Indonesia (~Rp 8.500)
    const avgCommission = 8500;
    const estimatedEarnings = successfulOrders * avgCommission;

    return {
      monthlyBioVisitors,
      productClicks,
      successfulOrders,
      estimatedEarnings,
    };
  }, [followers, clickRate]);

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#F0FDF4]/50 to-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-100/40 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#16A34A] text-xs font-bold mb-3 shadow-2xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Kalkulator Estimasi Cuan Affiliator</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Berapa Potensi Pendapatanmu dari Etalase?
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-3 leading-relaxed">
            Geser slider di bawah untuk melihat perkiraan komisi affiliate Shopee, TikTok, dan Tokopedia dengan etalase terorganisir.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Sliders */}
            <div className="lg:col-span-7 space-y-7">
              {/* Slider 1: Total Followers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="followers-slider" className="text-xs sm:text-sm font-bold text-slate-700">
                    Jumlah Followers Media Sosial
                  </label>
                  <span className="text-base sm:text-lg font-black text-[#16A34A] bg-emerald-50 px-3 py-0.5 rounded-lg border border-emerald-100">
                    {followers.toLocaleString("id-ID")}
                  </span>
                </div>
                <input
                  id="followers-slider"
                  type="range"
                  min="2000"
                  max="300000"
                  step="1000"
                  value={followers}
                  onChange={(e) => setFollowers(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#16A34A]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                  <span>2.000</span>
                  <span>50.000</span>
                  <span>150.000</span>
                  <span>300.000+</span>
                </div>
              </div>

              {/* Slider 2: Click-Through Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="ctr-slider" className="text-xs sm:text-sm font-bold text-slate-700">
                    Estimasi Keaktifan Klik Link Bio (CTR)
                  </label>
                  <span className="text-base sm:text-lg font-black text-[#16A34A] bg-emerald-50 px-3 py-0.5 rounded-lg border border-emerald-100">
                    {clickRate}%
                  </span>
                </div>
                <input
                  id="ctr-slider"
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={clickRate}
                  onChange={(e) => setClickRate(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#16A34A]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                  <span>1% (Santai)</span>
                  <span>4% (Rata-rata)</span>
                  <span>8% (Sering Racun)</span>
                  <span>12% (Viral)</span>
                </div>
              </div>

              {/* Value Comparison Points */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span>Cari nomor cepat = konversi naik 3x</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span>Tracking platform otomatis (TikTok/IG)</span>
                </div>
              </div>
            </div>

            {/* Right Column: Earnings Summary Display */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Estimasi Komisi / Bulan
                </span>

                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-2">
                  {formatRupiah(stats.estimatedEarnings)}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Berdasarkan perkiraan rata-rata pesanan berhasil dari etalase affiliator aktif.
                </p>

                {/* Sub-Metrics Breakdown */}
                <div className="mt-6 pt-5 border-t border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pengunjung Etalase / Bln</span>
                    <span className="font-bold text-slate-200">
                      {stats.monthlyBioVisitors.toLocaleString("id-ID")} orang
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Klik Produk ke Marketplace</span>
                    <span className="font-bold text-slate-200">
                      {stats.productClicks.toLocaleString("id-ID")} klik
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estimasi Pesanan Selesai</span>
                    <span className="font-bold text-emerald-400">
                      ~{stats.successfulOrders.toLocaleString("id-ID")} transaksi
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href="/daftar"
                className="mt-8 w-full py-3.5 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-extrabold text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <span>Mulai Raih Komisi Gratis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
