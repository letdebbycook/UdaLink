-- ==============================================================================
-- UDALINK: FITUR TAMBAH AKUN ADMIN & MANAJEMEN ROLE ADMIN (RPC)
-- Tanggal: 2026-10-26
-- ==============================================================================

-- 1. FUNGSI public.admin_create_admin
-- Membuat akun admin baru langsung dari panel admin oleh admin yang terotentikasi.
CREATE OR REPLACE FUNCTION public.admin_create_admin(
    p_email TEXT,
    p_password TEXT,
    p_username TEXT,
    p_display_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_clean_email TEXT := lower(trim(p_email));
    v_clean_user TEXT := lower(trim(p_username));
    v_clean_name TEXT := trim(p_display_name);
    v_uid UUID := gen_random_uuid();
BEGIN
    -- 1. Verifikasi bahwa pemanggil adalah admin yang sah
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat membuat akun admin baru.';
    END IF;

    -- 2. Validasi format email
    IF v_clean_email = '' OR v_clean_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Format email tidak valid.';
    END IF;

    -- 3. Validasi panjang password
    IF char_length(p_password) < 8 THEN
        RAISE EXCEPTION 'Password minimal 8 karakter.';
    END IF;

    -- 4. Validasi format username
    IF v_clean_user !~ '^[a-z0-9_]{3,30}$' THEN
        RAISE EXCEPTION 'Username harus 3-30 karakter (hanya huruf kecil, angka, dan underscore).';
    END IF;

    -- 5. Cek apakah email sudah terdaftar
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_clean_email) THEN
        RAISE EXCEPTION 'Email "%" sudah terdaftar di sistem.', v_clean_email;
    END IF;

    -- 6. Cek apakah username sudah dipakai
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_clean_user) THEN
        RAISE EXCEPTION 'Username "@%" sudah digunakan pengguna lain.', v_clean_user;
    END IF;

    IF v_clean_name = '' THEN
        v_clean_name := v_clean_user;
    END IF;

    -- 7. Insert ke auth.users dengan status email langsung terverifikasi
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
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        v_clean_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('username', v_clean_user, 'display_name', v_clean_name),
        now(),
        now(),
        'authenticated',
        'authenticated'
    );

    -- 8. Insert ke auth.identities agar kompatibel dengan sistem autentikasi email GoTrue
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_uid,
        v_uid,
        format('{"sub":"%s","email":"%s"}', v_uid, v_clean_email)::jsonb,
        'email',
        v_uid::text,
        now(),
        now(),
        now()
    );

    -- 9. Pastikan profiles dan memberships memiliki data dan role admin
    -- (Trigger on_auth_user_created sudah otomatis membuat baris awal)
    UPDATE public.profiles
    SET display_name = v_clean_name,
        bio = 'Administrator UdaLink'
    WHERE id = v_uid;

    UPDATE public.memberships
    SET role = 'admin',
        pro_until = NULL,
        is_suspended = false
    WHERE user_id = v_uid;

    -- Kembalikan respons berhasil
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_uid,
        'email', v_clean_email,
        'username', v_clean_user,
        'display_name', v_clean_name,
        'role', 'admin'
    );
END;
$$;

-- Berikan izin eksekusi kepada pengguna yang terautentikasi (keamanan divalidasi oleh is_admin())
GRANT EXECUTE ON FUNCTION public.admin_create_admin(TEXT, TEXT, TEXT, TEXT) TO authenticated;


-- 2. FUNGSI public.admin_set_role
-- Mengubah role pengguna (misal mengangkat user menjadi admin atau mencabut akses admin)
CREATE OR REPLACE FUNCTION public.admin_set_role(
    p_user_id UUID,
    p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Verifikasi bahwa pemanggil adalah admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat mengubah peran pengguna.';
    END IF;

    -- 2. Validasi nilai role
    IF p_role NOT IN ('admin', 'user') THEN
        RAISE EXCEPTION 'Role tidak valid. Pilihan hanya "admin" atau "user".';
    END IF;

    -- 3. Cegah admin mencabut hak admin dirinya sendiri agar tidak terkunci
    IF p_user_id = auth.uid() AND p_role != 'admin' THEN
        RAISE EXCEPTION 'Anda tidak dapat mencabut peran admin dari akun Anda sendiri.';
    END IF;

    -- 4. Update role pada memberships
    UPDATE public.memberships
    SET role = p_role
    WHERE user_id = p_user_id;
END;
$$;

-- Berikan izin eksekusi kepada pengguna yang terautentikasi
GRANT EXECUTE ON FUNCTION public.admin_set_role(UUID, TEXT) TO authenticated;
