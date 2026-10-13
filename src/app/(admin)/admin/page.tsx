import React from "react";
import { Users, CreditCard, Sparkles, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Ringkasan Admin</h1>
          <Badge className="bg-slate-900 text-white text-[10px]">Superadmin</Badge>
        </div>
        <p className="text-sm text-[#64748B]">Metrik penting dan aktivitas platform UdaLink saat ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Total Pengguna</span>
              <Users className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">1.420</span>
              <span className="text-xs text-emerald-600 font-medium">+42 minggu ini</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Pro Aktif</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">385</span>
              <span className="text-xs text-[#64748B]">(27% total)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Menunggu Verifikasi</span>
              <CreditCard className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-900">4</span>
              <span className="text-xs text-amber-700 font-medium">Perlu ditinjau</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Pemasukan Bulan Ini</span>
              <DollarSign className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">Rp 11.165.000</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-[#64748B]">
            Halaman data admin lengkap (Pembayaran, Pengguna, Pengaturan) akan dihubungkan oleh Backend di BE3.8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
