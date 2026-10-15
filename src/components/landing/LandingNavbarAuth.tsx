"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function LandingNavbarAuth() {
  const [user, setUser] = useState<{ username?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", currentUser.id)
            .single();

          setUser({
            username: profile?.username || currentUser.email?.split("@")[0] || "user",
          });
        }
      } catch (err) {
        console.warn("Gagal mengecek user navbar:", err);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/masuk">
          <Button variant="ghost" size="sm" className="font-semibold text-xs sm:text-sm">
            Masuk
          </Button>
        </Link>
        <Link href="/daftar">
          <Button size="sm" className="font-semibold text-xs sm:text-sm gap-1.5 shadow-sm shadow-[#16A34A]/20 min-h-[38px]">
            <span className="hidden sm:inline">Buat Etalase Gratis</span>
            <span className="sm:hidden">Daftar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Berhasil keluar dari akun.");
      window.location.reload();
    } catch {
      toast.error("Gagal keluar dari akun.");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  }

  if (user) {
    return (
      <>
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs sm:text-sm gap-1.5 shadow-sm shadow-[#16A34A]/20"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard (@{user.username})</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogoutModal(true)}
            title="Keluar Akun"
            className="text-xs text-slate-600 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>

        <ConfirmModal
          isOpen={showLogoutModal}
          onClose={() => {
            if (!isLoggingOut) setShowLogoutModal(false);
          }}
          onConfirm={handleLogout}
          title="Keluar dari Akun UdaLink"
          description="Apakah kamu yakin ingin keluar dari akun UdaLink? Kamu perlu masuk kembali untuk mengakses dasbor etalasemu."
          confirmText="Ya, Keluar"
          cancelText="Batal"
          loading={isLoggingOut}
          icon="logout"
          variant="danger"
        />
      </>
    );
  }

  return (
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
  );
}
