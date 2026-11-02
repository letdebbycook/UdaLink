-- ==============================================================================
-- UdaLink: Feature Platform Tracking pada Statistik (Tahap 3)
-- ==============================================================================

-- 1. Tambah kolom platform pada tabel clicks (default 'direct')
ALTER TABLE public.clicks
ADD COLUMN IF NOT EXISTS platform VARCHAR(30) NOT NULL DEFAULT 'direct';

-- Buat index untuk optimasi agregasi platform dan rentang waktu
CREATE INDEX IF NOT EXISTS idx_clicks_owner_platform_created
ON public.clicks(owner_id, platform, created_at DESC);

-- 2. Perbarui RPC record_click agar menerima parameter p_platform
-- Drop signature lama terlebih dahulu agar tidak terjadi duplicate signature error
DROP FUNCTION IF EXISTS public.record_click(UUID);
DROP FUNCTION IF EXISTS public.record_click(UUID, TEXT);
DROP FUNCTION IF EXISTS public.record_click(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.record_click(
    p_product_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_platform TEXT DEFAULT 'direct'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product RECORD;
    v_count INT := 0;
    v_clean_platform TEXT;
BEGIN
    SELECT p.id, p.user_id, p.affiliate_url, p.marketplace, p.is_active, m.is_suspended
    INTO v_product
    FROM public.products p
    JOIN public.memberships m ON m.user_id = p.user_id
    WHERE p.id = p_product_id;

    IF NOT FOUND OR v_product.is_active IS NOT TRUE OR v_product.is_suspended IS TRUE THEN
        RETURN NULL;
    END IF;

    -- Normalisasi nama platform (misal: instagram, tiktok, whatsapp, twitter, facebook, youtube, direct, lainnya)
    v_clean_platform := lower(trim(COALESCE(p_platform, 'direct')));
    IF v_clean_platform = '' THEN
        v_clean_platform := 'direct';
    END IF;

    -- Deduplikasi 60 menit per sesi & produk
    IF p_session_id IS NOT NULL AND length(p_session_id) > 0 THEN
        SELECT COUNT(*) INTO v_count
        FROM public.clicks
        WHERE product_id = v_product.id
          AND session_id = p_session_id
          AND created_at > (now() - INTERVAL '60 minutes');

        IF v_count > 0 THEN
            RETURN jsonb_build_object(
                'affiliate_url', v_product.affiliate_url,
                'marketplace',   v_product.marketplace,
                'deduplicated',  true
            );
        END IF;
    END IF;

    INSERT INTO public.clicks (product_id, owner_id, session_id, platform)
    VALUES (v_product.id, v_product.user_id, p_session_id, v_clean_platform);

    RETURN jsonb_build_object(
        'affiliate_url', v_product.affiliate_url,
        'marketplace',   v_product.marketplace,
        'deduplicated',  false
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_click(UUID, TEXT, TEXT) TO anon, authenticated;

-- 3. Perbarui RPC get_my_stats agar mengembalikan agregasi platform_stats
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
    v_platform_stats JSONB;
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

    -- Total klik user dalam rentang waktu
    SELECT count(*) INTO v_total_clicks
    FROM public.clicks
    WHERE owner_id = v_user_id AND created_at >= v_start_time;

    -- Statistik produk
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

    -- Agregasi per sumber platform
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'platform', cs.clean_platform,
            'click_count', cs.clicks,
            'percentage', CASE 
                WHEN v_total_clicks > 0 THEN ROUND((cs.clicks::numeric / v_total_clicks::numeric) * 100, 1)
                ELSE 0 
            END
        ) ORDER BY cs.clicks DESC
    ), '[]'::jsonb)
    INTO v_platform_stats
    FROM (
        SELECT 
            COALESCE(NULLIF(trim(lower(platform)), ''), 'direct') AS clean_platform,
            count(*) AS clicks
        FROM public.clicks
        WHERE owner_id = v_user_id AND created_at >= v_start_time
        GROUP BY COALESCE(NULLIF(trim(lower(platform)), ''), 'direct')
    ) cs;

    RETURN jsonb_build_object(
        'days', v_allowed_days,
        'is_pro', v_is_pro,
        'total_clicks', v_total_clicks,
        'products_stats', v_top_products,
        'platform_stats', v_platform_stats
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_stats(INTEGER) TO authenticated;

