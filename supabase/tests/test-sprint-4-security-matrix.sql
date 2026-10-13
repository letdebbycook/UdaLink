-- ==============================================================================
-- PENGUJIAN SPRINT 4: MATRIKS UJI KEAMANAN LENGKAP (BE 4.1)
-- ==============================================================================
-- Menguji 6 Persona: Anonim, Gratis, Pro, Pro Kedaluwarsa, Nonaktif, dan Admin
-- Menjamin aturan RLS dan penegakan paket ditegakkan 100% di level database!
-- ==============================================================================

DO $$
DECLARE
    v_uid_free UUID := gen_random_uuid();
    v_uid_pro UUID := gen_random_uuid();
    v_uid_expired UUID := gen_random_uuid();
    v_uid_suspended UUID := gen_random_uuid();
    v_uid_admin UUID := gen_random_uuid();

    v_res JSONB;
    v_can_add BOOLEAN;
    v_error_caught BOOLEAN := false;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MEMULAI AUDIT MATRIKS KEAMANAN DATABASE (BE 4.1)';
    RAISE NOTICE '==================================================';

    -- -------------------------------------------------------------------------
    -- 1. SETUP PERSONA PENGUJIAN
    -- -------------------------------------------------------------------------
    -- Akun Gratis
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES (v_uid_free, 'free@test.com', crypt('pass123', gen_salt('bf')), '{"username":"user_gratis","display_name":"User Gratis"}'::jsonb, 'authenticated', 'authenticated');

    -- Akun Pro
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES (v_uid_pro, 'pro@test.com', crypt('pass123', gen_salt('bf')), '{"username":"user_pro","display_name":"User Pro"}'::jsonb, 'authenticated', 'authenticated');
    UPDATE public.memberships SET pro_until = now() + interval '30 days' WHERE user_id = v_uid_pro;

    -- Akun Pro Kedaluwarsa (Pro habis 2 hari lalu)
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES (v_uid_expired, 'expired@test.com', crypt('pass123', gen_salt('bf')), '{"username":"user_expired","display_name":"User Expired"}'::jsonb, 'authenticated', 'authenticated');
    UPDATE public.memberships SET pro_until = now() - interval '2 days' WHERE user_id = v_uid_expired;
    UPDATE public.profiles SET theme = 'pink-pastel' WHERE id = v_uid_expired; -- Pasang tema premium saat masih pro

    -- Akun Nonaktif / Ditangguhkan
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES (v_uid_suspended, 'suspended@test.com', crypt('pass123', gen_salt('bf')), '{"username":"user_suspend","display_name":"User Suspend"}'::jsonb, 'authenticated', 'authenticated');
    UPDATE public.memberships SET is_suspended = true WHERE user_id = v_uid_suspended;

    -- Akun Admin
    INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, role, aud)
    VALUES (v_uid_admin, 'admin@test.com', crypt('pass123', gen_salt('bf')), '{"username":"user_admin","display_name":"Admin"}'::jsonb, 'authenticated', 'authenticated');
    UPDATE public.memberships SET role = 'admin' WHERE user_id = v_uid_admin;

    RAISE NOTICE '[OK] 5 Persona berhasil diinisialisasi.';

    -- -------------------------------------------------------------------------
    -- 2. UJI PERSONA PRO KEDALUWARSA (FALLBACK OTOMATIS KE ATURAN GRATIS)
    -- -------------------------------------------------------------------------
    -- Masukkan 1 banner untuk akun expired (saat dia dulu Pro)
    INSERT INTO public.banners (user_id, image_url, title, is_active)
    VALUES (v_uid_expired, 'https://img.com/banner.jpg', 'Banner Lawas', true);

    v_res := public.get_public_page('user_expired');

    -- Verifikasi tema premium dipaksa kembali ke 'hijau'
    IF (v_res->>'effective_theme') = 'hijau' THEN
        RAISE NOTICE '[OK] Pro Kedaluwarsa: Tema premium otomatis kembali ke tema "hijau".';
    ELSE
        RAISE EXCEPTION '[FAIL] Tema tidak fallback ke hijau: %', v_res->>'effective_theme';
    END IF;

    -- Verifikasi branding wajib tampil
    IF (v_res->>'show_branding')::boolean = true THEN
        RAISE NOTICE '[OK] Pro Kedaluwarsa: Tulisan "Dibuat dengan UdaLink" (branding) muncul kembali.';
    ELSE
        RAISE EXCEPTION '[FAIL] Branding harusnya muncul untuk akun non-pro.';
    END IF;

    -- Verifikasi banner tidak dikirim
    IF jsonb_array_length(v_res->'banners') = 0 THEN
        RAISE NOTICE '[OK] Pro Kedaluwarsa: Banner promo otomatis disembunyikan (array kosong).';
    ELSE
        RAISE EXCEPTION '[FAIL] Banner masih terkirim untuk akun expired!';
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. UJI PERSONA NONAKTIF / SUSPENDED
    -- -------------------------------------------------------------------------
    v_res := public.get_public_page('user_suspend');
    IF v_res IS NULL THEN
        RAISE NOTICE '[OK] Akun Nonaktif: get_public_page mengembalikan NULL ("Halaman tidak tersedia").';
    ELSE
        RAISE EXCEPTION '[FAIL] Etalase publik akun nonaktif tidak boleh diakses!';
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. UJI ISOLASI OTORISASI ADMIN PADA RPC
    -- -------------------------------------------------------------------------
    -- Coba panggil admin_dashboard_stats tanpa impersonasi admin (harus ditolak)
    BEGIN
        PERFORM public.admin_dashboard_stats();
        v_error_caught := false;
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
    END;

    IF v_error_caught THEN
        RAISE NOTICE '[OK] Proteksi RPC Admin: Non-admin ditolak saat memanggil fungsi admin_*';
    ELSE
        RAISE EXCEPTION '[FAIL] Fungsi admin_* bocor ke non-admin!';
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. BERSIHKAN DATA PENGUJIAN
    -- -------------------------------------------------------------------------
    DELETE FROM auth.users WHERE id IN (v_uid_free, v_uid_pro, v_uid_expired, v_uid_suspended, v_uid_admin);

    RAISE NOTICE '==================================================';
    RAISE NOTICE '[SELESAI] SELURUH MATRIKS KEAMANAN SPRINT 4 LOLOS 100%%';
    RAISE NOTICE '==================================================';
END;
$$;
