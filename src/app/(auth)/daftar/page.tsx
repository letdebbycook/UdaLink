"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DaftarPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Reserved words per PRD
  const reservedWords = [
    "admin", "dashboard", "daftar", "masuk", "go", "api", "udalink",
    "bantuan", "tentang", "harga", "syarat", "privasi", "login", "register", "akun"
  ];

  const cleanUsername = username.toLowerCase().trim();
  const isValidFormat = /^[a-z0-9_]{3,30}$/.test(cleanUsername);
  const isReserved = reservedWords.includes(cleanUsername);

  // Cek ketersediaan username ke database dengan debounce
  React.useEffect(() => {
    if (!cleanUsername || cleanUsername.length < 3 || !isValidFormat || isReserved) {
      setIsAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase.rpc("is_username_available", {
          p_username: cleanUsername,
        });
        if (error) throw error;
        setIsAvailable(Boolean(data));
      } catch (err) {
        console.error("Gagal memeriksa username:", err);
        setIsAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cleanUsername, isValidFormat, isReserved]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable) {
      toast.error("Silakan gunakan username yang valid dan tersedia.");
      return;
    }

    if (password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanUsername,
          },
        },
      });

      if (error) {
        toast.error(`Pendaftaran gagal: ${error.message}`);
        return;
      }

      toast.success("Pendaftaran berhasil! Mengarahkan ke etalasemu...");
      router.push("/dashboard");
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
          Buat Akun UdaLink
        </h1>
        <p className="text-xs text-[#64748B]">
          Mulai buat etalase affiliate-mu dalam hitungan menit, gratis!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0F172A] block">
            Username Etalase
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-mono">
              udalink.id/
            </span>
            <Input
              type="text"
              required
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className="pl-24 pr-9 font-mono text-xs"
            />
            {cleanUsername.length >= 3 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {isAvailable ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </span>
            )}
          </div>
          {cleanUsername.length > 0 && (
            <p className="text-[11px] text-[#64748B]">
              {isReserved ? (
                <span className="text-red-500 font-medium">Username ini sudah dicadangkan sistem.</span>
              ) : !isValidFormat ? (
                <span>3–30 karakter (huruf kecil, angka, atau garis bawah _).</span>
              ) : checkingUsername ? (
                <span className="text-[#94A3B8]">Memeriksa ketersediaan...</span>
              ) : isAvailable === false ? (
                <span className="text-red-500 font-medium">Username ini sudah dipakai.</span>
              ) : isAvailable === true ? (
                <span className="text-emerald-600 font-medium">Username tersedia!</span>
              ) : null}
            </p>
          )}
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0F172A] block">
            Kata Sandi
          </label>
          <Input
            type="password"
            required
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold gap-2 mt-2"
          disabled={loading || !isAvailable}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Daftar Sekarang</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-[#E2E8F0]">
        <p className="text-xs text-[#64748B]">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-[#16A34A] hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
