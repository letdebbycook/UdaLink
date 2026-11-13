# Dokumen Rencana Pengujian White Box — UdaLink

| Atribut | Nilai |
|---|---|
| Produk | UdaLink — katalog etalase & bio link afiliator |
| Stack | Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth + Storage) |
| Metode | White Box Testing (structural) |
| Basis kode | Working tree `D:\magang\task\projek internal\udalink` per 13 November 2026 |
| Environment uji | Supabase CLI lokal (Postgres 15+) untuk DB/RLS, Vitest + jsdom untuk TS/React, staging project untuk smoke |
| Pemilik dokumen | QA Automation & Security Engineering |
| Status | Dieksekusi Sebagian (Defect Kritis P0/S1 Selesai Diperbaiki) |

> **Prinsip dokumen ini:** setiap kasus uji mengacu ke baris kode yang benar-benar ada. Selisih antara spesifikasi produk dan implementasi dicatat sebagai defect pada Bab 8, bukan diuji sebagai fitur yang tidak ada. Nomor baris merujuk kondisi kode saat dokumen disusun; verifikasi ulang setelah ada perubahan.

---

## 0. Ringkasan eksekutif

Dari pembacaan kode, ada tiga risiko struktural yang membuat pengujian black box (laporan QA yang sudah ada) tidak cukup:

1. **Definisi fungsi database tidak tunggal.** `get_my_plan()` punya tiga versi berbeda di tiga file migrasi (`schema.sql`, `bugfix-qa-complete.sql`, `bugfix-security-and-limits.sql`) dengan perilaku berbeda: satu menyertakan generator `payment_code`, satu menyertakan `effective_theme`, satu tidak menyertakan `payment_methods`. Hasil uji bergantung pada file mana yang terakhir dijalankan.
2. **Ada dua signature `submit_payment`.** `sprint3-rpc-apply.sql` membuat versi 3 parameter; `schema.sql` membuat versi 4 parameter dengan default. Jika keduanya hidup, pemanggilan dengan tiga named argument berpotensi menghasilkan `PGRST203 ambiguous function`, dan fallback di klien memanggil bentuk yang sama sehingga tidak menyelamatkan.
3. **Harness pengujian yang ada memberi false confidence.** `supabase/tests/test-sprint-2-rls.sql:38` menguji kuota dengan `SELECT count(*) < limit FROM products`, bukan dengan memanggil `can_add_product()`. Karena test berjalan sebagai superuser tanpa JWT, `auth.uid()` bernilai `NULL` sehingga fungsi asli justru selalu `false`. Tidak satu pun test lama memverifikasi RLS.

Dokumen ini menutup celah tersebut dengan 191 kasus uji terstruktur, target branch coverage 100% pada jalur finansial/auth/kuota, dan harness yang mengimpor kode nyata (bukan menyalin logikanya).

---

## 1. Ruang lingkup dan batasan

### 1.1 In scope

| Modul | Artefak | Jenis pengujian |
|---|---|---|
| RPC paket & kuota | `get_my_plan`, `can_add_product`, `is_pro`, `is_admin` | basis path, condition, data flow, boundary |
| State machine pembayaran | `submit_payment`, `admin_review_payment` | state transition, basis path, concurrency |
| Row Level Security | `products`, `categories`, `payments`, `app_settings`, `memberships`, storage buckets | decision (USING true/false), negative testing |
| Route handler scraping | `src/app/api/products/scrape-images/route.ts` | basis path, exception, loop, security |
| Route handler import | `src/app/api/products/import-image/route.ts` | boundary, exception, data flow |
| State frontend langganan | `src/app/(dashboard)/dashboard/langganan/page.tsx` | branch, data flow `Promise.all`, condition |
| State frontend tampilan | `src/app/(dashboard)/dashboard/tampilan/page.tsx` | branch, sanitasi regex, lifecycle effect |
| Middleware/proxy | `src/proxy.ts` | decision table, path traversal, fail-open analysis |

---

## 8. Status Perbaikan Defect Kritis (P0 / S1)

| ID Defect | Deskripsi Temuan Awal | Status | File & Solusi Implementasi |
|---|---|---|---|
| **S1-01** | SSRF: `scrape-images` mengambil URL apa pun (loopback, metadata cloud, IP privat) | **RESOLVED** | `src/app/api/products/scrape-images/route.ts`: Ditambahkan validasi `isPrivateIpOrHost`, whitelist domain marketplace resmi (Shopee, Tokopedia, TikTok, Lazada, Blibli, Bukalapak), serta safe redirect handler manual (maks 3 hops). |
| **S1-02** | `get_my_plan` inkonsisten antar skema | **RESOLVED** | `supabase/schema.sql` & `supabase/patch-p0-defects.sql`: Dibuat fungsi kanonik dengan `DROP FUNCTION IF EXISTS`, generator persisten `payment_code`, dan pemuatan `payment_methods`. |
| **S1-03** | Ambiguitas signature `submit_payment` (`PGRST203`) | **RESOLVED** | `supabase/patch-p0-defects.sql`: Dilakukan `DROP FUNCTION IF EXISTS public.submit_payment(text, text, text)` dan distandarisasi ke versi 4 parameter. Di `langganan/page.tsx`, fallback ambigu dihilangkan. |
| **S1-04** | `proxy.ts` fail-open saat data membership null | **RESOLVED** | `src/proxy.ts`: Menggunakan `.maybeSingle()`. Jika membership null/tidak ditemukan, request ke `/dashboard` otomatis dialihkan (*fail-closed*) ke `/masuk?error=membership_not_found`. |
| **S1-05** | Fallback rekening dummy `1234567890` saat admin menonaktifkan seluruh metode | **RESOLVED** | `src/app/(dashboard)/dashboard/langganan/page.tsx`: Dihapus rekening hardcoded palsu. Jika seluruh metode nonaktif, sistem menampilkan banner peringatan dan menonaktifkan form kirim bukti. |
| **S1-06** | Pass-through bypass saat env Supabase tidak diset | **RESOLVED** | `src/proxy.ts`: Rute privat `/dashboard/*` dan `/admin/*` memblokir akses (status 500) jika konfigurasi kredensial belum tersedia di server. |

