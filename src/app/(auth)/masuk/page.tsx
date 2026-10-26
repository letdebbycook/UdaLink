"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

function MasukForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      toast.error("Gagal masuk dengan akun Google. Silakan coba lagi.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
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

      // Role admin langsung diarahkan ke panel admin saja
      if (signInData?.user) {
        const { data: membership } = await supabase
          .from("memberships")
          .select("role")
          .eq("user_id", signInData.user.id)
          .single();

        if (membership?.role === "admin") {
          toast.success("Selamat datang Admin! Mengarahkan ke panel admin...");
          router.push("/admin");
          router.refresh();
          return;
        }
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

      {/* Tombol Masuk dengan Google & Konfirmasi */}
      <div className="space-y-3">
        <GoogleAuthButton mode="masuk" redirectPath={redirectTarget} />
        
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 border-t border-[#E2E8F0]" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
            atau dengan email
          </span>
          <div className="flex-1 border-t border-[#E2E8F0]" />
        </div>
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
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
