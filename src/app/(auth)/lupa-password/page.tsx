"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/atur-ulang-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(`Gagal mengirim email: ${error.message}`);
        return;
      }

      setSubmitted(true);
      toast.success("Tautan atur ulang kata sandi berhasil dikirim!");
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
          Atur Ulang Kata Sandi
        </h1>
        <p className="text-xs text-[#64748B]">
          Masukkan email yang terdaftar untuk menerima tautan pemulihan kata sandi.
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-12 w-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
            <MailCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#0F172A]">Cek Email Kamu</p>
            <p className="text-xs text-[#64748B]">
              Tautan pemulihan kata sandi telah dikirim ke <span className="font-semibold text-[#0F172A]">{email}</span>.
            </p>
          </div>
          <Link href="/masuk">
            <Button variant="outline" className="w-full text-xs mt-2">
              Kembali ke Halaman Masuk
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0F172A] block">
              Email Terdaftar
            </label>
            <Input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                <span>Mengirim Tautan...</span>
              </>
            ) : (
              <span>Kirim Tautan Atur Ulang</span>
            )}
          </Button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-[#E2E8F0]">
        <Link
          href="/masuk"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#16A34A] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Masuk</span>
        </Link>
      </div>
    </div>
  );
}
