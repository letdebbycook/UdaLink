import React from "react";
import Link from "next/link";
import { Copy, ExternalLink, Package, MousePointerClick, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Ringkasan</h1>
        <p className="text-sm text-[#64748B]">Pantau performa etalase dan produk affiliate-mu di sini.</p>
      </div>

      {/* Kartu Link Etalase */}
      <Card className="border-[#BBF7D0] bg-gradient-to-r from-[#F0FDF4] to-white">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider">Link Etalasemu</span>
            <div className="text-base sm:text-lg font-bold text-[#0F172A] font-mono">
              udalink.id/nando
            </div>
            <p className="text-xs text-[#64748B]">Pasang link ini di bio Instagram, TikTok, dan bio YouTube-mu.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Copy className="h-3.5 w-3.5" />
              <span>Salin Link</span>
            </Button>
            <Link href="/nando" target="_blank">
              <Button size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Lihat Halaman</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 3 Kartu Angka */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Total Produk Aktif</span>
              <Package className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">12</span>
              <span className="text-xs text-[#64748B]">/ Unlimited (Pro)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Klik 7 Hari Terakhir</span>
              <MousePointerClick className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">1.248</span>
              <span className="text-xs text-emerald-600 font-medium">+18% dari minggu lalu</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Status Paket</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="pro">PRO AKTIF</Badge>
              <span className="text-xs text-[#64748B]">s.d. 30 Nov 2026</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist Awal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A]">Checklist Memulai Etalase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-[#0F172A]">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span className="line-through text-[#64748B]">Lengkapi foto profil dan bio etalase</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#0F172A]">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span className="line-through text-[#64748B]">Tambahkan produk affiliate pertamamu</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#0F172A]">
            <div className="h-4 w-4 rounded-full border-2 border-[#CBD5E1] shrink-0" />
            <span>Pasang link etalase di bio media sosialmu</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
