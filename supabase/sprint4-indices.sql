-- ==============================================================================
-- SPRINT 4 — INDEKS PERFORMA TAMBAHAN (BE4.1)
-- ==============================================================================
-- Jalankan di Supabase SQL Editor setelah sprint3-rpc-apply.sql
-- Semua idempotent (CREATE INDEX IF NOT EXISTS)
-- ==============================================================================

-- products: kueri dominan filter per user + aktif + featured
CREATE INDEX IF NOT EXISTS idx_products_user_active
    ON public.products (user_id, is_active, is_featured);

CREATE INDEX IF NOT EXISTS idx_products_user_category
    ON public.products (user_id, category_id);

CREATE INDEX IF NOT EXISTS idx_products_user_created
    ON public.products (user_id, created_at DESC);

-- banners: kueri dominan filter per user + aktif + sort
CREATE INDEX IF NOT EXISTS idx_banners_user_active_sort
    ON public.banners (user_id, is_active, sort_order);

-- categories: kueri dominan filter per user + sort
CREATE INDEX IF NOT EXISTS idx_categories_user_sort
    ON public.categories (user_id, sort_order);

-- memberships: kueri is_pro() dan cek suspended
CREATE INDEX IF NOT EXISTS idx_memberships_pro_until
    ON public.memberships (pro_until)
    WHERE pro_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_suspended
    ON public.memberships (user_id, is_suspended);

-- payments: kueri admin list payments by status
CREATE INDEX IF NOT EXISTS idx_payments_status_created
    ON public.payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_user_status
    ON public.payments (user_id, status);

-- clicks: kueri statistik per hari (sudah ada idx_clicks_owner_created)
-- tambahkan untuk range tanggal agar get_my_stats lebih cepat
CREATE INDEX IF NOT EXISTS idx_clicks_owner_product_created
    ON public.clicks (owner_id, product_id, created_at DESC);

-- profiles: full-text search untuk admin_list_users
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower
    ON public.profiles (lower(display_name));

-- Verifikasi indeks berhasil dibuat
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('products', 'banners', 'categories', 'memberships', 'payments', 'clicks', 'profiles')
ORDER BY tablename, indexname;
