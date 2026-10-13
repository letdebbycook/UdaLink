-- ==============================================================================
-- FIX LOGIN NANDO AFFILIATOR (Supabase GoTrue Auth)
-- ==============================================================================
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor untuk mengatasi
-- error "Database error querying schema" saat login dengan nando@udalink.id
-- ==============================================================================

DO $$
DECLARE
    v_nando_id UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Bersihkan identitas lama
    DELETE FROM auth.identities WHERE user_id = v_nando_id;
    
    -- 2. Pastikan akun nando di auth.users lengkap & terkonfirmasi
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
    )
    ON CONFLICT (id) DO UPDATE SET
        encrypted_password = crypt('password123', gen_salt('bf')),
        email_confirmed_at = now(),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"username":"nando","display_name":"Nando Affiliator"}'::jsonb,
        updated_at = now();

    -- 3. Masukkan ke auth.identities (Kunci utama agar Supabase Auth bisa login)
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
        v_nando_id,
        v_nando_id,
        format('{"sub":"%s","email":"%s"}', v_nando_id, 'nando@udalink.id')::jsonb,
        'email',
        v_nando_id::text,
        now(),
        now(),
        now()
    );

    -- 4. Pastikan status keanggotaan Pro aktif 30 hari
    UPDATE public.memberships
    SET pro_until = now() + interval '30 days',
        is_suspended = false
    WHERE user_id = v_nando_id;

    RAISE NOTICE '[SUKSES] Akun nando@udalink.id telah diperbaiki dan siap login!';
END;
$$;
