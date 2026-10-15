"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  MessageCircle,
  Award,
  Star,
  ShoppingBag,
  Share2,
  X,
  SearchX,
  Check,
} from "lucide-react";
import { PublicPageData, ProductData } from "@/lib/dummy-data";
import { getTheme } from "@/lib/themes";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

interface ShowcaseViewProps {
  initialData: PublicPageData;
}

export function ShowcaseView({ initialData }: ShowcaseViewProps) {
  const { profile, categories, products, banners, show_branding } = initialData;
  const theme = getTheme(profile.theme);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedLink, setCopiedLink] = useState(false);

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

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.is_active);

    // Filter by Category
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    // Check if query is numeric (Search by product number)
    const isNumeric = /^\d+$/.test(query);
    if (isNumeric) {
      const searchNum = parseInt(query, 10);
      const exactMatch = list.find((p) => p.number === searchNum);
      const otherMatches = list.filter((p) => p.number !== searchNum && p.number.toString().includes(query));

      // Put exact match at the top!
      if (exactMatch) {
        return [exactMatch, ...otherMatches];
      }
      return otherMatches;
    }

    // Text search by name (case-insensitive)
    return list.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, selectedCategory, searchQuery]);

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

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Tautan etalase berhasil disalin!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isNumericSearch = /^\d+$/.test(searchQuery.trim());
  const searchedNumber = isNumericSearch ? parseInt(searchQuery.trim(), 10) : null;

  return (
    <div
      className="min-h-screen py-0 sm:py-8 transition-colors duration-200"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Mobile-First Frame: max 480px in center */}
      <div
        className="max-w-[480px] mx-auto min-h-screen sm:min-h-[92vh] sm:rounded-3xl shadow-xl flex flex-col relative overflow-hidden transition-all border sm:border-opacity-100 border-opacity-0"
        style={{
          backgroundColor: theme.bg,
          borderColor: theme.cardBorder,
        }}
      >
        {/* Top Header Actions */}
        <div className="p-4 flex items-center justify-between z-10">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.cardBorder,
              borderWidth: "1px",
            }}
          >
            <span className="text-[#16A34A] font-extrabold">Uda</span>
            <span>Link</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
            style={{
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.cardBorder,
              borderWidth: "1px",
            }}
            title="Bagikan etalase"
          >
            {copiedLink ? (
              <Check className="h-4 w-4 text-[#16A34A]" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* 1. PROFILE HEADER (Round 96px avatar, name, bio, social icons) */}
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
            className="text-xl font-bold tracking-tight leading-snug"
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

          {/* Social Media Links Row */}
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
                className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="Instagram"
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
                className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="TikTok"
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
                className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="YouTube"
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
                className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* 2. PROMOTIONAL BANNERS CAROUSEL ANIMATED */}
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
              {/* Carousel Track */}
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-white text-xs font-bold leading-snug line-clamp-2">
                          {banner.title}
                        </p>
                      </div>
                    )}
                    {banner.link_url && (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 z-10"
                        aria-label={banner.title || "Tautan banner"}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Prev / Next navigation buttons */}
              {banners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
                    }}
                    aria-label="Banner sebelumnya"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-sm"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-sm"
                  >
                    ›
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-2 py-1 rounded-full bg-black/30 backdrop-blur-xs">
                    {banners.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBannerIndex(idx);
                        }}
                        aria-label={`Lihat banner ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === activeBannerIndex
                            ? "w-4 bg-white"
                            : "w-1.5 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 3. STICKY SEARCH BAR (Menempel di atas saat gulir) */}
        <div
          className="sticky top-0 z-30 px-4 py-3 backdrop-blur-md transition-colors"
          style={{
            backgroundColor: `${theme.bg}ee`,
            borderBottom: `1px solid ${theme.cardBorder}`,
          }}
        >
          <div className="relative">
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
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4. CATEGORY CHIPS (Geser ke samping, chip pertama "Semua") */}
        <div className="px-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs cursor-pointer"
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
        </div>

        {/* 5. PRODUK UNGGULAN (Khusus Pro, row kartu geser - hanya tampil saat tidak sedang mencari) */}
        {!searchQuery && selectedCategory === "all" && featuredProducts.length > 0 && (
          <div className="px-4 py-3">
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
                  className="min-w-[140px] max-w-[140px] rounded-2xl p-2 shadow-xs transition-all flex flex-col justify-between shrink-0"
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.cardBorder}`,
                  }}
                >
                  <div>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                      <span
                        className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10 shadow-xs"
                        style={{
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeText,
                        }}
                      >
                        #{prod.number}
                      </span>
                      {prod.image_url ? (
                        <Image
                          src={prod.image_url}
                          alt={prod.name}
                          fill
                          sizes="140px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <p
                      className="text-[11px] font-medium line-clamp-2 leading-snug"
                      style={{ color: theme.text }}
                    >
                      {prod.name}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p
                      className="text-xs font-bold"
                      style={{ color: theme.button }}
                    >
                      {formatRupiah(prod.price)}
                    </p>
                    <a
                      href={`/go/${prod.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
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
              {searchQuery ? `Hasil Pencarian (${filteredProducts.length})` : "Daftar Produk"}
            </h2>
            {isNumericSearch && searchedNumber !== null && (
              <span className="text-[10px] font-medium text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
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
                  className="text-xs font-semibold underline underline-offset-4 cursor-pointer"
                  style={{ color: theme.button }}
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

                return (
                  <div
                    key={prod.id}
                    id={`product-${prod.number}`}
                    className={`rounded-2xl p-2.5 shadow-xs transition-all flex flex-col justify-between ${
                      isExactMatched
                        ? "ring-2 ring-[#16A34A] ring-offset-2 scale-[1.02] shadow-md"
                        : ""
                    }`}
                    style={{
                      backgroundColor: theme.card,
                      border: `1px solid ${isExactMatched ? "#16A34A" : theme.cardBorder}`,
                    }}
                  >
                    <div>
                      {/* Foto Rasio 1:1 + Badge Nomor */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                        <span
                          className={`absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md z-10 shadow-xs ${
                            isExactMatched ? "bg-[#16A34A] text-white ring-2 ring-white" : ""
                          }`}
                          style={{
                            backgroundColor: isExactMatched ? "#16A34A" : theme.badgeBg,
                            color: isExactMatched ? "#FFFFFF" : theme.badgeText,
                          }}
                        >
                          #{prod.number}
                        </span>

                        {isExactMatched && (
                          <span className="absolute bottom-2 left-2 right-2 bg-[#16A34A] text-white text-[9px] font-bold py-0.5 rounded text-center shadow-xs">
                            Nomor Persis ★
                          </span>
                        )}

                        {prod.image_url ? (
                          <Image
                            src={prod.image_url}
                            alt={prod.name}
                            fill
                            sizes="(max-width: 480px) 50vw, 240px"
                            className="object-cover hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
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

                      {/* Tombol Beli */}
                      <a
                        href={`/go/${prod.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
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

        {/* 7. FOOTER BRANDING (Khusus akun Gratis atau jika show_branding aktif) */}
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

        {/* 8. FLOATING WHATSAPP BUTTON (Pojok kanan bawah jika nomor WA diisi) */}
        {profile.whatsapp && (
          <a
            href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}?text=Halo%20${encodeURIComponent(
              profile.display_name
            )},%20saya%20mau%20tanya%20tentang%20produk%20di%20etalase%20kamu`}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-5 right-5 sm:absolute sm:bottom-6 sm:right-6 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-40 border-2 border-white"
            title="Chat di WhatsApp"
          >
            <MessageCircle className="h-6 w-6 fill-white" />
          </a>
        )}
      </div>
    </div>
  );
}
