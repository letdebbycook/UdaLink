"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Loader2, CheckCircle2, Plus, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppSettings, PaymentMethodItem } from "@/types/database";

export default function AdminPengaturanPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [proPrice, setProPrice] = useState(29000);
  const [proDurationDays, setProDurationDays] = useState(30);
  const [freeProductLimit, setFreeProductLimit] = useState(30);
  const [adminWhatsapp, setAdminWhatsapp] = useState("");

  // Multi Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([
    {
      id: "bca_1",
      bank_name: "BCA",
      account_number: "1234567890",
      account_name: "PT UdaLink Media Nusantara",
      is_active: true,
    },
  ]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;
      if (data) {
        setSettings(data as AppSettings);
        setProPrice(data.pro_price);
        setProDurationDays(data.pro_duration_days);
        setFreeProductLimit(data.free_product_limit);
        setAdminWhatsapp(data.admin_whatsapp || "");

        if (Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
          setPaymentMethods(data.payment_methods as PaymentMethodItem[]);
        } else {
          setPaymentMethods([
            {
              id: "method_1",
              bank_name: data.bank_name || "BCA",
              account_number: data.bank_account_number || "",
              account_name: data.bank_account_name || "",
              is_active: true,
            },
          ]);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal memuat pengaturan: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddPaymentMethod = () => {
    const newId = `method_${Date.now()}`;
    setPaymentMethods((prev) => [
      ...prev,
      {
        id: newId,
        bank_name: "",
        account_number: "",
        account_name: "",
        is_active: true,
      },
    ]);
  };

  const handleUpdateMethod = (
    index: number,
    field: keyof PaymentMethodItem,
    value: string | boolean
  ) => {
    setPaymentMethods((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveMethod = (index: number) => {
    if (paymentMethods.length <= 1) {
      toast.error("Minimal harus ada satu metode pembayaran.");
      return;
    }
    setPaymentMethods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (proPrice <= 0 || proDurationDays <= 0 || freeProductLimit <= 0) {
      toast.error("Nilai harga, durasi, dan batas produk harus lebih besar dari 0.");
      return;
    }

    const activeMethods = paymentMethods.filter((m) => m.is_active);
    if (activeMethods.length === 0) {
      toast.error("Minimal harus ada satu metode pembayaran yang aktif.");
      return;
    }

    for (const m of paymentMethods) {
      if (!m.bank_name.trim() || !m.account_number.trim() || !m.account_name.trim()) {
        toast.error("Semua kolom nama bank/metode, nomor rekening, dan atas nama wajib diisi.");
        return;
      }
    }

    const primaryMethod = activeMethods[0] || paymentMethods[0];

    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({
          pro_price: Number(proPrice),
          pro_duration_days: Number(proDurationDays),
          free_product_limit: Number(freeProductLimit),
          bank_name: primaryMethod.bank_name.trim(),
          bank_account_number: primaryMethod.account_number.trim(),
          bank_account_name: primaryMethod.account_name.trim(),
          admin_whatsapp: adminWhatsapp.trim(),
          payment_methods: paymentMethods,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      toast.success("Pengaturan aplikasi & metode pembayaran berhasil disimpan!");
      fetchSettings();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan";
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#16A34A]" />
          Pengaturan Sistem &amp; Pembayaran
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Kelola harga paket Pro, batas kuota gratis, nomor bantuan, dan multi-metode pembayaran manual.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#16A34A]" />
          <span>Memuat pengaturan...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paket & Kuota */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-sm text-[#0F172A] border-b pb-2">
                Paket Langganan &amp; Kuota Pengguna
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    Harga Pro (Rp)
                  </label>
                  <Input
                    type="number"
                    min={1000}
                    step={1000}
                    value={proPrice}
                    onChange={(e) => setProPrice(Number(e.target.value))}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-[#64748B]">Biaya upgrade per periode.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    Durasi Pro (Hari)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={proDurationDays}
                    onChange={(e) => setProDurationDays(Number(e.target.value))}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-[#64748B]">Masa aktif setelah disetujui.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    Batas Produk Gratis
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={freeProductLimit}
                    onChange={(e) => setFreeProductLimit(Number(e.target.value))}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-[#64748B]">Maksimal produk akun non-Pro.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi Metode Pembayaran Manual */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                <div>
                  <h2 className="font-semibold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-[#16A34A]" />
                    Metode Pembayaran Manual (Multi-Rekening)
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Tambahkan beberapa rekening bank, e-wallet, atau QRIS manual untuk memudahkan transfer pengguna.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-[#16A34A] border-[#16A34A]/30 hover:bg-[#F0FDF4]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Metode
                </Button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method, idx) => (
                  <div
                    key={method.id || idx}
                    className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Metode #{idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={method.is_active}
                            onChange={(e) =>
                              handleUpdateMethod(idx, "is_active", e.target.checked)
                            }
                            className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                          />
                          <span>{method.is_active ? "Aktif" : "Nonaktif"}</span>
                        </label>
                        {paymentMethods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMethod(idx)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus metode ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Nama Bank / Metode
                        </label>
                        <Input
                          type="text"
                          placeholder="Misal: BCA, Mandiri, QRIS, GoPay"
                          value={method.bank_name}
                          onChange={(e) =>
                            handleUpdateMethod(idx, "bank_name", e.target.value)
                          }
                          className="text-xs h-9 bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Nomor Rekening / No. HP
                        </label>
                        <Input
                          type="text"
                          placeholder="Nomor rekening transfer"
                          value={method.account_number}
                          onChange={(e) =>
                            handleUpdateMethod(idx, "account_number", e.target.value)
                          }
                          className="text-xs h-9 bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Atas Nama
                        </label>
                        <Input
                          type="text"
                          placeholder="Nama pemilik rekening"
                          value={method.account_name}
                          onChange={(e) =>
                            handleUpdateMethod(idx, "account_name", e.target.value)
                          }
                          className="text-xs h-9 bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Kontak WhatsApp Admin */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    WhatsApp Admin Bantuan
                  </label>
                  <Input
                    type="text"
                    placeholder="Format 628..."
                    value={adminWhatsapp}
                    onChange={(e) => setAdminWhatsapp(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[10px] text-[#64748B]">Untuk konfirmasi manual &amp; bantuan pengguna.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full sm:w-auto h-10 text-xs font-semibold gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Seluruh Pengaturan</span>
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
