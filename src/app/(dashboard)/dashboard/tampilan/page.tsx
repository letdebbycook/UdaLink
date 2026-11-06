"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Palette, User, Share2, Image as ImageIcon, Sparkles,
  Upload, Check, Lock, Loader2, Smartphone, ExternalLink,
  MessageCircle, Video, Star, Eye, Search, Hash
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { THEMES, getTheme, ThemeDefinition } from "@/lib/themes";
import { compressImage } from "@/lib/image-compression";
import type { Profile, Banner, Product, MyPlanResponse } from "@/types/database";

export default function TampilanPage() {
  const [activeTab, setActiveTab] = useState<"profil" | "tema" | "sosial" | "banner">("profil");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plan, setPlan] = useState<MyPlanResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Form Profile State
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState("hijau");
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<string>("all");

  // Form Sosial State
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");

  // Banner State
  const [bannerSource, setBannerSource] = useState<"local" | "url">("local");
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerLink, setNewBannerLink] = useState("");
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [newBannerPreview, setNewBannerPreview] = useState<string | null>(null);
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);
  const [previewBannerIndex, setPreviewBannerIndex] = useState(0);

  // Banner crop state
  const [bannerCropSrc, setBannerCropSrc] = useState<string | null>(null);

  const isPro = plan?.is_pro ?? false;

  const samplePreviewProducts = [
    {
      number: 1,
      name: "Kemeja Linen Oversized",
      price: 139000,
      marketplace: "shopee",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&h=200&fit=crop",
    },
    {
      number: 2,
      name: "Keyboard Wireless 75%",
      price: 499000,
      marketplace: "tokopedia",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&h=200&fit=crop",
    },
    {
      number: 3,
      name: "Serum Niacinamide 10%",
      price: 89000,
      marketplace: "tiktok",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop",
    },
    {
      number: 4,
      name: "Stand Laptop Aluminium",
      price: 82000,
      marketplace: "shopee",
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop",
    },
  ];

  const displayProducts = products.length > 0
    ? products.slice(0, 4).map((p, idx) => ({
        number: p.number ?? idx + 1,
        name: p.name || `Produk Pilihan #${idx + 1}`,
        price: p.price ?? 99000,
        marketplace: p.marketplace || "shopee",
        image: (Array.isArray(p.images) && p.images[0]) || p.image_url || samplePreviewProducts[idx % 4].image,
      }))
    : samplePreviewProducts;

  const getMarketplaceBtnText = (marketplace?: string) => {
    switch (marketplace) {
      case "shopee": return "Beli di Shopee";
      case "tiktok": return "Beli di TikTok";
      case "tokopedia": return "Beli di Tokopedia";
      case "lazada": return "Beli di Lazada";
      default: return "Beli Sekarang";
    }
  };

  // Auto carousel cycling for live simulator preview
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profRes, planRes, bannersRes, prodsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.rpc("get_my_plan"),
        supabase.from("banners").select("*").eq("user_id", user.id).order("sort_order"),
        supabase.from("products").select("*").eq("user_id", user.id).limit(4),
      ]);

      if (profRes.data) {
        const p = profRes.data as Profile;
        setProfile(p);
        setDisplayName(p.display_name || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatar_url);
        setAvatarPreview(p.avatar_url);
        setSelectedTheme(p.theme || "hijau");
        setWhatsapp(p.whatsapp || "");
        setInstagram(p.instagram || "");
        setTiktok(p.tiktok || "");
        setYoutube(p.youtube || "");
      }

      if (planRes.data) setPlan(planRes.data as MyPlanResponse);
      if (bannersRes.data) setBanners(bannersRes.data as Banner[]);
      if (prodsRes.data) setProducts(prodsRes.data as Product[]);
    } catch (err: unknown) {
      toast.error("Gagal memuat data pengaturan tampilan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Avatar Pick & Compress
  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file: compressed, dataUrl } = await compressImage(file, 512, 512, 0.85);
      setAvatarPreview(dataUrl);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileName = `${Date.now()}-avatar.webp`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicData.publicUrl);
      toast.success("Foto profil berhasil diunggah");
    } catch (err: unknown) {
      toast.error("Gagal mengunggah foto profil");
    }
  }

  // Handle Save Profile / Settings
  async function handleSaveSettings() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi");

      // Validasi tema jika bukan Pro tapi pilih premium
      let themeToSave = selectedTheme;
      const themeDef = THEMES[selectedTheme];
      if (themeDef?.isPremium && !isPro) {
        toast.error("Tema premium hanya untuk akun Pro. Mengembalikan ke tema Hijau.");
        themeToSave = "hijau";
        setSelectedTheme("hijau");
      }

      // Sanitasi nomor WhatsApp agar sesuai constraint database (^62[0-9]+$)
      let sanitizedWa: string | null = null;
      if (whatsapp.trim()) {
        const digits = whatsapp.replace(/[^0-9]/g, "");
        if (digits) {
          if (digits.startsWith("0")) {
            sanitizedWa = "62" + digits.slice(1);
          } else if (digits.startsWith("62")) {
            sanitizedWa = digits;
          } else {
            sanitizedWa = "62" + digits;
          }
        }
      }

      // Sanitasi & Validasi Instagram
      let sanitizedIg: string | null = null;
      if (instagram.trim()) {
        const trimmed = instagram.trim().replace(/^@+/, "");
        const igMatch = trimmed.match(/(?:instagram\.com\/)(?:#!\/)?([a-zA-Z0-9._]+)/i);
        const candidate = igMatch && igMatch[1] ? igMatch[1] : trimmed.replace(/\/+$/, "");
        if (!/^[a-zA-Z0-9._]{1,30}$/.test(candidate)) {
          toast.error("Format username Instagram tidak valid. Gunakan huruf, angka, titik, atau garis bawah (maks. 30 karakter).");
          setSaving(false);
          return;
        }
        sanitizedIg = candidate;
      }

      // Sanitasi & Validasi TikTok
      let sanitizedTt: string | null = null;
      if (tiktok.trim()) {
        const trimmed = tiktok.trim().replace(/^@+/, "");
        const ttMatch = trimmed.match(/(?:tiktok\.com\/@?)([a-zA-Z0-9._]+)/i);
        const candidate = ttMatch && ttMatch[1] ? ttMatch[1] : trimmed.replace(/\/+$/, "");
        if (!/^[a-zA-Z0-9._]{2,24}$/.test(candidate)) {
          toast.error("Format username TikTok tidak valid. Gunakan huruf, angka, titik, atau garis bawah (2-24 karakter).");
          setSaving(false);
          return;
        }
        sanitizedTt = candidate;
      }

      // Sanitasi YouTube
      const sanitizedYt = youtube.trim() || null;

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          theme: themeToSave,
          whatsapp: sanitizedWa,
          instagram: sanitizedIg,
          tiktok: sanitizedTt,
          youtube: sanitizedYt,
        })
        .eq("id", user.id);

      if (error) throw new Error(error.message);

      if (sanitizedWa) setWhatsapp(sanitizedWa);
      if (sanitizedIg) setInstagram(sanitizedIg);
      if (sanitizedTt) setTiktok(sanitizedTt);

      toast.success("Pengaturan tampilan etalase berhasil disimpan!");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan tampilan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // Handle Banner Upload
  async function handleAddBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) {
      toast.error("Fitur banner etalase khusus pelanggan PRO");
      return;
    }
    if (banners.length >= 3) {
      toast.error("Maksimal 3 banner promosi aktif");
      return;
    }

    if (bannerSource === "local" && !newBannerFile) {
      toast.error("Silakan pilih file gambar banner terlebih dahulu");
      return;
    }

    if (bannerSource === "url") {
      if (!newBannerUrl.trim()) {
        toast.error("Silakan masukkan tautan URL gambar banner");
        return;
      }
      if (!/^https?:\/\//i.test(newBannerUrl.trim())) {
        toast.error("Format tautan gambar harus diawali dengan https:// atau http://");
        return;
      }
    }

    try {
      setUploadingBanner(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi");

      let finalBannerImageUrl = "";

      if (bannerSource === "local" && newBannerFile) {
        const fileName = `${Date.now()}-banner.webp`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("banners")
          .upload(filePath, newBannerFile, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase.storage
          .from("banners")
          .getPublicUrl(filePath);

        finalBannerImageUrl = publicData.publicUrl;
      } else {
        finalBannerImageUrl = newBannerUrl.trim();
      }

      const { error: insertErr } = await supabase
        .from("banners")
        .insert({
          user_id: user.id,
          image_url: finalBannerImageUrl,
          title: newBannerTitle.trim() || null,
          link_url: newBannerLink.trim() || null,
          sort_order: banners.length + 1,
          is_active: true,
        });

      if (insertErr) throw insertErr;

      toast.success("Banner berhasil ditambahkan");
      setNewBannerTitle("");
      setNewBannerLink("");
      setNewBannerFile(null);
      setNewBannerPreview(null);
      setNewBannerUrl("");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan banner");
    } finally {
      setUploadingBanner(false);
    }
  }

  function handleDeleteBanner(b: Banner) {
    setBannerToDelete(b);
  }

  async function confirmDeleteBanner() {
    if (!bannerToDelete) return;
    try {
      setIsDeletingBanner(true);
      const { error } = await supabase.from("banners").delete().eq("id", bannerToDelete.id);
      if (error) throw error;
      toast.success("Banner berhasil dihapus");
      setBannerToDelete(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus banner");
    } finally {
      setIsDeletingBanner(false);
    }
  }

  const currentTheme = getTheme(selectedTheme);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Tampilan Etalase
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Sesuaikan identitas, warna tema, media sosial, dan banner tokomu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Preview Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="lg:hidden gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-[#16A34A]" />
            {showMobilePreview ? "Tutup Pratinjau" : "Lihat Pratinjau"}
          </Button>

          <Button
            onClick={handleSaveSettings}
            disabled={saving || loading}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Main Grid: Form di Kiri, Live Phone Preview di Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* KOLOM KIRI: Tab Nav & Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profil")}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "profil"
                  ? "border-[#16A34A] text-[#16A34A]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="w-4 h-4" />
              Profil & Bio
            </button>

            <button
              onClick={() => setActiveTab("tema")}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "tema"
                  ? "border-[#16A34A] text-[#16A34A]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Palette className="w-4 h-4" />
              Tema & Warna
            </button>

            <button
              onClick={() => setActiveTab("sosial")}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "sosial"
                  ? "border-[#16A34A] text-[#16A34A]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Share2 className="w-4 h-4" />
              Sosial & WhatsApp
            </button>

            <button
              onClick={() => setActiveTab("banner")}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "banner"
                  ? "border-[#16A34A] text-[#16A34A]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Banner Promosi
              {!isPro && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0">
                  PRO
                </Badge>
              )}
            </button>
          </div>

          {/* TAB 1: PROFIL */}
          {activeTab === "profil" && (
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Foto Avatar Toko
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center shrink-0">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarPick}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Ganti Avatar
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Format JPG/PNG/WebP, otomatis disesuaikan 512x512.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Tampilan Etalase
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Misal: Nando's Favorite Finds"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bio Singkat
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tulis deskripsi tokomu atau panduan belanja bagi followers..."
                    maxLength={160}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20"
                  />
                  <p className="text-[11px] text-slate-400 text-right mt-1">
                    {bio.length}/160 karakter
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: TEMA */}
          {activeTab === "tema" && (
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">Pilih Tema & Gaya Visual</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      16 pilihan tema eksklusif dengan palet warna harmonis, gradasi latar, dan bentuk tombol unik.
                    </p>
                  </div>
                  {!isPro && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs self-start sm:self-auto">
                      12 Tema Khusus PRO
                    </Badge>
                  )}
                </div>

                {/* Filter Kategori Tema */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: "all", label: "Semua (16)" },
                    { id: "Dasar", label: "Dasar (4)" },
                    { id: "Pastel", label: "Pastel" },
                    { id: "Dark / Cyber", label: "Dark & Cyber" },
                    { id: "Luxury", label: "Luxury" },
                    { id: "Earthy", label: "Earthy" },
                    { id: "Vibrant", label: "Vibrant" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setThemeCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                        themeCategoryFilter === cat.id
                          ? "bg-[#16A34A] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {Object.values(THEMES)
                    .filter((th) =>
                      themeCategoryFilter === "all"
                        ? true
                        : th.categoryTag === themeCategoryFilter
                    )
                    .map((th) => {
                      const isSelected = selectedTheme === th.id;
                      const isLocked = th.isPremium && !isPro;

                      return (
                        <div
                          key={th.id}
                          onClick={() => {
                            if (isLocked) {
                              toast.error(`Tema "${th.name}" khusus untuk akun PRO.`);
                              return;
                            }
                            setSelectedTheme(th.id);
                          }}
                          className={`relative rounded-xl p-3 border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#16A34A] ring-2 ring-[#16A34A]/20 shadow-xs"
                              : "border-slate-200 hover:border-slate-300"
                          } ${isLocked ? "opacity-60 bg-slate-50" : "bg-white"}`}
                        >
                          {/* Color swatch dengan preview bentuk tombol */}
                          <div
                            className="h-16 rounded-lg flex items-center justify-center p-2 mb-2 relative overflow-hidden border border-black/5"
                            style={{
                              backgroundColor: th.bg,
                              backgroundImage: th.bgGradient,
                            }}
                          >
                            <div
                              className={`w-12 h-6 shadow-2xs flex items-center justify-center text-[10px] font-bold ${
                                th.buttonRadius || "rounded-lg"
                              }`}
                              style={{ backgroundColor: th.button, color: th.buttonText }}
                            >
                              <span>Aa</span>
                            </div>

                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}

                            {th.isPremium && (
                              <span className="absolute bottom-1 left-1.5 text-[8px] font-bold tracking-wider uppercase px-1 py-0.2 rounded bg-black/40 text-white backdrop-blur-2xs">
                                PRO
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {th.name}
                            </span>
                            {th.isPremium && !isPro && (
                              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: SOSIAL MEDIA & WHATSAPP */}
          {activeTab === "sosial" && (
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">Tautan Sosial & Kontak</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hubungkan akun media sosialmu agar pembeli bisa terhubung dengan mudah.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Nomor / Link WhatsApp
                    </label>
                    <span className="text-[11px] text-slate-400">{whatsapp.length}/50</span>
                  </div>
                  <Input
                    maxLength={50}
                    placeholder="Contoh: 08123456789 atau https://wa.me/628123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bisa masukkan nomor telepon (08... / 628...) atau tautan link WhatsApp.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <InstagramIcon className="w-4 h-4 text-pink-600" />
                      Instagram (Tautan Profil atau Username)
                    </label>
                    <span className="text-[11px] text-slate-400">{instagram.length}/100</span>
                  </div>
                  <Input
                    maxLength={100}
                    placeholder="Contoh: https://instagram.com/nandokreator atau @nandokreator"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value.replace(/\s+/g, ""))}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mendukung tautan link sosial media atau username akunmu (maks. 100 karakter).
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-slate-900" />
                      TikTok (Tautan Profil atau Username)
                    </label>
                    <span className="text-[11px] text-slate-400">{tiktok.length}/100</span>
                  </div>
                  <Input
                    maxLength={100}
                    placeholder="Contoh: https://tiktok.com/@nandotips atau nandotips"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value.replace(/\s+/g, ""))}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mendukung tautan link profil TikTok atau username (maks. 100 karakter).
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <YoutubeIcon className="w-4 h-4 text-red-600" />
                      YouTube (Tautan Channel atau Handle)
                    </label>
                    <span className="text-[11px] text-slate-400">{youtube.length}/120</span>
                  </div>
                  <Input
                    maxLength={120}
                    placeholder="Contoh: https://youtube.com/@NandoChannel atau @NandoChannel"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value.replace(/\s+/g, ""))}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mendukung link channel YouTube atau handle @ (maks. 120 karakter).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: BANNER PROMOSI */}
          {activeTab === "banner" && (
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#0F172A]">Banner Etalase (Maksimal 3)</h3>
                    {!isPro && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                        Fitur PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tampilkan poster promo, diskon khusus, atau tautan kampanye di bagian teratas etalase.
                  </p>
                </div>

                {!isPro ? (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-amber-600 mx-auto" />
                    <h4 className="font-bold text-sm text-amber-900">Khusus Pelanggan PRO</h4>
                    <p className="text-xs text-amber-700 max-w-sm mx-auto">
                      Tingkatkan konversi etalasemu hingga 2x lipat dengan memasang banner promo bergerak di etalase.
                    </p>
                    <Link href="/dashboard/langganan">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Upgrade ke PRO Sekarang
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Form Upload Banner Baru */}
                    {banners.length < 3 && (
                      <form onSubmit={handleAddBanner} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-800">
                            Tambah Banner Baru ({banners.length}/3)
                          </div>
                          {/* Toggle Opsi: Dari Perangkat vs Dari Internet */}
                          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-medium">
                            <button
                              type="button"
                              onClick={() => {
                                setBannerSource("local");
                                setNewBannerUrl("");
                              }}
                              className={`px-2.5 py-1 rounded-md transition-all ${
                                bannerSource === "local"
                                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBannerSource("url");
                                setNewBannerFile(null);
                                setNewBannerPreview(null);
                              }}
                              className={`px-2.5 py-1 rounded-md transition-all ${
                                bannerSource === "url"
                                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Link Internet
                            </button>
                          </div>
                        </div>

                        {bannerSource === "local" ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                id="banner-file"
                                accept="image/*"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  const objectUrl = URL.createObjectURL(f);
                                  setBannerCropSrc(objectUrl);
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="banner-file"
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer bg-white hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 text-slate-700"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Pilih Gambar dari Perangkat (16:9 / 21:9)</span>
                              </label>
                              {newBannerPreview && (
                                <span className="text-xs text-emerald-600 font-medium">✓ Gambar siap diupload</span>
                              )}
                            </div>
                            {newBannerPreview && (
                              <div className="w-full max-w-xs h-24 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                                <img src={newBannerPreview} alt="Preview Banner" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              placeholder="Masukkan URL gambar (contoh: https://images.unsplash.com/...)"
                              value={newBannerUrl}
                              onChange={(e) => setNewBannerUrl(e.target.value)}
                            />
                            {newBannerUrl && (
                              <div className="w-full max-w-xs h-24 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                                <img
                                  src={newBannerUrl}
                                  alt="Preview Internet"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <Input
                          placeholder="Judul banner (opsional)"
                          value={newBannerTitle}
                          onChange={(e) => setNewBannerTitle(e.target.value)}
                          maxLength={60}
                        />
                        <Input
                          placeholder="Tautan klik banner (opsional, misal https://...)"
                          value={newBannerLink}
                          onChange={(e) => setNewBannerLink(e.target.value)}
                        />

                        <Button
                          type="submit"
                          size="sm"
                          disabled={uploadingBanner || (bannerSource === "local" ? !newBannerFile : !newBannerUrl.trim())}
                          className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs gap-1.5"
                        >
                          {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Tambahkan Banner"}
                        </Button>
                      </form>
                    )}

                    {/* Daftar Banner */}
                    <div className="space-y-3">
                      {banners.map((b, idx) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={b.image_url}
                              alt="Banner"
                              className="w-16 h-10 object-cover rounded-lg border shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {b.title || `Banner #${idx + 1}`}
                              </p>
                              {b.link_url && (
                                <p className="text-[11px] text-slate-400 truncate">{b.link_url}</p>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBanner(b)}
                            title="Hapus Banner"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* KOLOM KANAN: LIVE PHONE PREVIEW SIMULATOR */}
        <div
          className={`lg:col-span-5 ${
            showMobilePreview ? "block" : "hidden lg:block"
          } sticky top-6`}
        >
          {/* Header Preview Interaktif */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Smartphone className="w-4 h-4 text-[#16A34A]" />
              <span>Pratinjau Layar HP 375px</span>
            </div>
            <span className="text-[11px] font-extrabold text-[#16A34A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 shadow-2xs">
              <Sparkles className="h-3 w-3" />
              {currentTheme.name}
            </span>
          </div>

          {/* Phone Shell dengan Dynamic Ambient Glow */}
          <div className="relative w-full flex justify-center py-2">
            {/* Ambient Glow di belakang HP */}
            <div
              className="absolute inset-0 max-w-[340px] mx-auto rounded-full blur-2xl transition-all duration-700 opacity-40 pointer-events-none"
              style={{
                backgroundColor: currentTheme.button,
              }}
            />

            {/* Apple iPhone Style Frame */}
            <div className="relative mx-auto w-[310px] sm:w-[340px] rounded-[44px] border-[8px] border-[#0F172A] bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-[#0F172A] rounded-b-xl z-30 flex items-center justify-center pointer-events-none">
                <div className="h-2 w-2 rounded-full bg-slate-900 mr-2" />
                <div className="h-1.5 w-7 rounded-full bg-slate-800" />
              </div>

              {/* Screen Area dengan Smooth Fade-In dan NO SCROLLBAR */}
              <div
                key={selectedTheme}
                className="pt-7 pb-4 min-h-[580px] max-h-[630px] overflow-y-auto no-scrollbar flex flex-col font-sans select-none transition-colors duration-500 animate-in fade-in duration-300"
                style={{
                  backgroundColor: currentTheme.bg,
                  backgroundImage: currentTheme.bgGradient,
                  color: currentTheme.text,
                }}
              >
                {/* Profile Card Header */}
                <div className="px-4 text-center space-y-2 mt-1">
                  <div
                    className="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 shadow-md bg-white/80 relative transition-transform duration-200 hover:scale-105"
                    style={{ borderColor: currentTheme.cardBorder }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-bold text-xl text-white"
                        style={{ backgroundColor: currentTheme.button }}
                      >
                        {(displayName || "U").charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3
                      className="font-extrabold text-sm tracking-tight"
                      style={{ color: currentTheme.text }}
                    >
                      {displayName || "Nama Toko Kamu"}
                    </h3>
                    <p
                      className="text-xs mt-0.5 line-clamp-2 max-w-[240px] mx-auto"
                      style={{ color: currentTheme.textSecondary }}
                    >
                      {bio || "Deskripsi etalase affiliate kamu akan muncul di sini."}
                    </p>
                  </div>

                  {/* Social media icons */}
                  <div className="flex items-center justify-center gap-2.5 pt-1">
                    {whatsapp && (
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shadow-2xs">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {instagram && (
                      <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600 shadow-2xs">
                        <InstagramIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {tiktok && (
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800 shadow-2xs">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {youtube && (
                      <div className="p-1.5 rounded-lg bg-red-50 text-red-600 shadow-2xs">
                        <YoutubeIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Carousel Preview */}
                {banners.length > 0 && isPro && (
                  <div className="px-4 mt-3">
                    <div
                      className="rounded-xl overflow-hidden aspect-[21/9] border relative shadow-xs group"
                      style={{ borderColor: currentTheme.cardBorder }}
                    >
                      <img
                        key={banners[previewBannerIndex % banners.length]?.id}
                        src={banners[previewBannerIndex % banners.length]?.image_url}
                        alt="Banner"
                        className="w-full h-full object-cover transition-all duration-700 animate-in fade-in"
                      />
                      {banners[previewBannerIndex % banners.length]?.title && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2 pb-4">
                          <span className="text-[10px] text-white font-bold line-clamp-1">
                            {banners[previewBannerIndex % banners.length]?.title}
                          </span>
                        </div>
                      )}
                      {banners.length > 1 && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                          {banners.map((b, idx) => (
                            <div
                              key={b.id}
                              className={`h-1 rounded-full transition-all duration-300 ${
                                idx === (previewBannerIndex % banners.length)
                                  ? "w-3 bg-white shadow-2xs"
                                  : "w-1 bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mini Search & Category Chips Simulation */}
                <div className="px-4 mt-3 space-y-2">
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                      style={{ color: currentTheme.textSecondary }}
                    />
                    <div
                      className="w-full h-8 pl-8 pr-2.5 rounded-xl text-[11px] font-medium flex items-center shadow-2xs"
                      style={{
                        backgroundColor: currentTheme.card,
                        color: currentTheme.textSecondary,
                        border: `1px solid ${currentTheme.cardBorder}`,
                      }}
                    >
                      Cari nomor atau nama produk…
                    </div>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {["Semua", "Outfit", "Gadget", "Racun Shopee"].map((cat, idx) => (
                      <span
                        key={cat}
                        className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap shadow-2xs ${
                          idx === 0 ? "" : "opacity-85"
                        }`}
                        style={{
                          backgroundColor: idx === 0 ? currentTheme.chipActiveBg : currentTheme.card,
                          color: idx === 0 ? currentTheme.chipActiveText : currentTheme.textSecondary,
                          border: `1px solid ${idx === 0 ? currentTheme.chipActiveBg : currentTheme.cardBorder}`,
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Product Collection Grid */}
                <div className="px-4 py-3 space-y-2 flex-1">
                  <div
                    className="text-[10px] font-black uppercase tracking-wider flex items-center justify-between"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    <span>Koleksi Produk ({products.length > 0 ? products.length : 4})</span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {displayProducts.map((prod) => (
                      <div
                        key={prod.number}
                        className="rounded-2xl p-2 border shadow-2xs flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200"
                        style={{
                          backgroundColor: currentTheme.card,
                          borderColor: currentTheme.cardBorder,
                        }}
                      >
                        <div>
                          <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden relative mb-1.5">
                            <span
                              className="absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded-md z-10 shadow-xs"
                              style={{
                                backgroundColor: currentTheme.badgeBg,
                                color: currentTheme.badgeText,
                              }}
                            >
                              #{prod.number}
                            </span>
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p
                            className="text-[10px] font-bold line-clamp-1 leading-tight"
                            style={{ color: currentTheme.text }}
                          >
                            {prod.name}
                          </p>
                        </div>

                        <div className="mt-1 pt-1 border-t" style={{ borderColor: currentTheme.cardBorder }}>
                          <p
                            className="text-[10px] font-black"
                            style={{ color: currentTheme.button }}
                          >
                            {formatRupiah(prod.price)}
                          </p>
                          <div
                            className={`mt-1 w-full text-[8px] font-bold py-1.5 px-1 text-center transition-all shadow-2xs group-hover:brightness-105 active:scale-95 flex items-center justify-center gap-1 ${
                              currentTheme.buttonRadius || "rounded-lg"
                            }`}
                            style={{
                              backgroundColor: currentTheme.button,
                              color: currentTheme.buttonText,
                            }}
                          >
                            <span>{getMarketplaceBtnText(prod.marketplace)}</span>
                            <ExternalLink className="w-2 h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UdaLink Branding Footer */}
                <div
                  className="p-3 text-center border-t text-[9px] mt-auto font-medium"
                  style={{
                    borderColor: currentTheme.cardBorder,
                    color: currentTheme.textSecondary,
                  }}
                >
                  Dibuat dengan <strong style={{ color: currentTheme.button }}>UdaLink</strong> · Buat etalasemu gratis
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bannerToDelete}
        onClose={() => {
          if (!isDeletingBanner) setBannerToDelete(null);
        }}
        onConfirm={confirmDeleteBanner}
        title="Hapus Banner Promosi"
        description={`Apakah kamu yakin ingin menghapus banner "${bannerToDelete?.title || "ini"}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={isDeletingBanner}
        icon="trash"
        variant="danger"
      />

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-between gap-3 shadow-lg">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowMobilePreview(!showMobilePreview)}
          className="gap-1.5 text-xs font-semibold"
        >
          <Smartphone className="w-4 h-4 text-[#16A34A]" />
          {showMobilePreview ? "Tutup Pratinjau" : "Lihat Pratinjau"}
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={handleSaveSettings}
          disabled={saving || loading}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-1.5 text-xs font-bold"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Simpan Perubahan
        </Button>
      </div>

      {/* Banner Crop Modal */}
      {bannerCropSrc && (
        <ImageCropModal
          imageSrc={bannerCropSrc}
          aspect={16 / 9}
          title="Crop Banner (16:9)"
          onComplete={async (blob, dataUrl) => {
            URL.revokeObjectURL(bannerCropSrc);
            setBannerCropSrc(null);
            const croppedFile = new File([blob], "banner-crop.webp", { type: "image/webp" });
            setNewBannerFile(croppedFile);
            setNewBannerPreview(dataUrl);
          }}
          onCancel={() => {
            URL.revokeObjectURL(bannerCropSrc);
            setBannerCropSrc(null);
          }}
        />
      )}
    </div>
  );
}
