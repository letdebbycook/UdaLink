"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface PaymentItem {
  id: string;
  user_id: string;
  amount: number;
  duration_days: number;
  sender_name: string;
  sender_bank: string;
  proof_path: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: {
    username: string;
    display_name: string;
  };
}

export default function AdminPembayaranPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          user_id,
          amount,
          duration_days,
          sender_name,
          sender_bank,
          proof_path,
          status,
          admin_note,
          reviewed_at,
          created_at,
          user:profiles!payments_user_id_fkey(username, display_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments((data as unknown as PaymentItem[]) || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal memuat data pembayaran: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const openInspectModal = async (payment: PaymentItem) => {
    setSelectedPayment(payment);
    setShowRejectForm(false);
    setRejectReason("");
    setSignedUrl(null);
    setLoadingUrl(true);

    try {
      // Ambil signed url dari bucket payment-proofs (berlaku 1 jam)
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(payment.proof_path, 3600);

      if (error) throw error;
      setSignedUrl(data?.signedUrl || null);
    } catch (err) {
      console.error("Gagal membuat signed URL:", err);
      toast.error("Tidak dapat memuat bukti transfer.");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("admin_review_payment", {
        p_payment_id: selectedPayment.id,
        p_approve: true,
        p_note: null,
      });

      if (error) throw error;

      toast.success("Pembayaran disetujui! Pengguna berhasil di-upgrade ke Pro.");
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyetujui";
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi!");
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("admin_review_payment", {
        p_payment_id: selectedPayment.id,
        p_approve: false,
        p_note: rejectReason.trim(),
      });

      if (error) throw error;

      toast.success("Pembayaran ditolak dengan catatan.");
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menolak";
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => p.status === activeTab);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Verifikasi Pembayaran Pro
        </h1>
        <p className="text-sm text-[#64748B]">
          Periksa bukti transfer dan sesuaikan nominal pembayaran dengan mutasi bank Anda.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#E2E8F0] gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "pending"
              ? "border-[#16A34A] text-[#16A34A]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Menunggu</span>
          <Badge className="bg-amber-100 text-amber-800 text-[10px] ml-1">
            {payments.filter((p) => p.status === "pending").length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "approved"
              ? "border-[#16A34A] text-[#16A34A]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Disetujui</span>
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "rejected"
              ? "border-[#16A34A] text-[#16A34A]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <XCircle className="h-4 w-4 text-red-500" />
          <span>Ditolak</span>
        </button>
      </div>

      {/* Daftar Tabel Pembayaran */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-2">
            <CreditCard className="h-8 w-8 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-semibold text-[#0F172A]">Tidak ada data pembayaran</p>
            <p className="text-xs text-[#64748B]">
              Belum ada transaksi dengan status {activeTab} saat ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Pengguna</th>
                  <th className="py-3 px-4 font-semibold">Pengirim</th>
                  <th className="py-3 px-4 font-semibold">Nominal</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                      {format(new Date(p.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                      <div>{p.user?.display_name || "Pengguna"}</div>
                      <div className="text-[11px] text-[#94A3B8] font-mono">@{p.user?.username || "-"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#0F172A]">
                      <div className="font-medium">{p.sender_name}</div>
                      <div className="text-[11px] text-[#64748B]">{p.sender_bank}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === "pending" && (
                        <Badge className="bg-amber-100 text-amber-800">Menunggu</Badge>
                      )}
                      {p.status === "approved" && (
                        <Badge className="bg-emerald-100 text-emerald-800">Disetujui</Badge>
                      )}
                      {p.status === "rejected" && (
                        <div>
                          <Badge className="bg-red-100 text-red-800">Ditolak</Badge>
                          {p.admin_note && (
                            <p className="text-[10px] text-red-600 mt-1">{p.admin_note}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInspectModal(p)}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Periksa</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog Periksa Bukti Transfer */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-base text-[#0F172A]">Detail Bukti Pembayaran</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Username</span>
                  <span className="font-semibold text-[#0F172A]">@{selectedPayment.user?.username}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Nominal Wajib</span>
                  <span className="font-bold text-[#16A34A] text-sm">
                    {formatRupiah(selectedPayment.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Pengirim</span>
                  <span className="font-semibold text-[#0F172A]">{selectedPayment.sender_name}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Bank Pengirim</span>
                  <span className="font-semibold text-[#0F172A]">{selectedPayment.sender_bank}</span>
                </div>
              </div>

              {/* Tampilan Gambar Bukti Transfer */}
              <div className="space-y-1.5">
                <span className="text-[#64748B] font-semibold block">Bukti Transfer Bank:</span>
                {loadingUrl ? (
                  <div className="h-64 flex items-center justify-center border rounded-xl bg-slate-50">
                    <Loader2 className="h-6 w-6 animate-spin text-[#16A34A]" />
                  </div>
                ) : signedUrl ? (
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-slate-50 text-center">
                    <img
                      src={signedUrl}
                      alt="Bukti Transfer"
                      className="max-h-72 w-full object-contain mx-auto"
                    />
                    <div className="p-2 border-t bg-white">
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#16A34A] hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Buka ukuran penuh</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500">Bukti gambar tidak dapat dimuat.</p>
                )}
              </div>
            </div>

            {/* Aksi Persetujuan jika Status Menunggu */}
            {selectedPayment.status === "pending" && (
              <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                {showRejectForm ? (
                  <div className="space-y-2 p-3 bg-red-50 rounded-xl border border-red-200">
                    <label className="text-xs font-semibold text-red-900 block">
                      Alasan Penolakan (Wajib diisi):
                    </label>
                    <Input
                      type="text"
                      placeholder="Contoh: Nominal tidak sesuai mutasi rekening"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowRejectForm(false)}
                        className="text-xs"
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="text-xs"
                      >
                        {actionLoading ? "Memproses..." : "Konfirmasi Tolak"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <Check className="h-4 w-4" />
                      <span>{actionLoading ? "Memproses..." : "Setujui Pembayaran"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                    >
                      <X className="h-4 w-4" />
                      <span>Tolak</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
