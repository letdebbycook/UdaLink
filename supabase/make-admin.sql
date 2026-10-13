-- ==============================================================================
-- UDALINK: HELPER SQL — JADIKAN AKUN ADMIN (BE 2.4)
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor Supabase untuk mengubah role user menjadi admin.
--
-- CARA PAKAI:
--   1. Ganti 'email@contoh.com' dengan email akun yang ingin dijadikan admin.
--   2. Jalankan di Supabase SQL Editor (Dashboard > SQL Editor > New Query).
--   3. Cek output NOTICE untuk konfirmasi.
-- ==============================================================================

DO $$
DECLARE
    v_target_email TEXT := 'email@contoh.com'; -- <<< GANTI INI
    v_user_id UUID;
    v_current_role TEXT;
BEGIN
    -- Cari user berdasarkan email di auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = lower(trim(v_target_email));

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User dengan email "%" tidak ditemukan di sistem.', v_target_email;
    END IF;

    -- Cek role sekarang
    SELECT role INTO v_current_role
    FROM public.memberships
    WHERE user_id = v_user_id;

    IF v_current_role IS NULL THEN
        RAISE EXCEPTION 'Membership untuk user "%" tidak ditemukan. Pastikan trigger handle_new_user sudah berjalan.', v_target_email;
    END IF;

    IF v_current_role = 'admin' THEN
        RAISE NOTICE '[INFO] User "%" (%) sudah memiliki role admin. Tidak ada perubahan.', v_target_email, v_user_id;
    ELSE
        -- Ubah role ke admin dan pastikan tidak disuspend
        UPDATE public.memberships
        SET
            role = 'admin',
            is_suspended = false
        WHERE user_id = v_user_id;

        RAISE NOTICE '[OK] Berhasil! User "%" (%) sekarang memiliki role admin.', v_target_email, v_user_id;
        RAISE NOTICE '     Akun dapat mengakses /admin dan semua RPC admin_.';
    END IF;
END;
$$;

-- ==============================================================================
-- UNTUK MENCABUT HAK ADMIN (kembalikan ke role user biasa):
-- ==============================================================================
-- DO $$
-- DECLARE
--     v_target_email TEXT := 'email@contoh.com'; -- <<< GANTI INI
--     v_user_id UUID;
-- BEGIN
--     SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(v_target_email));
--     IF v_user_id IS NULL THEN RAISE EXCEPTION 'User tidak ditemukan'; END IF;
--
--     UPDATE public.memberships SET role = 'user' WHERE user_id = v_user_id;
--     RAISE NOTICE '[OK] Hak admin dicabut dari "%".', v_target_email;
-- END;
-- $$;
