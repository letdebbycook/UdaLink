import React from "react";
import Link from "next/link";
import { Link2, ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-8 sm:p-10 space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mx-auto border border-[#DCFCE7]">
          <SearchX className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Error 404
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Halaman atau etalase yang kamu tuju tidak tersedia, telah dipindahkan, atau tautan yang kamu masukkan keliru.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-[#94A3B8]">
        <Link2 className="h-3.5 w-3.5 text-[#16A34A]" />
        <span>UdaLink — Satu link untuk semua produk affiliate</span>
      </div>
    </div>
  );
}
