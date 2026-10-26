import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Link2, ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan — UdaLink",
  description: "Ketentuan penggunaan platform etalase affiliate UdaLink.",
};

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#16A34A] flex items-center justify-center text-white">
              <Link2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="font-bold text-lg">
              Uda<span className="text-[#16A34A]">Link</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-[#64748B] hover:text-[#16A34A] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-12 shadow-xs space-y-8">
          <div className="border-b border-[#E2E8F0] pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-semibold mb-3">
              <ShieldCheck className="h-4 w-4" />
              <span>Dokumen Resmi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Syarat & Ketentuan Layanan
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5">
              Terakhir diperbarui: 26 Oktober 2026
            </p>
          </div>

          <section className="space-y-4 text-sm leading-relaxed text-[#334155]">
            <h2 className="text-base font-bold text-[#0F172A]">1. Ketentuan Umum</h2>
            <p>
              Dengan mendaftar, mengakses, atau menggunakan layanan UdaLink (&ldquo;Layanan&rdquo;), Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui salah satu bagian dari ketentuan ini, Anda tidak diperkenankan menggunakan Layanan kami.
            </p>

            <h2 className="text-base font-bold text-[#0F172A]">2. Penggunaan Akun &amp; Etalase</h2>
            <p>
              UdaLink menyediakan platform link-in-bio untuk mempermudah affiliator menautkan produk affiliate ke marketplace resmi (seperti Shopee, TikTok Shop, Tokopedia, Lazada). Anda bertanggung jawab penuh atas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Keaslian dan keakuratan informasi akun, tautan produk, dan konten yang diunggah.</li>
              <li>Kerahasiaan kredensial login akun Anda.</li>
              <li>Kepatuhan terhadap kebijakan program affiliate dari masing-masing marketplace yang Anda tautkan.</li>
            </ul>

            <h2 className="text-base font-bold text-[#0F172A]">3. Larangan Konten &amp; Aktivitas</h2>
            <p>Pengguna dilarang keras mengunggah atau mempromosikan:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Produk terlarang, ilegal, narkotika, obat keras tanpa izin, atau senjata.</li>
              <li>Perjudian, pornografi, penipuan (phishing), atau skema piramida / money game.</li>
              <li>Tautan berbahaya yang mengandung malware, virus, atau pengelabuan data.</li>
            </ul>
            <p>
              UdaLink berhak menonaktifkan atau menghapus akun yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.
            </p>

            <h2 className="text-base font-bold text-[#0F172A]">4. Layanan Berbayar (UdaLink Pro)</h2>
            <p>
              Layanan UdaLink Pro diaktifkan setelah konfirmasi pembayaran manual oleh tim admin. Durasi paket berlaku selama periode yang disepakati (30 hari untuk paket bulanan, 365 hari untuk paket tahunan). Pembayaran yang telah diverifikasi dan diaktifkan tidak dapat dibatalkan atau di-refund.
            </p>

            <h2 className="text-base font-bold text-[#0F172A]">5. Batasan Tanggung Jawab</h2>
            <p>
              UdaLink merupakan platform perantara tautan dan bukan penjual produk. Transaksi jual beli, pengiriman barang, garansi, dan keluhan produk sepenuhnya menjadi tanggung jawab antara pembeli, penjual, dan marketplace bersangkutan.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
