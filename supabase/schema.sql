-- ==============================================================================
-- UDALINK DATABASE SCHEMA (SPRINT 1)
-- ==============================================================================
-- Idempotent script for Supabase PostgreSQL
-- Mengikuti PRD Bagian 7, 9, 10, dan Sprint BE 1.1 - BE 1.6
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABEL-TABEL UTAMA (8 TABEL)
-- ==============================================================================

-- 2.1 TABEL profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    theme TEXT NOT NULL DEFAULT 'hijau',
    whatsapp TEXT,
    instagram TEXT,
    tiktok TEXT,
    youtube TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_username_format CHECK (username ~ '^[a-z0-9_]{3,30}$'),
    CONSTRAINT chk_profiles_username_reserved CHECK (
        username NOT IN (
            'admin', 'dashboard', 'daftar', 'masuk', 'go', 'api', 'udalink',
            'bantuan', 'tentang', 'harga', 'syarat', 'privasi', 'login', 'register', 'akun'
        )
    ),
    CONSTRAINT chk_profiles_display_name_length CHECK (char_length(display_name) <= 50),
    CONSTRAINT chk_profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 160),
    CONSTRAINT chk_profiles_whatsapp_format CHECK (whatsapp IS NULL OR whatsapp ~ '^62[0-9]+$'),
    CONSTRAINT chk_profiles_instagram CHECK (instagram IS NULL OR instagram !~ '^@'),
    CONSTRAINT chk_profiles_tiktok CHECK (tiktok IS NULL OR tiktok !~ '^@')
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles (lower(username));

-- 2.2 TABEL memberships
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    pro_until TIMESTAMPTZ,
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    payment_code INTEGER NOT NULL CHECK (payment_code BETWEEN 1 AND 999),
    last_product_number INTEGER NOT NULL DEFAULT 0 CHECK (last_product_number >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 TABEL categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) <= 30),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_categories_user_name UNIQUE (user_id, name)
);

-- 2.4 TABEL products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    number INTEGER NOT NULL CHECK (number > 0),
    name TEXT NOT NULL CHECK (char_length(name) <= 100),
    price INTEGER CHECK (price IS NULL OR price >= 0),
    image_url TEXT,
    affiliate_url TEXT NOT NULL CHECK (affiliate_url ~ '^https://'),
    marketplace TEXT NOT NULL DEFAULT 'shopee' CHECK (marketplace IN ('shopee', 'tiktok', 'tokopedia', 'lazada', 'lainnya')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_products_user_number UNIQUE (user_id, number)
);

-- 2.5 TABEL banners
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title TEXT,
    link_url TEXT CHECK (link_url IS NULL OR link_url ~ '^https://'),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 TABEL clicks
CREATE TABLE IF NOT EXISTS public.clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes untuk tabel clicks
CREATE INDEX IF NOT EXISTS idx_clicks_owner_created ON public.clicks (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_product_created ON public.clicks (product_id, created_at DESC);

-- 2.7 TABEL payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    sender_name TEXT NOT NULL,
    sender_bank TEXT NOT NULL,
    proof_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index unik bersyarat: satu pengguna hanya boleh punya satu pembayaran berstatus pending
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_pending_per_user 
    ON public.payments (user_id) 
    WHERE status = 'pending';

-- 2.8 TABEL app_settings (selalu 1 baris)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    pro_price INTEGER NOT NULL DEFAULT 29000,
    pro_duration_days INTEGER NOT NULL DEFAULT 30,
    free_product_limit INTEGER NOT NULL DEFAULT 30,
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    admin_whatsapp TEXT NOT NULL CHECK (admin_whatsapp ~ '^62[0-9]+$'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed awal baris app_settings jika belum ada
INSERT INTO public.app_settings (
    id, pro_price, pro_duration_days, free_product_limit,
    bank_name, bank_account_number, bank_account_name, admin_whatsapp
) VALUES (
    1, 29000, 30, 30,
    'BCA', '1234567890', 'PT UdaLink Media Nusantara', '628123456789'
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. FUNGSI DATABASE & HELPER RPC (SECURITY DEFINER)
-- ==============================================================================

-- 3.1 Fungsi is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = auth.uid()
          AND role = 'admin'
          AND is_suspended = false
    );
$$;

-- 3.2 Fungsi is_pro(uid uuid)
CREATE OR REPLACE FUNCTION public.is_pro(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = uid
          AND pro_until IS NOT NULL
          AND pro_until > now()
          AND is_suspended = false
    );
$$;

-- 3.3 Fungsi can_add_product()
-- Rule: true jika Pro, atau jumlah produk pengguna masih di bawah free_product_limit, dan akun tidak dinonaktifkan
CREATE OR REPLACE FUNCTION public.can_add_product()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_suspended BOOLEAN;
    v_pro_until TIMESTAMPTZ;
    v_free_limit INTEGER;
    v_current_count INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT is_suspended, pro_until
    INTO v_is_suspended, v_pro_until
    FROM public.memberships
    WHERE user_id = v_user_id;

    IF NOT FOUND OR v_is_suspended IS TRUE THEN
        RETURN false;
    END IF;

    -- Jika Pro aktif, unlimited product
    IF v_pro_until IS NOT NULL AND v_pro_until > now() THEN
        RETURN true;
    END IF;

    -- Jika Gratis, cek kuota terhadap app_settings.free_product_limit
    SELECT free_product_limit INTO v_free_limit FROM public.app_settings WHERE id = 1;
    IF v_free_limit IS NULL THEN
        v_free_limit := 30;
    END IF;

    SELECT count(*) INTO v_current_count FROM public.products WHERE user_id = v_user_id;

    RETURN v_current_count < v_free_limit;
END;
$$;

-- 3.4 Fungsi is_username_available(p_username text)
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_user TEXT := lower(trim(p_username));
BEGIN
    -- Validasi format (3-30 karakter, a-z, 0-9, _)
    IF v_clean_user !~ '^[a-z0-9_]{3,30}$' THEN
        RETURN false;
    END IF;

    -- Validasi reserved keywords
    IF v_clean_user IN (
        'admin', 'dashboard', 'daftar', 'masuk', 'go', 'api', 'udalink',
        'bantuan', 'tentang', 'harga', 'syarat', 'privasi', 'login', 'register', 'akun'
    ) THEN
        RETURN false;
    END IF;

    -- Cek ketersediaan di tabel profiles
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE lower(username) = v_clean_user
    );
END;
$$;

-- Hak akses eksekusi fungsi RPC
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pro(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_add_product() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;


-- ==============================================================================
-- 4. TRIGGER OTOMATISASI
-- ==============================================================================

-- 4.1 Trigger pendaftaran pengguna (auth.users -> profiles & memberships)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_username TEXT;
    v_username TEXT;
    v_display_name TEXT;
    v_payment_code INTEGER;
BEGIN
    v_raw_username := lower(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')));

    -- Jika username kosong atau tidak valid, generate username fallback yang aman
    IF v_raw_username ~ '^[a-z0-9_]{3,30}$' AND v_raw_username NOT IN (
        'admin', 'dashboard', 'daftar', 'masuk', 'go', 'api', 'udalink',
        'bantuan', 'tentang', 'harga', 'syarat', 'privasi', 'login', 'register', 'akun'
    ) AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = v_raw_username) THEN
        v_username := v_raw_username;
    ELSE
        v_username := 'user_' || substr(md5(NEW.id::text || clock_timestamp()::text), 1, 8);
    END IF;

    v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', v_username);
    IF char_length(v_display_name) > 50 THEN
        v_display_name := substr(v_display_name, 1, 50);
    END IF;

    -- Buat kode pembayaran unik 1-999 secara acak
    v_payment_code := floor(random() * 999 + 1)::integer;

    -- 1. Buat baris profiles
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (NEW.id, v_username, v_display_name)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Buat baris memberships
    INSERT INTO public.memberships (user_id, role, payment_code, last_product_number)
    VALUES (NEW.id, 'user', v_payment_code, 0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.2 Trigger nomor produk otomatis (sebelum simpan produk baru)
CREATE OR REPLACE FUNCTION public.handle_product_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_next_num INTEGER;
BEGIN
    -- Naikkan memberships.last_product_number milik pengguna sebanyak 1
    UPDATE public.memberships
    SET last_product_number = last_product_number + 1
    WHERE user_id = NEW.user_id
    RETURNING last_product_number INTO v_next_num;

    IF v_next_num IS NULL THEN
        RAISE EXCEPTION 'Membership tidak ditemukan untuk user_id: %', NEW.user_id;
    END IF;

    NEW.number := v_next_num;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_product_number ON public.products;
CREATE TRIGGER trg_set_product_number
    BEFORE INSERT ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_product_number();

-- 4.3 Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================

-- Aktifkan RLS di semua 8 tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 5.1 POLICIES: profiles
-- Pemilik membaca profil miliknya (pengunjung publik membaca via RPC get_public_page di Sprint 2)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Pemilik mengubah profil jika akun tidak disuspend
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    )
    WITH CHECK (
        auth.uid() = id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    );

-- 5.2 POLICIES: memberships
-- Pemilik atau admin bisa membaca membership miliknya
DROP POLICY IF EXISTS "memberships_select_own_or_admin" ON public.memberships;
CREATE POLICY "memberships_select_own_or_admin" ON public.memberships
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Perubahan membership hanya lewat trigger & RPC security definer admin (tidak ada insert/update/delete langsung)

-- 5.3 POLICIES: categories
DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
CREATE POLICY "categories_select_own" ON public.categories
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    );

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    );

DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own" ON public.categories
    FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    );

-- 5.4 POLICIES: products
DROP POLICY IF EXISTS "products_select_own" ON public.products;
CREATE POLICY "products_select_own" ON public.products
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND public.can_add_product() = true
        AND (
            category_id IS NULL OR EXISTS (
                SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
        AND (
            category_id IS NULL OR EXISTS (
                SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own" ON public.products
    FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    );

-- 5.5 POLICIES: banners
DROP POLICY IF EXISTS "banners_select_own" ON public.banners;
CREATE POLICY "banners_select_own" ON public.banners
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Banner hanya boleh ditambah/diubah oleh pengguna Pro dan tidak disuspend
DROP POLICY IF EXISTS "banners_insert_pro" ON public.banners;
CREATE POLICY "banners_insert_pro" ON public.banners
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND public.is_pro(auth.uid()) = true
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    );

DROP POLICY IF EXISTS "banners_update_pro" ON public.banners;
CREATE POLICY "banners_update_pro" ON public.banners
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id
        AND public.is_pro(auth.uid()) = true
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        AND public.is_pro(auth.uid()) = true
        AND NOT EXISTS (
            SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND is_suspended = true
        )
    );

DROP POLICY IF EXISTS "banners_delete_own" ON public.banners;
CREATE POLICY "banners_delete_own" ON public.banners
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 5.6 POLICIES: clicks
-- Pemilik bisa membaca data klik produk miliknya
DROP POLICY IF EXISTS "clicks_select_own" ON public.clicks;
CREATE POLICY "clicks_select_own" ON public.clicks
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id);

-- Insert klik hanya lewat RPC record_click (Sprint 2)

-- 5.7 POLICIES: payments
-- Pemilik bisa melihat pembayaran miliknya; Admin bisa melihat semua
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;
CREATE POLICY "payments_select_own_or_admin" ON public.payments
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Insert hanya lewat submit_payment; Update hanya lewat admin_review_payment

-- 5.8 POLICIES: app_settings
-- Semua orang (termasuk anonim/pengunjung) boleh membaca pengaturan
DROP POLICY IF EXISTS "app_settings_select_all" ON public.app_settings;
CREATE POLICY "app_settings_select_all" ON public.app_settings
    FOR SELECT TO anon, authenticated
    USING (true);

-- Hanya admin yang boleh mengubah pengaturan aplikasi
DROP POLICY IF EXISTS "app_settings_update_admin" ON public.app_settings;
CREATE POLICY "app_settings_update_admin" ON public.app_settings
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Hak akses schema dan tabel publik
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ==============================================================================
-- 6. STORAGE BUCKETS & POLICIES
-- ==============================================================================

-- 6.1 Daftarkan 4 Buckets di Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 6.2 Storage Policies: avatars (Public read, owner upload/update/delete di folder {user_id}/)
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6.3 Storage Policies: product-images (Public read, owner upload/update/delete di folder {user_id}/)
DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
CREATE POLICY "product_images_public_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_owner_insert" ON storage.objects;
CREATE POLICY "product_images_owner_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "product_images_owner_update" ON storage.objects;
CREATE POLICY "product_images_owner_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'product-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "product_images_owner_delete" ON storage.objects;
CREATE POLICY "product_images_owner_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'product-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6.4 Storage Policies: banners (Public read, Pro user upload/update/delete di folder {user_id}/)
DROP POLICY IF EXISTS "banners_public_select" ON storage.objects;
CREATE POLICY "banners_public_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_pro_insert" ON storage.objects;
CREATE POLICY "banners_pro_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'banners' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND public.is_pro(auth.uid()) = true
    );

DROP POLICY IF EXISTS "banners_pro_update" ON storage.objects;
CREATE POLICY "banners_pro_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'banners' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND public.is_pro(auth.uid()) = true
    );

DROP POLICY IF EXISTS "banners_owner_delete" ON storage.objects;
CREATE POLICY "banners_owner_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'banners' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6.5 Storage Policies: payment-proofs (Private bucket: owner atau admin select, owner insert di folder {user_id}/)
DROP POLICY IF EXISTS "payment_proofs_select_owner_or_admin" ON storage.objects;
CREATE POLICY "payment_proofs_select_owner_or_admin" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'payment-proofs' 
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_admin() = true
        )
    );

DROP POLICY IF EXISTS "payment_proofs_owner_insert" ON storage.objects;
CREATE POLICY "payment_proofs_owner_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'payment-proofs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
