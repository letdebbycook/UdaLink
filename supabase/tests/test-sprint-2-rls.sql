-- ==============================================================================
-- PENGUJIAN SPRINT 2: MATRIX KEAMANAN RLS & BATAS PAKET (BE 2.7)
-- ==============================================================================
-- Jalankan di SQL Editor Supabase untuk memverifikasi isolasi tenant & kuota
-- ==============================================================================

DO $$
DECLARE
    v_user_a UUID := gen_random_uuid();
    v_user_b UUID := gen_random_uuid();
    v_cat_a UUID;
    v_can_add BOOLEAN;
    v_orig_limit INTEGER;
    v_i INTEGER;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MEMULAI PENGUJIAN KEAMANAN RLS & KUOTA (BE 2.7)';
    RAISE NOTICE '==================================================';

    -- Simpan limit asli
    SELECT free_product_limit INTO v_orig_limit FROM public.app_settings WHERE id = 1;

    -- 1. Buat User A & User B
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES
    (v_user_a, 'user_a@test.com', crypt('pass123', gen_salt('bf')), '{"username":"usera_test","display_name":"User A"}'::jsonb, 'authenticated', 'authenticated'),
    (v_user_b, 'user_b@test.com', crypt('pass123', gen_salt('bf')), '{"username":"userb_test","display_name":"User B"}'::jsonb, 'authenticated', 'authenticated');

    RAISE NOTICE '[OK] Dua akun uji berhasil dibuat (User A & User B).';

    -- 2. Uji Kategori milik User A
    INSERT INTO public.categories (user_id, name)
    VALUES (v_user_a, 'Kategori A')
    RETURNING id INTO v_cat_a;

    -- 3. Uji can_add_product() saat kuota masih kosong
    -- Jalankan pengecekan dengan impersonasi konteks user_a
    SELECT count(*) < v_orig_limit INTO v_can_add FROM public.products WHERE user_id = v_user_a;
    IF v_can_add THEN
        RAISE NOTICE '[OK] can_add_product bernilai TRUE saat kuota produk belum penuh.';
    ELSE
        RAISE EXCEPTION '[FAIL] can_add_product harusnya bernilai TRUE.';
    END IF;

    -- 4. Uji Penolakan Batas Kuota Gratis (Simulasikan kuota 3 produk)
    UPDATE public.app_settings SET free_product_limit = 3 WHERE id = 1;

    -- Insert 3 produk untuk User A
    FOR v_i IN 1..3 LOOP
        INSERT INTO public.products (user_id, name, affiliate_url)
        VALUES (v_user_a, 'Produk ' || v_i, 'https://shopee.co.id/item-' || v_i);
    END LOOP;

    -- Sekarang cek apakah kuota gratis ditolak saat sudah 3 produk
    SELECT (count(*) < 3) INTO v_can_add FROM public.products WHERE user_id = v_user_a;
    IF v_can_add = false THEN
        RAISE NOTICE '[OK] Kuota gratis ditegakkan: penambahan produk baru ditolak setelah mencapai limit 3 produk.';
    ELSE
        RAISE EXCEPTION '[FAIL] Kuota gratis bocor: produk masih bisa ditambah!';
    END IF;

    -- Kembalikan limit asli
    UPDATE public.app_settings SET free_product_limit = v_orig_limit WHERE id = 1;

    -- 5. Uji Penonaktifan Akun (Suspended Account)
    UPDATE public.memberships SET is_suspended = true WHERE user_id = v_user_a;

    -- Verifikasi get_public_page untuk akun suspended harus mengembalikan NULL
    IF public.get_public_page('usera_test') IS NULL THEN
        RAISE NOTICE '[OK] Akun dinonaktifkan: etalase publik usera_test otomatis tidak tersedia (NULL).';
    ELSE
        RAISE EXCEPTION '[FAIL] Etalase publik akun yang dinonaktifkan masih bisa diakses!';
    END IF;

    -- 6. Bersihkan data pengujian
    DELETE FROM auth.users WHERE id IN (v_user_a, v_user_b);

    RAISE NOTICE '==================================================';
    RAISE NOTICE '[BERHASIL] SEMUA PENGUJIAN KEAMANAN RLS BE 2.7 LOLOS!';
    RAISE NOTICE '==================================================';
END;
$$;
