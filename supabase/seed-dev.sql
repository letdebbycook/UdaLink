-- ==============================================================================
-- UDALINK DEVELOPMENT SEED DATA (SPRINT 2 - BE 2.3)
-- ==============================================================================
-- Data dummy realistis untuk affiliator "nando"
-- Menghasilkan 1 user, 4 kategori, 12 produk (nomor #1 s/d #12 otomatis), dan 2 banner
-- ==============================================================================

DO $$
DECLARE
    v_nando_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_cat_gadget UUID;
    v_cat_fashion UUID;
    v_cat_home UUID;
    v_cat_beauty UUID;
BEGIN
    RAISE NOTICE 'Memulai seeding data development...';

    -- 1. Bersihkan data user uji sebelumnya jika ada
    DELETE FROM auth.users WHERE id = v_nando_id;

    -- 2. Buat user "nando" di auth.users (Trigger handle_new_user akan otomatis membuat profiles & memberships)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        aud,
        role
    ) VALUES (
        v_nando_id,
        '00000000-0000-0000-0000-000000000000',
        'nando@udalink.id',
        crypt('password123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"nando","display_name":"Nando Affiliator"}'::jsonb,
        now(),
        now(),
        'authenticated',
        'authenticated'
    );

    -- 3. Lengkapi profil Nando di public.profiles
    UPDATE public.profiles
    SET
        bio = 'Rekomendasi gadget murah, outfit aesthetic, dan racun belanja harian ✨ Cek nomor di video ya!',
        avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
        theme = 'hijau',
        whatsapp = '6281234567890',
        instagram = 'nando_affiliate',
        tiktok = 'nando.deals',
        youtube = 'https://youtube.com/@nandodeals'
    WHERE id = v_nando_id;

    -- 4. Buat 4 Kategori
    INSERT INTO public.categories (user_id, name, sort_order)
    VALUES (v_nando_id, 'Elektronik & Gadget', 1)
    RETURNING id INTO v_cat_gadget;

    INSERT INTO public.categories (user_id, name, sort_order)
    VALUES (v_nando_id, 'Fashion & Pakaian', 2)
    RETURNING id INTO v_cat_fashion;

    INSERT INTO public.categories (user_id, name, sort_order)
    VALUES (v_nando_id, 'Perlengkapan Rumah', 3)
    RETURNING id INTO v_cat_home;

    INSERT INTO public.categories (user_id, name, sort_order)
    VALUES (v_nando_id, 'Kesehatan & Kecantikan', 4)
    RETURNING id INTO v_cat_beauty;

    -- 5. Buat 12 Produk Uji (Nomor produk #1 s/d #12 akan diisi otomatis oleh trigger handle_product_number)
    INSERT INTO public.products (user_id, category_id, name, price, affiliate_url, marketplace, is_active, is_featured, image_url)
    VALUES
    (v_nando_id, v_cat_gadget, 'TWS Bluetooth 5.3 Bass Nendang No Delay', 89000, 'https://shopee.co.id/universal-link/tws-bass', 'shopee', true, true, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_gadget, 'Powerbank Fast Charging 20000mAh Slim', 145000, 'https://shopee.co.id/universal-link/powerbank-20k', 'shopee', true, true, 'https://images.unsplash.com/photo-1609592424368-450f384a307c?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_gadget, 'Stand HP Meja Lipat Kokoh Aluminium', 25000, 'https://vt.tiktok.com/ZS2xyz123/', 'tiktok', true, false, 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_fashion, 'Kaos Polos Oversize Katun Combed 24s', 55000, 'https://shopee.co.id/universal-link/kaos-oversize', 'shopee', true, false, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_fashion, 'Celana Cargo Canvas Streetwear Loose', 129000, 'https://vt.tiktok.com/ZS2cargo88/', 'tiktok', true, false, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_fashion, 'Topi Baseball Vintage Corduroy Unisex', 39000, 'https://www.tokopedia.com/topi-vintage', 'tokopedia', true, false, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_home, 'Humidifier Diffuser Kayu Ultrasonic LED', 72000, 'https://shopee.co.id/universal-link/humidifier', 'shopee', true, false, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_home, 'Lampu Meja Belajar LED Touch Screen', 48000, 'https://shopee.co.id/universal-link/lampu-belajar', 'shopee', true, false, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_home, 'Botol Minum Motivasi 2 Liter Penanda Waktu', 35000, 'https://vt.tiktok.com/ZS2botol2l/', 'tiktok', true, false, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_beauty, 'Sunscreen Serum SPF 50 PA++++ Ringan', 65000, 'https://shopee.co.id/universal-link/sunscreen-spf50', 'shopee', true, false, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_beauty, 'Lip Tint Velvet Korean Matte Tahan Lama', 38000, 'https://vt.tiktok.com/ZS2liptint99/', 'tiktok', true, false, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&h=500&fit=crop'),
    (v_nando_id, v_cat_gadget, 'Kabel Data Type C to Lightning Fast 20W', 19000, 'https://shopee.co.id/universal-link/kabel-fast', 'shopee', true, false, 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=500&fit=crop');

    -- 6. Buat 2 Banner Promo untuk Nando
    INSERT INTO public.banners (user_id, image_url, title, link_url, sort_order, is_active)
    VALUES
    (v_nando_id, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop', 'Mega Promo Gajian Diskon s/d 70%', 'https://shopee.co.id', 1, true),
    (v_nando_id, 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop', 'Flash Sale Gadget Murah Terbatas', 'https://vt.tiktok.com', 2, true);

    RAISE NOTICE '[OK] Seeding berhasil! User Nando (nando@udalink.id), 4 kategori, 12 produk (#1-#12), dan 2 banner telah dibuat.';
END;
$$;
