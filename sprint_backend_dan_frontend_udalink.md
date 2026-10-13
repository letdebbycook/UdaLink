# Sprint Backend dan Frontend UdaLink

**Sprint Terpisah: Backend dan Frontend UdaLink**
Rencana 4 sprint x 1 minggu (±6 hari kerja per sprint) untuk tim 2 orang, disusun dari PRD UdaLink.

**Catatan pembagian beban:**
* Backend murni lebih ringan (satu `schema.sql` besar plus pengujian), sedangkan frontend jauh lebih berat (±20 halaman).
* Karena itu "Backend" di rencana ini mencakup database + lapisan integrasi (koneksi Supabase, auth, route guard) dan, di Sprint 3, 4 halaman admin (karena dialah yang paling paham RPC-nya).
* Beban tiap sprint sudah diseimbangkan, tetapi Sprint 3 frontend tetap paling padat.

---

## Rencana Sprint BACKEND

**Lingkup:** Supabase (tabel, trigger, RPC, RLS, Storage, Auth), integrasi ke aplikasi, dan keamanan aturan paket.

### BE Sprint 1: Fondasi database (Tahap 2)
**Goal:** `supabase/schema.sql` jalan penuh di Supabase dengan RLS aktif di semua tabel.

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| BE1.1 | Buat project Supabase, ambil URL dan anon key, `.env.example` (bersama FE) | 0.5 |
| BE1.2 | 8 tabel sesuai PRD, constraint (aturan username + kata terlarang, panjang teks, https://, unik per pengguna), index clicks, index unik bersyarat satu payments pending | 1.5 |
| BE1.3 | Trigger: pendaftaran (isi profiles + memberships dengan payment_code acak 1-999), nomor produk otomatis (security definer), `updated_at` | 0.5 |
| BE1.4 | Fungsi: `is_admin()`, `is_pro()`, `can_add_product()`, `is_username_available()` | 0.5 |
| BE1.5 | RLS + policy semua tabel (profiles, memberships, categories, products, banners, clicks, payments, app_settings) | 1.5 |
| BE1.6 | 4 bucket (avatars, product-images, banners, payment-proofs) + policy folder `{user_id}/`, seed `app_settings` | 0.5 |

**Selesai bila:** 8 tabel + 4 bucket tampil, semua bertanda RLS aktif; daftar akun uji menghasilkan baris profiles dan memberships otomatis; produk ke-1 dan ke-2 mendapat nomor #1 dan #2.

### BE Sprint 2: RPC publik, auth, dan integrasi (Tahap 3+4+5)
**Goal:** FE bisa memakai data asli dan login berfungsi.

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| BE2.1 | `get_public_page` dengan semua aturan (Gratis: produk terbaru dibatasi, tema premium jadi hijau, tanpa banner/unggulan, show_branding; Pro: maks 6 unggulan, 3 banner; username tidak ada atau dinonaktifkan mengembalikan kosong) | 1.5 |
| BE2.2 | `record_click`, `get_my_stats` (rentang dibatasi 7 untuk Gratis), `get_my_plan` | 1.25 |
| BE2.3 | `supabase/seed-dev.sql`: akun uji, 12 produk, 4 kategori, 2 banner (agar FE bisa jalan sebelum CRUD produk selesai) | 0.25 |
| BE2.4 | `lib/supabase.ts`, atur Auth (matikan konfirmasi email saat dev), SQL jadikan akun admin | 0.5 |
| BE2.5 | Middleware: `/dashboard` hanya login, `/admin` hanya admin, pesan akun dinonaktifkan | 0.5 |
| BE2.6 | Sambungkan form Daftar/Masuk/Lupa/Atur ulang password dan halaman Akun (UI dari FE) | 1.5 |
| BE2.7 | Uji RLS dengan dua akun: tidak bisa baca/ubah data akun lain, `category_id` harus milik sendiri, batas Gratis ditolak database, akun nonaktif ditolak | 0.75 |

**Serah-terima ke FE:** `get_public_page`, `record_click`, seed, dan Auth siap paling lambat hari ke-3.
**Selesai bila:** `free_product_limit` diubah jadi 3 lalu produk ke-4 ditolak database (bukan hanya tombolnya); klik tercatat lewat `record_click`; `/admin` mengalihkan non-admin.

### BE Sprint 3: Pembayaran dan admin (Tahap 6+7)
**Goal:** alur Pro dari pengajuan sampai persetujuan berjalan, dan halaman admin siap.

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| BE3.1 | `submit_payment` (amount = harga + payment_code dan duration_days dihitung di database, tolak jika sudah ada pending) | 0.5 |
| BE3.2 | `admin_review_payment` (pro_until = greatest (now(), pro_until) + durasi, tolak wajib alasan, isi `reviewed_at`) | 0.75 |
| BE3.3 | `admin_dashboard_stats`, `admin_list_users` | 0.75 |
| BE3.4 | `admin_set_pro` (0 = cabut), `admin_set_suspended`; semua awal cek `is_admin()` | 0.25 |
| BE3.5 | RLS banner dan bucket banners khusus Pro, cek perilaku saat Pro habis | 0.5 |
| BE3.6 | Akses bukti transfer: pengguna hanya miliknya, admin via signed URL | 0.25 |
| BE3.7 | Uji alur pembayaran lewat SQL (setuju, tolak, perpanjang saat masih Pro) | 0.5 |
| BE3.8 | Halaman admin (UI + data): `/admin`, `/admin/pembayaran` (dialog bukti), `/admin/pengguna`, `/admin/pengaturan` | 3 |

**Selesai bila:** akun biasa menjadi "Pro aktif sampai [tanggal]" setelah disetujui; fungsi `admin_*` tidak bisa dipanggil dari akun non-admin.

### BE Sprint 4: Keamanan, konfigurasi produksi, rilis (Tahap 8)
**Goal:** aturan paket terbukti ditegakkan di database, dan konfigurasi produksi benar.

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| BE4.1 | Matriks uji keamanan: anonim, Gratis, Pro, Pro kedaluwarsa, admin, akun nonaktif, terhadap setiap tabel, RPC, dan bucket | 2 |
| BE4.2 | Perbaiki temuan, gabungkan menjadi `schema.sql` final + file update per tahap | 1 |
| BE4.3 | Cek index dan kecepatan clicks dan `get_public_page` | 0.5 |
| BE4.4 | Site URL dan Redirect URLs ke alamat Vercel, nyalakan lagi konfirmasi email, putuskan SMTP sendiri | 0.5 |
| BE4.5 | README bagian Supabase dan cara menjadikan akun admin | 0.5 |
| BE4.6 | Env Vercel (anon key saja, tidak ada service_role), dukung deploy dan uji bersama FE | 1 |

**Selesai bila:** tidak ada `service_role` di kode; semua aturan di bagian 10 PRD lolos uji.

---

## Rencana Sprint FRONTEND

**Lingkup:** Next.js, Tailwind, shadcn/ui, semua halaman bagian 7 dan panduan tampilan bagian 8 PRD.

### FE Sprint 1: Kerangka dan etalase (Tahap 1)
**Goal:** kerangka tampil rapi dan etalase contoh berfungsi, tanpa menunggu database.

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| FE1.1 | Next.js (App Router, TS), Tailwind, shadcn/ui, lucide-react, Plus Jakarta Sans, warna hijau #16A34A (bersama BE) | 0.5 |
| FE1.2 | `lib/dummy-data.ts` (1 affiliator, 12 produk, 4 kategori, 2 banner) dan `lib/themes.ts` (3 dasar + 5 premium) | 0.5 |
| FE1.3 | Layout: auth, dashboard (sidebar desktop + menu bawah 5 item di HP), admin (sidebar gelap #0F172A) | 1.5 |
| FE1.4 | Landing: hero, mockup HP dari komponen, 3 langkah, fitur, tabel Gratis vs Pro, FAQ accordion | 1.5 |
| FE1.5 | Etalase `/nando`: lebar maks 480px, pencarian menempel (angka = nomor persis tampil paling atas dan disorot), chip kategori, grid 2 kolom, 404 | 1.5 |
| FE1.6 | UI Daftar, Masuk, Lupa password, Atur ulang password (belum tersambung) | 0.5 |

**Selesai bila:** ketik "3" di `/nando`, produk #3 muncul paling atas; semua layout rapi di 375px.

### FE Sprint 2: Produk, kategori, etalase asli (Tahap 4+5)
**Goal:** affiliator mengelola produk dan statistik dengan data asli.

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| FE2.1 | `/dashboard/produk`: tabel desktop dan kartu HP, cari, filter kategori, switch tampil, indikator kuota "12 dari 30", tombol tambah nonaktif saat penuh | 1 |
| FE2.2 | Form produk (baru dan edit): upload dengan pratinjau + browser-image-compression (WebP, 1080px, ±300 KB, maks 5 MB), validasi react-hook-form + zod, deteksi marketplace dari link, switch unggulan terkunci untuk Gratis | 1.75 |
| FE2.3 | `/dashboard/kategori`: tambah, ubah nama, urutkan, hapus | 1 |
| FE2.4 | Etalase `/[username]` memakai `get_public_page` + halaman "Halaman tidak tersedia" | 0.75 |
| FE2.5 | `/go/[id]`: spinner, `record_click`, `window.location.replace`, pesan jika produk disembunyikan | 0.5 |
| FE2.6 | `/dashboard/statistik` (7/30 hari, 30 terkunci untuk Gratis) dan `/dashboard` (kartu link, 3 kartu angka, 5 terlaris, checklist awal) | 1.5 |

**Dependensi:** butuh `get_public_page` dan seed dari BE2.1/BE2.3 (hari ke-3). Sebelumnya kerjakan FE2.1-2.3 dengan data contoh.
**Selesai bila:** tambah 3 produk dengan foto lalu nomornya #1 sampai #3; klik "Beli" mengalihkan ke Shopee dan klik bertambah di statistik.

### FE Sprint 3: Tampilan dan langganan (Tahap 6+7)
**Goal:** kustomisasi etalase lengkap dan halaman langganan Pro. (Halaman admin dikerjakan di BE Sprint 3.)

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| FE3.1 | `/dashboard/tampilan`: dua kolom, tab Profil (upload avatar, nama, bio) | 1 |
| FE3.2 | Tab Tema (8 tema, premium berikon gembok untuk Gratis) dan tab Sosial & WA | 1 |
| FE3.3 | Tab Banner (maks 3, judul, link, urutan, aktif) dan Unggulan (maks 6), label "Khusus Pro" + tombol Upgrade | 2 |
| FE3.4 | Pratinjau HP langsung (dialog di HP), etalase menampilkan WA mengambang dan footer branding sesuai paket | 1 |
| FE3.5 | `/dashboard/langganan`: status, kartu perbandingan, "Transfer tepat Rp 29.137" dengan kode unik + tombol salin, form bukti, riwayat berbadge, pesan saat pending | 1.5 |
| FE3.6 | Banner pengingat 3 hari sebelum Pro habis | 0.25 |

**Risiko:** sprint paling padat (±6,75 hari). Jika meleset, kerjakan urutan banner di FE3.3 paling akhir, atau kurangi tema premium dari 5 jadi 2.
**Selesai bila:** ganti tema dan foto profil, pratinjau dan etalase ikut berubah; isi lalu kosongkan `pro_until`, banner dan unggulan muncul lalu hilang.

### FE Sprint 4: Poles dan rilis (Tahap 8)
**Goal:** semua halaman nyaman di HP dan lengkap kondisi tampilannya.

| ID | Tugas | Hari |
| :--- | :--- | :--- |
| FE4.1 | Cek 375px dan desktop di semua halaman (termasuk admin) | 2 |
| FE4.2 | Skeleton loading, keadaan kosong, pesan error Bahasa Indonesia, toast simpan/hapus, konfirmasi hapus, tombol nonaktif saat menyimpan | 2 |
| FE4.3 | Landing: harga dari `app_settings`, judul tab, favicon ikon link hijau, 404 final, format Rupiah dan tanggal Indonesia | 1 |
| FE4.4 | Deploy Vercel dan uji dari HP bersama BE (daftar, tambah produk, "Beli" membuka Shopee, lupa password) | 1 |

**Selesai bila:** seluruh skenario uji Tahap 8 di PRD lolos dari HP.

---

## Titik serah-terima BE ke FE

| Sprint BE harus siap | FE mulai integrasi |
| :--- | :--- |
| `get_public_page`, `record_click`, seed, Auth: hari ke-3 (Sprint 2) | Hari ke-4 |
| Aturan Pro untuk banner/bucket, `get_my_plan`, `submit_payment`: hari ke-2 (Sprint 3) | Hari ke-3 |
| Semua RPC final dan konfigurasi Supabase produksi: hari ke-2 (Sprint 4) | Deploy bersama |

## Aturan bersama

* **BE adalah pemilik tunggal `schema.sql`.**
    * Nama tabel, kolom, fungsi, bucket, dan URL tidak diubah sepihak.
* PR saling direview, dan `npm run build` harus lolos sebelum merge.
* Jika sprint meleset, potong tema premium dan banner lebih dulu. Jangan potong RLS, `record_click`, alur pembayaran, dan matriks uji BE4.1.