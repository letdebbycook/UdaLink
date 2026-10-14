"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, ExternalLink, Check } from "lucide-react";

export function PhoneMockup() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchVal, setSearchVal] = useState("");

  const sampleProducts = [
    { number: 1, name: "Kemeja Linen Oversized", price: "Rp 139.000", category: "Fashion" },
    { number: 3, name: "Keyboard Wireless 75%", price: "Rp 499.000", category: "Gadget" },
    { number: 6, name: "Serum Niacinamide 10%", price: "Rp 89.000", category: "Perawatan" },
    { number: 11, name: "Stand Laptop Aluminium", price: "Rp 82.000", category: "Gadget" },
    { number: 5, name: "Celana Cargo Wide Leg", price: "Rp 179.000", category: "Fashion" },
    { number: 8, name: "Sunscreen SPF 50+", price: "Rp 65.000", category: "Perawatan" },
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

  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px] rounded-[40px] border-[8px] border-[#0F172A] bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-[#0F172A] rounded-b-xl z-30 flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-slate-900 mr-2" />
        <div className="h-1.5 w-8 rounded-full bg-slate-800" />
      </div>

      {/* Screen Area */}
      <div className="pt-7 pb-4 px-3.5 bg-[#F0FDF4] min-h-[540px] text-[#0F172A] flex flex-col font-sans select-none">
        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center mt-1 mb-3">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-[#16A34A] border-2 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">
              N
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-0.5 rounded-full border border-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
          </div>
          <h4 className="font-bold text-sm text-[#0F172A] mt-1.5 leading-tight">
            Nando Pratama
          </h4>
          <p className="text-[10px] text-[#64748B] line-clamp-1 max-w-[220px]">
            Sharing racun shopee &amp; outfit harian terfavorit...
          </p>
        </div>

        {/* Banner Mini */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-2 text-white text-left mb-2.5 shadow-xs">
          <span className="text-[8px] uppercase tracking-wider font-bold bg-white/20 px-1.5 py-0.5 rounded">
            PROMO
          </span>
          <p className="text-[10px] font-bold mt-1 leading-tight">
            Diskon s.d 70% Tanggal Kembar!
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Ketik '3' untuk tes nomor..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full h-8 pl-7 pr-2 rounded-lg bg-white border border-[#DCFCE7] text-[11px] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
          {["Semua", "Fashion", "Gadget", "Perawatan"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`text-[9px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                activeTab === cat
                  ? "bg-[#16A34A] text-white"
                  : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#16A34A]/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-[250px] pr-0.5">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-[10px] text-[#64748B]">
              Produk tidak ditemukan
            </div>
          ) : (
            filtered.map((prod) => (
              <div
                key={prod.number}
                className={`bg-white rounded-xl p-1.5 border transition-all ${
                  searchVal.trim() === prod.number.toString()
                    ? "border-[#16A34A] ring-2 ring-[#16A34A]/20 shadow-sm"
                    : "border-[#E2E8F0]"
                }`}
              >
                <div className="relative aspect-square rounded-lg bg-slate-100 mb-1 flex items-center justify-center overflow-hidden">
                  <span className="absolute top-1 left-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded">
                    #{prod.number}
                  </span>
                  <ShoppingBag className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-[10px] font-medium text-[#0F172A] line-clamp-1 leading-tight">
                  {prod.name}
                </p>
                <p className="text-[10px] font-bold text-[#16A34A] mt-0.5">
                  {prod.price}
                </p>
                <div className="mt-1 w-full bg-[#16A34A] text-white text-[8px] font-bold py-1 rounded text-center flex items-center justify-center gap-0.5">
                  <span>Beli</span>
                  <ExternalLink className="h-2 w-2" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-2 pt-2 border-t border-[#DCFCE7]/60 text-[9px] text-[#64748B]">
          Dibuat dengan <span className="font-bold text-[#16A34A]">UdaLink</span>
        </div>
      </div>
    </div>
  );
}

