"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Link2,
  LayoutDashboard,
  CreditCard,
  Users,
  Settings,
  Shield,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil keluar dari sesi admin.");
      router.push("/masuk");
    } catch (err) {
      console.error("Gagal logout:", err);
      toast.error("Gagal keluar akun.");
    } finally {
      setLoadingLogout(false);
      setShowLogoutModal(false);
    }
  };

  const adminNav = [
    { name: "Ringkasan", href: "/admin", icon: LayoutDashboard },
    { name: "Verifikasi Pembayaran", href: "/admin/pembayaran", icon: CreditCard },
    { name: "Kelola Pengguna", href: "/admin/pengguna", icon: Users },
    { name: "Pengaturan Aplikasi", href: "/admin/pengaturan", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* SIDEBAR ADMIN GELAP (#0F172A) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-[#0F172A] text-white shrink-0 sticky top-0 h-screen">
        {/* Brand Admin */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#16A34A] flex items-center justify-center text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">UdaLink</span>
              <span className="text-[10px] block text-emerald-400 font-mono font-medium -mt-1">
                PANEL ADMIN
              </span>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
            Super
          </Badge>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Manajemen
          </div>
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#16A34A] text-white font-semibold shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 mt-6 border-t border-slate-800">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-rose-400" />
              <span>Keluar Sesi Admin</span>
            </button>
          </div>
        </div>

        {/* Footer Admin info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-medium text-slate-200">Mode Administrator</p>
          <p className="text-[11px] text-slate-500">Akses Penuh Basis Data</p>
        </div>
      </aside>

      {/* MOBILE HEADER ADMIN */}
      <header className="md:hidden bg-[#0F172A] text-white sticky top-0 z-20 border-b border-slate-800 shadow-sm">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">UdaLink Panel Admin</span>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/20 flex items-center gap-1.5 min-h-[36px]"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-slate-800/80 bg-[#0F172A]">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] active:scale-95 select-none",
                  isActive
                    ? "bg-[#16A34A] text-white font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* MODAL KONFIRMASI LOGOUT ADMIN */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Keluar dari Panel Admin?"
        description="Sesi administrator Anda akan diakhiri dan dialihkan ke halaman masuk."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
        icon="logout"
        loading={loadingLogout}
        onConfirm={handleLogout}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
