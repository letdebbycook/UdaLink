-- ==============================================================================
-- PENGUJIAN SPRINT 2: RPC PUBLIK, AUTH, DAN INTEGRASI (BE 2.1 - BE 2.3)
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor Supabase setelah menjalankan sprint-2-rpc.sql dan seed-dev.sql
-- ==============================================================================

DO $$
DECLARE
    v_nando_data JSONB;
    v_prod_id UUID;
    v_click_res JSONB;
    v_click_count INTEGER;
    v_non_existent JSONB;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MEMULAI PENGUJIAN BACKEND SPRINT 2 (RPC & SEED)';
    RAISE NOTICE '==================================================';

    -- 1. Uji RPC get_public_page('nando')
    v_nando_data := public.get_public_page('nando');

    IF v_nando_data IS NULL THEN
        RAISE EXCEPTION '[FAIL] get_public_page(nando) mengembalikan NULL. Pastikan seed-dev.sql sudah dijalankan!';
    END IF;

    IF (v_nando_data->'profile'->>'username') = 'nando' THEN
        RAISE NOTICE '[OK] Profil nando ditemukan: %', v_nando_data->'profile'->>'display_name';
    ELSE
        RAISE EXCEPTION '[FAIL] Username pada payload tidak sesuai: %', v_nando_data->'profile'->>'username';
    END IF;

    -- Uji jumlah kategori nando (harus 4)
    IF jsonb_array_length(v_nando_data->'categories') = 4 THEN
        RAISE NOTICE '[OK] Kategori terambil lengkap: 4 kategori.';
    ELSE
        RAISE EXCEPTION '[FAIL] Jumlah kategori tidak sesuai: % ditemukan.', jsonb_array_length(v_nando_data->'categories');
    END IF;

    -- Uji jumlah produk nando (harus 12)
    IF jsonb_array_length(v_nando_data->'products') = 12 THEN
        RAISE NOTICE '[OK] Produk terambil lengkap: 12 produk (#1-#12).';
    ELSE
        RAISE EXCEPTION '[FAIL] Jumlah produk tidak sesuai: % ditemukan.', jsonb_array_length(v_nando_data->'products');
    END IF;

    -- 2. Uji RPC record_click
    -- Ambil salah satu produk nando
    SELECT (v_nando_data->'products'->0->>'id')::uuid INTO v_prod_id;

    v_click_res := public.record_click(v_prod_id);

    IF v_click_res IS NOT NULL AND (v_click_res->>'affiliate_url') IS NOT NULL THEN
        RAISE NOTICE '[OK] record_click sukses mencatat klik dan mengembalikan URL: %', v_click_res->>'affiliate_url';
    ELSE
        RAISE EXCEPTION '[FAIL] record_click gagal mengembalikan data redirect.';
    END IF;

    -- Cek tabel clicks
    SELECT count(*) INTO v_click_count FROM public.clicks WHERE product_id = v_prod_id;
    IF v_click_count >= 1 THEN
        RAISE NOTICE '[OK] Klik berhasil tersimpan di tabel clicks (total: % klik).', v_click_count;
    ELSE
        RAISE EXCEPTION '[FAIL] Klik tidak tercatat di tabel clicks.';
    END IF;

    -- 3. Uji username yang tidak ada harus mengembalikan NULL
    v_non_existent := public.get_public_page('user_tidak_ada_12345');
    IF v_non_existent IS NULL THEN
        RAISE NOTICE '[OK] get_public_page untuk username tidak terdaftar mengembalikan NULL (Halaman tidak tersedia).';
    ELSE
        RAISE EXCEPTION '[FAIL] get_public_page untuk username bodong harus mengembalikan NULL!';
    END IF;

    RAISE NOTICE '==================================================';
    RAISE NOTICE '[BERHASIL] SEMUA TES BACKEND SPRINT 2 LOLOS 100%%';
    RAISE NOTICE '==================================================';
END;
$$;
