"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Link2,
  LayoutDashboard,
  Package,
  Layers,
  Palette,
  BarChart2,
  CreditCard,
  User,
  ShieldCheck,
  MoreHorizontal,
  X,
  ExternalLink,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<{
    displayName: string;
    username: string;
    avatarUrl: string | null;
    isPro: boolean;
    isAdmin: boolean;
  }>({
    displayName: "Pengguna",
    username: "...",
    avatarUrl: null,
    isPro: false,
    isAdmin: false,
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profRes, planRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("id", user.id)
            .single(),
          supabase.rpc("get_my_plan"),
        ]);

        const prof = profRes.data;
        const plan = planRes.data as { is_pro?: boolean; role?: string } | null;

        setCurrentUser({
          displayName: prof?.display_name || user.email?.split("@")[0] || "Pengguna",
          username: prof?.username || "user",
          avatarUrl: prof?.avatar_url || null,
          isPro: Boolean(plan?.is_pro),
          isAdmin: plan?.role === "admin",
        });
      } catch (err) {
        console.warn("Gagal memuat profil header:", err);
      }
    }
    loadUser();
  }, []);

  function handleLogout() {
    setShowLogoutModal(true);
  }

  async function performLogout() {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      toast.success("Berhasil keluar dari akun.");
      window.location.href = "/masuk";
    } catch (err) {
      toast.error("Gagal keluar dari akun.");
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  }

  const mainNavItems = [
    { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Produk", href: "/dashboard/produk", icon: Package },
    { name: "Kategori", href: "/dashboard/kategori", icon: Layers },
    { name: "Tampilan", href: "/dashboard/tampilan", icon: Palette },
    { name: "Statistik", href: "/dashboard/statistik", icon: BarChart2 },
    { name: "Langganan", href: "/dashboard/langganan", icon: CreditCard },
    { name: "Akun", href: "/dashboard/akun", icon: User },
  ];

  // Mobile Bottom Nav: 5 items
  const mobileNavItems = [
    { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Produk", href: "/dashboard/produk", icon: Package },
    { name: "Tampilan", href: "/dashboard/tampilan", icon: Palette },
    { name: "Statistik", href: "/dashboard/statistik", icon: BarChart2 },
    { name: "Lainnya", action: () => setShowMoreMenu(true), icon: MoreHorizontal },
  ];

  const moreItems = [
    { name: "Kategori", href: "/dashboard/kategori", icon: Layers },
    { name: "Langganan", href: "/dashboard/langganan", icon: CreditCard },
    { name: "Pengaturan Akun", href: "/dashboard/akun", icon: User },
    ...(currentUser.isAdmin
      ? [{ name: "Panel Admin", href: "/admin", icon: ShieldCheck, badge: "Admin" }]
      : []),
  ];

  const etalaseUrl = currentUser.username !== "..." ? `/${currentUser.username}` : "/nando";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-[#E2E8F0] bg-white shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center border-b border-[#E2E8F0] justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-sm shadow-[#16A34A]/20">
              <Link2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">
              Uda<span className="text-[#16A34A]">Link</span>
            </span>
          </Link>
          {currentUser.isPro ? (
            <Badge variant="pro">PRO</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-slate-500">
              GRATIS
            </Badge>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="text-[11px] font-semibold tracking-wider text-[#94A3B8] uppercase px-3 mb-2">
            Menu Utama
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#F0FDF4] text-[#16A34A] font-semibold"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-[#16A34A]" : "text-[#64748B]")} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#E2E8F0]">
            <div className="text-[11px] font-semibold tracking-wider text-[#94A3B8] uppercase px-3 mb-2">
              Tautan Eksternal
            </div>
            {currentUser.isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors",
                  pathname.startsWith("/admin") && "bg-[#F1F5F9] text-[#0F172A] font-semibold"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#64748B]" />
                  <span>Panel Admin</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">
                  Admin
                </Badge>
              </Link>
            )}
            <Link
              href={etalaseUrl}
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#16A34A] hover:bg-[#F0FDF4] transition-colors mt-1"
            >
              <ExternalLink className="h-4.5 w-4.5" />
              <span>Lihat Etalasemu</span>
            </Link>
          </div>
        </div>

        {/* User Mini Bar with Actual Logout */}
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-200 overflow-hidden flex items-center justify-center font-bold text-xs text-[#16A34A] shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-semibold text-[#0F172A] truncate">
                {currentUser.displayName}
              </p>
              <p className="text-[11px] text-[#64748B] truncate">
                @{currentUser.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Keluar dari Akun"
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-6">
        {/* Top Header Mobile */}
        <header className="md:hidden h-14 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between sticky top-0 z-20">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#16A34A] flex items-center justify-center text-white">
              <Link2 className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-[#0F172A]">
              Uda<span className="text-[#16A34A]">Link</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={etalaseUrl}
              target="_blank"
              className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-1.5 rounded-lg border border-[#BBF7D0] flex items-center gap-1 min-h-[36px]"
            >
              <span>Etalase</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (5 ITEMS) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white border-t border-[#E2E8F0] flex items-center justify-around z-30 shadow-lg px-2">
        {mobileNavItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.href
            ? pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            : false;

          if (item.action) {
            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[#64748B] hover:text-[#16A34A] active:scale-95 transition-all select-none"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href!}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-95 transition-all select-none",
                isActive
                  ? "text-[#16A34A] font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* MOBILE "LAINNYA" MODAL DRAWER */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 border-t border-[#E2E8F0] space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold text-xs">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    currentUser.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] leading-tight">
                    {currentUser.displayName}
                  </h3>
                  <p className="text-[11px] text-slate-500">@{currentUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] text-[#0F172A] font-medium text-sm transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[#64748B]" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-[#DC2626] font-medium text-sm hover:bg-[#FEE2E2]/30 transition-colors text-left"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Custom Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={performLogout}
        title="Keluar dari UdaLink"
        description="Apakah kamu yakin ingin keluar dari akun? Kamu perlu masuk kembali untuk mengakses dasbor etalasemu."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        loading={isLoggingOut}
        icon="logout"
        variant="danger"
      />
    </div>
  );
}
