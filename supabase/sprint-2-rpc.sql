-- ==============================================================================
-- UDALINK DATABASE RPC FUNCTIONS (SPRINT 2)
-- ==============================================================================
-- Fungsi RPC Publik & Affiliator sesuai PRD Bagian 9 & 10
-- ==============================================================================

-- 1. FUNGSI record_click(p_product_id uuid)
-- Mencatat 1 klik pada tabel clicks dan mengembalikan URL affiliate & marketplace.
-- Mengembalikan NULL jika produk disembunyikan (is_active = false) atau akun dinonaktifkan (is_suspended = true).
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

    -- Catat klik
    INSERT INTO public.clicks (product_id, owner_id)
    VALUES (v_product.id, v_product.user_id);

    -- Kembalikan URL affiliate dan marketplace
    RETURN jsonb_build_object(
        'affiliate_url', v_product.affiliate_url,
        'marketplace', v_product.marketplace
    );
END;
$$;

-- Berikan izin akses ke anon dan authenticated
GRANT EXECUTE ON FUNCTION public.record_click(UUID) TO anon, authenticated;


-- 2. FUNGSI get_public_page(p_username text)
-- Mengembalikan seluruh data etalase publik affiliator dalam satu payload JSON:
-- - profil affiliator
-- - daftar kategori
-- - daftar produk (dengan aturan Gratis vs Pro)
-- - banner (hanya jika Pro)
-- - produk unggulan (maks 6 jika Pro)
-- - tema efektif (tema premium diubah jadi 'hijau' jika Gratis)
-- - show_branding (true jika Gratis, false jika Pro)
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
    -- 1. Cari pemilik berdasarkan username
    SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.theme,
           p.whatsapp, p.instagram, p.tiktok, p.youtube,
           m.pro_until, m.is_suspended
    INTO v_user
    FROM public.profiles p
    JOIN public.memberships m ON m.user_id = p.id
    WHERE lower(p.username) = v_clean_user;

    -- Jika username tidak ada atau akun disuspend, kembalikan NULL
    IF NOT FOUND OR v_user.is_suspended IS TRUE THEN
        RETURN NULL;
    END IF;

    -- 2. Tentukan status Pro aktif
    v_is_pro := (v_user.pro_until IS NOT NULL AND v_user.pro_until > now());

    -- 3. Tentukan batas tema & branding
    -- Tema dasar: 'hijau', 'putih-klasik', 'gelap'
    -- Tema premium: 'pink-pastel', 'biru-laut', 'oranye-hangat', 'ungu-malam', 'krem-minimalis'
    IF v_is_pro THEN
        v_effective_theme := COALESCE(v_user.theme, 'hijau');
        v_show_branding := false;
    ELSE
        -- Akun gratis: jika memilih tema selain 3 tema dasar, otomatis reset ke 'hijau'
        IF v_user.theme IN ('hijau', 'putih', 'gelap', 'monokrom') THEN
            v_effective_theme := v_user.theme;
        ELSE
            v_effective_theme := 'hijau';
        END IF;
        v_show_branding := true;
    END IF;

    -- 4. Bangun payload profil
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

    -- 5. Ambil Kategori affiliator
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

    -- 6. Ambil Banner (Khusus Pro: maksimal 3 banner aktif)
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

    -- 7. Ambil Produk
    IF v_is_pro THEN
        -- PRO: Semua produk aktif
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

        -- Produk unggulan: maks 6 produk aktif yang ditandai is_featured
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
        -- GRATIS: Maksimal free_product_limit produk terbaru (nomor terbesar), is_featured diabaikan
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

    -- 8. Return JSON utuh
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


-- 3. FUNGSI get_my_stats(p_days int)
-- Menghitung total klik dan klik per produk milik affiliator yang login.
-- Batas waktu: maksimal 7 hari untuk Gratis, maksimal 30 hari untuk Pro.
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

    -- Cek status Pro
    v_is_pro := public.is_pro(v_user_id);

    -- Enforce batas hari
    IF v_is_pro THEN
        v_allowed_days := LEAST(GREATEST(COALESCE(p_days, 30), 1), 30);
    ELSE
        v_allowed_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 7);
    END IF;

    v_start_time := now() - (v_allowed_days || ' days')::interval;

    -- Hitung total klik
    SELECT count(*) INTO v_total_clicks
    FROM public.clicks
    WHERE owner_id = v_user_id AND created_at >= v_start_time;

    -- Hitung klik per produk (diurutkan dari terbanyak)
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


-- 4. FUNGSI get_my_plan()
-- Mengambil ringkasan paket akun affiliator yang login beserta info rekening pembayaran.
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
