"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Loader2, Save, AlertCircle, ExternalLink, LogOut, Link2, Check, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function AkunPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || "");
        // Ambil display_name dan username dari profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", currentUser.id)
          .single();
        if (profile) {
          setDisplayName(profile.display_name || "");
          setUsername(profile.username || "");
          setCurrentUsername(profile.username || "");
        }
      }
      setInitializing(false);
    };
    loadUser();
  }, []);

  // Validasi real-time ketersediaan username
  const cleanUsername = username.toLowerCase().trim();
  const isValidUsernameFormat = /^[a-z0-9_]{3,30}$/.test(cleanUsername);
  const reservedWords = [
    "admin", "dashboard", "daftar", "masuk", "go", "api", "udalink",
    "bantuan", "tentang", "harga", "syarat", "privasi", "login", "register", "akun",
    "_next", "support", "help", "settings", "pengaturan", "faq", "terms", "privacy",
    "static", "syarat-ketentuan", "kebijakan-privasi"
  ];
  const isReservedUsername = reservedWords.includes(cleanUsername);

  useEffect(() => {
    if (!cleanUsername || cleanUsername === currentUsername) {
      setIsUsernameAvailable(null);
      return;
    }
    if (!isValidUsernameFormat || isReservedUsername) {
      setIsUsernameAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase.rpc("is_username_available", {
          p_username: cleanUsername,
        });
        if (error) throw error;
        setIsUsernameAvailable(Boolean(data));
      } catch (err) {
        console.error("Gagal memeriksa ketersediaan username:", err);
        setIsUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cleanUsername, currentUsername, isValidUsernameFormat, isReservedUsername]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanUsername) {
      toast.error("Link username tidak boleh kosong.");
      return;
    }
    if (cleanUsername === currentUsername) {
      toast.info("Username tidak mengalami perubahan.");
      return;
    }
    if (!isValidUsernameFormat) {
      toast.error("Username harus 3-30 karakter, hanya huruf kecil, angka, dan garis bawah (_).");
      return;
    }
    if (isReservedUsername) {
      toast.error("Username ini dipesan oleh sistem dan tidak dapat digunakan.");
      return;
    }
    if (isUsernameAvailable === false) {
      toast.error("Username sudah digunakan oleh akun lain. Silakan pilih username lain.");
      return;
    }

    setLoadingUsername(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: cleanUsername })
        .eq("id", user!.id);

      if (error) throw error;
      setCurrentUsername(cleanUsername);
      setIsUsernameAvailable(null);
      toast.success("Link etalasemu berhasil diperbarui! Halaman publik sekarang aktif di link baru.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal mengubah link username: ${msg}`);
    } finally {
      setLoadingUsername(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Nama tampilan tidak boleh kosong.");
      return;
    }
    if (displayName.trim().length > 50) {
      toast.error("Nama tampilan maksimal 50 karakter.");
      return;
    }
    setLoadingProfile(true);
    try {
      // Update display_name di tabel profiles
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user!.id);

      if (error) throw error;
      toast.success("Nama tampilan berhasil diperbarui!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal memperbarui profil: ${msg}`);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Email tidak boleh kosong.");
      return;
    }
    if (trimmedEmail.length > 100) {
      toast.error("Panjang alamat email maksimal 100 karakter.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Format email tidak valid. Masukkan alamat email yang benar (contoh: nama@domain.com).");
      return;
    }
    if (trimmedEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("Email baru sama dengan email saat ini.");
      return;
    }
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
      if (error) throw error;
      toast.success("Email konfirmasi telah dikirim ke email baru. Silakan periksa inbox-mu.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal mengubah email: ${msg}`);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Kata sandi berhasil diperbarui!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal mengubah kata sandi: ${msg}`);
    } finally {
      setLoadingPassword(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Pengaturan Akun</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Kelola informasi akun dan keamanan akunmu.
        </p>
      </div>

      {/* Info Email Saat Ini */}
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
        <div className="text-xs text-[#15803D]">
          <span className="font-semibold">Login sebagai:</span>{" "}
          {user?.email}
        </div>
      </div>

      {/* Form Link Etalase (Username) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
              <Link2 className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Link Etalase (Username)</h2>
              <p className="text-xs text-[#64748B]">
                Tentukan link publik etalase yang mudah diingat pembeli
              </p>
            </div>
          </div>
          {currentUsername && (
            <Link
              href={`/${currentUsername}`}
              target="_blank"
              className="text-xs font-semibold text-[#16A34A] hover:underline flex items-center gap-1 shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Buka Link</span>
            </Link>
          )}
        </div>

        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0F172A] block">
              Tautan Etalase Publik
            </label>
            <div className="flex items-center rounded-xl border border-[#E2E8F0] overflow-hidden focus-within:ring-2 focus-within:ring-[#16A34A]/20 focus-within:border-[#16A34A] transition-all bg-white">
              <span className="bg-slate-50 border-r border-[#E2E8F0] px-3.5 py-2 text-xs font-mono text-slate-500 select-none">
                udalink.vercel.app/
              </span>
              <Input
                type="text"
                required
                placeholder="namaetalasemu"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={30}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-mono tracking-tight text-[#0F172A] h-10 px-3"
              />
              <div className="pr-3 flex items-center">
                {checkingUsername && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                {!checkingUsername && isUsernameAvailable === true && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" /> Tersedia
                  </span>
                )}
                {!checkingUsername && isUsernameAvailable === false && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    <X className="h-3 w-3" /> Tidak Tersedia
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#94A3B8] mt-1">
              <span>Hanya huruf kecil, angka, dan garis bawah (_). 3-30 karakter.</span>
              <span>{cleanUsername.length}/30</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto h-10 text-sm font-semibold gap-2"
            disabled={
              loadingUsername ||
              cleanUsername === currentUsername ||
              !isValidUsernameFormat ||
              isReservedUsername ||
              isUsernameAvailable === false
            }
          >
            {loadingUsername ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Menyimpan Link...</span></>
            ) : (
              <><Save className="h-4 w-4" /><span>Simpan Link Etalase</span></>
            )}
          </Button>
        </form>
      </div>

      {/* Form 1: Nama Tampilan */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
            <User className="h-4 w-4 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Nama Tampilan</h2>
            <p className="text-xs text-[#64748B]">
              Nama yang ditampilkan di etalasemu
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0F172A] block">
              Nama Tampilan
            </label>
            <Input
              type="text"
              required
              placeholder="Nama lengkapmu"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
            <p className="text-[11px] text-[#94A3B8]">{displayName.length}/50 karakter</p>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto h-10 text-sm font-semibold gap-2"
            disabled={loadingProfile}
          >
            {loadingProfile ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Menyimpan...</span></>
            ) : (
              <><Save className="h-4 w-4" /><span>Simpan Nama</span></>
            )}
          </Button>
        </form>
      </div>

      {/* Form 2: Ganti Email */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
            <ExternalLink className="h-4 w-4 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Ubah Email</h2>
            <p className="text-xs text-[#64748B]">
              Email konfirmasi akan dikirim ke alamat baru
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0F172A] block">
              Email Baru
            </label>
            <Input
              type="email"
              required
              maxLength={50}
              placeholder="email-baru@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ""))}
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Format: nama@domain.com (maks. 50 karakter, tanpa spasi)</span>
              <span className={email.length >= 50 ? "text-amber-600 font-semibold" : ""}>
                {email.length}/50
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto h-10 text-sm font-semibold gap-2"
            disabled={loadingEmail || email === user?.email}
          >
            {loadingEmail ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Mengirim Konfirmasi...</span></>
            ) : (
              <><Save className="h-4 w-4" /><span>Ubah Email</span></>
            )}
          </Button>
        </form>
      </div>

      {/* Form 3: Ganti Password */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
            <Lock className="h-4 w-4 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Kata Sandi</h2>
            <p className="text-xs text-[#64748B]">
              Minimal 6 karakter — disarankan kombinasi huruf &amp; angka
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0F172A] block">
              Kata Sandi Baru
            </label>
            <Input
              type="password"
              required
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0F172A] block">
              Konfirmasi Kata Sandi Baru
            </label>
            <Input
              type="password"
              required
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium">
                Kata sandi tidak cocok.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto h-10 text-sm font-semibold gap-2"
            disabled={loadingPassword || !newPassword || !confirmPassword}
          >
            {loadingPassword ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Memperbarui...</span></>
            ) : (
              <><Lock className="h-4 w-4" /><span>Perbarui Kata Sandi</span></>
            )}
          </Button>
        </form>
      </div>

      {/* Sesi Login & Keluar Akun */}
      <div className="bg-white rounded-2xl border border-red-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
            <LogOut className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Sesi Login</h2>
            <p className="text-xs text-[#64748B]">
              Masuk sebagai <strong className="text-slate-800">{user?.email}</strong>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Keluar dari sesi saat ini jika kamu menggunakan perangkat bersama atau ingin berganti akun.
        </p>

        <Button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          disabled={loadingLogout}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm font-semibold gap-2"
        >
          {loadingLogout ? (
            <><Loader2 className="h-4 w-4 animate-spin text-red-600" /><span>Sedang Keluar...</span></>
          ) : (
            <><LogOut className="h-4 w-4" /><span>Keluar dari Akun Ini</span></>
          )}
        </Button>
      </div>

      {/* Bantuan: Lupa Password */}
      <div className="text-center">
        <Link
          href="/lupa-password"
          className="text-xs text-[#64748B] hover:text-[#16A34A] transition-colors underline underline-offset-2"
        >
          Lupa kata sandi saat ini? Gunakan fitur atur ulang via email
        </Link>
      </div>

      {/* Modern Custom Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setLoadingLogout(true);
          try {
            await supabase.auth.signOut();
            toast.success("Berhasil keluar dari akun.");
            window.location.href = "/masuk";
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
            toast.error(`Gagal keluar: ${msg}`);
            setLoadingLogout(false);
            setShowLogoutModal(false);
          }
        }}
        title="Keluar dari Akun UdaLink"
        description="Apakah kamu yakin ingin keluar dari akun UdaLink? Kamu perlu masuk kembali untuk mengakses akunmu."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        loading={loadingLogout}
        icon="logout"
        variant="danger"
      />
    </div>
  );
}
