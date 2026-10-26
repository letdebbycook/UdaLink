import React from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk & Daftar — UdaLink",
  description: "Masuk ke akun UdaLink untuk mengelola etalase link produk affiliate kamu.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Logo Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform active:scale-95"
          >
            <div className="h-10 w-10 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-md shadow-[#16A34A]/20">
              <Link2 className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Uda<span className="text-[#16A34A]">Link</span>
            </span>
          </Link>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Satu link untuk semua produk affiliate-mu
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          {children}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-[#64748B] hover:text-[#16A34A] transition-colors"
          >
            ← Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}
