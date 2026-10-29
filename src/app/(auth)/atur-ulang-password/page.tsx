"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AturUlangPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setHasValidSession(true);
            setVerifyingSession(false);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        setHasValidSession(Boolean(session));
      } catch (err) {
        console.error("Gagal memeriksa sesi reset kata sandi:", err);
        setHasValidSession(false);
      } finally {
        setVerifyingSession(false);
      }
    }

    verifyAuth();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(`Gagal mengubah kata sandi: ${error.message}`);
        return;
      }

      setSuccess(true);
      toast.success("Kata sandi berhasil diperbarui!");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Terjadi kesalahan: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        <p className="text-xs text-slate-500">Memverifikasi tautan keamanan...</p>
      </div>
    );
  }

  if (!hasValidSession && !success) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[#0F172A]">Tautan Tidak Valid atau Kedaluwarsa</h1>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Sesi pemulihan kata sandi tidak ditemukan atau tautan ini telah kedaluwarsa. Silakan ajukan tautan baru.
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <Button onClick={() => router.push("/lupa-password")} className="w-full text-xs">
            Minta Tautan Baru
          </Button>
          <div>
            <Link href="/masuk" className="text-xs text-slate-500 hover:text-slate-800">
              Kembali ke Halaman Masuk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
          Kata Sandi Baru
        </h1>
        <p className="text-xs text-[#64748B]">
          Buat kata sandi baru yang kuat dan mudah kamu ingat.
        </p>
      </div>

      {success ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-12 w-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#0F172A]">Kata Sandi Berhasil Diubah!</p>
            <p className="text-xs text-[#64748B]">
              Silakan masuk kembali menggunakan kata sandi barumu.
            </p>
          </div>
          <Button
            onClick={() => router.push("/masuk")}
            className="w-full text-xs mt-2"
          >
            Masuk Sekarang
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold gap-2 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span>Simpan Kata Sandi</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-[#E2E8F0]">
        <Link
          href="/masuk"
          className="text-xs text-[#64748B] hover:text-[#16A34A] transition-colors"
        >
          Kembali ke Masuk
        </Link>
      </div>
    </div>
  );
}

export default function AturUlangPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
          <p className="text-xs text-slate-500">Memuat...</p>
        </div>
      }
    >
      <AturUlangPasswordContent />
    </Suspense>
  );
}

