-- ==============================================================================
-- MASTER QA REMEDIATION PATCH: Backend Bug Fixes & Deduplication
-- Tanggal: 2026-10-27
-- Memperbaiki temuan QA Backend UdaLink:
-- 1. BE-BUG-03: Drop fungsi record_click(UUID) lama untuk mengatasi PGRST203 (Function Overloading)
-- 2. BE-TECH-01: Dukungan pelacakan klik banner (banner_id pada clicks + RPC record_banner_click)
-- 3. BE-DATA-01: can_add_product() dan get_my_plan() hanya menghitung produk aktif (is_active = true)
-- 4. BE-SEC-03: Mekanisme loop retry & uniqueness check untuk payment_code (mencegah collision 3-digit)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PERBAIKAN TABEL CLICKS & DEDUP BANNER/PRODUK (BE-BUG-03 & BE-TECH-01)
-- ------------------------------------------------------------------------------

-- Buat kolom product_id nullable agar bisa menampung klik banner
ALTER TABLE public.clicks ALTER COLUMN product_id DROP NOT NULL;

-- Tambah kolom session_id, ip_hint, dan banner_id (jika belum ada)
ALTER TABLE public.clicks
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_hint TEXT,
  ADD COLUMN IF NOT EXISTS banner_id UUID REFERENCES public.banners(id) ON DELETE CASCADE;

-- Indeks untuk query deduplikasi dan analitik banner
CREATE INDEX IF NOT EXISTS idx_clicks_dedup
  ON public.clicks (product_id, session_id, created_at)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clicks_banner_created
  ON public.clicks (banner_id, created_at DESC)
  WHERE banner_id IS NOT NULL;

-- PENTING: DROP fungsi lama 1-parameter agar PostgREST tidak mengalami error PGRST203
DROP FUNCTION IF EXISTS public.record_click(UUID);

-- Recreate record_click dengan parameter opsional p_session_id (dedup window 60 menit)
CREATE OR REPLACE FUNCTION public.record_click(
  p_product_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_count INT := 0;
BEGIN
  -- Ambil info produk dan status penangguhan akun pemilik
  SELECT p.id, p.user_id, p.affiliate_url, p.marketplace, p.is_active, m.is_suspended
  INTO v_product
  FROM public.products p
  JOIN public.memberships m ON m.user_id = p.user_id
  WHERE p.id = p_product_id;

  -- Validasi: produk ada, aktif, dan akun pemilik tidak dinonaktifkan
  IF NOT FOUND OR v_product.is_active IS NOT TRUE OR v_product.is_suspended IS TRUE THEN
    RETURN NULL;
  END IF;

  -- Deduplication: cek apakah session yang sama sudah klik produk ini dalam 60 menit terakhir
  IF p_session_id IS NOT NULL AND length(p_session_id) > 0 THEN
    SELECT COUNT(*) INTO v_count
    FROM public.clicks
    WHERE product_id = v_product.id
      AND session_id = p_session_id
      AND created_at > (now() - INTERVAL '60 minutes');

    IF v_count > 0 THEN
      -- Sudah pernah klik: kembalikan URL tanpa insert klik baru (deduplicated)
      RETURN jsonb_build_object(
        'affiliate_url', v_product.affiliate_url,
        'marketplace',   v_product.marketplace,
        'deduplicated',  true
      );
    END IF;
  END IF;

  -- Catat klik produk
  INSERT INTO public.clicks (product_id, owner_id, session_id)
  VALUES (v_product.id, v_product.user_id, p_session_id);

  -- Kembalikan URL affiliate dan marketplace
  RETURN jsonb_build_object(
    'affiliate_url', v_product.affiliate_url,
    'marketplace',   v_product.marketplace,
    'deduplicated',  false
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_click(UUID, TEXT) TO anon, authenticated;

-- Fungsi RPC pelacak klik banner (BE-TECH-01)
CREATE OR REPLACE FUNCTION public.record_banner_click(
  p_banner_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_banner RECORD;
  v_count INT := 0;
BEGIN
  -- Ambil data banner dan cek status user
  SELECT b.id, b.user_id, b.link_url, b.is_active, m.is_suspended
  INTO v_banner
  FROM public.banners b
  JOIN public.memberships m ON m.user_id = b.user_id
  WHERE b.id = p_banner_id;

  -- Validasi banner dan akun
  IF NOT FOUND OR v_banner.is_active IS NOT TRUE OR v_banner.is_suspended IS TRUE THEN
    RETURN NULL;
  END IF;

  -- Deduplication 60 menit per session
  IF p_session_id IS NOT NULL AND length(p_session_id) > 0 THEN
    SELECT COUNT(*) INTO v_count
    FROM public.clicks
    WHERE banner_id = v_banner.id
      AND session_id = p_session_id
      AND created_at > (now() - INTERVAL '60 minutes');

    IF v_count > 0 THEN
      RETURN jsonb_build_object(
        'link_url', v_banner.link_url,
        'deduplicated', true
      );
    END IF;
  END IF;

  -- Catat klik banner dengan mencantumkan owner_id pemilik etalase
  INSERT INTO public.clicks (banner_id, owner_id, session_id)
  VALUES (v_banner.id, v_banner.user_id, p_session_id);

  RETURN jsonb_build_object(
    'link_url', v_banner.link_url,
    'deduplicated', false
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_banner_click(UUID, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. KUOTA PRODUK HANYA MENGHITUNG PRODUK AKTIF (BE-DATA-01)
-- ------------------------------------------------------------------------------

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

    -- PERBAIKAN: Hanya menghitung produk aktif (is_active = true)
    SELECT count(*) INTO v_current_count 
    FROM public.products 
    WHERE user_id = v_user_id AND is_active = true;

    RETURN v_current_count < v_free_limit;
END;
$$;
GRANT EXECUTE ON FUNCTION public.can_add_product() TO authenticated;

-- Perbarui get_my_plan() agar menghitung produk aktif
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
    v_effective_theme TEXT;
    v_theme TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: user belum login';
    END IF;

    SELECT role, pro_until, is_suspended, payment_code
    INTO v_membership
    FROM public.memberships
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membership tidak ditemukan untuk user %', v_user_id;
    END IF;

    SELECT theme INTO v_theme FROM public.profiles WHERE id = v_user_id;

    SELECT pro_price, pro_duration_days, free_product_limit,
           bank_name, bank_account_number, bank_account_name, admin_whatsapp
    INTO v_settings
    FROM public.app_settings
    WHERE id = 1;

    -- PERBAIKAN: Hanya menghitung produk aktif
    SELECT count(*) INTO v_product_count 
    FROM public.products 
    WHERE user_id = v_user_id AND is_active = true;

    v_is_pro := (v_membership.pro_until IS NOT NULL AND v_membership.pro_until > now());

    IF v_is_pro THEN
        v_effective_theme := COALESCE(v_theme, 'hijau');
    ELSE
        IF v_theme IN ('pink-pastel', 'biru-laut', 'oranye-hangat', 'ungu-malam', 'krem-minimalis') THEN
            v_effective_theme := 'hijau';
        ELSE
            v_effective_theme := COALESCE(v_theme, 'hijau');
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'is_pro', v_is_pro,
        'role', v_membership.role,
        'pro_until', v_membership.pro_until,
        'is_suspended', v_membership.is_suspended,
        'payment_code', v_membership.payment_code,
        'product_count', v_product_count,
        'free_product_limit', COALESCE(v_settings.free_product_limit, 30),
        'pro_price', COALESCE(v_settings.pro_price, 29000),
        'pro_duration_days', COALESCE(v_settings.pro_duration_days, 30),
        'effective_theme', v_effective_theme,
        'bank_name', v_settings.bank_name,
        'bank_account_number', v_settings.bank_account_number,
        'bank_account_name', v_settings.bank_account_name,
        'admin_whatsapp', v_settings.admin_whatsapp
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_plan() TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. KODE UNIK PEMBAYARAN: RETRY & COLLISION CHECK (BE-SEC-03)
-- ------------------------------------------------------------------------------

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
    v_attempts INTEGER := 0;
BEGIN
    v_raw_username := NEW.raw_user_meta_data->>'username';
    IF v_raw_username IS NULL OR trim(v_raw_username) = '' THEN
        v_username := lower(split_part(NEW.email, '@', 1));
        v_username := regexp_replace(v_username, '[^a-z0-9_]', '_', 'g');
        IF char_length(v_username) < 3 THEN
            v_username := v_username || '_' || substr(NEW.id::text, 1, 3);
        END IF;
        IF char_length(v_username) > 30 THEN
            v_username := substr(v_username, 1, 30);
        END IF;
    ELSE
        v_username := lower(trim(v_raw_username));
    END IF;

    v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', v_username);
    IF char_length(v_display_name) > 50 THEN
        v_display_name := substr(v_display_name, 1, 50);
    END IF;

    -- PERBAIKAN: Loop untuk menghasilkan payment_code 3 digit (100 - 999) yang belum dipakai
    LOOP
        v_payment_code := floor(random() * 899 + 100)::integer;
        IF NOT EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE payment_code = v_payment_code
        ) THEN
            EXIT;
        END IF;

        v_attempts := v_attempts + 1;
        -- Jika populasi mendekati 900 pengguna terdaftar, pilih kode yang tidak sedang pending transaksi
        IF v_attempts > 25 THEN
            SELECT coalesce(
                (
                    SELECT s.num
                    FROM generate_series(100, 999) AS s(num)
                    LEFT JOIN (
                        SELECT m.payment_code
                        FROM public.memberships m
                        JOIN public.payments p ON p.user_id = m.user_id AND p.status = 'pending'
                    ) used ON s.num = used.payment_code
                    WHERE used.payment_code IS NULL
                    ORDER BY random()
                    LIMIT 1
                ),
                floor(random() * 899 + 100)::integer
            ) INTO v_payment_code;
            EXIT;
        END IF;
    END LOOP;

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
