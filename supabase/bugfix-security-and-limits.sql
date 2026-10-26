-- ==============================================================================
-- DATABASE AUDIT & SECURITY PATCH
-- Tanggal: 2026-10-26
-- Perbaikan:
-- 1. Database-level constraints & triggers untuk pembatasan fitur Pro:
--    - Produk unggulan (is_featured = true) hanya boleh diset oleh pengguna Pro
--    - Tema Pro di tabel profiles hanya boleh dipilih oleh pengguna Pro
--    - Kuota banner maksimal 3 buah dan hanya untuk pengguna Pro
--    - Kuota produk gratis 30 produk
-- 2. Daftar reserved usernames tambahan (_next, support, help, settings, pengaturan, dll.)
-- 3. Dukungan multi-metode pembayaran (kolom payment_methods JSONB di app_settings)
-- 4. Generator kode unik dinamis per transaksi
-- ==============================================================================

-- 1. TAMBAH RESERVED USERNAMES DI FUNGSI VALIDASI
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

    -- Validasi reserved keywords sistem & rute Next.js
    IF v_clean_user IN (
        'admin', 'dashboard', 'daftar', 'masuk', 'go', 'api', 'udalink',
        'bantuan', 'tentang', 'harga', 'syarat', 'privasi', 'login', 'register', 'akun',
        '_next', 'support', 'help', 'settings', 'pengaturan', 'faq', 'terms', 'privacy',
        'static', 'robots', 'sitemap', 'syarat-ketentuan', 'kebijakan-privasi'
    ) THEN
        RETURN false;
    END IF;

    -- Cek ketersediaan di tabel profiles
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE lower(username) = v_clean_user
    );
END;
$$;

-- 2. TRIGGER VALIDASI TEMA PRO & FITUR PRO DI TABEL PROFILES
CREATE OR REPLACE FUNCTION public.validate_profile_pro_features()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_pro BOOLEAN;
    v_free_themes TEXT[] := ARRAY['hijau', 'putih', 'gelap', 'cream'];
BEGIN
    -- Cek apakah user berstatus Pro
    v_is_pro := public.is_pro(NEW.id);

    -- Jika bukan Pro dan mencoba memilih tema selain tema dasar/gratis
    IF NOT v_is_pro AND NEW.theme IS NOT NULL AND NOT (NEW.theme = ANY(v_free_themes)) THEN
        RAISE EXCEPTION 'Tema % adalah tema Pro. Silakan upgrade akun Anda ke UdaLink Pro.', NEW.theme;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_pro ON public.profiles;
CREATE TRIGGER trg_validate_profile_pro
    BEFORE INSERT OR UPDATE OF theme ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.validate_profile_pro_features();

-- 3. TRIGGER VALIDASI PRODUK UNGGULAN & KUOTA DI TABEL PRODUCTS
CREATE OR REPLACE FUNCTION public.validate_product_pro_features()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_pro BOOLEAN;
    v_user_id UUID := NEW.user_id;
    v_active_count INTEGER;
    v_free_limit INTEGER;
BEGIN
    v_is_pro := public.is_pro(v_user_id);

    -- Validasi Produk Unggulan: hanya untuk akun Pro
    IF NEW.is_featured IS TRUE AND NOT v_is_pro THEN
        RAISE EXCEPTION 'Fitur Produk Unggulan hanya tersedia untuk pengguna UdaLink Pro.';
    END IF;

    -- Validasi kuota 30 produk aktif untuk akun gratis saat menambah atau mengaktifkan produk
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_active IS FALSE AND NEW.is_active IS TRUE)) THEN
        IF NOT v_is_pro AND NEW.is_active IS TRUE THEN
            SELECT free_product_limit INTO v_free_limit FROM public.app_settings WHERE id = 1;
            IF v_free_limit IS NULL THEN v_free_limit := 30; END IF;

            SELECT count(*) INTO v_active_count
            FROM public.products
            WHERE user_id = v_user_id AND is_active = true AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

            IF v_active_count >= v_free_limit THEN
                RAISE EXCEPTION 'Batas kuota % produk aktif telah tercapai. Upgrade ke Pro untuk menambah produk tanpa batas.', v_free_limit;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_product_pro ON public.products;
CREATE TRIGGER trg_validate_product_pro
    BEFORE INSERT OR UPDATE OF is_featured, is_active ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.validate_product_pro_features();

-- 4. TRIGGER VALIDASI KUOTA BANNER (MAKSIMAL 3 & HANYA PRO) DI TABEL BANNERS
CREATE OR REPLACE FUNCTION public.validate_banner_pro_features()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_pro BOOLEAN;
    v_banner_count INTEGER;
BEGIN
    v_is_pro := public.is_pro(NEW.user_id);

    IF NOT v_is_pro THEN
        RAISE EXCEPTION 'Fitur Banner Promo hanya tersedia untuk pengguna UdaLink Pro.';
    END IF;

    IF TG_OP = 'INSERT' THEN
        SELECT count(*) INTO v_banner_count
        FROM public.banners
        WHERE user_id = NEW.user_id;

        IF v_banner_count >= 3 THEN
            RAISE EXCEPTION 'Batas maksimal 3 banner promo telah tercapai.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_banner_pro ON public.banners;
CREATE TRIGGER trg_validate_banner_pro
    BEFORE INSERT ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.validate_banner_pro_features();

-- 5. TAMBAHKAN KOLOM payment_methods DI app_settings (JSONB untuk multi-rekening)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[
    {"id": "bca_1", "bank_name": "BCA", "account_number": "1234567890", "account_name": "PT UdaLink Media Nusantara", "is_active": true},
    {"id": "mandiri_1", "bank_name": "Bank Mandiri", "account_number": "1370012345678", "account_name": "PT UdaLink Media Nusantara", "is_active": true},
    {"id": "bri_1", "bank_name": "BRI", "account_number": "001201000123530", "account_name": "PT UdaLink Media Nusantara", "is_active": true}
]'::jsonb;

-- 6. PERBARUI get_my_plan() AGAR MENYERTAKAN payment_methods & KODE PEMBAYARAN DINAMIS
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
    v_payment_code INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: user belum login';
    END IF;

    SELECT role, pro_until, is_suspended, payment_code
    INTO v_membership
    FROM public.memberships
    WHERE user_id = v_user_id;

    SELECT pro_price, pro_duration_days, free_product_limit,
           bank_name, bank_account_number, bank_account_name, admin_whatsapp,
           payment_methods
    INTO v_settings
    FROM public.app_settings
    WHERE id = 1;

    SELECT count(*) INTO v_product_count
    FROM public.products
    WHERE user_id = v_user_id;

    v_is_pro := (v_membership.pro_until IS NOT NULL AND v_membership.pro_until > now());

    -- Gunakan kode pembayaran unik atau generate random 100-999
    v_payment_code := COALESCE(v_membership.payment_code, floor(random() * 900 + 100)::integer);

    RETURN jsonb_build_object(
        'role', v_membership.role,
        'is_pro', v_is_pro,
        'pro_until', v_membership.pro_until,
        'is_suspended', v_membership.is_suspended,
        'payment_code', v_payment_code,
        'product_count', v_product_count,
        'free_product_limit', v_settings.free_product_limit,
        'pro_price', v_settings.pro_price,
        'pro_duration_days', v_settings.pro_duration_days,
        'bank_name', v_settings.bank_name,
        'bank_account_number', v_settings.bank_account_number,
        'bank_account_name', v_settings.bank_account_name,
        'admin_whatsapp', v_settings.admin_whatsapp,
        'payment_methods', COALESCE(v_settings.payment_methods, '[]'::jsonb)
    );
END;
$$;
