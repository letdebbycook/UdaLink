"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function RedirectPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError("ID Produk tidak valid.");
      return;
    }

    let isMounted = true;

    async function handleRedirect() {
      try {
        // Ambil data produk (affiliate_url dan status)
        const { data: product, error: fetchErr } = await supabase
          .from("products")
          .select("affiliate_url, is_active, name")
          .eq("id", productId)
          .single();

        if (fetchErr || !product) {
          if (isMounted) setError("Produk tidak ditemukan atau tautan sudah kadaluarsa.");
          return;
        }

        if (!product.is_active) {
          if (isMounted) setError("Produk ini sedang dinonaktifkan oleh pemilik etalase.");
          return;
        }

        // Catat klik via RPC record_click (asinkron, jangan blokir redirect bila error)
        try {
          await supabase.rpc("record_click", { p_product_id: productId });
        } catch (rpcErr) {
          console.warn("Gagal mencatat klik:", rpcErr);
        }

        // Redirect langsung ke marketplace
        window.location.replace(product.affiliate_url);
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Terjadi kesalahan saat mengalihkan."
          );
        }
      }
    }

    handleRedirect();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Tautan Tidak Tersedia</h1>
            <p className="text-sm text-slate-600">{error}</p>
            <div className="pt-2 flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#16A34A] mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              Mengarahkan ke Marketplace...
            </h1>
            <p className="text-xs text-slate-500">
              Mohon tunggu sejenak, kamu sedang dialihkan ke toko resmi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
