"use client";

import React, { useState } from "react";
import { Search, ExternalLink, Check, Sparkles } from "lucide-react";
import Image from "next/image";
import { getTheme } from "@/lib/themes";

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

  const availableThemes = [
    { id: "hijau", label: "Emerald", color: "#16A34A" },
    { id: "gelap", label: "Cyber Dark", color: "#0F172A" },
    { id: "putih", label: "Classic White", color: "#FFFFFF", border: "#CBD5E1" },
    { id: "lavender", label: "Pastel", color: "#9333EA" },
    { id: "sunset", label: "Sunset", color: "#EA580C" },
  ];

  const handleSelectTheme = (id: string) => {
    setActiveThemeId(id);
    if (onThemeChange) {
      onThemeChange(id);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Theme Switcher Bar */}
      {showThemePicker && (
        <div className="mb-4 inline-flex items-center gap-1.5 p-1 rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 pl-2 pr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#16A34A]" />
            Tema:
          </span>
          {availableThemes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTheme(t.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeThemeId === t.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs"
                style={{
                  backgroundColor: t.color,
                  border: t.border ? `1px solid ${t.border}` : "none",
                }}
              />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Phone Mockup Frame */}
      <div className="relative mx-auto w-[290px] sm:w-[320px] rounded-[42px] border-[8px] border-[#0F172A] bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 transition-transform duration-300 hover:scale-[1.01]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-[#0F172A] rounded-b-xl z-30 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-900 mr-2" />
          <div className="h-1.5 w-8 rounded-full bg-slate-800" />
        </div>

        {/* Screen Area with Dynamic Theme */}
        <div
          className="pt-7 pb-4 px-3.5 min-h-[540px] flex flex-col font-sans select-none transition-colors duration-300"
          style={{
            backgroundColor: theme.bg,
            backgroundImage: theme.bgGradient,
            color: theme.text,
          }}
        >
          {/* Profile Card Header */}
          <div className="flex flex-col items-center text-center mt-1 mb-3">
            <div className="relative">
              <div
                className="h-16 w-16 rounded-full border-2 shadow-md flex items-center justify-center text-white text-xl font-bold"
                style={{
                  backgroundColor: theme.button,
                  borderColor: theme.cardBorder,
                }}
              >
                N
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-0.5 rounded-full border border-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            </div>
            <h4
              className="font-extrabold text-sm mt-1.5 leading-tight"
              style={{ color: theme.text }}
            >
              Nando Pratama
            </h4>
            <p
              className="text-[10px] line-clamp-1 max-w-[220px]"
              style={{ color: theme.textSecondary }}
            >
              Sharing racun Shopee &amp; outfit harian terfavorit...
            </p>
          </div>

          {/* Banner Mini */}
          <div
            className="rounded-xl p-2 text-white text-left mb-2.5 shadow-xs"
            style={{
              backgroundColor: theme.button,
            }}
          >
            <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/20 px-1.5 py-0.5 rounded">
              PROMO SPESIAL
            </span>
            <p className="text-[10px] font-bold mt-1 leading-tight text-white">
              Diskon s.d 70% Tanggal Kembar!
            </p>
          </div>

          {/* Search bar */}
          <div className="relative mb-2">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: theme.textSecondary }}
            />
            <input
              type="text"
              placeholder="Ketik '3' untuk tes nomor..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full h-8 pl-8 pr-2 rounded-lg text-[11px] focus:outline-none focus:ring-1 shadow-2xs transition-all"
              style={{
                backgroundColor: theme.card,
                color: theme.text,
                border: `1px solid ${theme.cardBorder}`,
              }}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
            {["Semua", "Fashion", "Gadget", "Perawatan"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className="text-[9px] px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-all shadow-2xs"
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

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-[250px] pr-0.5 no-scrollbar">
            {filtered.length === 0 ? (
              <div
                className="col-span-2 text-center py-6 text-[10px]"
                style={{ color: theme.textSecondary }}
              >
                Produk tidak ditemukan
              </div>
            ) : (
              filtered.map((prod) => (
                <div
                  key={prod.number}
                  className={`rounded-xl p-1.5 transition-all shadow-2xs flex flex-col justify-between ${
                    searchVal.trim() === prod.number.toString()
                      ? "ring-2 ring-offset-1 scale-[1.02]"
                      : ""
                  }`}
                  style={{
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.cardBorder}`,
                  }}
                >
                  <div>
                    <div className="relative aspect-square rounded-lg bg-slate-100 mb-1 overflow-hidden">
                      <span
                        className="absolute top-1 left-1 text-[8px] font-extrabold px-1 rounded z-10 shadow-xs"
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
                        className="object-cover"
                      />
                    </div>
                    <p
                      className="text-[10px] font-semibold line-clamp-1 leading-tight"
                      style={{ color: theme.text }}
                    >
                      {prod.name}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-extrabold mt-1"
                      style={{ color: theme.button }}
                    >
                      {prod.price}
                    </p>
                    <div
                      className="mt-1 w-full text-[8px] font-bold py-1 rounded-md text-center flex items-center justify-center gap-0.5 shadow-2xs"
                      style={{
                        backgroundColor: theme.button,
                        color: theme.buttonText,
                      }}
                    >
                      <span>Beli</span>
                      <ExternalLink className="h-2 w-2" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="text-center mt-2 pt-2 border-t text-[9px]"
            style={{
              borderColor: theme.cardBorder,
              color: theme.textSecondary,
            }}
          >
            Dibuat dengan <span className="font-bold text-[#16A34A]">UdaLink</span>
          </div>
        </div>
      </div>
    </div>
  );
}
