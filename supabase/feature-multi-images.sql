-- ==============================================================================
-- UdaLink: Feature Multi-Images (Maks 5 Gambar per Produk)
-- ==============================================================================

-- 1. Tambah kolom images JSONB ke tabel products jika belum ada
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Migrasi data lama: jika images kosong dan image_url ada nilainya, jadikan images[0] = image_url
UPDATE public.products
SET images = jsonb_build_array(image_url)
WHERE (images IS NULL OR images = '[]'::jsonb) AND image_url IS NOT NULL;

-- 3. Batasi maksimal 5 gambar di level database
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS check_products_max_5_images;

ALTER TABLE public.products
ADD CONSTRAINT check_products_max_5_images
CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 5);

-- 4. Perbarui RPC get_public_page agar menyertakan array images
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

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF v_user.is_suspended IS TRUE THEN
        RETURN jsonb_build_object(
            'profile', jsonb_build_object('username', v_user.username),
            'is_suspended', true
        );
    END IF;

    v_is_pro := (v_user.pro_until IS NOT NULL AND v_user.pro_until > now());

    IF v_is_pro THEN
        v_effective_theme := COALESCE(v_user.theme, 'hijau');
        v_show_branding   := false;
    ELSE
        v_effective_theme := 'hijau';
        v_show_branding   := true;
    END IF;

    v_profile := jsonb_build_object(
        'id',           v_user.id,
        'username',     v_user.username,
        'display_name', v_user.display_name,
        'bio',          v_user.bio,
        'avatar_url',   v_user.avatar_url,
        'whatsapp',     v_user.whatsapp,
        'instagram',    v_user.instagram,
        'tiktok',       v_user.tiktok,
        'youtube',      v_user.youtube
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
            LIMIT 5
        ) b;

        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'number', p.number,
                'name', p.name,
                'price', p.price,
                'image_url', p.image_url,
                'images', COALESCE(p.images, CASE WHEN p.image_url IS NOT NULL THEN jsonb_build_array(p.image_url) ELSE '[]'::jsonb END),
                'marketplace', p.marketplace,
                'category_id', p.category_id,
                'is_featured', true
            ) ORDER BY p.number DESC
        ), '[]'::jsonb)
        INTO v_featured_products
        FROM (
            SELECT * FROM public.products
            WHERE user_id = v_user.id AND is_active = true AND is_featured = true
            ORDER BY number DESC
            LIMIT 6
        ) p;

        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'number', p.number,
                'name', p.name,
                'price', p.price,
                'image_url', p.image_url,
                'images', COALESCE(p.images, CASE WHEN p.image_url IS NOT NULL THEN jsonb_build_array(p.image_url) ELSE '[]'::jsonb END),
                'marketplace', p.marketplace,
                'category_id', p.category_id,
                'is_featured', p.is_featured
            ) ORDER BY p.number DESC
        ), '[]'::jsonb)
        INTO v_products
        FROM public.products p
        WHERE p.user_id = v_user.id AND p.is_active = true;
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
                'images', COALESCE(p.images, CASE WHEN p.image_url IS NOT NULL THEN jsonb_build_array(p.image_url) ELSE '[]'::jsonb END),
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
