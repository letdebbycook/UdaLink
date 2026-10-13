"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function MasukForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email atau kata sandi salah. Silakan periksa kembali.");
        } else {
          toast.error(`Gagal masuk: ${error.message}`);
        }
        return;
      }

      toast.success("Berhasil masuk! Mengarahkan...");
      router.push(redirectTarget);
      router.refresh();
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
          Selamat Datang Kembali
        </h1>
        <p className="text-xs text-[#64748B]">
          Masuk ke akun UdaLink untuk mengelola etalase affiliate-mu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0F172A] block">
            Email
          </label>
          <Input
            type="email"
            required
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#0F172A] block">
              Kata Sandi
            </label>
            <Link
              href="/lupa-password"
              className="text-[11px] text-[#16A34A] hover:underline font-medium"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Masuk</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-[#E2E8F0]">
        <p className="text-xs text-[#64748B]">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-[#16A34A] hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#16A34A]" />
      </div>
    }>
      <MasukForm />
    </Suspense>
  );
}
