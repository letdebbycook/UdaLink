"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";

interface ProductImageSliderProps {
  images: string[];
  alt: string;
  sizes?: string;
  className?: string;
  aspectClassName?: string;
  badge?: React.ReactNode;
}

export function ProductImageSlider({
  images,
  alt,
  sizes = "(max-width: 640px) 50vw, 25vw",
  className = "object-cover",
  aspectClassName = "relative w-full aspect-square bg-slate-100 overflow-hidden",
  badge,
}: ProductImageSliderProps) {
  // Saring URL gambar yang valid
  const validImages = (images || []).filter(
    (img) => typeof img === "string" && img.trim().length > 0
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  // Touch gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = validImages.length;

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
    },
    [total]
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
    },
    [total]
  );

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;

    // Minimum swipe threshold (40px)
    if (diff > 40 && total > 1) {
      // Swiped left -> next
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
    } else if (diff < -40 && total > 1) {
      // Swiped right -> prev
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  // Jika tidak ada gambar sama sekali
  if (total === 0 || failedImages.has(currentIndex)) {
    return (
      <div className={aspectClassName}>
        {badge}
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-300">
          <ShoppingBag className="h-8 w-8 text-slate-300 stroke-[1.5]" />
        </div>
      </div>
    );
  }

  // Jika hanya ada 1 gambar (tampilan reguler tanpa kontrol slider)
  if (total === 1) {
    return (
      <div className={aspectClassName}>
        {badge}
        <Image
          src={validImages[0]}
          alt={alt}
          fill
          sizes={sizes}
          className={`${className} transition-transform duration-300`}
          onError={() => handleError(0)}
        />
      </div>
    );
  }

  // Multi-gambar (dengan slider + swipe)
  return (
    <div
      className={`${aspectClassName} group/slider select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {badge}

      {/* Render gambar aktif */}
      {validImages.map((src, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={`${src}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
              isActive ? "opacity-100 z-0 pointer-events-auto" : "opacity-0 -z-10 pointer-events-none"
            }`}
          >
            <Image
              src={src}
              alt={`${alt} - Foto ${idx + 1}`}
              fill
              sizes={sizes}
              className={className}
              onError={() => handleError(idx)}
              priority={idx === 0}
            />
          </div>
        );
      })}

      {/* Tombol Panah Kiri (Desktop hover / Mobile tap) */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Foto Sebelumnya"
        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover/slider:opacity-100 transition-opacity shadow-sm backdrop-blur-xs"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Tombol Panah Kanan */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Foto Selanjutnya"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover/slider:opacity-100 transition-opacity shadow-sm backdrop-blur-xs"
      >
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Indicator Dots di bagian bawah */}
      <div className="absolute bottom-2 left-0 right-0 z-20 flex items-center justify-center gap-1.5 px-2 pointer-events-none">
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-auto">
          {validImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Lihat foto ${idx + 1}`}
              className={`rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? "w-3 h-1.5 bg-white shadow-2xs"
                  : "w-1.5 h-1.5 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Badge Jumlah Foto (misal 1/3) di pojok kanan atas */}
      <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs pointer-events-none">
        {currentIndex + 1}/{total}
      </div>
    </div>
  );
}
