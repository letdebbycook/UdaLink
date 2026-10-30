"use client";

import React, { useState } from "react";
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  Check,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image-compression";

interface MultiImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  affiliateUrl: string;
  onApplyDetectedTitle?: (title: string) => void;
  maxImages?: number;
}

export function MultiImageManager({
  images,
  onChange,
  affiliateUrl,
  onApplyDetectedTitle,
  maxImages = 5,
}: MultiImageManagerProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "link" | "auto">("upload");
  const [uploading, setUploading] = useState(false);
  const [directUrl, setDirectUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  // Scraped modal state
  const [scrapedCandidates, setScrapedCandidates] = useState<string[]>([]);
  const [scrapedTitle, setScrapedTitle] = useState<string | undefined>(undefined);
  const [selectedScraped, setSelectedScraped] = useState<Set<string>>(new Set());
  const [isScrapedModalOpen, setIsScrapedModalOpen] = useState(false);
  const [importingScraped, setImportingScraped] = useState(false);

  const remainingSlots = Math.max(0, maxImages - images.length);

  // 1. Reorder / Set Cover / Delete
  function handleSetCover(index: number) {
    if (index === 0) return;
    const newImages = [...images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onChange(newImages);
    toast.success("Foto utama berhasil diperbarui");
  }

  function handleMove(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    onChange(newImages);
  }

  function handleRemove(index: number) {
    const newImages = images.filter((_, idx) => idx !== index);
    onChange(newImages);
    toast.success("Foto berhasil dihapus");
  }

  // 2. Local Upload
  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (remainingSlots <= 0) {
      toast.error(`Maksimal ${maxImages} foto per produk telah tercapai.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(`Hanya ${remainingSlots} foto pertama yang akan diproses.`);
    }

    try {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi.");

      const uploadedUrls: string[] = [];

      for (const file of filesToProcess) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File "${file.name}" melebihi batas 5 MB, dilewati.`);
          continue;
        }

        // Kompresi WebP 1:1 persegi ideal
        const { file: compressed } = await compressImage(file, {
          makeSquare: true,
          fitMode: "contain",
          maxWidth: 1080,
          maxHeight: 1080,
          quality: 0.85,
          backgroundColor: "#FFFFFF",
        });

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(filePath, compressed, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} foto berhasil ditambahkan`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah foto";
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // 3. Direct Image URL Import
  async function handleImportDirectUrl() {
    const trimmed = directUrl.trim();
    if (!trimmed) {
      toast.error("Masukkan URL gambar terlebih dahulu.");
      return;
    }

    if (remainingSlots <= 0) {
      toast.error(`Maksimal ${maxImages} foto telah tercapai.`);
      return;
    }

    try {
      setUploading(true);
      const res = await fetch("/api/products/import-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengimpor gambar dari link.");
      }

      onChange([...images, data.url]);
      setDirectUrl("");
      toast.success("Foto dari link berhasil disimpan ke galeri!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses gambar";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  // 4. Auto Scrape from E-Commerce Link
  async function handleScrapeImages() {
    const trimmedUrl = affiliateUrl.trim();
    if (!trimmedUrl) {
      toast.error("Isi tautan afiliasi produk terlebih dahulu pada formulir di bawah.");
      return;
    }

    if (remainingSlots <= 0) {
      toast.error(`Maksimal ${maxImages} foto telah tercapai. Hapus beberapa foto untuk menambah baru.`);
      return;
    }

    try {
      setScraping(true);
      const res = await fetch("/api/products/scrape-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendeteksi foto e-commerce.");
      }

      if (!data.images || data.images.length === 0) {
        toast.info(
          data.message ||
            "Tidak dapat menemukan foto otomatis pada link ini (karena proteksi e-commerce). Silakan gunakan opsi upload lokal atau tempel link gambar."
        );
        return;
      }

      setScrapedCandidates(data.images);
      setScrapedTitle(data.title);
      // Pre-select up to remaining slots
      const initialSelected = new Set<string>(
        data.images.slice(0, remainingSlots)
      );
      setSelectedScraped(initialSelected);
      setIsScrapedModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mendeteksi foto";
      toast.error(msg);
    } finally {
      setScraping(false);
    }
  }

  // Confirm Scraped Selection
  async function handleConfirmScraped() {
    const selectedUrls = Array.from(selectedScraped);
    if (selectedUrls.length === 0) {
      toast.error("Pilih minimal 1 gambar untuk diimpor.");
      return;
    }

    try {
      setImportingScraped(true);
      let successCount = 0;
      const newUrls: string[] = [];

      for (const rawUrl of selectedUrls) {
        try {
          const res = await fetch("/api/products/import-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: rawUrl }),
          });

          const data = await res.json();
          if (res.ok && data.url) {
            newUrls.push(data.url);
            successCount++;
          } else {
            // Jika proxy gagal, gunakan direct URL sebagai fallback
            newUrls.push(rawUrl);
            successCount++;
          }
        } catch {
          newUrls.push(rawUrl);
          successCount++;
        }
      }

      if (newUrls.length > 0) {
        onChange([...images, ...newUrls].slice(0, maxImages));
        toast.success(`${successCount} foto berhasil diimpor ke produk!`);
      }

      if (scrapedTitle && onApplyDetectedTitle) {
        onApplyDetectedTitle(scrapedTitle);
      }

      setIsScrapedModalOpen(false);
    } catch {
      toast.error("Gagal mengimpor beberapa foto terpilih.");
    } finally {
      setImportingScraped(false);
    }
  }

  function toggleScrapedItem(url: string) {
    const next = new Set(selectedScraped);
    if (next.has(url)) {
      next.delete(url);
    } else {
      if (next.size >= remainingSlots) {
        toast.warning(`Sisa kuota foto untuk produk ini adalah ${remainingSlots}.`);
        return;
      }
      next.add(url);
    }
    setSelectedScraped(next);
  }

  return (
    <div className="space-y-3">
      {/* Header Foto & Counter */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          Galeri Foto Produk (Maks {maxImages} Foto)
        </label>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {images.length}/{maxImages} Foto
        </span>
      </div>

      {/* Grid Thumbnail Gambar yang Tersimpan */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        {images.length === 0 ? (
          <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              Belum ada foto produk yang ditambahkan
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pilih foto lokal, gunakan link gambar, atau ambil otomatis dari tautan e-commerce.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {images.map((imgUrl, idx) => {
              const isCover = idx === 0;
              return (
                <div
                  key={`${imgUrl}-${idx}`}
                  className="relative aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden group shadow-2xs flex items-center justify-center"
                >
                  <img
                    src={imgUrl}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-contain p-1"
                  />

                  {/* Badge Foto Utama */}
                  {isCover ? (
                    <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs z-10">
                      Utama
                    </span>
                  ) : (
                    <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
                      #{idx + 1}
                    </span>
                  )}

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-20">
                    <div className="flex items-center justify-between">
                      {!isCover ? (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          title="Jadikan Foto Utama"
                          className="w-6 h-6 rounded bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center text-xs shadow-xs"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ) : (
                        <div />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        title="Hapus Foto"
                        className="w-6 h-6 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Left / Right Arrows */}
                    <div className="flex items-center justify-center gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "left")}
                          title="Pindahkan ke Kiri"
                          className="w-5 h-5 rounded bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "right")}
                          title="Pindahkan ke Kanan"
                          className="w-5 h-5 rounded bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Input Controls (Hanya jika belum mencapai maxImages) */}
        {remainingSlots > 0 ? (
          <div className="pt-2 border-t border-slate-200">
            {/* Tabs Pilihan Metode Penambahan Foto */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 mb-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "upload"
                    ? "bg-[#16A34A] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Lokal</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "link"
                    ? "bg-[#16A34A] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Dari Link</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("auto")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "auto"
                    ? "bg-[#16A34A] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Otomatis E-Commerce</span>
              </button>
            </div>

            {/* Content Tab: Upload Lokal */}
            {activeTab === "upload" && (
              <div className="space-y-1.5">
                <input
                  type="file"
                  id="multi-product-photos"
                  accept="image/*"
                  multiple
                  onChange={handleFilePick}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="multi-product-photos"
                  className={`w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    uploading ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Memproses dan mengunggah gambar...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Pilih File dari Perangkat (Bisa pilih hingga {remainingSlots} foto)</span>
                    </>
                  )}
                </label>
                <p className="text-[10px] text-slate-400 text-center">
                  Format gambar otomatis dikonversi ke WebP 1:1 tanpa pecah (Maks 5 MB/file).
                </p>
              </div>
            )}

            {/* Content Tab: Dari Link Gambar */}
            {activeTab === "link" && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/foto-produk.jpg"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    className="text-xs h-9 bg-white"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleImportDirectUrl}
                    disabled={uploading || !directUrl.trim()}
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs h-9 shrink-0 gap-1.5"
                  >
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Impor</span>
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Gambar akan otomatis diunduh dan disimpan aman di penyimpanan UdaLink agar tidak rusak.
                </p>
              </div>
            )}

            {/* Content Tab: Ambil Otomatis dari E-Commerce */}
            {activeTab === "auto" && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScrapeImages}
                  disabled={scraping}
                  className="w-full h-10 border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 font-semibold text-xs gap-2"
                >
                  {scraping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span>Menganalisa dan mengambil foto dari link marketplace...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Tarik Foto Otomatis dari Link Afiliasi</span>
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Sistem akan mendeteksi foto produk dari link Shopee, Tokopedia, TikTok Shop, atau Lazada yang Anda isi di bawah.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Maksimal 5 foto telah terpenuhi. Hapus foto yang ada jika ingin mengganti.</span>
          </div>
        )}
      </div>

      {/* Modal Pemilihan Foto Hasil Scraping Otomatis */}
      {isScrapedModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Foto Produk Terdeteksi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pilih foto yang ingin dimasukkan ke etalase (Tersisa kuota: {remainingSlots})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScrapedModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {scrapedTitle && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  Judul Terdeteksi:
                </span>
                <span className="line-clamp-2">{scrapedTitle}</span>
              </div>
            )}

            {/* Grid Foto Hasil Scraping */}
            <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
              {scrapedCandidates.map((url, idx) => {
                const isSelected = selectedScraped.has(url);
                return (
                  <div
                    key={`${url}-${idx}`}
                    onClick={() => toggleScrapedItem(url)}
                    className={`relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#16A34A] ring-2 ring-[#16A34A]/20 scale-95"
                        : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Foto e-commerce ${idx + 1}`}
                      className="w-full h-full object-contain bg-white"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-600">
                {selectedScraped.size} foto dipilih
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScrapedModalOpen(false)}
                  disabled={importingScraped}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmScraped}
                  disabled={importingScraped || selectedScraped.size === 0}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs gap-1.5"
                >
                  {importingScraped ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunduh...</span>
                    </>
                  ) : (
                    <span>Gunakan Foto ({selectedScraped.size})</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
