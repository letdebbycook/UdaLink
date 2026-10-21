"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package, Plus, Search, Filter, Trash2, Edit2, ExternalLink,
  Loader2, Crown, Upload, Eye, EyeOff, Star, AlertCircle,
  CheckCircle2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image-compression";
import { detectMarketplace, MARKETPLACE_CONFIG } from "@/lib/marketplace";
import { formatRupiah } from "@/lib/utils";
import type { Product, Category, MyPlanResponse, MarketplaceType } from "@/types/database";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ImageCropModal } from "@/components/ui/image-crop-modal";

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plan, setPlan] = useState<MyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formAffiliateUrl, setFormAffiliateUrl] = useState("");
  const [formMarketplace, setFormMarketplace] = useState<MarketplaceType>("lainnya");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawSelectedFile, setRawSelectedFile] = useState<File | null>(null);
  const [imageFitMode, setImageFitMode] = useState<"contain" | "cover">("contain");
  const [imageZoom, setImageZoom] = useState<number>(1.0);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [prodsRes, catsRes, planRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order("number", { ascending: true }),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
        supabase.rpc("get_my_plan"),
      ]);

      if (prodsRes.data) setProducts(prodsRes.data as Product[]);
      if (catsRes.data) setCategories(catsRes.data as Category[]);
      if (planRes.data) setPlan(planRes.data as MyPlanResponse);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quota calculation
  const isPro = plan?.is_pro ?? false;
  const currentCount = products.length;
  const freeLimit = plan?.free_product_limit ?? 30;
  const isQuotaFull = !isPro && currentCount >= freeLimit;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        `#${p.number}`.includes(search.trim()) ||
        String(p.number) === search.trim();
      const matchCat =
        selectedCat === "all" ||
        (selectedCat === "none" && !p.category_id) ||
        p.category_id === selectedCat;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat]);

  // Handle URL change to auto-detect marketplace
  function handleUrlChange(url: string) {
    setFormAffiliateUrl(url);
    const detected = detectMarketplace(url);
    setFormMarketplace(detected);
  }

  // Helper untuk proses gambar 1:1 ideal tanpa terpotong
  async function processSelectedImage(
    file: File,
    fit: "contain" | "cover",
    zoom: number
  ) {
    try {
      setUploadProgress(true);
      const { file: compressed, dataUrl } = await compressImage(file, {
        makeSquare: true,
        fitMode: fit,
        zoomScale: zoom,
        maxWidth: 1080,
        maxHeight: 1080,
        quality: 0.85,
        backgroundColor: "#FFFFFF",
      });
      setImageFile(compressed);
      setImagePreview(dataUrl);
    } catch (err) {
      toast.error("Gagal memproses gambar produk");
    } finally {
      setUploadProgress(false);
    }
  }

  // Handle image pick — open crop modal first
  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5 MB");
      return;
    }

    setRawSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  // Called when user confirms the crop
  async function handleCropComplete(blob: Blob, dataUrl: string) {
    setCropSrc(null);
    setUploadProgress(true);
    try {
      const croppedFile = new File([blob], "product-crop.webp", { type: "image/webp" });
      setImageFile(croppedFile);
      setImagePreview(dataUrl);
    } catch {
      toast.error("Gagal memproses hasil crop");
    } finally {
      setUploadProgress(false);
    }
  }

  function handleFitModeChange(mode: "contain" | "cover") {
    setImageFitMode(mode);
    if (rawSelectedFile) {
      processSelectedImage(rawSelectedFile, mode, imageZoom);
    }
  }

  function handleZoomChange(newZoom: number) {
    const clamped = Math.max(0.6, Math.min(1.4, Math.round(newZoom * 10) / 10));
    setImageZoom(clamped);
    if (rawSelectedFile) {
      processSelectedImage(rawSelectedFile, imageFitMode, clamped);
    }
  }

  function openCreateModal() {
    if (isQuotaFull) {
      toast.error(`Batas paket Gratis tercapai (${freeLimit} produk). Upgrade ke Pro untuk menambah produk tanpa batas!`);
      return;
    }
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormCategoryId("");
    setFormAffiliateUrl("");
    setFormMarketplace("lainnya");
    setFormIsActive(true);
    setFormIsFeatured(false);
    setFormImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
    setRawSelectedFile(null);
    setImageFitMode("contain");
    setImageZoom(1.0);
    setIsModalOpen(true);
  }

  function openEditModal(prod: Product) {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(prod.price ? String(prod.price) : "");
    setFormCategoryId(prod.category_id || "");
    setFormAffiliateUrl(prod.affiliate_url);
    setFormMarketplace(prod.marketplace);
    setFormIsActive(prod.is_active);
    setFormIsFeatured(prod.is_featured);
    setFormImageUrl(prod.image_url);
    setImageFile(null);
    setImagePreview(prod.image_url);
    setRawSelectedFile(null);
    setImageFitMode("contain");
    setImageZoom(1.0);
    setIsModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formAffiliateUrl.trim()) {
      toast.error("Nama dan tautan afiliasi wajib diisi");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi");

      let finalImageUrl = formImageUrl;

      // Upload gambar jika ada file baru yang dipilih
      if (imageFile) {
        const fileExt = "webp";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      let parsedPrice: number | null = null;
      if (formPrice.trim() !== "") {
        const digitsOnly = formPrice.replace(/\D/g, "");
        const num = parseInt(digitsOnly, 10);
        if (isNaN(num) || num === 0) {
          toast.error("Kosongkan harga atau masukkan harga yang sesuai (lebih dari 0).");
          setSaving(false);
          return;
        }
        parsedPrice = num;
      }

      if (editingProduct) {
        // UPDATE
        const { error: updateErr } = await supabase
          .from("products")
          .update({
            name: formName.trim(),
            price: parsedPrice,
            category_id: formCategoryId || null,
            affiliate_url: formAffiliateUrl.trim(),
            marketplace: formMarketplace,
            image_url: finalImageUrl,
            is_active: formIsActive,
            is_featured: isPro ? formIsFeatured : false,
          })
          .eq("id", editingProduct.id);

        if (updateErr) throw updateErr;
        toast.success(`Produk "${formName}" berhasil diperbarui`);
      } else {
        // INSERT (nomor produk dibuat otomatis oleh trigger DB)
        const { error: insertErr } = await supabase
          .from("products")
          .insert({
            user_id: user.id,
            name: formName.trim(),
            price: parsedPrice,
            category_id: formCategoryId || null,
            affiliate_url: formAffiliateUrl.trim(),
            marketplace: formMarketplace,
            image_url: finalImageUrl,
            is_active: formIsActive,
            is_featured: isPro ? formIsFeatured : false,
          });

        if (insertErr) throw insertErr;
        toast.success(`Produk "${formName}" berhasil ditambahkan`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(prod: Product) {
    try {
      const nextActive = !prod.is_active;
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_active: nextActive } : p))
      );

      const { error } = await supabase
        .from("products")
        .update({ is_active: nextActive })
        .eq("id", prod.id);

      if (error) {
        // Rollback
        loadData();
        throw error;
      }

      toast.success(
        nextActive
          ? `Produk #${prod.number} ditampilkan di etalase`
          : `Produk #${prod.number} disembunyikan`
      );
    } catch (err: unknown) {
      toast.error("Gagal mengubah visibilitas produk");
    }
  }

  function handleDeleteProduct(prod: Product) {
    setProductToDelete(prod);
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return;
    try {
      setIsDeletingProduct(true);
      const { error } = await supabase.from("products").delete().eq("id", productToDelete.id);
      if (error) throw error;

      toast.success(`Produk #${productToDelete.number} berhasil dihapus`);
      setProductToDelete(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus produk");
    } finally {
      setIsDeletingProduct(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Kuota */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Daftar Produk
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Kelola tautan afiliasi dan susunan produk etalasemu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={openCreateModal}
            disabled={isQuotaFull}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Quota Banner */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                Kuota Produk:{" "}
                {isPro ? (
                  <span className="text-[#16A34A] font-bold">Tanpa Batas (PRO)</span>
                ) : (
                  <span>
                    <strong className="text-[#0F172A]">{currentCount}</strong> dari{" "}
                    <strong>{freeLimit}</strong> produk
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {isPro
                  ? "Kamu berlangganan Pro — bebas menambahkan produk sebanyak mungkin."
                  : isQuotaFull
                  ? "Kuota paket Gratis penuh. Upgrade ke Pro untuk menambah produk tanpa batas."
                  : `Tersisa ${freeLimit - currentCount} kuota produk pada paket Gratis.`}
              </p>
            </div>
          </div>

          {!isPro && (
            <Link href="/dashboard/langganan">
              <Button
                variant="outline"
                size="sm"
                className="border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4] gap-1.5 shrink-0"
              >
                <Crown className="w-4 h-4" />
                Upgrade ke PRO
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari berdasarkan nama produk atau nomor (misal #1)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <div className="sm:w-60">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20"
          >
            <option value="all">Semua Kategori</option>
            <option value="none">Tanpa Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mb-3" />
          <p className="text-sm">Memuat daftar produk...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-dashed border-2 border-[#CBD5E1]">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-[#64748B]">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#0F172A]">
              {products.length === 0 ? "Belum Ada Produk" : "Tidak Ada Produk yang Cocok"}
            </h3>
            <p className="text-sm text-[#64748B] max-w-sm mx-auto mt-1 mb-5">
              {products.length === 0
                ? "Mulai etalasemu dengan menambahkan produk rekomendasi pertamamu sekarang."
                : "Coba ubah kata kunci pencarian atau filter kategori di atas."}
            </p>
            {products.length === 0 && (
              <Button
                onClick={openCreateModal}
                disabled={isQuotaFull}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Produk Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase">
                <tr>
                  <th className="py-3 px-4 w-16">No</th>
                  <th className="py-3 px-4 w-16">Foto</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4">Marketplace</th>
                  <th className="py-3 px-4 text-center">Tampil</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  const mpConfig = MARKETPLACE_CONFIG[p.marketplace] || MARKETPLACE_CONFIG.lainnya;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        !p.is_active ? "opacity-60 bg-slate-50/50" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-[#16A34A]">#{p.number}</td>
                      <td className="py-3.5 px-4">
                        <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0F172A] line-clamp-1 flex items-center gap-2">
                          {p.name}
                          {p.is_featured && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-300 gap-1 text-[11px] py-0"
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              Unggulan
                            </Badge>
                          )}
                        </div>
                        <a
                          href={p.affiliate_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-[#16A34A] flex items-center gap-1 mt-0.5 truncate max-w-xs"
                        >
                          {p.affiliate_url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {cat ? (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700">
                            {cat.name}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {p.price ? formatRupiah(p.price) : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={mpConfig.badgeClass}>
                          {mpConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            p.is_active
                              ? "bg-emerald-50 text-[#16A34A] border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                          }`}
                          title={p.is_active ? "Sembunyikan produk" : "Tampilkan produk"}
                        >
                          {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(p)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(p)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              const mpConfig = MARKETPLACE_CONFIG[p.marketplace] || MARKETPLACE_CONFIG.lainnya;
              return (
                <Card
                  key={p.id}
                  className={`border-[#E2E8F0] shadow-xs ${
                    !p.is_active ? "opacity-70 bg-slate-50/50" : "bg-white"
                  }`}
                >
                  <CardContent className="p-3.5 flex gap-3">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{p.number}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-sm text-[#0F172A] line-clamp-2">
                            {p.name}
                          </h4>
                          {p.is_featured && (
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={`text-[10px] py-0 ${mpConfig.badgeClass}`}>
                            {mpConfig.label}
                          </Badge>
                          {cat && (
                            <span className="text-[11px] text-slate-500 truncate">
                              • {cat.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="font-bold text-sm text-[#16A34A]">
                          {p.price ? formatRupiah(p.price) : "-"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border text-xs ${
                              p.is_active
                                ? "bg-emerald-50 text-[#16A34A] border-emerald-200"
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}
                            title={p.is_active ? "Sembunyikan produk" : "Tampilkan produk"}
                          >
                            {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(p)}
                            className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(p)}
                            className="h-9 w-9 p-0 text-red-500 hover:bg-red-50"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#16A34A]" />
                {editingProduct ? `Edit Produk #${editingProduct.number}` : "Tambah Produk Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
              {/* Foto Produk dengan Kontrol Ideal 1:1 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Foto Produk (Rasio Ideal 1:1 Toko)
                </label>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden relative flex items-center justify-center shrink-0 shadow-2xs">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview 1:1"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded">
                        1:1
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="product-photo"
                          accept="image/*"
                          onChange={handleImagePick}
                          className="hidden"
                        />
                        <label
                          htmlFor="product-photo"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadProgress ? "Memproses..." : "Pilih / Ganti Foto"}</span>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Format 1:1 kotak mencegah foto terpotong di tampilan etalase HP.
                      </p>
                    </div>
                  </div>

                  {/* Kontrol Kustomisasi 1:1 (Pas Utuh vs Penuh & Ukuran Zoom) */}
                  {imagePreview && (
                    <div className="pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Format Gambar:</span>
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleFitModeChange("contain")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              imageFitMode === "contain"
                                ? "bg-[#16A34A] text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Pas Utuh (1:1 Ideal)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFitModeChange("cover")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              imageFitMode === "cover"
                                ? "bg-[#16A34A] text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Penuh (Cover)
                          </button>
                        </div>
                      </div>

                      {/* Slider / Tombol Zoom Kustom Ukuran */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-semibold text-slate-700">Besar Gambar:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleZoomChange(imageZoom - 0.1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                            title="Kecilkan"
                          >
                            -
                          </button>
                          <span className="font-mono text-[11px] font-bold text-slate-700 w-12 text-center">
                            {Math.round(imageZoom * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleZoomChange(imageZoom + 0.1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                            title="Besarkan"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Misal: Kemeja Linen Pria Oversize"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Tautan Afiliasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tautan Afiliasi / Link Toko <span className="text-red-500">*</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://shopee.co.id/product/..."
                  value={formAffiliateUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                />
                {formAffiliateUrl.trim().length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-500">Marketplace terdeteksi:</span>
                    <Badge
                      variant="outline"
                      className={`text-xs py-0 ${
                        MARKETPLACE_CONFIG[formMarketplace]?.badgeClass || ""
                      }`}
                    >
                      {MARKETPLACE_CONFIG[formMarketplace]?.label || "Lainnya"}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Kategori & Harga (2 Kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20"
                  >
                    <option value="">Tanpa Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Harga (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      Rp
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Contoh: 125000"
                      value={formPrice}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "");
                        setFormPrice(cleaned);
                      }}
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="pl-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bisa dikosongkan jika tidak ada harga.
                  </p>
                </div>
              </div>

              {/* Switch Unggulan (Khusus Pro) */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    Jadikan Produk Unggulan
                    {!isPro && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tampil di bagian atas etalase pembeli (maksimal 6 produk).
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isPro}
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#16A34A] rounded focus:ring-[#16A34A] cursor-pointer disabled:opacity-50"
                />
              </div>

              {/* Switch Tampilkan */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-700">
                  Langsung Tampilkan di Etalase
                </span>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#16A34A] rounded focus:ring-[#16A34A] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? "Simpan Perubahan" : "Tambahkan Produk"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => {
          if (!isDeletingProduct) setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title={`Hapus Produk #${productToDelete?.number}`}
        description={`Apakah kamu yakin ingin menghapus produk "${productToDelete?.name}"? Produk yang dihapus tidak dapat dipulihkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={isDeletingProduct}
        icon="trash"
        variant="danger"
      />

      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onComplete={handleCropComplete}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
        />
      )}
    </div>

  );
}
