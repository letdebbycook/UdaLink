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
  Search,
  ChevronLeft,
  ChevronRight,
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
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
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
      const { data: rpcData, error: rpcErr } = await supabase.rpc("admin_list_payments", {
        p_status: "all",
      });

      if (!rpcErr && rpcData) {
        setPayments(rpcData as PaymentItem[]);
        return;
      }

      // Jika RPC gagal karena akses ditolak, langsung throw (fallback juga akan gagal)
      if (rpcErr?.message?.includes("Akses ditolak") || rpcErr?.message?.includes("permission denied")) {
        throw rpcErr;
      }

      console.warn("RPC admin_list_payments gagal, mencoba fallback:", rpcErr?.message);

      const { data: payData, error: payErr } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (payErr) throw payErr;

      if (!payData || payData.length === 0) {
        setPayments([]);
        return;
      }

      const userIds = Array.from(new Set(payData.map((p) => p.user_id)));
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds);

      const profileMap = new Map((profilesData || []).map((prof) => [prof.id, prof]));

      const combined: PaymentItem[] = payData.map((p) => ({
        ...p,
        user: profileMap.get(p.user_id)
          ? {
              username: profileMap.get(p.user_id)!.username,
              display_name: profileMap.get(p.user_id)!.display_name,
            }
          : undefined,
      }));

      setPayments(combined);
    } catch (err: unknown) {
      console.error("fetchPayments error:", err);
      const pgErr = err as { message?: string; details?: string; hint?: string; code?: string };
      let errorMsg = pgErr?.message || (err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui");

      if (errorMsg.includes("Akses ditolak") || errorMsg.includes("permission denied") || pgErr?.code === "42501") {
        errorMsg = "Akun ini tidak memiliki akses admin. Pastikan role admin sudah diatur di database.";
      }

      if (pgErr?.hint) {
        errorMsg += ` (${pgErr.hint})`;
      }

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

  const query = search.toLowerCase().trim();
  const filteredPayments = payments
    .filter((p) => p.status === activeTab)
    .filter((p) => {
      if (!query) return true;
      const matchSender = p.sender_name?.toLowerCase().includes(query);
      const matchBank = p.sender_bank?.toLowerCase().includes(query);
      const matchUser = p.user?.username?.toLowerCase().includes(query);
      const matchDisplay = p.user?.display_name?.toLowerCase().includes(query);
      const matchAmount = p.amount?.toString().includes(query);
      return matchSender || matchBank || matchUser || matchDisplay || matchAmount;
    });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
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
            onClick={() => {
              setActiveTab("approved");
              setCurrentPage(1);
            }}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "approved"
                ? "border-[#16A34A] text-[#16A34A]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Disetujui</span>
            <Badge variant="outline" className="text-[#64748B] text-[10px] ml-1">
              {payments.filter((p) => p.status === "approved").length}
            </Badge>
          </button>

          <button
            onClick={() => {
              setActiveTab("rejected");
              setCurrentPage(1);
            }}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "rejected"
                ? "border-[#16A34A] text-[#16A34A]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Ditolak</span>
            <Badge variant="outline" className="text-[#64748B] text-[10px] ml-1">
              {payments.filter((p) => p.status === "rejected").length}
            </Badge>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama, bank, atau @user..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

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
        <div className="space-y-3">
          <div className="md:hidden space-y-3">
            {paginatedPayments.map((p) => (
              <Card key={p.id} className="border-[#E2E8F0] shadow-xs bg-white">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-[#0F172A]">
                        {p.user?.display_name || "Pengguna"}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] font-mono">
                        @{p.user?.username || "-"}
                      </p>
                    </div>
                    <div>
                      {p.status === "pending" && (
                        <Badge className="bg-amber-100 text-amber-800 text-[10px]">Menunggu</Badge>
                      )}
                      {p.status === "approved" && (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Disetujui</Badge>
                      )}
                      {p.status === "rejected" && (
                        <Badge className="bg-red-100 text-red-800 text-[10px]">Ditolak</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nominal Transfer</span>
                      <span className="font-bold text-sm text-[#0F172A] block">
                        {formatRupiah(p.amount)}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {p.duration_days >= 300 || p.amount >= 200000
                          ? "Tahunan (365 Hari)"
                          : "Bulanan (30 Hari)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pengirim</span>
                      <span className="font-medium text-[#0F172A] block truncate">
                        {p.sender_name} ({p.sender_bank})
                      </span>
                    </div>
                  </div>

                  {p.status === "rejected" && p.admin_note && (
                    <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg">
                      Alasan: {p.admin_note}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {format(new Date(p.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInspectModal(p)}
                      className="h-8 gap-1.5 text-xs min-h-[36px]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Periksa</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Tanggal</th>
                    <th className="py-3 px-4 font-semibold">Pengguna</th>
                    <th className="py-3 px-4 font-semibold">Pengirim</th>
                    <th className="py-3 px-4 font-semibold">Paket & Nominal</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedPayments.map((p) => (
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
                      <td className="py-3.5 px-4 text-[#0F172A]">
                        <div className="font-bold">{formatRupiah(p.amount)}</div>
                        <div className="mt-0.5">
                          {p.duration_days >= 300 || p.amount >= 200000 ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Tahunan (365 Hari)
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Bulanan (30 Hari)
                            </span>
                          )}
                        </div>
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              Menampilkan{" "}
              <strong className="text-slate-900">
                {filteredPayments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-slate-900">
                {Math.min(currentPage * pageSize, filteredPayments.length)}
              </strong>{" "}
              dari <strong className="text-slate-900">{filteredPayments.length}</strong> transaksi
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </Button>
              <span className="px-2 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
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
