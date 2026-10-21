"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Loader2, CropIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  imageSrc: string;
  onComplete: (croppedBlob: Blob, croppedDataUrl: string) => void;
  onCancel: () => void;
  /** Crop aspect ratio, e.g. 1 for square, 16/9 for banner. Defaults to 1. */
  aspect?: number;
  /** Title shown in the modal header. Defaults to "Crop Foto". */
  title?: string;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<{ blob: Blob; dataUrl: string }> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = pixelCrop.width;
    offCanvas.height = pixelCrop.height;
    const offCtx = offCanvas.getContext("2d")!;
    offCtx.translate(pixelCrop.width / 2, pixelCrop.height / 2);
    offCtx.rotate(rad);
    offCtx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      -pixelCrop.width / 2,
      -pixelCrop.height / 2,
      pixelCrop.width,
      pixelCrop.height
    );
    ctx.drawImage(offCanvas, 0, 0);
  } else {
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
        resolve({ blob, dataUrl: canvas.toDataURL("image/webp", 0.9) });
      },
      "image/webp",
      0.9
    );
  });
}

export function ImageCropModal({ imageSrc, onComplete, onCancel, aspect = 1, title = "Crop Foto" }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, cropped: Area) => {
    setCroppedAreaPixels(cropped);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const { blob, dataUrl } = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onComplete(blob, dataUrl);
    } catch {
      // silently fail — caller handles error
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CropIcon className="w-4 h-4 text-[#16A34A]" />
            <span className="text-sm font-bold text-[#0F172A]">{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative w-full bg-slate-900" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: { border: "2px solid #16A34A" },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-3 space-y-3 bg-slate-50 border-t border-slate-100">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#16A34A] h-1.5 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-500 w-9 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotate */}
          <div className="flex items-center gap-3">
            <RotateCw className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 accent-[#16A34A] h-1.5 cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-500 w-9 text-right">
              {rotation}°
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-9 text-xs"
            disabled={processing}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-9 text-xs bg-[#16A34A] hover:bg-[#15803D] text-white"
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Memproses...
              </>
            ) : (
              <>
                <CropIcon className="h-3.5 w-3.5 mr-1.5" />
                Gunakan Foto Ini
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
