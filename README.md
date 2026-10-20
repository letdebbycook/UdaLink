# UdaLink: Platform "Link di Bio" Khusus Affiliator

UdaLink adalah aplikasi etalase tautan bio untuk affiliator Shopee, TikTok Shop, Tokopedia, dan Lazada. Penonton video cukup mencari atau mengetik nomor produk (misal: `#23`) dan langsung diarahkan ke tautan affiliate dengan pencatatan metrik klik otomatis.

---

## Tech Stack

- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Lucide Icons, Plus Jakarta Sans.
- **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, Supabase Storage).
- **Libraries:** `@supabase/ssr`, `@supabase/supabase-js`, `react-hook-form`, `zod`, `date-fns` (id), `sonner`, `browser-image-compression`.
- **Deployment:** Vercel (Frontend) + Supabase Cloud (Backend).

---

## Panduan Setup Lokal

### 1. Prasyarat Sistem
- Node.js versi LTS (`v20` atau `v22` disarankan)
- npm / pnpm / yarn
- Akun Supabase di [supabase.com](https://supabase.com)

### 2. Kloning & Instalasi
```bash
git clone https://github.com/letdebbycook/UdaLink.git
cd UdaLink
npm install
```

### 3. Konfigurasi Environment Variables
Salin file template `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Buka `.env.local` dan isi kunci API Supabase dari **Project Settings -> API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

> [!WARNING]
> **Keamanan Kunci:** Jangan pernah memasukkan `service_role key` ke dalam `.env.local` atau kode client. Seluruh operasi client di UdaLink dilindungi oleh Row Level Security (RLS) menggunakan `anon key`.

---

## Setup Database & Supabase

1. **Jalankan Skema Database:**
   * Buka **Supabase Dashboard** -> **SQL Editor** -> buat query baru.
   * Salin seluruh isi file [supabase/schema.sql](supabase/schema.sql) dan klik **Run**.
   * Skema ini mencakup 8 tabel utama, RLS policies, storage bucket policies, triggers, dan seluruh fungsi RPC.

2. **(Opsional) Isi Data Dummy untuk Pengujian:**
   * Buka query baru di SQL Editor, salin isi file [supabase/seed-dev.sql](supabase/seed-dev.sql), lalu klik **Run**.
   * Ini akan membuat affiliator contoh `@nando` dengan 4 kategori, 12 produk (#1 s/d #12), dan 2 banner.

3. **Matikan Konfirmasi Email untuk Development:**
   * Buka **Authentication** -> **Providers** -> **Email**.
   * Nonaktifkan toggle **Confirm email** agar user baru bisa langsung login saat testing lokal.

### Sign in with Google (Opsional)

Login Google memakai flow OAuth PKCE bawaan Supabase. Callback berada di `/auth/callback` dan sudah termasuk validasi bahwa email akun Google terverifikasi.

1. Di Google Cloud Console ([console.cloud.google.com](https://console.cloud.google.com)), buat kredensial **OAuth client ID** tipe *Web application*:
   - **Authorized JavaScript origins:** `http://localhost:3000` dan domain produksi Anda.
   - **Authorized redirect URIs:** `https://<project-ref>.supabase.co/auth/v1/callback` (lihat nilai persisnya di Supabase Dashboard → Authentication → Providers → Google).
2. Di Supabase Dashboard (**Authentication → Providers → Google**), aktifkan provider dan tempel **Client ID** serta **Client Secret**.
3. Pastikan **Redirect URLs** di **Authentication → URL Configuration** memuat `http://localhost:3000/**` dan domain produksi Anda.
4. Tidak ada environment variable tambahan; konfigurasi Google sepenuhnya di sisi Supabase.

Fitur terkait role & langganan:

- Pengguna dengan `memberships.role = 'admin'` otomatis diarahkan ke panel admin setelah login.
- Menu dan halaman **Statistik** hanya tersedia untuk pengguna Pro (`pro_until` aktif). Pengguna Free yang membuka `/dashboard/statistik` langsung dialihkan ke halaman Langganan oleh pemeriksaan di sisi server (`src/proxy.ts` dan gate di `src/app/(dashboard)/dashboard/statistik/page.tsx`).

---

## Konfigurasi Akun Admin

Setelah mendaftar akun baru melalui antarmuka aplikasi di `/daftar`, buka **SQL Editor** di Supabase dan jalankan query berikut:

```sql
UPDATE public.memberships 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_ANDA@gmail.com');
```

Setelah query dieksekusi, akun Anda akan memiliki hak akses penuh ke rute `/admin`, `/admin/pembayaran`, `/admin/pengguna`, dan `/admin/pengaturan`.

---

## Pengujian & Verifikasi

### 1. Verifikasi Koneksi API & Storage
```bash
node supabase/tests/verify-api.js
```

### 2. Verifikasi Matriks Keamanan RLS
Jalankan file pengujian SQL di Supabase SQL Editor:
- `supabase/tests/test-sprint-1.sql` (Verifikasi tabel, RLS, dan storage)
- `supabase/tests/test-sprint-2.sql` (Verifikasi RPC etalase publik dan klik)
- `supabase/tests/test-sprint-2-rls.sql` (Verifikasi isolasi tenant & kuota gratis)
- `supabase/tests/test-sprint-3.sql` (Verifikasi alur pembayaran Pro & admin)
- `supabase/tests/test-sprint-4-security-matrix.sql` (Audit 6 persona keamanan)

### 3. Build Produksi
Pastikan aplikasi lulus type check dan build:
```bash
npm run build
```

---

## Panduan Deployment ke Vercel

1. Hubungkan repository GitHub ini ke Vercel.
2. Tambahkan Environment Variables di Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Di Supabase Dashboard (**Authentication -> URL Configuration**):
   - Atur **Site URL** ke domain Vercel Anda (contoh: `https://udalink.vercel.app`).
   - Tambahkan **Redirect URLs**:
     - `https://udalink.vercel.app/**`
     - `http://localhost:3000/**` (untuk pengujian lokal).
