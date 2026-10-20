"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";
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
  const [googleLoading, setGoogleLoading] = useState(false);

  // Tampilkan pesan error dari callback OAuth Google
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      toast.error(oauthError);
      router.replace("/masuk");
    }
  }, [searchParams, router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Flow PKCE + Sesi Cookie: sesi disimpan sebagai cookie httpOnly
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(`Gagal masuk dengan Google: ${error.message}`);
        setGoogleLoading(false);
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghubungi Google.");
      setGoogleLoading(false);
    }
  };

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
      // Admin diarahkan ke panel admin, pengguna lain ke tujuan semula
      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user!.id)
        .single();
      if (membership?.role === "admin" && !redirectTarget.startsWith("/admin")) {
        router.push("/admin");
      } else {
        router.push(redirectTarget);
      }
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

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full h-11 text-sm font-semibold gap-2.5"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="h-4 w-4" />
        )}
        <span>Lanjutkan dengan Google</span>
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E2E8F0]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] text-[#64748B]">atau gunakan email</span>
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
