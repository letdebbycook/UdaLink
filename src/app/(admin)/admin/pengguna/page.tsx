"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Users,
  Search,
  Star,
  Ban,
  CheckCircle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UserItem {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: "user" | "admin";
  is_pro: boolean;
  pro_until: string | null;
  is_suspended: boolean;
  product_count: number;
  created_at: string;
}

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async (query = "") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_search: query,
      });

      if (error) throw error;
      setUsers((data as unknown as UserItem[]) || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal memuat pengguna: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleTogglePro = async (user: UserItem, givePro: boolean) => {
    setActionLoading(user.id);
    try {
      const days = givePro ? 30 : 0;
      const { error } = await supabase.rpc("admin_set_pro", {
        p_user_id: user.id,
        p_days: days,
      });

      if (error) throw error;

      toast.success(
        givePro
          ? `Berhasil memberikan paket Pro (+30 hari) ke @${user.username}`
          : `Paket Pro @${user.username} telah dicabut.`
      );
      fetchUsers(search);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal mengubah status Pro";
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (user: UserItem) => {
    const nextState = !user.is_suspended;
    setActionLoading(user.id);
    try {
      const { error } = await supabase.rpc("admin_set_suspended", {
        p_user_id: user.id,
        p_value: nextState,
      });

      if (error) throw error;

      toast.success(
        nextState
          ? `Akun @${user.username} berhasil dinonaktifkan.`
          : `Akun @${user.username} telah diaktifkan kembali.`
      );
      fetchUsers(search);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal mengubah status akun";
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Kelola Pengguna
          </h1>
          <p className="text-sm text-[#64748B]">
            Cari affiliator, kelola status keanggotaan Pro, dan kendalikan akses akun.
          </p>
        </div>

        {/* Form Pencarian */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Cari username atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="text-xs">
            Cari
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-2">
            <Users className="h-8 w-8 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-semibold text-[#0F172A]">Pengguna tidak ditemukan</p>
            <p className="text-xs text-[#64748B]">
              Coba gunakan kata kunci pencarian yang lain.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Mobile Card View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {users.map((u) => {
              const isBusy = actionLoading === u.id;
              return (
                <Card key={u.id} className="border-[#E2E8F0] shadow-xs bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-[#0F172A] truncate">
                            {u.display_name}
                          </span>
                          {u.role === "admin" && (
                            <Badge className="bg-slate-900 text-white text-[9px] py-0 px-1.5">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-[#94A3B8] font-mono">
                          @{u.username} • {u.email}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {u.is_suspended ? (
                          <Badge className="bg-red-100 text-red-800 text-[10px]">Nonaktif</Badge>
                        ) : u.is_pro ? (
                          <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1 text-[10px]">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>Pro Aktif</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[#64748B] text-[10px]">Gratis</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-[#64748B]">
                      <span>Koleksi: <strong className="text-[#0F172A]">{u.product_count}</strong> produk</span>
                      <span className="text-[11px]">
                        Daftar: {format(new Date(u.created_at), "dd MMM yyyy", { locale: localeId })}
                      </span>
                    </div>

                    {u.is_pro && u.pro_until && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        Masa aktif Pro s/d {format(new Date(u.pro_until), "dd MMM yyyy", { locale: localeId })}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
                      <Link href={`/${u.username}`} target="_blank">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 min-h-[36px]">
                          <ExternalLink className="h-3.5 w-3.5 text-[#64748B]" />
                          <span>Etalase</span>
                        </Button>
                      </Link>

                      <div className="flex items-center gap-1.5">
                        {u.is_pro ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePro(u, false)}
                            disabled={isBusy}
                            className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 min-h-[36px]"
                          >
                            Cabut Pro
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePro(u, true)}
                            disabled={isBusy}
                            className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 min-h-[36px]"
                          >
                            +30 Hari Pro
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleSuspend(u)}
                          disabled={isBusy}
                          className={`h-8 text-xs min-h-[36px] ${
                            u.is_suspended
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {u.is_suspended ? "Aktifkan" : "Tangguhkan"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Pengguna</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Produk</th>
                    <th className="py-3 px-4 font-semibold">Status Paket</th>
                    <th className="py-3 px-4 font-semibold">Terdaftar</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {users.map((u) => {
                    const isBusy = actionLoading === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{u.display_name}</span>
                            {u.role === "admin" && (
                              <Badge className="bg-slate-900 text-white text-[9px] py-0 px-1.5">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-[#94A3B8] font-mono">@{u.username}</div>
                        </td>

                        <td className="py-3.5 px-4 text-[#64748B]">
                          {u.email}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                          {u.product_count} produk
                        </td>

                        <td className="py-3.5 px-4">
                          {u.is_suspended ? (
                            <Badge className="bg-red-100 text-red-800">Nonaktif</Badge>
                          ) : u.is_pro ? (
                            <div className="space-y-0.5">
                              <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                <span>Pro Aktif</span>
                              </Badge>
                              {u.pro_until && (
                                <p className="text-[10px] text-[#64748B]">
                                  s/d {format(new Date(u.pro_until), "dd MMM yyyy", { locale: localeId })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[#64748B]">Gratis</Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                          {format(new Date(u.created_at), "dd MMM yyyy", { locale: localeId })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Lihat Etalase */}
                            <Link href={`/${u.username}`} target="_blank">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Buka Etalase">
                                <ExternalLink className="h-3.5 w-3.5 text-[#64748B]" />
                              </Button>
                            </Link>

                            {/* Tombol Beri / Cabut Pro */}
                            {u.is_pro ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTogglePro(u, false)}
                                disabled={isBusy}
                                className="h-7 text-[11px] text-amber-700 border-amber-200 hover:bg-amber-50"
                              >
                                Cabut Pro
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTogglePro(u, true)}
                                disabled={isBusy}
                                className="h-7 text-[11px] text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              >
                                +30 Hari Pro
                              </Button>
                            )}

                            {/* Tombol Suspend / Unsuspend */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleSuspend(u)}
                              disabled={isBusy}
                              className={`h-7 text-[11px] ${
                                u.is_suspended
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {u.is_suspended ? "Aktifkan" : "Tangguhkan"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
