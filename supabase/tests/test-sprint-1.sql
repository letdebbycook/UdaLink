-- ==============================================================================
-- PENGUJIAN SPRINT 1: SCHEMA, CONSTRAINT, TRIGGER, RLS, STORAGE
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor Supabase untuk memverifikasi seluruh komponen
-- ==============================================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_rls_count INTEGER;
    v_bucket_count INTEGER;
    v_settings_count INTEGER;
    v_test_uid UUID := gen_random_uuid();
    v_prod1_num INTEGER;
    v_prod2_num INTEGER;
    v_test_avail BOOLEAN;
    v_test_reserved BOOLEAN;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MEMULAI PENGUJIAN BACKEND SPRINT 1 (BE 1.1 - 1.6)';
    RAISE NOTICE '==================================================';

    -- 1. Uji Keberadaan 8 Tabel
    SELECT count(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'profiles', 'memberships', 'categories', 'products',
        'banners', 'clicks', 'payments', 'app_settings'
      );
    
    IF v_table_count = 8 THEN
        RAISE NOTICE '[OK] 8 Tabel utama berhasil dibuat (8/8).';
    ELSE
        RAISE EXCEPTION '[FAIL] Jumlah tabel utama tidak sesuai: %/8 ditemukan.', v_table_count;
    END IF;

    -- 2. Uji Status RLS Aktif pada 8 Tabel
    SELECT count(*) INTO v_rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 'memberships', 'categories', 'products',
        'banners', 'clicks', 'payments', 'app_settings'
      )
      AND rowsecurity = true;

    IF v_rls_count = 8 THEN
        RAISE NOTICE '[OK] Row Level Security (RLS) aktif pada seluruh 8 tabel (8/8).';
    ELSE
        RAISE EXCEPTION '[FAIL] RLS belum aktif pada semua tabel (%/8 aktif).', v_rls_count;
    END IF;

    -- 3. Uji 4 Bucket Storage
    SELECT count(*) INTO v_bucket_count
    FROM storage.buckets
    WHERE id IN ('avatars', 'product-images', 'banners', 'payment-proofs');

    IF v_bucket_count = 4 THEN
        RAISE NOTICE '[OK] 4 Bucket storage berhasil terdaftar (4/4).';
    ELSE
        RAISE EXCEPTION '[FAIL] Bucket storage belum lengkap (%/4 terdaftar).', v_bucket_count;
    END IF;

    -- 4. Uji Seed app_settings
    SELECT count(*) INTO v_settings_count FROM public.app_settings WHERE id = 1;
    IF v_settings_count = 1 THEN
        RAISE NOTICE '[OK] 1 baris awal app_settings berhasil diisi.';
    ELSE
        RAISE EXCEPTION '[FAIL] app_settings belum memiliki baris default (id=1).';
    END IF;

    -- 5. Uji RPC is_username_available
    v_test_avail := public.is_username_available('tokoberkah_123');
    v_test_reserved := public.is_username_available('admin');

    IF v_test_avail = true AND v_test_reserved = false THEN
        RAISE NOTICE '[OK] Fungsi is_username_available() berhasil memvalidasi nama valid & menolak reserved words.';
    ELSE
        RAISE EXCEPTION '[FAIL] is_username_available() gagal pada uji nama valid/reserved.';
    END IF;

    -- 6. Uji Simulasi Nomor Produk Otomatis (Sequential Numbering via Trigger)
    -- Buat baris dummy di auth.users untuk testing transaction rollback
    INSERT INTO auth.users (id, email)
    VALUES (v_test_uid, 'test_be_sprint1@udalink.internal')
    ON CONFLICT (id) DO NOTHING;

    -- Trigger handle_new_user() harus otomatis membuat profiles & memberships
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_test_uid) OR
       NOT EXISTS (SELECT 1 FROM public.memberships WHERE user_id = v_test_uid) THEN
        RAISE EXCEPTION '[FAIL] Trigger handle_new_user gagal membuat profiles atau memberships otomatis.';
    ELSE
        RAISE NOTICE '[OK] Trigger pendaftaran otomatis membuat profiles & memberships dengan payment_code.';
    END IF;

    -- Masukkan produk pertama
    INSERT INTO public.products (user_id, name, affiliate_url)
    VALUES (v_test_uid, 'Produk Uji 1', 'https://shopee.co.id/item-1')
    RETURNING number INTO v_prod1_num;

    -- Masukkan produk kedua
    INSERT INTO public.products (user_id, name, affiliate_url)
    VALUES (v_test_uid, 'Produk Uji 2', 'https://shopee.co.id/item-2')
    RETURNING number INTO v_prod2_num;

    IF v_prod1_num = 1 AND v_prod2_num = 2 THEN
        RAISE NOTICE '[OK] Trigger nomor produk otomatis berhasil: Produk 1 dapat #1, Produk 2 dapat #2.';
    ELSE
        RAISE EXCEPTION '[FAIL] Penomoran produk otomatis tidak sesuai: #% dan #%.', v_prod1_num, v_prod2_num;
    END IF;

    -- Bersihkan data uji
    DELETE FROM auth.users WHERE id = v_test_uid;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'SEMUA PENGUJIAN SPRINT 1 BERHASIL DILALUI DENGAN SUKSES!';
    RAISE NOTICE '==================================================';
END $$;
