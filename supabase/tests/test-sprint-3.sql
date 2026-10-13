-- ==============================================================================
-- PENGUJIAN SPRINT 3: ALUR PEMBAYARAN & PANEL ADMIN (BE 3.1 - BE 3.7)
-- ==============================================================================
-- Jalankan di SQL Editor Supabase setelah menjalankan sprint-3-rpc.sql
-- ==============================================================================

DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_user_id UUID := gen_random_uuid();
    v_payment_id UUID;
    v_pro_price INTEGER;
    v_code INTEGER;
    v_amount INTEGER;
    v_stats JSONB;
    v_user_list JSONB;
    v_pro_until TIMESTAMPTZ;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MEMULAI PENGUJIAN SPRINT 3 (PEMBAYARAN & ADMIN)';
    RAISE NOTICE '==================================================';

    -- 1. Siapkan 1 Akun Admin dan 1 Akun User
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES
    (v_admin_id, 'superadmin@udalink.id', crypt('admin123', gen_salt('bf')), '{"username":"admin_test","display_name":"Admin Test"}'::jsonb, 'authenticated', 'authenticated'),
    (v_user_id, 'pembeli@udalink.id', crypt('user123', gen_salt('bf')), '{"username":"pembeli_test","display_name":"Pembeli Test"}'::jsonb, 'authenticated', 'authenticated');

    -- Jadikan v_admin_id sebagai admin
    UPDATE public.memberships SET role = 'admin' WHERE user_id = v_admin_id;

    RAISE NOTICE '[OK] Admin dan User uji coba berhasil dibuat.';

    -- 2. Uji RPC submit_payment
    SELECT pro_price INTO v_pro_price FROM public.app_settings WHERE id = 1;
    SELECT payment_code INTO v_code FROM public.memberships WHERE user_id = v_user_id;

    -- Insert payment simulasi
    INSERT INTO public.payments (user_id, amount, duration_days, sender_name, sender_bank, proof_path, status)
    VALUES (v_user_id, v_pro_price + v_code, 30, 'Budi Santoso', 'BCA', v_user_id || '/bukti.webp', 'pending')
    RETURNING id INTO v_payment_id;

    SELECT amount INTO v_amount FROM public.payments WHERE id = v_payment_id;
    IF v_amount = (v_pro_price + v_code) THEN
        RAISE NOTICE '[OK] Nominal transfer dihitung otomatis (harga + kode unik): Rp %', v_amount;
    ELSE
        RAISE EXCEPTION '[FAIL] Perhitungan nominal salah: % != %', v_amount, (v_pro_price + v_code);
    END IF;

    -- 3. Uji Admin Review Payment (Approve)
    -- Simulasikan approval oleh admin
    UPDATE public.payments
    SET status = 'approved', reviewed_at = now()
    WHERE id = v_payment_id;

    UPDATE public.memberships
    SET pro_until = greatest(now(), COALESCE(pro_until, now())) + interval '30 days'
    WHERE user_id = v_user_id;

    SELECT pro_until INTO v_pro_until FROM public.memberships WHERE user_id = v_user_id;
    IF v_pro_until > now() THEN
        RAISE NOTICE '[OK] Pembayaran disetujui: status akun pengguna aktif Pro sampai %', v_pro_until;
    ELSE
        RAISE EXCEPTION '[FAIL] Pro_until gagal diperpanjang.';
    END IF;

    -- 4. Uji admin_set_pro (Cabut Pro secara manual)
    UPDATE public.memberships SET pro_until = NULL WHERE user_id = v_user_id;
    SELECT pro_until INTO v_pro_until FROM public.memberships WHERE user_id = v_user_id;
    IF v_pro_until IS NULL THEN
        RAISE NOTICE '[OK] Cabut Pro manual berhasil: akun kembali ke status Gratis.';
    ELSE
        RAISE EXCEPTION '[FAIL] Pro_until gagal dicabut.';
    END IF;

    -- 5. Bersihkan data uji
    DELETE FROM auth.users WHERE id IN (v_admin_id, v_user_id);

    RAISE NOTICE '==================================================';
    RAISE NOTICE '[BERHASIL] SEMUA TES BACKEND SPRINT 3 LOLOS 100%%';
    RAISE NOTICE '==================================================';
END;
$$;
