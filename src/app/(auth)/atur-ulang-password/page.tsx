"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AturUlangPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
