import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Link2, ArrowLeft, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — UdaLink",
  description: "Kebijakan privasi dan perlindungan data pengguna di UdaLink.",
};

export default function KebijakanPrivasiPage() {
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
              <Lock className="h-4 w-4" />
              <span>Perlindungan Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kebijakan Privasi
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5">
              Terakhir diperbarui: 26 Oktober 2026
            </p>
          </div>

          <section className="space-y-4 text-sm leading-relaxed text-[#334155]">
            <h2 className="text-base font-bold text-[#0F172A]">1. Data yang Kami Kumpulkan</h2>
            <p>Kami mengumpulkan informasi yang Anda berikan saat mendaftar dan menggunakan UdaLink:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Informasi Akun:</strong> Alamat email, username pilihan, nama tampilan, dan kata sandi terenkripsi.</li>
              <li><strong>Informasi Profil &amp; Etalase:</strong> Foto profil, teks bio, nomor WhatsApp bisnis, dan handle media sosial.</li>
              <li><strong>Data Produk Affiliate:</strong> Nama produk, tautan afiliasi, marketplace, harga, dan gambar produk.</li>
              <li><strong>Statistik Kunjungan:</strong> Jumlah klik produk agregat untuk keperluan analitik pemilik etalase.</li>
            </ul>

            <h2 className="text-base font-bold text-[#0F172A]">2. Penggunaan Informasi</h2>
            <p>Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Menyediakan, mengelola, dan mengoptimalkan etalase tautan Anda.</li>
              <li>Menghitung metrik performa klik produk affiliate Anda.</li>
              <li>Memverifikasi transaksi langganan paket UdaLink Pro.</li>
              <li>Menghubungi Anda terkait pembaruan layanan penting atau keamanan akun.</li>
            </ul>

            <h2 className="text-base font-bold text-[#0F172A]">3. Perlindungan &amp; Keamanan Data</h2>
            <p>
              Kami menerapkan standar keamanan enkripsi modern (termasuk HTTPS/TLS dan Row Level Security database) untuk melindungi data pribadi Anda dari akses tidak sah, kebocoran, atau perubahan data tanpa izin.
            </p>

            <h2 className="text-base font-bold text-[#0F172A]">4. Pembagian Data ke Pihak Ketiga</h2>
            <p>
              UdaLink tidak pernah menjual atau menyewakan data pribadi Anda kepada pihak ketiga mana pun. Data publik etalase (nama, bio, nomor produk, link) hanya ditampilkan kepada calon pembeli yang mengakses tautan etalase Anda.
            </p>

            <h2 className="text-base font-bold text-[#0F172A]">5. Kontak Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau ingin mengajukan permohonan penghapusan akun, silakan hubungi tim kami melalui email resmi atau kontak WhatsApp yang tertera di aplikasi.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
