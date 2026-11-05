"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  MessageCircle,
  Award,
  Share2,
  X,
  SearchX,
  Check,
  Hash,
  ArrowUpDown,
  QrCode,
  Download,
  Copy,
  ChevronRight,
  Delete,
  Sparkles,
} from "lucide-react";
import { PublicPageData } from "@/lib/dummy-data";
import { getTheme } from "@/lib/themes";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
import { ProductImageSlider } from "@/components/showcase/ProductImageSlider";
import { QrCodeSvg } from "@/components/ui/qr-code";

interface ShowcaseViewProps {
  initialData: PublicPageData;
}

type SortOption = "default" | "popular" | "price_asc" | "price_desc" | "newest";

export function ShowcaseView({ initialData }: ShowcaseViewProps) {
  const { profile, categories, products, banners, show_branding } = initialData;
  const theme = getTheme(profile.theme);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [copiedLink, setCopiedLink] = useState(false);
  const [refParam, setRefParam] = useState<string>("");

  // Numpad Quick-Search Drawer State
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [numpadValue, setNumpadValue] = useState("");
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  // Share & QR Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Capture URL query params for referral platform tracking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const ref = sp.get("ref") || sp.get("source") || sp.get("utm_source") || sp.get("platform") || "";
      if (ref) {
        setRefParam(ref);
      }
    }
  }, []);

  // Banner Carousel State
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);

  // Auto carousel cycling
  useEffect(() => {
    if (banners.length <= 1 || isBannerPaused) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length, isBannerPaused]);

  // Handle jump to product number with highlight pulse
  const jumpToProductNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return;

    const targetProduct = products.find((p) => p.is_active && p.number === num);
    if (!targetProduct) {
      toast.error(`Produk #${num} tidak ditemukan di etalase`);
      return;
    }

    // Reset filters that might hide the product
    setSelectedCategory("all");
    setSearchQuery("");
    setIsNumpadOpen(false);

    // Scroll smoothly to target element
    setTimeout(() => {
      const element = document.getElementById(`product-${num}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedProductId(targetProduct.id);
        toast.success(`Menemukan produk #${num}: ${targetProduct.name}`);

        // Remove highlight after 4.5 seconds
        setTimeout(() => {
          setHighlightedProductId(null);
        }, 4500);
      }
    }, 150);
  };

  // Preview product currently typed in numpad
  const numpadPreviewProduct = useMemo(() => {
    if (!numpadValue) return null;
    const num = parseInt(numpadValue, 10);
    if (isNaN(num)) return null;
    return products.find((p) => p.is_active && p.number === num) || null;
  }, [numpadValue, products]);

  // Filter, Search & Sorting Logic
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.is_active);

    // 1. Filter by Category
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    // 2. Search Query Handling
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const normalized = query
        .replace(/^#/, "")
        .replace(/^nomor\s+/, "")
        .replace(/^no\.?\s+/, "")
        .replace(/\.$/, "")
        .trim();

      const isNumeric = /^\d+$/.test(normalized);

      if (isNumeric) {
        const searchNum = parseInt(normalized, 10);
        const exactMatch = list.find((p) => p.number === searchNum);
        const partialNumMatches = list.filter(
          (p) => p.number !== searchNum && p.number.toString().includes(normalized)
        );
        const nameMatches = list.filter(
          (p) =>
            p.number !== searchNum &&
            !partialNumMatches.includes(p) &&
            p.name.toLowerCase().includes(normalized)
        );

        if (exactMatch) {
          list = [exactMatch, ...partialNumMatches, ...nameMatches];
        } else {
          list = [...partialNumMatches, ...nameMatches];
        }
      } else {
        list = list.filter((p) => p.name.toLowerCase().includes(normalized));
      }
    }

    // 3. Sorting Options
    const sorted = [...list];
    switch (sortBy) {
      case "popular":
        sorted.sort((a, b) => {
          // Sort by featured first, then clicks count if available
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return (b.clicks_count || 0) - (a.clicks_count || 0);
        });
        break;
      case "price_asc":
        sorted.sort((a, b) => {
          const priceA = a.price ?? Infinity;
          const priceB = b.price ?? Infinity;
          return priceA - priceB;
        });
        break;
      case "price_desc":
        sorted.sort((a, b) => {
          const priceA = a.price ?? -Infinity;
          const priceB = b.price ?? -Infinity;
          return priceB - priceA;
        });
        break;
      case "newest":
        sorted.sort((a, b) => b.number - a.number);
        break;
      case "default":
      default:
        // Keep original order or number ascending
        break;
    }

    return sorted;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Featured Products (is_featured = true)
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.is_active && p.is_featured);
  }, [products]);

  // Helper for marketplace button text
  const getMarketplaceLabel = (marketplace: string) => {
    switch (marketplace) {
      case "shopee":
        return "Beli di Shopee";
      case "tiktok":
        return "Beli di TikTok";
      case "tokopedia":
        return "Beli di Tokopedia";
      case "lazada":
        return "Beli di Lazada";
      default:
        return "Beli Sekarang";
    }
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://udalink.id/${profile.username}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      toast.success("Tautan etalase berhasil disalin!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Download QR Code as PNG image
  const handleDownloadQr = () => {
    const svgElement = document.getElementById("showcase-qr-code");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 50, 50, 500, 500);

      const png = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Etalase-${profile.username}.png`;
      downloadLink.href = png;
      downloadLink.click();
      toast.success("QR Code berhasil diunduh!");
    };
    image.src = blobURL;
  };

  const isNumericSearch = /^\d+$/.test(searchQuery.trim());
  const searchedNumber = isNumericSearch ? parseInt(searchQuery.trim(), 10) : null;

  return (
    <div
      className="min-h-screen py-0 sm:py-8 transition-colors duration-200"
      style={{
        backgroundColor: theme.bg,
        backgroundImage: theme.bgGradient,
      }}
    >
      {/* Mobile-First Frame: max 480px in center */}
      <div
        className="max-w-[480px] mx-auto min-h-screen sm:min-h-[92vh] sm:rounded-3xl shadow-xl flex flex-col relative overflow-hidden transition-all border sm:border-opacity-100 border-opacity-0"
        style={{
          backgroundColor: theme.bg,
          backgroundImage: theme.bgGradient,
          borderColor: theme.cardBorder,
        }}
      >
        {/* Top Header Actions */}
        <div className="p-4 flex items-center justify-between z-10">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full transition-all shadow-xs active:scale-[0.98]"
            style={{
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.cardBorder,
              borderWidth: "1px",
            }}
          >
            <span className="text-[#16A34A] font-extrabold tracking-tight">Uda</span>
            <span>Link</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Quick Numpad Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setNumpadValue("");
                setIsNumpadOpen(true);
              }}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
              style={{
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.cardBorder,
                borderWidth: "1px",
              }}
              title="Cari nomor produk via Numpad"
              aria-label="Cari nomor produk"
            >
              <Hash className="h-4 w-4 text-[#16A34A]" />
            </button>

            {/* Share & QR Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
              style={{
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.cardBorder,
                borderWidth: "1px",
              }}
              title="Bagikan etalase & QR Code"
              aria-label="Bagikan etalase"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 1. PROFILE HEADER */}
        <div className="px-5 pt-1 pb-4 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div
              className="h-24 w-24 rounded-full overflow-hidden border-[3px] shadow-md relative"
              style={{ borderColor: theme.button }}
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  priority
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center font-bold text-2xl text-white"
                  style={{ backgroundColor: theme.button }}
                >
                  {profile.display_name.charAt(0)}
                </div>
              )}
            </div>
            {profile.is_pro && (
              <div
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-400 text-slate-900 border-2 border-white shadow-xs"
                title="Akun Terverifikasi Pro"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          <h1
            className="text-xl font-extrabold tracking-tight leading-snug"
            style={{ color: theme.text }}
          >
            {profile.display_name}
          </h1>

          <p
            className="text-xs font-mono mt-0.5"
            style={{ color: theme.textSecondary }}
          >
            @{profile.username}
          </p>

          {profile.bio && (
            <p
              className="text-xs mt-2.5 max-w-[360px] leading-relaxed"
              style={{ color: theme.textSecondary }}
            >
              {profile.bio}
            </p>
          )}

          {/* Social Media Links Row (All targets >= 44x44px for thumb compliance) */}
          <div className="flex items-center gap-2.5 mt-4">
            {profile.instagram && (
              <a
                href={
                  profile.instagram.startsWith("http")
                    ? profile.instagram
                    : `https://instagram.com/${profile.instagram.replace(/^@+/, "")}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="Instagram"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            )}

            {profile.tiktok && (
              <a
                href={
                  profile.tiktok.startsWith("http")
                    ? profile.tiktok
                    : `https://tiktok.com/@${profile.tiktok.replace(/^@+/, "")}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="TikTok"
                aria-label="TikTok"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.35 0 .69.07 1 .19V9.07a6.37 6.37 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.33 6.34 6.34 0 0 0 9.34 21.67a6.34 6.34 0 0 0 6.34-6.34V8.71a8.18 8.18 0 0 0 4.91 1.62V6.88a4.83 4.83 0 0 1-1-.19z" />
                </svg>
              </a>
            )}

            {profile.youtube && (
              <a
                href={
                  profile.youtube.startsWith("http")
                    ? profile.youtube
                    : profile.youtube.startsWith("@")
                    ? `https://youtube.com/${profile.youtube}`
                    : `https://youtube.com/@${profile.youtube}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="YouTube"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
                </svg>
              </a>
            )}

            {profile.whatsapp && (
              <a
                href={
                  profile.whatsapp.startsWith("http")
                    ? profile.whatsapp
                    : `https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="WhatsApp"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* 2. PROMOTIONAL BANNERS CAROUSEL */}
        {banners.length > 0 && (
          <div
            className="px-4 py-2"
            onMouseEnter={() => setIsBannerPaused(true)}
            onMouseLeave={() => setIsBannerPaused(false)}
            onTouchStart={() => setIsBannerPaused(true)}
            onTouchEnd={() => setIsBannerPaused(false)}
          >
            <div
              className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-slate-200 shadow-sm border group"
              style={{ borderColor: theme.cardBorder }}
            >
              <div
                className="flex h-full transition-transform duration-700 ease-out"
                style={{
                  transform: `translateX(-${activeBannerIndex * 100}%)`,
                  width: `${banners.length * 100}%`,
                }}
              >
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="w-full h-full relative shrink-0 group overflow-hidden"
                  >
                    <Image
                      src={banner.image_url}
                      alt={banner.title || "Banner Promo"}
                      fill
                      unoptimized
                      sizes="(max-width: 480px) 100vw, 480px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {banner.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pb-8 flex flex-col justify-end z-10">
                        <p className="text-white text-xs font-bold leading-snug line-clamp-2">
                          {banner.title}
                        </p>
                      </div>
                    )}
                    {banner.link_url && (
                      <a
                        href={`/go/banner/${banner.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 z-10"
                        aria-label={banner.title || "Tautan banner"}
                      />
                    )}
                  </div>
                ))}
              </div>

              {banners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                    }}
                    aria-label="Banner sebelumnya"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-sm"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
                    }}
                    aria-label="Banner berikutnya"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-sm"
                  >
                    ›
                  </button>

                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 z-20 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                    {banners.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBannerIndex(idx);
                        }}
                        aria-label={`Lihat banner ${idx + 1}`}
                        className="p-1.5 cursor-pointer flex items-center justify-center min-w-[24px] min-h-[24px]"
                      >
                        <span
                          className={`block h-2 rounded-full transition-all duration-300 ${
                            idx === activeBannerIndex
                              ? "w-5 bg-white shadow-xs"
                              : "w-2 bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 3. STICKY SEARCH & NUMPAD BAR (Menempel di atas dengan glassmorphism) */}
        <div
          className="sticky top-0 z-30 px-4 py-2.5 backdrop-blur-md transition-colors"
          style={{
            backgroundColor: `${theme.bg}f0`,
            borderBottom: `1px solid ${theme.cardBorder}`,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: theme.textSecondary }}
              />
              <input
                type="text"
                id="search-product"
                placeholder="Cari nomor atau nama produk…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-9 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-xs focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#94A3B8] hover:text-[#0F172A]"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Numpad Launcher Button */}
            <button
              type="button"
              onClick={() => {
                setNumpadValue("");
                setIsNumpadOpen(true);
              }}
              className="h-11 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
              style={{
                backgroundColor: theme.card,
                color: theme.text,
                border: `1px solid ${theme.cardBorder}`,
              }}
              title="Ketik nomor via Numpad"
            >
              <Hash className="h-3.5 w-3.5 text-[#16A34A]" />
              <span className="hidden xs:inline">No</span>
            </button>
          </div>
        </div>

        {/* 4. CATEGORY CHIPS & SORT FILTER BAR */}
        <div className="px-4 py-2.5 space-y-2">
          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer active:scale-95"
              style={{
                backgroundColor:
                  selectedCategory === "all" ? theme.chipActiveBg : theme.card,
                color:
                  selectedCategory === "all" ? theme.chipActiveText : theme.textSecondary,
                border: `1px solid ${
                  selectedCategory === "all" ? theme.chipActiveBg : theme.cardBorder
                }`,
              }}
            >
              Semua
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer active:scale-95"
                style={{
                  backgroundColor:
                    selectedCategory === cat.id ? theme.chipActiveBg : theme.card,
                  color:
                    selectedCategory === cat.id ? theme.chipActiveText : theme.textSecondary,
                  border: `1px solid ${
                    selectedCategory === cat.id ? theme.chipActiveBg : theme.cardBorder
                  }`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Sort Options Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-[11px]">
            <div className="flex items-center gap-1 text-slate-400 pl-0.5 shrink-0">
              <ArrowUpDown className="h-3 w-3" />
              <span className="font-semibold text-[10px] uppercase tracking-wider">Urut:</span>
            </div>

            {[
              { id: "default", label: "Nomor #" },
              { id: "popular", label: "Terpopuler" },
              { id: "price_asc", label: "Termurah" },
              { id: "price_desc", label: "Termahal" },
              { id: "newest", label: "Terbaru" },
            ].map((sort) => {
              const isActive = sortBy === sort.id;
              return (
                <button
                  key={sort.id}
                  type="button"
                  onClick={() => setSortBy(sort.id as SortOption)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#16A34A]/10 text-[#16A34A] font-bold border border-[#16A34A]/30"
                      : "text-slate-500 hover:text-slate-800 bg-black/[0.02]"
                  }`}
                >
                  {sort.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. PRODUK UNGGULAN (Khusus Pro, row kartu geser - hanya tampil saat tidak sedang mencari) */}
        {!searchQuery && selectedCategory === "all" && sortBy === "default" && featuredProducts.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Award className="h-4 w-4 text-amber-500" />
              <h2
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: theme.text }}
              >
                Produk Unggulan
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
              {featuredProducts.map((prod) => (
                <div
                  key={`feat_${prod.id}`}
                  className="min-w-[140px] max-w-[140px] rounded-2xl p-2.5 shadow-xs transition-all flex flex-col justify-between shrink-0 hover:shadow-md"
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.cardBorder}`,
                  }}
                >
                  <div>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                      <ProductImageSlider
                        images={Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : (prod.image_url ? [prod.image_url] : [])}
                        alt={prod.name}
                        sizes="140px"
                        aspectClassName="relative w-full h-full overflow-hidden"
                        className="object-contain p-0.5"
                        badge={
                          <span
                            className="absolute top-1.5 left-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md z-10 shadow-xs"
                            style={{
                              backgroundColor: theme.badgeBg,
                              color: theme.badgeText,
                            }}
                          >
                            #{prod.number}
                          </span>
                        }
                      />
                    </div>
                    <p
                      className="text-[11px] font-semibold line-clamp-2 leading-snug"
                      style={{ color: theme.text }}
                    >
                      {prod.name}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p
                      className="text-xs font-extrabold"
                      style={{ color: theme.button }}
                    >
                      {formatRupiah(prod.price)}
                    </p>
                    <a
                      href={refParam ? `/go/${prod.id}?ref=${encodeURIComponent(refParam)}` : `/go/${prod.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-1.5 w-full py-2 ${
                        theme.buttonRadius || "rounded-lg"
                      } text-xs min-h-[36px] font-bold flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-[0.98]`}
                      style={{
                        backgroundColor: theme.button,
                        color: theme.buttonText,
                      }}
                    >
                      <span>Beli</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. GRID 2 KOLOM KARTU PRODUK */}
        <div className="px-4 py-3 flex-1">
          {/* Section title / search feedback */}
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              {searchQuery ? `Hasil Pencarian (${filteredProducts.length})` : `Daftar Produk (${filteredProducts.length})`}
            </h2>
            {isNumericSearch && searchedNumber !== null && (
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                Mencari nomor #{searchedNumber}
              </span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            /* STATE KOSONG PENCARIAN */
            <div className="py-14 px-4 text-center space-y-3">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.textSecondary,
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <SearchX className="h-7 w-7" />
              </div>
              <p
                className="text-xs sm:text-sm font-medium leading-relaxed max-w-[260px] mx-auto"
                style={{ color: theme.textSecondary }}
              >
                Produk tidak ditemukan. Coba nomor atau kata lain.
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold underline underline-offset-4 cursor-pointer text-[#16A34A]"
                >
                  Tampilkan semua produk
                </button>
              )}
            </div>
          ) : (
            /* GRID 2 KOLOM */
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((prod) => {
                const isExactMatched = searchedNumber !== null && prod.number === searchedNumber;
                const isPulseHighlighted = highlightedProductId === prod.id;

                return (
                  <div
                    key={prod.id}
                    id={`product-${prod.number}`}
                    className={`rounded-2xl p-2.5 shadow-xs transition-all duration-300 flex flex-col justify-between group hover:shadow-md ${
                      isPulseHighlighted
                        ? "animate-pulse ring-4 ring-[#16A34A] ring-offset-2 scale-[1.02] shadow-xl"
                        : isExactMatched
                        ? "ring-2 ring-[#16A34A] ring-offset-2 scale-[1.01] shadow-md"
                        : ""
                    }`}
                    style={{
                      backgroundColor: theme.card,
                      border: `1px solid ${
                        isPulseHighlighted || isExactMatched ? "#16A34A" : theme.cardBorder
                      }`,
                    }}
                  >
                    <div>
                      {/* Foto Rasio 1:1 + Badge Nomor + Slider */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                        <ProductImageSlider
                          images={Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : (prod.image_url ? [prod.image_url] : [])}
                          alt={prod.name}
                          sizes="(max-width: 480px) 50vw, 240px"
                          aspectClassName="relative w-full h-full overflow-hidden"
                          className="object-contain p-0.5 group-hover:scale-105 transition-transform duration-200"
                          badge={
                            <>
                              <span
                                className={`absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md z-10 shadow-xs ${
                                  isExactMatched || isPulseHighlighted ? "bg-[#16A34A] text-white ring-2 ring-white" : ""
                                }`}
                                style={{
                                  backgroundColor: isExactMatched || isPulseHighlighted ? "#16A34A" : theme.badgeBg,
                                  color: isExactMatched || isPulseHighlighted ? "#FFFFFF" : theme.badgeText,
                                }}
                              >
                                #{prod.number}
                              </span>

                              {(isExactMatched || isPulseHighlighted) && (
                                <span className="absolute bottom-2 left-2 right-2 z-10 bg-[#16A34A] text-white text-[10px] font-extrabold py-0.5 rounded text-center shadow-xs">
                                  Nomor Persis ★
                                </span>
                              )}
                            </>
                          }
                        />
                      </div>

                      {/* Nama Produk (Maks 2 Baris) */}
                      <h3
                        className="text-xs font-semibold line-clamp-2 leading-snug min-h-[32px]"
                        style={{ color: theme.text }}
                      >
                        {prod.name}
                      </h3>
                    </div>

                    <div className="mt-2.5 pt-2 border-t" style={{ borderColor: theme.cardBorder }}>
                      {/* Harga Rupiah */}
                      {prod.price !== null && (
                        <p
                          className="text-xs sm:text-sm font-extrabold mb-2"
                          style={{ color: theme.button }}
                        >
                          {formatRupiah(prod.price)}
                        </p>
                      )}

                      {/* Tombol Beli (Touch Target >= 44px) */}
                      <a
                        href={refParam ? `/go/${prod.id}?ref=${encodeURIComponent(refParam)}` : `/go/${prod.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`w-full min-h-[44px] ${
                          theme.buttonRadius || "rounded-xl"
                        } text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] hover:opacity-95`}
                        style={{
                          backgroundColor: theme.button,
                          color: theme.buttonText,
                        }}
                      >
                        <span>{getMarketplaceLabel(prod.marketplace)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7. FOOTER BRANDING */}
        {show_branding && (
          <div className="mt-8 mb-6 text-center px-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:underline"
              style={{ color: theme.textSecondary }}
            >
              <span>Dibuat dengan</span>
              <span className="font-bold text-[#16A34A]">UdaLink</span>
              <span>· Buat etalasemu gratis</span>
            </Link>
          </div>
        )}

        {/* 8. FLOATING WHATSAPP BUTTON */}
        {profile.whatsapp && (
          <a
            href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}?text=Halo%20${encodeURIComponent(
              profile.display_name
            )},%20saya%20mau%20tanya%20tentang%20produk%20di%20etalase%20kamu`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Chat WhatsApp dengan ${profile.display_name}`}
            className="fixed bottom-20 right-4 sm:absolute sm:bottom-24 sm:right-4 h-12 w-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-40 border-2 border-white"
            title="Chat di WhatsApp"
          >
            <MessageCircle className="h-5 w-5 fill-white" />
          </a>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 9. NUMPAD QUICK-SEARCH DRAWER / MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isNumpadOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsNumpadOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 bg-white shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-black text-sm">
                  #
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">Cari Nomor Produk</h3>
                  <p className="text-[11px] text-slate-500">Ketik nomor produk untuk lompat instan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNumpadOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Typed Value Display */}
            <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex items-center justify-center gap-1.5 min-h-[58px]">
              <span className="text-xl font-bold text-slate-400">#</span>
              <span className="text-3xl font-black tracking-wider text-[#0F172A]">
                {numpadValue || "..."}
              </span>
            </div>

            {/* Live Product Preview Match */}
            {numpadPreviewProduct ? (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-white overflow-hidden relative border border-emerald-100 shrink-0">
                    <img
                      src={numpadPreviewProduct.image_url || "/placeholder.png"}
                      alt={numpadPreviewProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {numpadPreviewProduct.name}
                    </p>
                    <p className="text-[11px] font-extrabold text-[#16A34A]">
                      {formatRupiah(numpadPreviewProduct.price)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToProductNumber(numpadValue)}
                  className="px-3 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs hover:bg-[#15803D] active:scale-95"
                >
                  <span>Lihat</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : numpadValue ? (
              <div className="mb-4 py-2 px-3 rounded-xl bg-slate-100 text-center text-xs text-slate-500">
                Belum ada produk dengan nomor #{numpadValue}
              </div>
            ) : null}

            {/* Numpad Keypad Grid (3 x 4) */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    if (numpadValue.length < 5) {
                      setNumpadValue((prev) => prev + digit.toString());
                    }
                  }}
                  className="h-13 rounded-2xl bg-white border border-slate-200 text-lg font-bold text-[#0F172A] hover:bg-slate-50 active:scale-95 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              {/* Clear Button */}
              <button
                type="button"
                onClick={() => setNumpadValue("")}
                className="h-13 rounded-2xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                Hapus
              </button>

              {/* Zero */}
              <button
                type="button"
                onClick={() => {
                  if (numpadValue && numpadValue.length < 5) {
                    setNumpadValue((prev) => prev + "0");
                  }
                }}
                className="h-13 rounded-2xl bg-white border border-slate-200 text-lg font-bold text-[#0F172A] hover:bg-slate-50 active:scale-95 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>

              {/* Backspace Button */}
              <button
                type="button"
                onClick={() => setNumpadValue((prev) => prev.slice(0, -1))}
                className="h-13 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Hapus satu angka"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            {/* Action Button: Jump */}
            <button
              type="button"
              disabled={!numpadValue}
              onClick={() => jumpToProductNumber(numpadValue)}
              className="mt-4 w-full h-12 rounded-xl bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Lompat ke Produk #{numpadValue || "..."}</span>
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 10. MODAL BAGIKAN & QR CODE INTERAKTIF */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 bg-white shadow-2xl border border-slate-200 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title */}
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto mb-2">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-base text-[#0F172A]">
              Bagikan Etalase
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan QR code atau salin tautan etalase @{profile.username}
            </p>

            {/* QR Code Container */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 inline-block shadow-inner">
              <div id="showcase-qr-code">
                <QrCodeSvg
                  value={currentUrl}
                  size={190}
                  fgColor="#0F172A"
                  bgColor="#FFFFFF"
                />
              </div>
            </div>

            {/* URL Display with Copy Button */}
            <div className="flex items-center gap-1.5 p-1.5 pl-3 rounded-xl bg-slate-100 border border-slate-200 mb-4 text-left">
              <span className="text-xs font-mono text-slate-600 truncate flex-1">
                {currentUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1 shrink-0 hover:bg-[#15803D] active:scale-95 transition-all shadow-xs"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Disalin!" : "Salin"}</span>
              </button>
            </div>

            {/* Social Share Quick Links */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Cek koleksi produk rekomendasi saya di: ${currentUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 font-bold text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  currentUrl
                )}&text=${encodeURIComponent(
                  `Koleksi rekomendasi produk pilihan di etalase saya:`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold text-xs flex flex-col items-center gap-1 transition-colors"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X / Twitter</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="py-2.5 px-2 rounded-xl bg-emerald-50 text-[#16A34A] hover:bg-emerald-100 font-bold text-xs flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Unduh QR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
