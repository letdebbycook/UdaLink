"use client";

import React, { useState } from "react";
import { Loader2, ShieldCheck, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface GoogleAuthButtonProps {
  mode?: "masuk" | "daftar";
  redirectPath?: string;
  className?: string;
}

export function GoogleAuthButton({
  mode = "masuk",
  redirectPath = "/dashboard",
  className = "",
}: GoogleAuthButtonProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartGoogleOAuth = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectPath
      )}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        if (
          error.message.includes("provider is not enabled") ||
          error.message.includes("Unsupported provider")
        ) {
          toast.error(
            "Provider Google OAuth belum diaktifkan di Supabase Dashboard (Authentication > Providers > Google). Gunakan email & kata sandi terlebih dahulu."
          );
        } else {
          toast.error(`Gagal menghubungkan Google: ${error.message}`);
        }
        setLoading(false);
        setShowConfirmModal(false);
        return;
      }

      // Supabase signInWithOAuth handles window.location redirect automatically if successful
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat otentikasi Google";
      toast.error(msg);
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        className={`w-full h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.99] cursor-pointer ${className}`}
      >
        {/* Google G Logo SVG */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>
          {mode === "daftar" ? "Daftar dengan Google" : "Masuk dengan Google"}
        </span>
      </button>

      {/* MODAL KONFIRMASI GOOGLE */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-2xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Konfirmasi Masuk Google
                  </h3>
                  <p className="text-xs text-slate-500">
                    Autentikasi aman melalui akun Google Anda
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !loading && setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Body */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-600 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aman & Cepat:</strong> Anda akan dialihkan ke formulir otorisasi resmi Google untuk verifikasi identitas.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                <span>
                  Nama dan alamat email akun Google Anda akan digunakan untuk membuat atau menyinkronkan akun UdaLink Anda.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                <span>
                  Kata sandi Google Anda tidak pernah dibagikan atau disimpan di server UdaLink.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setShowConfirmModal(false)}
                className="h-10 text-xs font-semibold px-4"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={handleStartGoogleOAuth}
                className="h-10 text-xs font-semibold px-5 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengarahkan ke Google...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjutkan ke Google</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
