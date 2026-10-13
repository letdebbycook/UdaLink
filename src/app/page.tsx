import React from "react";
import Link from "next/link";
import {
  Link2,
  ArrowRight,
  Sparkles,
  Search,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  ShieldCheck,
  Check,
  X,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { Accordion, AccordionItem } from "@/components/ui/accordion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col font-sans">
      {/* 1. NAVBAR */}
      <header className="h-18 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-sm shadow-[#16A34A]/20">
              <Link2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">
              Uda<span className="text-[#16A34A]">Link</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <a href="#langkah" className="hover:text-[#16A34A] transition-colors">Cara Kerja</a>
            <a href="#fitur" className="hover:text-[#16A34A] transition-colors">Fitur</a>
            <a href="#harga" className="hover:text-[#16A34A] transition-colors">Harga</a>
            <a href="#faq" className="hover:text-[#16A34A] transition-colors">FAQ</a>
            <Link href="/nando" target="_blank" className="text-[#16A34A] font-semibold flex items-center gap-1 hover:underline">
              Contoh Etalase
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/masuk">
              <Button variant="ghost" size="sm" className="font-semibold text-xs sm:text-sm">
                Masuk
              </Button>
            </Link>
            <Link href="/daftar">
              <Button size="sm" className="font-semibold text-xs sm:text-sm gap-1.5 shadow-sm shadow-[#16A34A]/20">
                <span>Buat Etalase Gratis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-[#F0FDF4]/70 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-semibold border border-[#BBF7D0]">
                <Sparkles className="h-3.5 w-3.5 fill-[#15803D]" />
                <span>Dirancang Khusus Affiliator Indonesia</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15]">
                Satu link untuk semua produk affiliate-mu
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Audiens cukup cari nomor produk yang kamu sebut di video TikTok atau Reels, langsung klik dan beli di marketplace tanpa ribet scroll ratusan link.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link href="/daftar" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-base font-bold gap-2 shadow-lg shadow-[#16A34A]/25">
                    <span>Buat Etalase Gratis</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/nando" target="_blank" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-base font-semibold">
                    Lihat Contoh Etalase
                  </Button>
                </Link>
              </div>

              {/* Trust micro metrics */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#64748B]">
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

      {/* 3. CARA KERJA 3 LANGKAH */}
      <section id="langkah" className="py-20 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
              Mudah & Praktis
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
              Mulai dalam 3 Langkah Sederhana
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Tanpa keahlian teknis. Etalase affiliate-mu langsung siap dibagikan ke followers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Langkah 1 */}
            <div className="bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center font-bold text-base mb-5">
                1
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                Daftar & Buat Akun
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Pilih username unik pilihanmu (contoh: udalink.id/nando), lengkapi foto profil dan bio singkat.
              </p>
            </div>

            {/* Langkah 2 */}
            <div className="bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center font-bold text-base mb-5">
                2
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                Masukkan Link Produk
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Tempel tautan affiliate. Setiap produk otomatis mendapatkan nomor unik (#1, #2, #3, dst).
              </p>
            </div>

            {/* Langkah 3 */}
            <div className="bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center justify-center font-bold text-base mb-5">
                3
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                Bagikan Satu Link di Bio
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Sebut &ldquo;Cek link bio nomor 23 ya!&rdquo; di kontenmu. Penonton langsung menemukan barang persis seketika.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FITUR UNGGULAN */}
      <section id="fitur" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
              Fitur Andalan
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
              Semua yang Dibutuhkan Konten Kreator
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Didesain khusus untuk meningkatkan konversi klik link affiliate dari media sosial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#16A34A]/50 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-4">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-base mb-1.5">
                Cari Nomor Persis Seketika
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Penonton cukup mengetik angka &ldquo;3&rdquo;, produk nomor #3 langsung muncul di posisi teratas dan disorot.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#16A34A]/50 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-4">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-base mb-1.5">
                Multi-Marketplace Otomatis
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Dukungan Shopee, TikTok Shop, Tokopedia, dan Lazada. Tombol beli otomatis menyesuaikan nama marketplace.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#16A34A]/50 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-4">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-base mb-1.5">
                Tampilan Khusus Mobile (480px)
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                99% audiens membuka link bio dari smartphone. Desain UdaLink cepat, ringan, dan terasa seperti mini app.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#16A34A]/50 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-base mb-1.5">
                Statistik Klik Terbanyak
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Pantau produk mana yang paling banyak diklik followers untuk menyusun strategi konten affiliate berikutnya.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#16A34A]/50 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-base mb-1.5">
                Banner Promo & Unggulan
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Sorot produk best-seller dan pasang banner promosi tanggal kembar untuk mendongkrak penjualan maksimal.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#16A34A]/50 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-base mb-1.5">
                Kategori & Pilihan Tema
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Kelompokkan produk (Outfit, Gadget, Skincare) dan ganti nuansa warna etalase sesuai persona akunmu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TABEL HARGA GRATIS VS PRO */}
      <section id="harga" className="py-20 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
              Paket Fleksibel
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
              Pilih Paket Sesuai Kebutuhanmu
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Mulai gratis selamanya, upgrade ke Pro saat akunmu berkembang pesat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Paket Gratis */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 flex flex-col justify-between shadow-xs">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">Paket Gratis</h3>
                  <p className="text-xs text-[#64748B] mt-1">Cocok untuk affiliator pemula yang baru mulai.</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#0F172A]">Rp 0</span>
                    <span className="text-xs text-[#64748B]">/ selamanya</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-[#0F172A] border-t border-[#E2E8F0] pt-6">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <span>Hingga 30 produk affiliate aktif</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <span>3 Tema dasar (Hijau, Putih, Gelap)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <span>Pencarian nomor & nama produk</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <span>Statistik klik 7 hari</span>
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
                <Link href="/daftar">
                  <Button variant="outline" className="w-full h-11 font-semibold">
                    Daftar Gratis
                  </Button>
                </Link>
              </div>
            </div>

            {/* Paket Pro */}
            <div className="bg-white rounded-3xl border-2 border-[#16A34A] p-8 flex flex-col justify-between shadow-lg relative">
              <div className="absolute -top-3.5 right-6">
                <Badge variant="pro" className="px-3 py-1 text-xs uppercase tracking-wider">
                  PALING POPULER
                </Badge>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">Paket Pro</h3>
                  <p className="text-xs text-[#64748B] mt-1">Untuk affiliator profesional yang ingin konversi maksimal.</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#16A34A]">Rp 29.000</span>
                    <span className="text-xs text-[#64748B]">/ 30 hari</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-[#0F172A] border-t border-[#E2E8F0] pt-6">
                  <div className="flex items-center gap-3 font-semibold text-[#16A34A]">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Produk affiliate TANPA BATAS</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <span>Semua 8 Tema (Termasuk 5 Tema Premium)</span>
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
                    <span>Statistik klik lengkap 30 hari</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <span>Hapus watermark / branding UdaLink</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link href="/daftar">
                  <Button className="w-full h-11 font-bold shadow-md shadow-[#16A34A]/25">
                    Mulai Akun Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
              Pertanyaan Umum
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion>
            <AccordionItem title="Apakah UdaLink benar-benar bisa digunakan gratis?">
              Ya, paket Gratis bisa dipakai selamanya dengan kuota hingga 30 produk, akses 3 tema dasar, dan pencarian nomor produk tanpa batas waktu.
            </AccordionItem>
            <AccordionItem title="Bagaimana cara penonton mencari nomor produk yang saya sebut?">
              Cukup sebut nomor produk di video kamu (misalnya &ldquo;Outfit nomor 3 ada di link bio!&rdquo;). Saat penonton membuka etalasemu dan mengetik angka 3 di kolom pencarian, produk nomor 3 langsung tampil paling atas dan disorot secara otomatis.
            </AccordionItem>
            <AccordionItem title="Marketplace apa saja yang bisa ditautkan?">
              Kamu bisa menautkan link affiliate dari Shopee, TikTok Shop, Tokopedia, Lazada, atau toko online lainnya. UdaLink akan otomatis mendeteksi nama marketplace dari link dan menampilkan label belanja yang sesuai.
            </AccordionItem>
            <AccordionItem title="Bagaimana cara berlangganan Paket Pro?">
              Pembayaran paket Pro menggunakan transfer bank manual dengan kode unik (3 digit) yang terverifikasi cepat oleh admin kami. Tidak perlu kartu kredit.
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 7. CLOSING CTA */}
      <section className="py-20 bg-[#F0FDF4] border-t border-[#BBF7D0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Siap Maksimalkan Cuan dari Link Affiliate?
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto">
            Buat etalase cantikmu sekarang juga dan permudah ratusan followers belanja produk rekomendasi kamu.
          </p>
          <div className="pt-2">
            <Link href="/daftar">
              <Button size="lg" className="h-12 px-8 text-base font-bold shadow-lg shadow-[#16A34A]/25 gap-2">
                <span>Daftar Gratis Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
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
          <div>
            © 2026 UdaLink · Powered by UdaCoding. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
