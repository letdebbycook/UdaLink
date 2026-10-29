"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Layers, Plus, Trash2, Edit2, ArrowUp, ArrowDown,
  Loader2, Check, AlertCircle, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/types/database";

interface CategoryWithCount extends Category {
  product_count?: number;
}

export default function KategoriPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form tambah kategori
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Edit kategori
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Hapus kategori modal state
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil kategori
      const { data: catData, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (catErr) throw catErr;

      // Hitung jumlah produk per kategori
      const { data: prodData } = await supabase
        .from("products")
        .select("category_id")
        .eq("user_id", user.id);

      const countMap: Record<string, number> = {};
      if (prodData) {
        for (const p of prodData) {
          if (p.category_id) {
            countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
          }
        }
      }

      const merged = (catData || []).map((cat) => ({
        ...cat,
        product_count: countMap[cat.id] || 0,
      }));

      setCategories(merged);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat kategori";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (newName.trim().length > 30) {
      toast.error("Nama kategori maksimal 30 karakter");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi");

      const maxSort = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);

      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: newName.trim(),
          sort_order: maxSort + 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Kategori "${newName.trim()}" berhasil dibuat`);
      setNewName("");
      setIsAdding(false);
      loadCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah kategori");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateName(id: string) {
    if (!editName.trim()) return;
    if (editName.trim().length > 30) {
      toast.error("Nama kategori maksimal 30 karakter");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("categories")
        .update({ name: editName.trim() })
        .eq("id", id);

      if (error) throw error;

      toast.success("Nama kategori berhasil diperbarui");
      setEditingId(null);
      loadCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah kategori");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(category: CategoryWithCount) {
    setCategoryToDelete(category);
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;
    try {
      setIsDeletingCategory(true);
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryToDelete.id);

      if (error) throw error;

      toast.success(`Kategori "${categoryToDelete.name}" berhasil dihapus`);
      setCategoryToDelete(null);
      loadCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori");
    } finally {
      setIsDeletingCategory(false);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];

    try {
      setSaving(true);
      // Tukar sort_order
      const newCurrentSort = targetCat.sort_order === currentCat.sort_order
        ? (direction === "up" ? currentCat.sort_order - 1 : currentCat.sort_order + 1)
        : targetCat.sort_order;
      const newTargetSort = currentCat.sort_order;

      const [res1, res2] = await Promise.all([
        supabase
          .from("categories")
          .update({ sort_order: newCurrentSort })
          .eq("id", currentCat.id),
        supabase
          .from("categories")
          .update({ sort_order: newTargetSort })
          .eq("id", targetCat.id),
      ]);

      if (res1.error || res2.error) {
        throw new Error(res1.error?.message || res2.error?.message || "Gagal mengubah urutan kategori");
      }

      await loadCategories();
    } catch (err: unknown) {
      toast.error("Gagal mengubah urutan kategori");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Kelola Kategori
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Kelompokkan produkmu agar pengunjung etalase mudah menemukan apa yang dicari.
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Form Tambah Kategori */}
      {isAdding && (
        <Card className="border-[#16A34A]/30 bg-emerald-50/40">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="font-semibold text-sm text-[#0F172A] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#16A34A]" />
                Kategori Baru
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Misal: Fashion Wanita, Elektronik, Skincare"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={30}
                  autoFocus
                  required
                  className="bg-white"
                />
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="submit"
                    disabled={saving || !newName.trim()}
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setNewName("");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List Kategori */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mb-3" />
          <p className="text-sm">Memuat daftar kategori...</p>
        </div>
      ) : categories.length === 0 ? (
        <Card className="border-dashed border-2 border-[#CBD5E1]">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-[#64748B]">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#0F172A]">Belum Ada Kategori</h3>
            <p className="text-sm text-[#64748B] max-w-sm mx-auto mt-1 mb-5">
              Buat kategori pertama untuk memudahkan pembeli menyaring produk di tokomu.
            </p>
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Buat Kategori Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, index) => (
            <Card
              key={cat.id}
              className="border-[#E2E8F0] hover:border-slate-300 transition-shadow shadow-xs"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {editingId === cat.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={30}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateName(cat.id)}
                      disabled={saving || !editName.trim()}
                      className="bg-[#16A34A] text-white"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#0F172A] truncate">
                          {cat.name}
                        </span>
                        <Badge variant="outline" className="text-xs text-slate-500 font-normal">
                          {cat.product_count || 0} produk
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tombol aksi */}
                {editingId !== cat.id && (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0 || saving}
                      onClick={() => handleMove(index, "up")}
                      title="Geser ke atas"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === categories.length - 1 || saving}
                      onClick={() => handleMove(index, "down")}
                      title="Geser ke bawah"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                      }}
                      title="Ubah nama"
                      className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cat)}
                      title="Hapus"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modern Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => {
          if (!isDeletingCategory) setCategoryToDelete(null);
        }}
        onConfirm={confirmDeleteCategory}
        title={`Hapus Kategori "${categoryToDelete?.name}"`}
        description={
          (categoryToDelete?.product_count || 0) > 0
            ? `Kategori ini memiliki ${categoryToDelete?.product_count} produk. Produk-produk tersebut tidak akan terhapus, namun tidak lagi berkategori. Lanjutkan?`
            : `Apakah kamu yakin ingin menghapus kategori "${categoryToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={isDeletingCategory}
        icon="trash"
        variant="danger"
      />
    </div>
  );
}
