"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Loader2, Save, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";

export default function AkunPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || "");
        // Ambil display_name dari profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", currentUser.id)
          .single();
        if (profile) {
          setDisplayName(profile.display_name || "");
        }
      }
      setInitializing(false);
    };
    loadUser();
  }, []);

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
    if (!email.trim()) {
      toast.error("Email tidak boleh kosong.");
      return;
    }
    if (email === user?.email) {
      toast.error("Email baru sama dengan email saat ini.");
      return;
    }
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
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
              placeholder="email-baru@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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

      {/* Bahaya: Lupa Password */}
      <div className="text-center">
        <Link
          href="/lupa-password"
          className="text-xs text-[#64748B] hover:text-[#16A34A] transition-colors underline underline-offset-2"
        >
          Lupa kata sandi saat ini? Gunakan fitur atur ulang via email
        </Link>
      </div>
    </div>
  );
}
