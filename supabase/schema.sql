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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
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
    v_candidate TEXT;
    v_display_name TEXT;
    v_payment_code INTEGER;
    v_google_email TEXT := NULLIF(NEW.email, '');
BEGIN
    -- Prioritas 1: username eksplisit dari pendaftaran
    v_raw_username := lower(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')));

    -- Jika tidak ada (mis. sign-up via Google), turunkan dari email:
    -- ambil bagian sebelum @, buang alias setelah tanda plus,
    -- lalu hapus karakter non-alfanumerik (titik, strip, dsb.)
    IF COALESCE(v_raw_username, '') = '' AND v_google_email IS NOT NULL THEN
        v_raw_username := split_part(lower(v_google_email), '@', 1);
        v_raw_username := split_part(v_raw_username, '+', 1);
        v_raw_username := regexp_replace(v_raw_username, '[^a-z0-9_]', '', 'g');
        v_raw_username := substr(v_raw_username, 1, 30);
    END IF;

    v_raw_username := lower(trim(COALESCE(v_raw_username, '')));

    v_username := NULL;

    IF v_raw_username ~ '^[a-z0-9_]{1,30}$' AND v_raw_username NOT IN (
        'admin', 'dashboard', 'daftar', 'masuk', 'go', 'api', 'udalink',
        'bantuan', 'tentang', 'harga', 'syarat', 'privasi', 'login', 'register', 'akun'
    ) THEN
        -- Username minimum 3 karakter; dasar pendek diberi prefiks user_
        IF char_length(v_raw_username) < 3 THEN
            v_raw_username := 'user_' || v_raw_username;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = v_raw_username) THEN
            v_username := v_raw_username;
        ELSE
            -- Sudah dipakai: tambah akhiran angka (mis. namapengguna2) hingga tersedia
            FOR i IN 2..99 LOOP
                v_candidate := substr(v_raw_username, 1, 30 - char_length(i::text)) || i;
                EXIT WHEN NOT EXISTS (
                    SELECT 1 FROM public.profiles WHERE lower(username) = v_candidate
                );
            END LOOP;

            IF v_candidate IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM public.profiles WHERE lower(username) = v_candidate
            ) THEN
                v_username := v_candidate;
            END IF;
        END IF;
    END IF;

    -- Fallback terakhir: username acak yang aman
    IF v_username IS NULL THEN
        v_username := 'user_' || substr(md5(NEW.id::text || clock_timestamp()::text), 1, 8);
    END IF;

    -- Display name: metadata pendaftaran, lalu nama dari email, lalu nama Google
    v_display_name := COALESCE(
        NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'display_name', '')), ''),
        NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')), ''),
        NULLIF(trim(v_raw_username), ''),
        NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
        NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'name', '')), ''),
        v_username
    );
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

-- 4.4 Trigger normalisasi nomor WhatsApp admin pada app_settings
CREATE OR REPLACE FUNCTION public.handle_normalize_admin_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cleaned TEXT;
BEGIN
    IF NEW.admin_whatsapp IS NOT NULL THEN
        v_cleaned := regexp_replace(NEW.admin_whatsapp, '[^0-9]', '', 'g');
        IF v_cleaned LIKE '08%' THEN
            v_cleaned := '62' || substr(v_cleaned, 2);
        END IF;
        NEW.admin_whatsapp := v_cleaned;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_admin_whatsapp ON public.app_settings;
CREATE TRIGGER trg_normalize_admin_whatsapp
    BEFORE INSERT OR UPDATE OF admin_whatsapp ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_normalize_admin_whatsapp();


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
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_admin());


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

-- ==============================================================================
-- 7. FUNGSI DATABASE (RPC) PUBLIK & AFFILIATOR (SPRINT 2)
-- ==============================================================================

-- 7.1 record_click(p_product_id uuid)
CREATE OR REPLACE FUNCTION public.record_click(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product RECORD;
    v_is_suspended BOOLEAN;
BEGIN
    SELECT p.id, p.user_id, p.affiliate_url, p.marketplace, p.is_active, m.is_suspended
    INTO v_product
    FROM public.products p
    JOIN public.memberships m ON m.user_id = p.user_id
    WHERE p.id = p_product_id;

    IF NOT FOUND OR v_product.is_active IS NOT TRUE OR v_product.is_suspended IS TRUE THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.clicks (product_id, owner_id)
    VALUES (v_product.id, v_product.user_id);

    RETURN jsonb_build_object(
        'affiliate_url', v_product.affiliate_url,
        'marketplace', v_product.marketplace
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_click(UUID) TO anon, authenticated;

-- 7.2 get_public_page(p_username text)
CREATE OR REPLACE FUNCTION public.get_public_page(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_user TEXT := lower(trim(p_username));
    v_user RECORD;
    v_is_pro BOOLEAN;
    v_effective_theme TEXT;
    v_show_branding BOOLEAN;
    v_free_limit INTEGER;
    v_profile JSONB;
    v_categories JSONB;
    v_banners JSONB := '[]'::jsonb;
    v_featured_products JSONB := '[]'::jsonb;
    v_products JSONB := '[]'::jsonb;
BEGIN
    SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.theme,
           p.whatsapp, p.instagram, p.tiktok, p.youtube,
           m.pro_until, m.is_suspended
    INTO v_user
    FROM public.profiles p
    JOIN public.memberships m ON m.user_id = p.id
    WHERE lower(p.username) = v_clean_user;

    IF NOT FOUND OR v_user.is_suspended IS TRUE THEN
        RETURN NULL;
    END IF;

    v_is_pro := (v_user.pro_until IS NOT NULL AND v_user.pro_until > now());

    IF v_is_pro THEN
        v_effective_theme := COALESCE(v_user.theme, 'hijau');
        v_show_branding := false;
    ELSE
        IF v_user.theme IN ('pink-pastel', 'biru-laut', 'oranye-hangat', 'ungu-malam', 'krem-minimalis') THEN
            v_effective_theme := 'hijau';
        ELSE
            v_effective_theme := COALESCE(v_user.theme, 'hijau');
        END IF;
        v_show_branding := true;
    END IF;

    v_profile := jsonb_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'display_name', v_user.display_name,
        'bio', v_user.bio,
        'avatar_url', v_user.avatar_url,
        'whatsapp', v_user.whatsapp,
        'instagram', v_user.instagram,
        'tiktok', v_user.tiktok,
        'youtube', v_user.youtube
    );

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'sort_order', c.sort_order
        ) ORDER BY c.sort_order ASC, c.created_at ASC
    ), '[]'::jsonb)
    INTO v_categories
    FROM public.categories c
    WHERE c.user_id = v_user.id;

    IF v_is_pro THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', b.id,
                'image_url', b.image_url,
                'title', b.title,
                'link_url', b.link_url,
                'sort_order', b.sort_order
            ) ORDER BY b.sort_order ASC, b.created_at ASC
        ), '[]'::jsonb)
        INTO v_banners
        FROM (
            SELECT * FROM public.banners
            WHERE user_id = v_user.id AND is_active = true
            ORDER BY sort_order ASC, created_at ASC
            LIMIT 3
        ) b;
    END IF;

    IF v_is_pro THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'number', p.number,
                'name', p.name,
                'price', p.price,
                'image_url', p.image_url,
                'marketplace', p.marketplace,
                'category_id', p.category_id,
                'is_featured', p.is_featured
            ) ORDER BY p.number DESC
        ), '[]'::jsonb)
        INTO v_products
        FROM public.products p
        WHERE p.user_id = v_user.id AND p.is_active = true;

        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'number', p.number,
                'name', p.name,
                'price', p.price,
                'image_url', p.image_url,
                'marketplace', p.marketplace,
                'category_id', p.category_id
            ) ORDER BY p.number DESC
        ), '[]'::jsonb)
        INTO v_featured_products
        FROM (
            SELECT * FROM public.products
            WHERE user_id = v_user.id AND is_active = true AND is_featured = true
            ORDER BY number DESC
            LIMIT 6
        ) p;
    ELSE
        SELECT free_product_limit INTO v_free_limit FROM public.app_settings WHERE id = 1;
        IF v_free_limit IS NULL THEN v_free_limit := 30; END IF;

        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'number', p.number,
                'name', p.name,
                'price', p.price,
                'image_url', p.image_url,
                'marketplace', p.marketplace,
                'category_id', p.category_id,
                'is_featured', false
            ) ORDER BY p.number DESC
        ), '[]'::jsonb)
        INTO v_products
        FROM (
            SELECT * FROM public.products
            WHERE user_id = v_user.id AND is_active = true
            ORDER BY number DESC
            LIMIT v_free_limit
        ) p;
    END IF;

    RETURN jsonb_build_object(
        'profile', v_profile,
        'effective_theme', v_effective_theme,
        'show_branding', v_show_branding,
        'is_pro', v_is_pro,
        'categories', v_categories,
        'banners', v_banners,
        'featured_products', v_featured_products,
        'products', v_products
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_page(TEXT) TO anon, authenticated;

-- 7.3 get_my_stats(p_days int)
CREATE OR REPLACE FUNCTION public.get_my_stats(p_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_pro BOOLEAN;
    v_allowed_days INTEGER;
    v_start_time TIMESTAMPTZ;
    v_total_clicks BIGINT;
    v_top_products JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: user belum login';
    END IF;

    v_is_pro := public.is_pro(v_user_id);

    IF v_is_pro THEN
        v_allowed_days := LEAST(GREATEST(COALESCE(p_days, 30), 1), 30);
    ELSE
        v_allowed_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 7);
    END IF;

    v_start_time := now() - (v_allowed_days || ' days')::interval;

    SELECT count(*) INTO v_total_clicks
    FROM public.clicks
    WHERE owner_id = v_user_id AND created_at >= v_start_time;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_id', p.id,
            'number', p.number,
            'name', p.name,
            'marketplace', p.marketplace,
            'price', p.price,
            'image_url', p.image_url,
            'click_count', COALESCE(c.clicks, 0)
        ) ORDER BY COALESCE(c.clicks, 0) DESC, p.number DESC
    ), '[]'::jsonb)
    INTO v_top_products
    FROM public.products p
    LEFT JOIN (
        SELECT product_id, count(*) AS clicks
        FROM public.clicks
        WHERE owner_id = v_user_id AND created_at >= v_start_time
        GROUP BY product_id
    ) c ON c.product_id = p.id
    WHERE p.user_id = v_user_id;

    RETURN jsonb_build_object(
        'days', v_allowed_days,
        'is_pro', v_is_pro,
        'total_clicks', v_total_clicks,
        'products_stats', v_top_products
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_stats(INTEGER) TO authenticated;

-- 7.4 get_my_plan()
CREATE OR REPLACE FUNCTION public.get_my_plan()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_membership RECORD;
    v_settings RECORD;
    v_product_count INTEGER;
    v_is_pro BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: user belum login';
    END IF;

    SELECT role, pro_until, is_suspended, payment_code
    INTO v_membership
    FROM public.memberships
    WHERE user_id = v_user_id;

    SELECT pro_price, pro_duration_days, free_product_limit,
           bank_name, bank_account_number, bank_account_name, admin_whatsapp
    INTO v_settings
    FROM public.app_settings
    WHERE id = 1;

    SELECT count(*) INTO v_product_count
    FROM public.products
    WHERE user_id = v_user_id;

    v_is_pro := (v_membership.pro_until IS NOT NULL AND v_membership.pro_until > now());

    RETURN jsonb_build_object(
        'role', v_membership.role,
        'is_pro', v_is_pro,
        'pro_until', v_membership.pro_until,
        'is_suspended', v_membership.is_suspended,
        'payment_code', v_membership.payment_code,
        'product_count', v_product_count,
        'free_product_limit', v_settings.free_product_limit,
        'pro_price', v_settings.pro_price,
        'pro_duration_days', v_settings.pro_duration_days,
        'bank_name', v_settings.bank_name,
        'bank_account_number', v_settings.bank_account_number,
        'bank_account_name', v_settings.bank_account_name,
        'admin_whatsapp', v_settings.admin_whatsapp
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_plan() TO authenticated;

-- ==============================================================================
-- 8. FUNGSI DATABASE (RPC) PEMBAYARAN & PANEL ADMIN (SPRINT 3)
-- ==============================================================================

-- 8.1 submit_payment
CREATE OR REPLACE FUNCTION public.submit_payment(
    p_sender_name TEXT,
    p_sender_bank TEXT,
    p_proof_path TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_membership RECORD;
    v_settings RECORD;
    v_amount INTEGER;
    v_new_payment_id UUID;
    v_has_pending BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: user belum login';
    END IF;

    IF trim(COALESCE(p_sender_name, '')) = '' THEN
        RAISE EXCEPTION 'Nama pengirim wajib diisi';
    END IF;
    IF trim(COALESCE(p_sender_bank, '')) = '' THEN
        RAISE EXCEPTION 'Bank pengirim wajib diisi';
    END IF;
    IF trim(COALESCE(p_proof_path, '')) = '' THEN
        RAISE EXCEPTION 'Bukti transfer wajib diunggah';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.payments
        WHERE user_id = v_user_id AND status = 'pending'
    ) INTO v_has_pending;

    IF v_has_pending THEN
        RAISE EXCEPTION 'Kamu masih memiliki pembayaran yang sedang menunggu verifikasi admin';
    END IF;

    SELECT pro_price, pro_duration_days INTO v_settings FROM public.app_settings WHERE id = 1;
    SELECT payment_code INTO v_membership FROM public.memberships WHERE user_id = v_user_id;

    IF v_settings.pro_price IS NULL OR v_membership.payment_code IS NULL THEN
        RAISE EXCEPTION 'Pengaturan sistem atau kode pembayaran tidak ditemukan';
    END IF;

    v_amount := v_settings.pro_price + v_membership.payment_code;

    INSERT INTO public.payments (
        user_id,
        amount,
        duration_days,
        sender_name,
        sender_bank,
        proof_path,
        status
    ) VALUES (
        v_user_id,
        v_amount,
        v_settings.pro_duration_days,
        trim(p_sender_name),
        trim(p_sender_bank),
        trim(p_proof_path),
        'pending'
    )
    RETURNING id INTO v_new_payment_id;

    RETURN v_new_payment_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_payment(TEXT, TEXT, TEXT) TO authenticated;

-- 8.2 admin_review_payment
CREATE OR REPLACE FUNCTION public.admin_review_payment(
    p_payment_id UUID,
    p_approve BOOLEAN,
    p_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat meninjau pembayaran';
    END IF;

    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data pembayaran tidak ditemukan';
    END IF;

    IF v_payment.status != 'pending' THEN
        RAISE EXCEPTION 'Pembayaran ini sudah pernah diproses sebelumnya (%)', v_payment.status;
    END IF;

    IF p_approve IS TRUE THEN
        UPDATE public.payments
        SET
            status = 'approved',
            admin_note = p_note,
            reviewed_at = now()
        WHERE id = p_payment_id;

        UPDATE public.memberships
        SET
            pro_until = greatest(now(), COALESCE(pro_until, now())) + (v_payment.duration_days || ' days')::interval
        WHERE user_id = v_payment.user_id;
    ELSE
        IF trim(COALESCE(p_note, '')) = '' THEN
            RAISE EXCEPTION 'Alasan penolakan wajib diisi';
        END IF;

        UPDATE public.payments
        SET
            status = 'rejected',
            admin_note = trim(p_note),
            reviewed_at = now()
        WHERE id = p_payment_id;
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_review_payment(UUID, BOOLEAN, TEXT) TO authenticated;

-- 8.3 admin_dashboard_stats
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_users BIGINT;
    v_pro_users BIGINT;
    v_pending_payments BIGINT;
    v_monthly_revenue BIGINT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    SELECT count(*) INTO v_total_users FROM public.profiles;

    SELECT count(*) INTO v_pro_users
    FROM public.memberships
    WHERE pro_until IS NOT NULL AND pro_until > now();

    SELECT count(*) INTO v_pending_payments
    FROM public.payments
    WHERE status = 'pending';

    SELECT COALESCE(sum(amount), 0) INTO v_monthly_revenue
    FROM public.payments
    WHERE status = 'approved'
      AND created_at >= date_trunc('month', now());

    RETURN jsonb_build_object(
        'total_users', v_total_users,
        'pro_users', v_pro_users,
        'pending_payments', v_pending_payments,
        'monthly_revenue', v_monthly_revenue
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

-- 8.4 admin_list_users
CREATE OR REPLACE FUNCTION public.admin_list_users(p_search TEXT DEFAULT '')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_search TEXT := lower(trim(COALESCE(p_search, '')));
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'username', p.username,
            'display_name', p.display_name,
            'role', m.role,
            'is_pro', (m.pro_until IS NOT NULL AND m.pro_until > now()),
            'pro_until', m.pro_until,
            'is_suspended', m.is_suspended,
            'product_count', COALESCE(prod.cnt, 0),
            'created_at', p.created_at
        ) ORDER BY p.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    JOIN public.memberships m ON m.user_id = p.id
    LEFT JOIN (
        SELECT user_id, count(*) AS cnt
        FROM public.products
        GROUP BY user_id
    ) prod ON prod.user_id = p.id
    WHERE (
        v_clean_search = ''
        OR lower(p.username) LIKE '%' || v_clean_search || '%'
        OR lower(u.email) LIKE '%' || v_clean_search || '%'
        OR lower(p.display_name) LIKE '%' || v_clean_search || '%'
    );

    RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT) TO authenticated;

-- 8.5 admin_set_pro
CREATE OR REPLACE FUNCTION public.admin_set_pro(
    p_user_id UUID,
    p_days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    IF p_days <= 0 THEN
        UPDATE public.memberships
        SET pro_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.memberships
        SET pro_until = greatest(now(), COALESCE(pro_until, now())) + (p_days || ' days')::interval
        WHERE user_id = p_user_id;
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_pro(UUID, INTEGER) TO authenticated;

-- 8.6 admin_set_suspended
CREATE OR REPLACE FUNCTION public.admin_set_suspended(
    p_user_id UUID,
    p_value BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    UPDATE public.memberships
    SET is_suspended = p_value
    WHERE user_id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_suspended(UUID, BOOLEAN) TO authenticated;


