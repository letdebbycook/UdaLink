"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, LogOut, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  icon?: "logout" | "trash" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  loading = false,
  icon = "warning",
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      cancelButtonRef.current?.focus();
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="relative z-[100]"
      aria-labelledby="confirm-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs motion-safe:transition-opacity motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
          <div className="relative transform overflow-hidden rounded-2xl bg-white p-5 sm:p-6 text-left shadow-2xl border border-slate-100 w-full max-w-md my-auto motion-safe:transition-all motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200">
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  variant === "danger"
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}
              >
                {icon === "logout" ? (
                  <LogOut className="w-5 h-5" />
                ) : icon === "trash" ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <h3
                  id="confirm-modal-title"
                  className="text-base font-bold text-[#0F172A] leading-snug"
                >
                  {title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>

              <button
                onClick={onClose}
                disabled={loading}
                aria-label="Tutup dialog konfirmasi"
                className="text-slate-400 hover:text-slate-600 rounded-lg transition-colors -mr-2 -mt-2 cursor-pointer h-11 w-11 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <Button
                ref={cancelButtonRef}
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto text-xs sm:text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 min-h-[44px] h-11 px-4 rounded-xl cursor-pointer"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`w-full sm:w-auto text-xs sm:text-sm font-semibold min-h-[44px] h-11 px-4 rounded-xl shadow-xs cursor-pointer ${
                  variant === "danger"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-[#15803D] hover:bg-[#166534] text-white"
                }`}
              >
                {loading ? "Memproses..." : confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
