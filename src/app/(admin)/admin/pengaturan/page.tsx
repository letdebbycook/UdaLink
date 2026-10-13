"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppSettings } from "@/types/database";

export default function AdminPengaturanPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [proPrice, setProPrice] = useState(29000);
  const [proDurationDays, setProDurationDays] = useState(30);
  const [freeProductLimit, setFreeProductLimit] = useState(30);
  const [bankName, setBankName] = useState("BCA");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [adminWhatsapp, setAdminWhatsapp] = useState("");

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
        setBankName(data.bank_name || "BCA");
        setBankAccountNumber(data.bank_account_number || "");
        setBankAccountName(data.bank_account_name || "");
        setAdminWhatsapp(data.admin_whatsapp || "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (proPrice <= 0 || proDurationDays <= 0 || freeProductLimit <= 0) {
      toast.error("Nilai harga, durasi, dan batas produk harus lebih besar dari 0.");
      return;
    }

    if (!bankAccountNumber.trim() || !bankAccountName.trim()) {
      toast.error("Informasi nomor rekening dan atas nama wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({
          pro_price: Number(proPrice),
          pro_duration_days: Number(proDurationDays),
          free_product_limit: Number(freeProductLimit),
          bank_name: bankName.trim(),
          bank_account_number: bankAccountNumber.trim(),
          bank_account_name: bankAccountName.trim(),
          admin_whatsapp: adminWhatsapp.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      toast.success("Pengaturan aplikasi berhasil disimpan!");
      fetchSettings();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan";
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Pengaturan Aplikasi
        </h1>
        <p className="text-sm text-[#64748B]">
          Atur harga paket Pro, batas kuota akun gratis, dan data rekening penerima transfer.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bagian Paket & Kuota */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-sm text-[#0F172A] border-b pb-2">
                Paket Langganan & Batas Produk
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    Harga Paket Pro (Rp)
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
                  <p className="text-[10px] text-[#64748B]">Nominal dasar sebelum kode unik.</p>
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

          {/* Bagian Rekening Bank & Kontak */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-sm text-[#0F172A] border-b pb-2">
                Rekening Pembayaran & Bantuan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    Nama Bank
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: BCA / Mandiri / BRI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    Nomor Rekening
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: 1234567890"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    Atas Nama Rekening
                  </label>
                  <Input
                    type="text"
                    placeholder="Nama pemilik rekening"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">
                    WhatsApp Admin
                  </label>
                  <Input
                    type="text"
                    placeholder="Format 628..."
                    value={adminWhatsapp}
                    onChange={(e) => setAdminWhatsapp(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[10px] text-[#64748B]">Untuk bantuan pengguna & konfirmasi.</p>
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
                <span>Simpan Perubahan</span>
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
