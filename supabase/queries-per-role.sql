-- ==============================================================================
-- UDALINK: QUERY SQL UNTUK SETIAP ROLE & STATUS BERLANGGANAN
-- ==============================================================================
-- File ini menyediakan query yang bisa Anda copy-paste dan jalankan SATU PER SATU
-- sesuai kebutuhan di Supabase SQL Editor.
--
-- Terdapat 2 CARA:
--   [CARA A] UBAH AKUN YANG SUDAH ADA (Cukup masukkan email Anda)
--   [CARA B] BUAT AKUN BARU LANGSUNG DENGAN PASSWORD
-- ==============================================================================


-- ==============================================================================
-- BAGIAN 1: UBAH AKUN YANG SUDAH ADA (Paling Sering Digunakan)
-- (Daftar dulu via halaman /daftar, lalu jalankan query di bawah ini)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1.1 JADIKAN ROLE ADMIN
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'admin@udalink.id'; -- Ganti dengan email target
BEGIN
    UPDATE public.memberships
    SET role = 'admin',
        is_suspended = false
    WHERE user_id = (SELECT id FROM auth.users WHERE email = lower(trim(v_email)));

    RAISE NOTICE '[OK] Akun % sekarang memiliki role ADMIN.', v_email;
END $$;


-- ------------------------------------------------------------------------------
-- 1.2 JADIKAN BERLANGGANAN PRO (1 TAHUN / 365 HARI)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'pro@udalink.id'; -- Ganti dengan email target
BEGIN
    UPDATE public.memberships
    SET role = 'user',
        pro_until = now() + interval '365 days',
        is_suspended = false
    WHERE user_id = (SELECT id FROM auth.users WHERE email = lower(trim(v_email)));

    RAISE NOTICE '[OK] Akun % sekarang aktif PRO (1 Tahun / 365 Hari).', v_email;
END $$;


-- ------------------------------------------------------------------------------
-- 1.3 JADIKAN BERLANGGANAN PLUS / STARTER (30 HARI)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'starter@udalink.id'; -- Ganti dengan email target
BEGIN
    UPDATE public.memberships
    SET role = 'user',
        pro_until = now() + interval '30 days',
        is_suspended = false
    WHERE user_id = (SELECT id FROM auth.users WHERE email = lower(trim(v_email)));

    RAISE NOTICE '[OK] Akun % sekarang aktif PLUS / STARTER (30 Hari).', v_email;
END $$;


-- ------------------------------------------------------------------------------
-- 1.4 JADIKAN AKUN GRATIS (FREE / CABUT PRO)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'free@udalink.id'; -- Ganti dengan email target
BEGIN
    UPDATE public.memberships
    SET role = 'user',
        pro_until = NULL,
        is_suspended = false
    WHERE user_id = (SELECT id FROM auth.users WHERE email = lower(trim(v_email)));

    RAISE NOTICE '[OK] Akun % sekarang kembali ke paket GRATIS (Free).', v_email;
END $$;


-- ------------------------------------------------------------------------------
-- 1.5 SIMULASI LANGGANAN EXPIRED (KEDALUWARSA)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'expired@udalink.id'; -- Ganti dengan email target
BEGIN
    UPDATE public.memberships
    SET role = 'user',
        pro_until = now() - interval '3 days', -- Habis 3 hari lalu
        is_suspended = false
    WHERE user_id = (SELECT id FROM auth.users WHERE email = lower(trim(v_email)));

    RAISE NOTICE '[OK] Akun % di-set masa berlangganannya telah KEDALUWARSA.', v_email;
END $$;


-- ------------------------------------------------------------------------------
-- 1.6 SUSPEND / BLOKIR AKUN
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'suspended@udalink.id'; -- Ganti dengan email target
BEGIN
    UPDATE public.memberships
    SET is_suspended = true
    WHERE user_id = (SELECT id FROM auth.users WHERE email = lower(trim(v_email)));

    RAISE NOTICE '[OK] Akun % sekarang dalam status DISUSPEND / DIBLOKIR.', v_email;
END $$;


-- ------------------------------------------------------------------------------
-- 1.7 BUKA SUSPEND (AKTIFKAN KEMBALI AKUN)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'suspended@udalink.id'; -- Ganti dengan email target
BEGIN
    UPDATE public.memberships
    SET is_suspended = false
    WHERE user_id = (SELECT id FROM auth.users WHERE email = lower(trim(v_email)));

    RAISE NOTICE '[OK] Status suspend akun % telah DICABUT (Aktif kembali).', v_email;
END $$;




-- ==============================================================================
-- BAGIAN 2: BUAT AKUN BARU LANGSUNG LENGKAP (INSTANT SEED PER ROLE)
-- (Bisa langsung dipakai login dengan email & password yang ditentukan)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 2.1 BUAT AKUN ADMIN BARU (admin@udalink.id / Admin@123!)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_uid UUID := 'c0000000-0000-0000-0000-000000000001';
    v_email TEXT := 'admin@udalink.id';
    v_pass TEXT := 'Admin@123!';
BEGIN
    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (v_uid, '00000000-0000-0000-0000-000000000000', v_email, crypt(v_pass, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"adminudalink","display_name":"Super Admin"}'::jsonb,
        now(), now(), 'authenticated', 'authenticated');

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_uid, v_uid, format('{"sub":"%s","email":"%s"}', v_uid, v_email)::jsonb, 'email', v_uid::text, now(), now(), now());

    UPDATE public.profiles SET bio = 'Administrator UdaLink', theme = 'biru', whatsapp = '6281200000001' WHERE id = v_uid;
    UPDATE public.memberships SET role = 'admin', pro_until = NULL, is_suspended = false WHERE user_id = v_uid;

    RAISE NOTICE '[OK] Akun ADMIN siap login: % / %', v_email, v_pass;
END $$;


-- ------------------------------------------------------------------------------
-- 2.2 BUAT AKUN PRO TAHUNAN BARU (pro@udalink.id / ProUser@123!)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_uid UUID := 'c0000000-0000-0000-0000-000000000002';
    v_email TEXT := 'pro@udalink.id';
    v_pass TEXT := 'ProUser@123!';
BEGIN
    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (v_uid, '00000000-0000-0000-0000-000000000000', v_email, crypt(v_pass, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"proudalink","display_name":"Pro Member"}'::jsonb,
        now(), now(), 'authenticated', 'authenticated');

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_uid, v_uid, format('{"sub":"%s","email":"%s"}', v_uid, v_email)::jsonb, 'email', v_uid::text, now(), now(), now());

    UPDATE public.profiles SET bio = 'Member Pro 1 Tahun', theme = 'kuning', whatsapp = '6281200000002' WHERE id = v_uid;
    UPDATE public.memberships SET role = 'user', pro_until = now() + interval '365 days', is_suspended = false WHERE user_id = v_uid;

    RAISE NOTICE '[OK] Akun PRO siap login: % / % (Aktif 365 hari)', v_email, v_pass;
END $$;


-- ------------------------------------------------------------------------------
-- 2.3 BUAT AKUN PLUS / BULANAN BARU (plus@udalink.id / PlusUser@123!)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_uid UUID := 'c0000000-0000-0000-0000-000000000003';
    v_email TEXT := 'plus@udalink.id';
    v_pass TEXT := 'PlusUser@123!';
BEGIN
    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (v_uid, '00000000-0000-0000-0000-000000000000', v_email, crypt(v_pass, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"plusudalink","display_name":"Plus Member"}'::jsonb,
        now(), now(), 'authenticated', 'authenticated');

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_uid, v_uid, format('{"sub":"%s","email":"%s"}', v_uid, v_email)::jsonb, 'email', v_uid::text, now(), now(), now());

    UPDATE public.profiles SET bio = 'Member Plus 30 Hari', theme = 'hijau', whatsapp = '6281200000003' WHERE id = v_uid;
    UPDATE public.memberships SET role = 'user', pro_until = now() + interval '30 days', is_suspended = false WHERE user_id = v_uid;

    RAISE NOTICE '[OK] Akun PLUS siap login: % / % (Aktif 30 hari)', v_email, v_pass;
END $$;


-- ------------------------------------------------------------------------------
-- 2.4 BUAT AKUN GRATIS (FREE) BARU (free@udalink.id / FreeUser@123!)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_uid UUID := 'c0000000-0000-0000-0000-000000000004';
    v_email TEXT := 'free@udalink.id';
    v_pass TEXT := 'FreeUser@123!';
BEGIN
    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
    VALUES (v_uid, '00000000-0000-0000-0000-000000000000', v_email, crypt(v_pass, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        '{"username":"freeudalink","display_name":"Free Member"}'::jsonb,
        now(), now(), 'authenticated', 'authenticated');

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_uid, v_uid, format('{"sub":"%s","email":"%s"}', v_uid, v_email)::jsonb, 'email', v_uid::text, now(), now(), now());

    UPDATE public.profiles SET bio = 'Member Akun Gratis', theme = 'merah', whatsapp = '6281200000004' WHERE id = v_uid;
    UPDATE public.memberships SET role = 'user', pro_until = NULL, is_suspended = false WHERE user_id = v_uid;

    RAISE NOTICE '[OK] Akun GRATIS siap login: % / %', v_email, v_pass;
END $$;


-- ==============================================================================
-- BAGIAN 3: QUERY CEK STATUS SEMUA USER
-- ==============================================================================
-- Jalankan SELECT di bawah ini kapan saja untuk melihat status seluruh akun:
SELECT 
    u.email,
    p.username,
    p.display_name,
    m.role,
    m.pro_until,
    CASE 
        WHEN m.role = 'admin' THEN '👑 ADMIN'
        WHEN m.is_suspended THEN '🚫 SUSPENDED'
        WHEN m.pro_until IS NOT NULL AND m.pro_until > now() THEN '⭐ PRO / PLUS AKTIF'
        WHEN m.pro_until IS NOT NULL AND m.pro_until <= now() THEN '⏰ EXPIRED'
        ELSE '🆓 FREE (GRATIS)'
    END AS status_langganan,
    m.is_suspended
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
JOIN public.memberships m ON m.user_id = u.id
ORDER BY u.created_at DESC;
