"use client";

import React, { useState } from "react";
import { Search, ExternalLink, Check, Sparkles, Palette, Zap } from "lucide-react";
import Image from "next/image";
import { getTheme, THEMES } from "@/lib/themes";

interface PhoneMockupProps {
  initialTheme?: string;
  onThemeChange?: (themeId: string) => void;
  showThemePicker?: boolean;
}

export function PhoneMockup({
  initialTheme = "hijau",
  onThemeChange,
  showThemePicker = true,
}: PhoneMockupProps) {
  const [activeThemeId, setActiveThemeId] = useState(initialTheme);
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchVal, setSearchVal] = useState("");
  const [selectedProductNumber, setSelectedProductNumber] = useState<number | null>(null);

  const theme = getTheme(activeThemeId);

  const sampleProducts = [
    {
      number: 1,
      name: "Kemeja Linen Oversized",
      price: "Rp 139.000",
      category: "Fashion",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&h=200&fit=crop",
    },
    {
      number: 3,
      name: "Keyboard Wireless 75%",
      price: "Rp 499.000",
      category: "Gadget",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&h=200&fit=crop",
    },
    {
      number: 6,
      name: "Serum Niacinamide 10%",
      price: "Rp 89.000",
      category: "Perawatan",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop",
    },
    {
      number: 11,
      name: "Stand Laptop Aluminium",
      price: "Rp 82.000",
      category: "Gadget",
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop",
    },
    {
      number: 5,
      name: "Celana Cargo Wide Leg",
      price: "Rp 179.000",
      category: "Fashion",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&h=200&fit=crop",
    },
    {
      number: 8,
      name: "Sunscreen SPF 50+",
      price: "Rp 65.000",
      category: "Perawatan",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop",
    },
  ];

  const filtered = sampleProducts.filter((p) => {
    const matchCategory = activeTab === "Semua" || p.category === activeTab;

    if (searchVal.trim()) {
      const isNumeric = /^\d+$/.test(searchVal.trim());
      const matchSearch = isNumeric
        ? p.number.toString() === searchVal.trim()
        : p.name.toLowerCase().includes(searchVal.toLowerCase());
      return matchCategory && matchSearch;
    }

    return matchCategory;
  });

  const showcaseThemes = [
    {
      id: "hijau",
      label: "Emerald",
      color: "#16A34A",
      tag: "Populer",
      glow: "rgba(22, 163, 74, 0.25)",
    },
    {
      id: "gelap",
      label: "Cyber Dark",
      color: "#0F172A",
      tag: "Sleek",
      glow: "rgba(15, 23, 42, 0.35)",
    },
    {
      id: "putih",
      label: "Classic White",
      color: "#FFFFFF",
      border: "#CBD5E1",
      tag: "Bersih",
      glow: "rgba(148, 163, 184, 0.25)",
    },
    {
      id: "biru",
      label: "Samudra",
      color: "#0284C7",
      tag: "Segar",
      glow: "rgba(2, 132, 199, 0.25)",
    },
    {
      id: "oranye",
      label: "Oranye",
      color: "#EA580C",
      tag: "Hangat",
      glow: "rgba(234, 88, 12, 0.25)",
    },
    {
      id: "ungu",
      label: "Ungu Malam",
      color: "#9333EA",
      tag: "Elegan",
      glow: "rgba(147, 51, 234, 0.25)",
    },
  ];

  const currentThemeMeta = showcaseThemes.find((t) => t.id === activeThemeId) || showcaseThemes[0];

  const handleSelectTheme = (id: string) => {
    setActiveThemeId(id);
    if (onThemeChange) {
      onThemeChange(id);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[380px] mx-auto">
      {/* 1. INTERACTIVE THEME PICKER DECK */}
      {showThemePicker && (
        <div className="w-full mb-5 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <div className="h-5 w-5 rounded-md bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <Palette className="h-3.5 w-3.5" />
              </div>
              <span>Pilih Tema Etalase:</span>
            </div>
            <span className="text-[11px] font-extrabold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 animate-in fade-in">
              <Sparkles className="h-2.5 w-2.5" />
              {currentThemeMeta.label}
            </span>
          </div>

          {/* Grid of Interactive Theme Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {showcaseThemes.map((t) => {
              const isActive = activeThemeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTheme(t.id)}
                  className={`group relative min-h-[42px] px-2.5 py-1.5 rounded-xl text-left transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md scale-[1.02] ring-2 ring-offset-1 ring-slate-900"
                      : "bg-slate-50 hover:bg-slate-100/90 text-slate-700 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 border border-slate-200/60"
                  }`}
                  aria-label={`Pilih tema ${t.label}`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "ring-2 ring-white" : ""
                    }`}
                    style={{
                      backgroundColor: t.color,
                      border: t.border ? `1px solid ${t.border}` : "none",
                    }}
                  />
                  <span className="text-[11px] font-bold truncate leading-tight">
                    {t.label}
                  </span>
                  {isActive && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            💡 Klik tema di atas untuk melihat perubahan warna seketika
          </p>
        </div>
      )}

      {/* 2. PHONE MOCKUP WITH DYNAMIC AMBIENT GLOW */}
      <div className="relative w-full flex justify-center">
        {/* Dynamic Theme Glow in the Background */}
        <div
          className="absolute -inset-4 rounded-full blur-2xl transition-all duration-700 opacity-60 pointer-events-none"
          style={{
            backgroundColor: currentThemeMeta.glow,
          }}
        />

        {/* Outer Phone Frame */}
        <div className="relative w-[290px] sm:w-[320px] rounded-[42px] border-[8px] border-[#0F172A] bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 transition-transform duration-300 hover:scale-[1.01]">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-[#0F172A] rounded-b-xl z-30 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-slate-900 mr-2" />
            <div className="h-1.5 w-7 rounded-full bg-slate-800" />
          </div>

          {/* Screen Area with Fade-In Animation on Theme Change */}
          <div
            key={activeThemeId}
            className="pt-7 pb-4 px-3.5 min-h-[540px] flex flex-col font-sans select-none transition-colors duration-500 animate-in fade-in duration-300"
            style={{
              backgroundColor: theme.bg,
              backgroundImage: theme.bgGradient,
              color: theme.text,
            }}
          >
            {/* Profile Card Header */}
            <div className="flex flex-col items-center text-center mt-1 mb-3">
              <div className="relative group cursor-pointer">
                <div
                  className="h-16 w-16 rounded-full border-2 shadow-md flex items-center justify-center text-white text-xl font-black transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: theme.button,
                    borderColor: theme.cardBorder,
                  }}
                >
                  N
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-0.5 rounded-full border border-white shadow-xs">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              </div>
              <h4
                className="font-extrabold text-sm mt-1.5 leading-tight tracking-tight"
                style={{ color: theme.text }}
              >
                Nando Pratama
              </h4>
              <p
                className="text-[10px] line-clamp-1 max-w-[220px] mt-0.5"
                style={{ color: theme.textSecondary }}
              >
                Sharing racun Shopee &amp; outfit harian terfavorit...
              </p>
            </div>

            {/* Banner Mini Promo */}
            <div
              className="rounded-xl p-2.5 text-white text-left mb-2.5 shadow-xs transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
              style={{
                backgroundColor: theme.button,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-wider font-black bg-white/25 px-1.5 py-0.5 rounded">
                  PROMO SPESIAL
                </span>
                <span className="text-[9px] text-white/90 font-bold">Diskon s.d 70%</span>
              </div>
              <p className="text-[10px] font-extrabold mt-1 leading-tight text-white line-clamp-1">
                Koleksi Pilihan Tanggal Kembar Terlengkap!
              </p>
            </div>

            {/* Search Bar with Instant Numeric Search */}
            <div className="relative mb-2">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors"
                style={{ color: theme.textSecondary }}
              />
              <input
                type="text"
                placeholder="Cari nomor produk (misal: '3')..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full h-8.5 pl-8 pr-7 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-2 shadow-2xs transition-all"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.cardBorder}`,
                }}
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => setSearchVal("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
              {["Semua", "Fashion", "Gadget", "Perawatan"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`text-[9px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer active:scale-95 ${
                    activeTab === cat ? "scale-105" : "hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === cat ? theme.chipActiveBg : theme.card,
                    color:
                      activeTab === cat ? theme.chipActiveText : theme.textSecondary,
                    border: `1px solid ${
                      activeTab === cat ? theme.chipActiveBg : theme.cardBorder
                    }`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid with Fade-in animation */}
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-[250px] pr-0.5 no-scrollbar">
              {filtered.length === 0 ? (
                <div
                  className="col-span-2 text-center py-6 text-[10px] animate-in fade-in"
                  style={{ color: theme.textSecondary }}
                >
                  Produk tidak ditemukan. Coba nomor lain.
                </div>
              ) : (
                filtered.map((prod) => {
                  const isMatch =
                    searchVal.trim() === prod.number.toString() ||
                    selectedProductNumber === prod.number;

                  return (
                    <div
                      key={prod.number}
                      onClick={() =>
                        setSelectedProductNumber(
                          selectedProductNumber === prod.number ? null : prod.number
                        )
                      }
                      className={`rounded-2xl p-2 transition-all duration-200 shadow-2xs flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                        isMatch
                          ? "ring-2 ring-offset-1 scale-[1.02] shadow-sm animate-in fade-in"
                          : ""
                      }`}
                      style={{
                        backgroundColor: theme.card,
                        border: `1px solid ${isMatch ? theme.button : theme.cardBorder}`,
                      }}
                    >
                      <div>
                        {/* Image + Badge */}
                        <div className="relative aspect-square rounded-xl bg-slate-100 mb-1.5 overflow-hidden">
                          <span
                            className="absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded-md z-10 shadow-xs"
                            style={{
                              backgroundColor: theme.badgeBg,
                              color: theme.badgeText,
                            }}
                          >
                            #{prod.number}
                          </span>
                          <Image
                            src={prod.image}
                            alt={prod.name}
                            fill
                            sizes="120px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <p
                          className="text-[10px] font-bold line-clamp-1 leading-tight"
                          style={{ color: theme.text }}
                        >
                          {prod.name}
                        </p>
                      </div>

                      <div className="mt-1 pt-1 border-t" style={{ borderColor: theme.cardBorder }}>
                        <p
                          className="text-[10px] font-black"
                          style={{ color: theme.button }}
                        >
                          {prod.price}
                        </p>
                        <div
                          className="mt-1 w-full text-[8px] font-black py-1.5 rounded-lg text-center flex items-center justify-center gap-1 shadow-2xs group-hover:brightness-105 active:scale-95 transition-all"
                          style={{
                            backgroundColor: theme.button,
                            color: theme.buttonText,
                          }}
                        >
                          <span>Beli Sekarang</span>
                          <ExternalLink className="h-2 w-2" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="text-center mt-2 pt-2 border-t text-[9px] font-medium"
              style={{
                borderColor: theme.cardBorder,
                color: theme.textSecondary,
              }}
            >
              Dibuat dengan <span className="font-extrabold text-[#16A34A]">UdaLink</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
