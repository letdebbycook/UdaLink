"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Link2,
  ArrowRight,
  Search,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  ShieldCheck,
  Check,
  X,
  Layers,
  Menu,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { EarningsCalculator } from "@/components/landing/EarningsCalculator";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { LandingNavbarAuth } from "@/components/landing/LandingNavbarAuth";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Navbar scroll animation and reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      setScrolled(window.scrollY > 25);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col font-sans">
      {/* 1. NAVBAR DENGAN ANIMASI SCROLL & PROGRESS BAR */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "h-16 bg-white/85 backdrop-blur-xl shadow-md border-b border-[#E2E8F0]/90"
            : "h-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]"
        }`}
      >
        {/* Scroll Progress Bar at the top of Navbar */}
        <div
          className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-[#16A34A] to-teal-400 transition-all duration-150 z-50"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className={`rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-sm shadow-[#16A34A]/20 transition-all duration-300 group-hover:scale-105 ${
                scrolled ? "h-8.5 w-8.5" : "h-9 w-9"
              }`}
            >
              <Link2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span
              className={`font-extrabold tracking-tight text-[#0F172A] transition-all duration-300 ${
                scrolled ? "text-lg" : "text-xl"
              }`}
            >
              Uda<span className="text-[#16A34A]">Link</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#64748B]">
            <a href="#langkah" className="hover:text-[#16A34A] transition-colors py-1">
              Cara Kerja
            </a>
            <a href="#fitur" className="hover:text-[#16A34A] transition-colors py-1">
              Fitur
            </a>
            <a href="#kalkulator" className="hover:text-[#16A34A] transition-colors py-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>Kalkulator</span>
            </a>
            <a href="#harga" className="hover:text-[#16A34A] transition-colors py-1">
              Harga
            </a>
            <a href="#faq" className="hover:text-[#16A34A] transition-colors py-1">
              FAQ
            </a>
            <Link
              href="/nando"
              target="_blank"
              className="text-[#16A34A] font-bold flex items-center gap-1 hover:underline py-1"
            >
              Contoh Etalase
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] active:scale-95 transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden md:block">
              <LandingNavbarAuth />
            </div>
          </div>
        </div>

        {/* Mobile drawer with smooth fade-in */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              {[
                { href: "#langkah", label: "Cara Kerja" },
                { href: "#fitur", label: "Fitur" },
                { href: "#kalkulator", label: "Kalkulator Cuan" },
                { href: "#harga", label: "Harga" },
                { href: "#faq", label: "FAQ" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F0FDF4] hover:text-[#16A34A] active:scale-98 transition-all"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/nando"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-bold text-[#16A34A] hover:bg-[#F0FDF4] transition-colors"
              >
                Contoh Etalase
              </Link>
              <div className="pt-2 border-t border-[#E2E8F0] mt-1">
                <LandingNavbarAuth />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION DENGAN FADE IN HALUS */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-[#F0FDF4]/70 via-white to-white animate-in fade-in duration-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-bold border border-[#BBF7D0] shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                <span>Dirancang Khusus Affiliator Indonesia</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.14]">
                Satu link untuk semua produk affiliate-mu
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Audiens cukup cari nomor produk yang kamu sebut di video TikTok atau Reels, langsung klik dan beli di marketplace tanpa ribet scroll ratusan link.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/daftar"
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "w-full sm:w-auto h-12 px-7 text-base font-bold gap-2 shadow-md shadow-[#16A34A]/25 hover:shadow-lg hover:shadow-[#16A34A]/35 hover:-translate-y-0.5 active:scale-95 transition-all duration-200",
                  })}
                >
                  <span>Buat Etalase Gratis</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/nando"
                  target="_blank"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className:
                      "w-full sm:w-auto h-12 px-6 text-base font-semibold hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition-all duration-200",
                  })}
                >
                  Lihat Contoh Etalase
                </Link>
              </div>

              {/* Trust micro metrics */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#64748B] font-medium">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#16A34A]" />
                  <span>Gratis tanpa kartu kredit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#16A34A]" />
                  <span>Mendukung Shopee, TikTok & Tokopedia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#16A34A]" />
                  <span>Pencarian nomor super cepat</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARA KERJA 3 LANGKAH DENGAN FADE IN / FADE OUT */}
      <section id="langkah" className="py-20 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <RevealOnScroll direction="up">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
                Mudah & Praktis
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Mulai dalam 3 Langkah Sederhana
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Tanpa keahlian teknis. Etalase affiliate-mu langsung siap dibagikan ke followers.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Langkah 1 */}
            <RevealOnScroll delayMs={0} direction="up">
              <div className="bg-white p-7 rounded-3xl border border-[#E2E8F0] shadow-xs relative hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 group h-full">
                <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center font-black text-base mb-5 group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                  Daftar & Buat Akun
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Pilih username unik pilihanmu, lengkapi foto profil dan bio singkat dalam hitungan detik.
                </p>
              </div>
            </RevealOnScroll>

            {/* Langkah 2 */}
            <RevealOnScroll delayMs={150} direction="up">
              <div className="bg-white p-7 rounded-3xl border border-[#E2E8F0] shadow-xs relative hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 group h-full">
                <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center font-black text-base mb-5 group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                  Masukkan Link Produk
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Tempel tautan affiliate. Setiap produk otomatis mendapatkan nomor urut unik (#1, #2, #3, dst).
                </p>
              </div>
            </RevealOnScroll>

            {/* Langkah 3 */}
            <RevealOnScroll delayMs={300} direction="up">
              <div className="bg-white p-7 rounded-3xl border border-[#E2E8F0] shadow-xs relative hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 group h-full">
                <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center font-black text-base mb-5 group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                  Bagikan Satu Link di Bio
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Sebut &ldquo;Cek link bio nomor 23 ya!&rdquo; di kontenmu. Penonton langsung menemukan barang persis seketika.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 4. FITUR UNGGULAN DENGAN FADE IN / FADE OUT */}
      <section id="fitur" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <RevealOnScroll direction="up">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
                Fitur Andalan
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Semua yang Dibutuhkan Konten Kreator
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Didesain khusus untuk meningkatkan konversi klik link affiliate dari media sosial.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Cari Nomor Persis Seketika",
                desc: "Penonton cukup mengetik angka atau via numpad dialer, produk langsung muncul dan disorot otomatis.",
              },
              {
                icon: ShoppingBag,
                title: "Multi-Marketplace Otomatis",
                desc: "Dukungan Shopee, TikTok Shop, Tokopedia, dan Lazada. Tombol beli otomatis menyesuaikan nama marketplace.",
              },
              {
                icon: Smartphone,
                title: "Tampilan Khusus Mobile",
                desc: "Mayoritas audiens membuka link bio dari smartphone. Desain UdaLink cepat, ringan, dan terasa seperti mini app.",
              },
              {
                icon: TrendingUp,
                title: "Statistik Klik & Referrer",
                desc: "Pantau produk mana yang paling banyak diklik dan dari platform mana followers datang (TikTok vs Instagram).",
              },
              {
                icon: Sparkles,
                title: "Banner Promo & Unggulan",
                desc: "Sorot produk best-seller dan pasang banner promosi tanggal kembar untuk mendongkrak penjualan maksimal.",
              },
              {
                icon: Layers,
                title: "16 Tema Eksklusif",
                desc: "Kelompokkan produk dengan kategori dan pilih dari 16 palet warna harmonis sesuai persona akunmu.",
              },
            ].map((f, idx) => {
              const IconComp = f.icon;
              return (
                <RevealOnScroll key={f.title} delayMs={idx * 80} direction="up">
                  <div className="p-6 rounded-3xl border border-[#E2E8F0] hover:border-[#16A34A]/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group h-full flex flex-col justify-between">
                    <div>
                      <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-2xs">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-[#0F172A] text-base mb-1.5">
                        {f.title}
                      </h3>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4.5 KALKULATOR ESTIMASI CUAN */}
      <div id="kalkulator">
        <RevealOnScroll direction="up">
          <EarningsCalculator />
        </RevealOnScroll>
      </div>

      {/* 5. TABEL HARGA 3 CARD: GRATIS, PRO BULANAN, PRO TAHUNAN */}
      <section id="harga" className="py-20 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <RevealOnScroll direction="up">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
                Paket Fleksibel
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Pilih Paket Sesuai Kebutuhanmu
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Mulai gratis selamanya, upgrade ke Pro kapan saja untuk fitur tanpa batas.
              </p>
            </div>
          </RevealOnScroll>

          {/* 3 CARD PRICING GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Card 1: Paket Gratis */}
            <RevealOnScroll delayMs={0} direction="up" className="h-full">
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-7 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">Paket Gratis</h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Cocok untuk affiliator pemula yang baru mulai.
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-[#0F172A]">Rp 0</span>
                      <span className="text-xs text-[#64748B] font-medium">/ selamanya</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-[#0F172A] border-t border-[#E2E8F0] pt-6 font-medium">
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Hingga 30 produk affiliate aktif</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>4 Tema Dasar (Hijau, Putih, Gelap, Monokrom)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Pencarian nomor & nama produk</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#94A3B8]">
                      <X className="h-4 w-4 shrink-0" />
                      <span className="line-through">Statistik klik pengunjung</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#94A3B8]">
                      <X className="h-4 w-4 shrink-0" />
                      <span className="line-through">Banner promo etalase</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#94A3B8]">
                      <X className="h-4 w-4 shrink-0" />
                      <span className="line-through">Produk unggulan</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#94A3B8]">
                      <X className="h-4 w-4 shrink-0" />
                      <span>Terdapat watermark UdaLink</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/daftar"
                    className={buttonVariants({
                      variant: "outline",
                      className:
                        "w-full h-11 font-bold active:scale-95 transition-all",
                    })}
                  >
                    Daftar Gratis
                  </Link>
                </div>
              </div>
            </RevealOnScroll>

            {/* Card 2: Paket Pro Bulanan */}
            <RevealOnScroll delayMs={150} direction="up" className="h-full">
              <div className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full relative">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">Pro Bulanan</h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Fleksibel per 30 hari tanpa komitmen panjang.
                    </p>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-[#16A34A]">Rp 29.000</span>
                      <span className="text-xs text-[#64748B] font-medium">/ 30 hari</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-[#0F172A] border-t border-[#E2E8F0] pt-6 font-medium">
                    <div className="flex items-center gap-3 font-bold text-[#16A34A]">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Produk affiliate TANPA BATAS</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Semua 16 Tema Visual Pro</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Hingga 3 Banner promo geser</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Hingga 6 Baris Produk Unggulan</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Statistik klik lengkap & tracking platform</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Hapus watermark / branding UdaLink</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/daftar"
                    className={buttonVariants({
                      variant: "outline",
                      className:
                        "w-full h-11 font-bold border-slate-300 hover:border-slate-400 active:scale-95 transition-all",
                    })}
                  >
                    Pilih Pro Bulanan
                  </Link>
                </div>
              </div>
            </RevealOnScroll>

            {/* Card 3: Paket Pro Tahunan (BEST VALUE / PALING HEMAT) */}
            <RevealOnScroll delayMs={300} direction="up" className="h-full">
              <div className="bg-gradient-to-b from-white via-[#F0FDF4]/30 to-white rounded-3xl border-2 border-[#16A34A] p-7 sm:p-8 flex flex-col justify-between shadow-xl relative hover:-translate-y-2 transition-all duration-300 ring-2 ring-[#16A34A]/20 h-full">
                {/* Best Value Badge Header */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-emerald-600 to-[#16A34A] text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" />
                    BEST VALUE · HEMAT 28%
                  </span>
                </div>

                <div className="space-y-6 pt-1">
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">Pro Tahunan</h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Pilihan paling hemat untuk affiliator aktif.
                    </p>
                    <div className="mt-4 space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-[#16A34A]">
                          Rp 249.000
                        </span>
                        <span className="text-xs text-[#64748B] font-medium">/ tahun</span>
                      </div>
                      <p className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-lg inline-block">
                        Setara ~Rp 20.750 / bulan (Hemat 28%)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-[#0F172A] border-t border-[#E2E8F0] pt-6 font-medium">
                    <div className="flex items-center gap-3 font-bold text-[#16A34A]">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Semua fitur Pro Lengkap 1 Tahun Penuh</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Produk affiliate TANPA BATAS</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Semua 16 Tema Visual & Banner Promo</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Statistik klik lengkap & Bebas Watermark</span>
                    </div>
                    <div className="flex items-center gap-3 font-semibold text-emerald-800">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Prioritas rilis fitur baru & support</span>
                    </div>
                    <div className="flex items-center gap-3 font-semibold text-emerald-800">
                      <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>Badge Affiliator Terverifikasi Pro</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/daftar"
                    className={buttonVariants({
                      className:
                        "w-full h-11 font-extrabold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg shadow-[#16A34A]/25 active:scale-95 transition-all",
                    })}
                  >
                    Mulai Pro Tahunan (Hemat 28%)
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION DENGAN FADE IN / FADE OUT */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <RevealOnScroll direction="up">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
                Pertanyaan Umum
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Pertanyaan yang Sering Ditanyakan
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={150} direction="up">
            <Accordion>
              <AccordionItem title="Apakah UdaLink benar-benar bisa digunakan gratis?">
                Ya, paket Gratis bisa dipakai selamanya dengan kuota hingga 30 produk, akses tema dasar, dan pencarian nomor produk tanpa batas waktu.
              </AccordionItem>
              <AccordionItem title="Bagaimana cara penonton mencari nomor produk yang saya sebut?">
                Cukup sebut nomor produk di video kamu (misalnya &ldquo;Outfit nomor 3 ada di link bio!&rdquo;). Saat penonton membuka etalasemu dan mengetik angka 3 atau menggunakan tombol numpad dialer, produk nomor 3 langsung tampil paling atas dan disorot dengan efek glowing pulse secara otomatis.
              </AccordionItem>
              <AccordionItem title="Marketplace apa saja yang bisa ditautkan?">
                Kamu bisa menautkan link affiliate dari Shopee, TikTok Shop, Tokopedia, Lazada, atau toko online lainnya. UdaLink akan otomatis mendeteksi nama marketplace dari link dan menampilkan label belanja yang sesuai.
              </AccordionItem>
              <AccordionItem title="Apa keuntungan mengambil Paket Pro Tahunan?">
                Paket Pro Tahunan memberikan potongan harga 28% (setara hanya ~Rp 20.750/bulan dibandingkan Rp 29.000/bulan), kuota produk tanpa batas, akses 16 tema, banner promosi, tanpa watermark UdaLink, serta prioritas akses fitur terbaru.
              </AccordionItem>
              <AccordionItem title="Bagaimana metode pembayaran untuk berlangganan?">
                Pembayaran paket Pro menggunakan transfer bank manual dengan kode unik (3 digit) yang terverifikasi cepat oleh admin kami. Tidak memerlukan kartu kredit.
              </AccordionItem>
            </Accordion>
          </RevealOnScroll>
        </div>
      </section>

      {/* 7. CLOSING CTA DENGAN FADE IN / FADE OUT */}
      <section className="py-20 bg-[#F0FDF4] border-t border-[#BBF7D0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <RevealOnScroll direction="up">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0F172A]">
              Siap Maksimalkan Cuan dari Link Affiliate?
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto font-medium mt-2">
              Buat etalase cantikmu sekarang juga dan permudah ratusan followers belanja produk rekomendasi kamu.
            </p>
            <div className="pt-6">
              <Link
                href="/daftar"
                className={buttonVariants({
                  size: "lg",
                  className: "h-12 px-8 text-base font-extrabold shadow-lg shadow-[#16A34A]/25 gap-2 hover:-translate-y-0.5 active:scale-95 transition-all",
                })}
              >
                <span>Daftar Gratis Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-10 bg-white border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#16A34A] flex items-center justify-center text-white">
              <Link2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm text-[#0F172A]">UdaLink</span>
            <span>— Satu link untuk semua produk affiliate</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/syarat-ketentuan" className="hover:text-[#16A34A] transition-colors">
              Syarat & Ketentuan
            </Link>
            <span>•</span>
            <Link href="/kebijakan-privasi" className="hover:text-[#16A34A] transition-colors">
              Kebijakan Privasi
            </Link>
          </div>

          <div>
            © 2026 UdaLink · Powered by UdaCoding. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
