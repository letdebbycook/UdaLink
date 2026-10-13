"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CreditCard, Sparkles, Check, Clock, CheckCircle2,
  XCircle, Copy, Upload, AlertCircle, AlertTriangle,
  Loader2, ShieldCheck, ArrowRight, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import type { MyPlanResponse, Payment } from "@/types/database";

export default function LanggananPage() {
  const [plan, setPlan] = useState<MyPlanResponse | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Pembayaran
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("BCA");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [planRes, payRes] = await Promise.all([
        supabase.rpc("get_my_plan"),
        supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (planRes.data) setPlan(planRes.data as MyPlanResponse);
      if (payRes.data) setPayments(payRes.data as Payment[]);
    } catch (err: unknown) {
      toast.error("Gagal memuat data langganan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hitung jumlah transfer dengan kode unik pembayaran
  const basePrice = plan?.pro_price ?? 29000;
  const paymentCode = plan?.payment_code ?? 123;
  const totalTransfer = basePrice + paymentCode;
  const isPro = plan?.is_pro ?? false;

  // Cek apakah ada pembayaran yang sedang pending
  const pendingPayment = payments.find((p) => p.status === "pending");

  // Cek pengingat kedaluwarsa Pro (≤ 3 hari)
  const isExpiringSoon = (() => {
    if (!isPro || !plan?.pro_until) return false;
    const diffDays =
      (new Date(plan.pro_until).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 3;
  })();

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file bukti pembayaran maksimal 5 MB");
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!senderName.trim() || !proofFile) {
      toast.error("Nama pengirim dan bukti transfer wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi");

      // 1. Upload bukti transfer ke bucket `payment-proofs/{user_id}/...`
      const ext = proofFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-proof.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, proofFile);

      if (uploadErr) throw uploadErr;

      // 2. Submit payment via RPC submit_payment
      const { data: payId, error: rpcErr } = await supabase.rpc("submit_payment", {
        p_sender_name: senderName.trim(),
        p_sender_bank: senderBank.trim(),
        p_proof_path: filePath,
        p_duration_days: plan?.pro_duration_days ?? 30,
      });

      if (rpcErr) throw rpcErr;

      toast.success("Bukti transfer berhasil dikirim! Menunggu konfirmasi admin.");
      setSenderName("");
      setProofFile(null);
      setProofPreview(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim pembayaran");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Langganan & Paket Akun
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Kelola paket tokomu untuk membuka fitur-fitur profesional affiliator.
        </p>
      </div>

      {/* Banner Pengingat Kedaluwarsa (≤ 3 Hari) */}
      {isExpiringSoon && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm text-amber-900">
            <strong>Masa aktif PRO segera berakhir!</strong> Paketmu akan habis pada{" "}
            <strong>{formatTanggal(plan?.pro_until)}</strong>. Perpanjang sekarang agar
            banner dan tema premium tokomu tidak dinonaktifkan.
          </div>
        </div>
      )}

      {/* Status Langganan Saat Ini */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isPro ? "bg-emerald-50 text-[#16A34A]" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-[#0F172A]">
                  {isPro ? "Paket UdaLink PRO" : "Paket UdaLink Gratis"}
                </h3>
                <Badge
                  variant={isPro ? "pro" : "outline"}
                  className={isPro ? "" : "text-slate-600"}
                >
                  {isPro ? "PRO AKTIF" : "GRATIS"}
                </Badge>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {isPro
                  ? `Masa aktif berlaku hingga ${formatTanggal(plan?.pro_until)}`
                  : "Maksimal 30 produk, 3 tema standar, tanpa banner promosi."}
              </p>
            </div>
          </div>

          {!isPro && (
            <Badge variant="outline" className="text-xs py-1 px-3 self-start sm:self-auto">
              Kode Unik Akun: #{paymentCode}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Perbandingan Fitur Paket */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paket Gratis */}
        <Card className={`border-[#E2E8F0] ${!isPro ? "ring-2 ring-slate-300" : "opacity-75"}`}>
          <CardContent className="p-6 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pemula
              </span>
              <h3 className="text-xl font-bold text-[#0F172A] mt-1">Paket Gratis</h3>
              <div className="text-2xl font-bold text-[#0F172A] mt-2">Rp 0</div>
              <p className="text-xs text-slate-500 mt-1">Gratis selamanya tanpa biaya bulanan.</p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                Maksimal 30 produk etalase
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                3 pilihan tema dasar
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                Analisis statistik klik 7 hari
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                Tanpa banner promosi
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                Tanpa produk unggulan
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                Menampilkan badge UdaLink
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paket PRO */}
        <Card className="border-[#16A34A] ring-2 ring-[#16A34A]/20 bg-emerald-50/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#16A34A] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider">
            REKOMENDASI
          </div>

          <CardContent className="p-6 space-y-4">
            <div>
              <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                Affiliator Pro
              </span>
              <h3 className="text-xl font-bold text-[#0F172A] mt-1">Paket UdaLink PRO</h3>
              <div className="text-2xl font-bold text-[#16A34A] mt-2">
                {formatRupiah(basePrice)}{" "}
                <span className="text-xs font-normal text-slate-500">
                  / {plan?.pro_duration_days ?? 30} hari
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Semua fitur terbuka untuk memaksimalkan penjualan affiliate.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-800 pt-2 border-t border-emerald-100">
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                <strong>Produk tanpa batas</strong> (unlimited kuota)
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                <strong>Semua 8 tema premium</strong>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                <strong>Hingga 3 banner promosi bergerak</strong>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                <strong>6 slot produk unggulan teratas</strong>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                <strong>Analitik 30 hari lengkap</strong>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                Bebas watermark & branding UdaLink
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form & Instruksi Pembayaran */}
      {pendingPayment ? (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-amber-900">
                  Pembayaran Sedang Diverifikasi Admin
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Bukti transfer sebesar <strong>{formatRupiah(pendingPayment.amount)}</strong>{" "}
                  telah diterima pada {formatTanggal(pendingPayment.created_at)}. Akunmu akan aktif
                  segera setelah dicek oleh admin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E2E8F0] bg-white">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#16A34A]" />
                Instruksi Pembayaran Manual & Konfirmasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Silakan lakukan transfer ke rekening resmi UdaLink dan unggah foto struk bukti transfer.
              </p>
            </div>

            {/* Info Rekening Tujuan */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Bank Tujuan</span>
                <span className="text-sm font-bold text-slate-900">
                  {plan?.bank_name || "BCA"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Nomor Rekening</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {plan?.bank_account_number || "8735019283"}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        plan?.bank_account_number || "8735019283",
                        "Nomor rekening"
                      )
                    }
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title="Salin"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  a.n. {plan?.bank_account_name || "PT UdaLink Indonesia"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Jumlah Transfer Tepat
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-[#16A34A]">
                    {formatRupiah(totalTransfer)}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(String(totalTransfer), "Jumlah transfer")
                    }
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title="Salin"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-amber-700 font-medium block">
                  *Wajib transfer tepat hingga 3 digit terakhir (#{paymentCode})
                </span>
              </div>
            </div>

            {/* Form Konfirmasi Bukti Transfer */}
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Pemilik Rekening Pengirim <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nama di buku tabungan / e-wallet"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bank / E-Wallet Pengirim
                  </label>
                  <Input
                    placeholder="Misal: BCA, Mandiri, BRI, GoPay, Dana"
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Upload Foto Bukti Transfer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foto Bukti Transfer / Struk / Screenshot <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="proof-upload"
                    accept="image/*"
                    onChange={handleFilePick}
                    className="hidden"
                  />
                  <label
                    htmlFor="proof-upload"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Pilih File Bukti
                  </label>
                  {proofFile && (
                    <span className="text-xs text-[#16A34A] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {proofFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting || !proofFile || !senderName.trim()}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Kirim Bukti Pembayaran
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Riwayat Pembayaran */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-[#0F172A] mb-3">
            Riwayat Pembayaran
          </h3>

          {payments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Belum ada riwayat pengajuan pembayaran.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((p) => {
                const statusBadge =
                  p.status === "approved" ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                      Disetujui
                    </Badge>
                  ) : p.status === "pending" ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                      Menunggu Verifikasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                      Ditolak
                    </Badge>
                  );

                return (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {formatRupiah(p.amount)}
                        </span>
                        {statusBadge}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.sender_bank} a.n. {p.sender_name} • {formatTanggal(p.created_at)}
                      </p>
                      {p.admin_note && (
                        <p className="text-xs text-red-600 mt-1">
                          Catatan Admin: {p.admin_note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
