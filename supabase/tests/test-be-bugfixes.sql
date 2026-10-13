-- ==============================================================================
-- PENGUJIAN PERBAIKAN BACKEND (BE BUGFIX TEST SUITE)
-- ==============================================================================
-- Jalankan di SQL Editor Supabase setelah mengeksekusi be-bugfix-patch.sql
-- ==============================================================================

DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_user_id UUID := gen_random_uuid();
    v_payment_id UUID;
    v_payments_json JSONB;
    v_fk_count INTEGER;
    v_saved_wa TEXT;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MEMULAI PENGUJIAN PERBAIKAN BACKEND (BE)';
    RAISE NOTICE '==================================================';

    -- 1. UJI CONSTRAINT FOREIGN KEY (payments -> profiles)
    SELECT count(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_user_id_fkey' AND table_name = 'payments';

    IF v_fk_count > 0 THEN
        RAISE NOTICE '[OK] Test 1: Constraint payments_user_id_fkey terdaftar di tabel payments.';
    ELSE
        RAISE EXCEPTION '[FAIL] Test 1: Constraint payments_user_id_fkey belum ada!';
    END IF;

    -- 2. UJI TRIGGER NORMALISASI WHATSAPP PADA app_settings
    -- Uji coba update dengan format awalan '08' dan karakter non-digit
    UPDATE public.app_settings
    SET admin_whatsapp = '+0812-3456-7890'
    WHERE id = 1;

    SELECT admin_whatsapp INTO v_saved_wa FROM public.app_settings WHERE id = 1;

    IF v_saved_wa = '6281234567890' THEN
        RAISE NOTICE '[OK] Test 2: Trigger trg_normalize_admin_whatsapp berhasil (+08... diubah menjadi %)', v_saved_wa;
    ELSE
        RAISE EXCEPTION '[FAIL] Test 2: Hasil normalisasi tidak sesuai ekspektasi: %', v_saved_wa;
    END IF;

    -- Kembalikan ke nomor default semula
    UPDATE public.app_settings
    SET admin_whatsapp = '628123456789'
    WHERE id = 1;

    -- 3. SIAPKAN USER & PEMBAYARAN UJI COBA
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES
    (v_admin_id, 'admin_patch@udalink.id', crypt('admin123', gen_salt('bf')), '{"username":"admin_patch","display_name":"Admin Patch"}'::jsonb, 'authenticated', 'authenticated'),
    (v_user_id, 'user_patch@udalink.id', crypt('user123', gen_salt('bf')), '{"username":"user_patch","display_name":"User Patch"}'::jsonb, 'authenticated', 'authenticated');

    UPDATE public.memberships SET role = 'admin' WHERE user_id = v_admin_id;

    INSERT INTO public.payments (user_id, amount, duration_days, sender_name, sender_bank, proof_path, status)
    VALUES (v_user_id, 29123, 30, 'User Patch Test', 'BCA', v_user_id || '/patch_test.webp', 'pending')
    RETURNING id INTO v_payment_id;

    -- 4. UJI QUERY DATA PEMBAYARAN & RELASI PROFIL
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', pay.id,
            'amount', pay.amount,
            'user', jsonb_build_object(
                'username', p.username,
                'display_name', p.display_name
            )
        )
    )
    INTO v_payments_json
    FROM public.payments pay
    LEFT JOIN public.profiles p ON p.id = pay.user_id
    WHERE pay.id = v_payment_id;

    IF v_payments_json->0->'user'->>'username' = 'user_patch' THEN
        RAISE NOTICE '[OK] Test 3: Relasi pembayaran ke profil berhasil menggabungkan data username & display_name.';
    ELSE
        RAISE EXCEPTION '[FAIL] Test 3: Gagal mengambil relasi user pada pembayaran: %', v_payments_json;
    END IF;

    -- 5. BERSIHKAN DATA UJI COBA
    DELETE FROM public.payments WHERE id = v_payment_id;
    DELETE FROM auth.users WHERE id IN (v_admin_id, v_user_id);

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'SEMUA PENGUJIAN PERBAIKAN BACKEND (BE) BERHASIL!';
    RAISE NOTICE '==================================================';
END $$;
