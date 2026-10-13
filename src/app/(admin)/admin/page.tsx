"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CreditCard, Sparkles, DollarSign, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface AdminStats {
  total_users: number;
  pro_users: number;
  pending_payments: number;
  monthly_revenue: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await supabase.rpc("admin_dashboard_stats");
        if (error) throw error;
        setStats(data as AdminStats);
      } catch (err) {
        console.error("Gagal memuat statistik admin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Ringkasan Admin</h1>
            <Badge className="bg-slate-900 text-white text-[10px]">Superadmin</Badge>
          </div>
          <p className="text-sm text-[#64748B]">Metrik penting dan aktivitas platform UdaLink saat ini.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pengguna */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748B]">Total Pengguna</span>
                  <Users className="h-4 w-4 text-[#16A34A]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#0F172A]">{stats?.total_users || 0}</span>
                  <span className="text-xs text-[#64748B]">terdaftar</span>
                </div>
              </CardContent>
            </Card>

            {/* Pro Aktif */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748B]">Pro Aktif</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#0F172A]">{stats?.pro_users || 0}</span>
                  <span className="text-xs text-amber-600 font-medium">berlangganan</span>
                </div>
              </CardContent>
            </Card>

            {/* Menunggu Verifikasi */}
            <Link href="/admin/pembayaran">
              <Card className="border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800">Menunggu Verifikasi</span>
                    <CreditCard className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-900">{stats?.pending_payments || 0}</span>
                    <span className="text-xs text-amber-700 font-medium">Perlu ditinjau →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Pemasukan Bulan Ini */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748B]">Pemasukan Bulan Ini</span>
                  <DollarSign className="h-4 w-4 text-[#16A34A]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#0F172A]">
                    {formatRupiah(stats?.monthly_revenue || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-sm text-[#0F172A]">Aksi Cepat: Verifikasi Pembayaran</h3>
                <p className="text-xs text-[#64748B]">
                  Periksa bukti transfer dari pengguna yang mengajukan upgrade ke paket Pro dan sesuaikan dengan mutasi bank.
                </p>
                <Link href="/admin/pembayaran">
                  <Button size="sm" className="gap-2">
                    <span>Buka Halaman Pembayaran</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-sm text-[#0F172A]">Aksi Cepat: Kelola Pengguna</h3>
                <p className="text-xs text-[#64748B]">
                  Cari affiliator, aktifkan/cabut paket Pro secara manual, atau tangguhkan akun yang melanggar ketentuan.
                </p>
                <Link href="/admin/pengguna">
                  <Button size="sm" variant="outline" className="gap-2">
                    <span>Buka Daftar Pengguna</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
