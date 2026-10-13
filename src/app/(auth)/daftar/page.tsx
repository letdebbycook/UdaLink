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
  const [activeUser, setActiveUser] = useState<{ email?: string; username?: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Periksa apakah user masih memiliki sesi login aktif
  React.useEffect(() => {
    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

          setActiveUser({
            email: user.email,
            username: profile?.username || user.email?.split("@")[0] || "user",
          });
        }
      } catch (err) {
        console.warn(err);
      }
    }
    checkSession();
  }, []);

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
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          toast.error("Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.");
        } else {
          toast.error(`Pendaftaran gagal: ${error.message}`);
        }
        return;
      }

      // Jika email confirmation aktif di Supabase, session akan null
      if (!data.session) {
        toast.success("Pendaftaran berhasil! Cek email kamu untuk konfirmasi akun sebelum masuk.", {
          duration: 8000,
        });
        router.push("/masuk");
        return;
      }

      // Session langsung aktif (email confirmation dimatikan)
      toast.success("Pendaftaran berhasil! Mengarahkan ke dashboard...");
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

      {activeUser ? (
        <div className="p-6 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#16A34A] mx-auto flex items-center justify-center font-bold text-base border border-emerald-300">
            {activeUser.username?.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0F172A]">Kamu Masih Terhubung</h2>
            <p className="text-xs text-slate-600">
              Browser ini sedang aktif login sebagai <strong>@{activeUser.username}</strong> ({activeUser.email}).
            </p>
          </div>
          <div className="pt-2 space-y-2.5">
            <Link href="/dashboard" className="w-full block">
              <Button className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold gap-1.5 h-10">
                <span>Buka Dashboard @{activeUser.username}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                await supabase.auth.signOut();
                setActiveUser(null);
                setLoggingOut(false);
                toast.success("Berhasil keluar akun. Silakan daftarkan akun barumu!");
              }}
              className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-10"
            >
              {loggingOut ? "Sedang Keluar..." : "Keluar & Buat Akun Baru"}
            </Button>
          </div>
        </div>
      ) : (
        <>
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
                  ) : null}
                  {checkingUsername && <span className="text-[#94A3B8]">Memeriksa ketersediaan...</span>}
                  {!isReserved && isValidFormat && !checkingUsername && isAvailable === false && (
                    <span className="text-red-500 font-medium">Username ini sudah dipakai.</span>
                  )}
                  {!isReserved && isValidFormat && !checkingUsername && isAvailable === true && (
                    <span className="text-emerald-600 font-medium">Username tersedia!</span>
                  )}
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
        </>
      )}
    </div>
  );
}
