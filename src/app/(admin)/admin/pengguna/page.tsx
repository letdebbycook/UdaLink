"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Users,
  Search,
  Star,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Shield,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pro" | "free" | "suspended" | "admin">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // State Modal Tambah Admin
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });

  // State Modal Konfirmasi Ganti Role
  const [roleModalUser, setRoleModalUser] = useState<{
    user: UserItem;
    nextRole: "admin" | "user";
  } | null>(null);

  const fetchUsers = async (query = "") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_search: query,
      });

      if (error) throw error;
      setUsers((data as unknown as UserItem[]) || []);
      setCurrentPage(1);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal memuat pengguna: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
    fetchUsers(search);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const filteredUsers = users.filter((u) => {
    if (statusFilter === "pro") return u.is_pro && !u.is_suspended;
    if (statusFilter === "free") return !u.is_pro && !u.is_suspended && u.role !== "admin";
    if (statusFilter === "suspended") return u.is_suspended;
    if (statusFilter === "admin") return u.role === "admin";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminForm((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    toast.info("Password acak kuat telah digenerate.");
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = adminForm.email.trim().toLowerCase();
    const cleanUsername = adminForm.username.trim().toLowerCase().replace(/^@/, "");
    const cleanDisplayName = adminForm.displayName.trim() || cleanUsername;
    const cleanPassword = adminForm.password;

    if (!cleanEmail || !cleanUsername || !cleanPassword) {
      toast.error("Email, username, dan password wajib diisi.");
      return;
    }

    if (cleanPassword.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }

    setSubmittingAdmin(true);
    try {
      const { error } = await supabase.rpc("admin_create_admin", {
        p_email: cleanEmail,
        p_password: cleanPassword,
        p_username: cleanUsername,
        p_display_name: cleanDisplayName,
      });

      if (error) throw error;

      toast.success(`Akun admin @${cleanUsername} (${cleanEmail}) berhasil dibuat!`);
      setShowAddAdminModal(false);
      setAdminForm({ email: "", username: "", displayName: "", password: "" });
      fetchUsers(search);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal membuat akun admin";
      toast.error(errorMsg);
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    const { user, nextRole } = roleModalUser;
    setActionLoading(user.id);
    try {
      const { error } = await supabase.rpc("admin_set_role", {
        p_user_id: user.id,
        p_role: nextRole,
      });

      if (error) throw error;

      toast.success(
        nextRole === "admin"
          ? `Pengguna @${user.username} berhasil diangkat menjadi Admin!`
          : `Akses admin @${user.username} telah dicabut.`
      );
      fetchUsers(search);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal mengubah hak akses";
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
      setRoleModalUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Kelola Pengguna
          </h1>
          <p className="text-sm text-[#64748B]">
            Cari affiliator, kelola status keanggotaan Pro, dan kendalikan akun admin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 sm:w-64">
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

          <Button
            onClick={() => setShowAddAdminModal(true)}
            size="sm"
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs gap-1.5 shrink-0 shadow-xs"
          >
            <UserPlus className="h-4 w-4 text-emerald-400" />
            <span>Tambah Admin</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: "all", label: `Semua (${users.length})` },
          { id: "admin", label: `Admin (${users.filter((u) => u.role === "admin").length})` },
          { id: "pro", label: `Pro Aktif (${users.filter((u) => u.is_pro && !u.is_suspended).length})` },
          { id: "free", label: `Gratis (${users.filter((u) => !u.is_pro && !u.is_suspended && u.role !== "admin").length})` },
          { id: "suspended", label: `Dinonaktifkan (${users.filter((u) => u.is_suspended).length})` },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setStatusFilter(item.id as typeof statusFilter);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === item.id
                ? "bg-[#16A34A] text-white shadow-2xs font-semibold"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Daftar Pengguna */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-2">
            <Users className="h-8 w-8 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-semibold text-[#0F172A]">Pengguna tidak ditemukan</p>
            <p className="text-xs text-[#64748B]">
              Coba gunakan kata kunci pencarian atau ganti filter status.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Card View untuk Mobile */}
          <div className="md:hidden space-y-3">
            {paginatedUsers.map((u) => {
              const isBusy = actionLoading === u.id;
              const isSelf = u.id === currentUserId;

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
                            <Badge className="bg-slate-900 text-white text-[9px] py-0 px-1.5 flex items-center gap-1">
                              <Shield className="h-2.5 w-2.5 text-emerald-400" />
                              <span>Admin</span>
                            </Badge>
                          )}
                          {isSelf && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 text-slate-500">
                              Anda
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

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Aksi Role Admin */}
                        {u.role === "admin" ? (
                          !isSelf && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRoleModalUser({ user: u, nextRole: "user" })}
                              disabled={isBusy}
                              className="h-8 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 min-h-[36px]"
                            >
                              Cabut Admin
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRoleModalUser({ user: u, nextRole: "admin" })}
                            disabled={isBusy}
                            className="h-8 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 min-h-[36px]"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Admin
                          </Button>
                        )}

                        {/* Aksi Pro */}
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

                        {/* Aksi Suspend */}
                        {!isSelf && (
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
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Table View untuk Desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
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
                  {paginatedUsers.map((u) => {
                    const isBusy = actionLoading === u.id;
                    const isSelf = u.id === currentUserId;

                    return (
                      <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold">{u.display_name}</span>
                            {u.role === "admin" && (
                              <Badge className="bg-slate-900 text-white text-[9px] py-0 px-1.5 flex items-center gap-1">
                                <Shield className="h-2.5 w-2.5 text-emerald-400" />
                                <span>Admin</span>
                              </Badge>
                            )}
                            {isSelf && (
                              <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 bg-slate-100 rounded">
                                (Anda)
                              </span>
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
                            {/* Link Etalase */}
                            <Link href={`/${u.username}`} target="_blank">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Buka Etalase">
                                <ExternalLink className="h-3.5 w-3.5 text-[#64748B]" />
                              </Button>
                            </Link>

                            {/* Tombol Role Admin */}
                            {u.role === "admin" ? (
                              !isSelf ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRoleModalUser({ user: u, nextRole: "user" })}
                                  disabled={isBusy}
                                  className="h-7 text-[11px] text-slate-700 border-slate-200 hover:bg-slate-50"
                                  title="Cabut wewenang admin"
                                >
                                  Cabut Admin
                                </Button>
                              ) : null
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRoleModalUser({ user: u, nextRole: "admin" })}
                                disabled={isBusy}
                                className="h-7 text-[11px] text-purple-700 border-purple-200 hover:bg-purple-50"
                                title="Jadikan pengguna sebagai admin"
                              >
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Jadi Admin
                              </Button>
                            )}

                            {/* Tombol Pro */}
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

                            {/* Tombol Tangguhkan */}
                            {!isSelf && (
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
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              Menampilkan{" "}
              <strong className="text-slate-900">
                {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-slate-900">
                {Math.min(currentPage * pageSize, filteredUsers.length)}
              </strong>{" "}
              dari <strong className="text-slate-900">{filteredUsers.length}</strong> pengguna
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </Button>
              <span className="px-2 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH AKUN ADMIN BARU */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Modal */}
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">
                    Tambah Akun Admin Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Akses kontrol penuh ke panel administrator UdaLink
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !submittingAdmin && setShowAddAdminModal(false)}
                disabled={submittingAdmin}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleCreateAdmin} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Email Admin <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="admin.baru@udalink.id"
                  required
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="text-xs h-9"
                  disabled={submittingAdmin}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                      @
                    </span>
                    <Input
                      type="text"
                      placeholder="admin_keuangan"
                      required
                      value={adminForm.username}
                      onChange={(e) =>
                        setAdminForm((prev) => ({
                          ...prev,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                        }))
                      }
                      className="text-xs h-9 pl-7 font-mono"
                      disabled={submittingAdmin}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Nama Lengkap
                  </label>
                  <Input
                    type="text"
                    placeholder="Admin Operasional"
                    value={adminForm.displayName}
                    onChange={(e) =>
                      setAdminForm((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    className="text-xs h-9"
                    disabled={submittingAdmin}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    disabled={submittingAdmin}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    required
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="text-xs h-9 pl-9 pr-9 font-mono"
                    disabled={submittingAdmin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Callout Keamanan */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Akun ini akan langsung berstatus <strong>Admin</strong> aktif dengan hak untuk verifikasi pembayaran, mengubah status paket user, serta mengubah pengaturan sistem.
                </p>
              </div>

              {/* Footer Tombol */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAdminModal(false)}
                  disabled={submittingAdmin}
                  className="text-xs h-9 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingAdmin}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs h-9 px-4 gap-1.5"
                >
                  {submittingAdmin ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Buat Akun Admin</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI UBAH ROLE */}
      <ConfirmModal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        onConfirm={handleConfirmRoleChange}
        title={
          roleModalUser?.nextRole === "admin"
            ? `Jadikan @${roleModalUser?.user.username} sebagai Admin?`
            : `Cabut Hak Akses Admin @${roleModalUser?.user.username}?`
        }
        description={
          roleModalUser?.nextRole === "admin"
            ? `Pengguna @${roleModalUser?.user.username} (${roleModalUser?.user.email}) akan mendapatkan wewenang penuh untuk mengakses seluruh menu panel admin.`
            : `Pengguna @${roleModalUser?.user.username} tidak akan bisa lagi mengakses panel admin dan kembali menjadi pengguna biasa.`
        }
        confirmText={
          roleModalUser?.nextRole === "admin"
            ? "Ya, Angkat Jadi Admin"
            : "Ya, Cabut Akses Admin"
        }
        variant={roleModalUser?.nextRole === "admin" ? "warning" : "danger"}
        loading={!!actionLoading}
      />
    </div>
  );
}
