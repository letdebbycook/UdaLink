-- ==============================================================================
-- PATCH PERBAIKAN DEFECT P0 / S1 (UDALINK)
-- Tanggal: 13 November 2026
-- 1. S1-02: Konsolidasi get_my_plan() kanonik (persistent payment_code + payment_methods)
-- 2. S1-03: Eliminasi ambigu overload submit_payment (drop versi 3-argumen)
-- ==============================================================================

-- 1. DROP overload lama submit_payment agar tidak memicu error PGRST203 ambigu
DROP FUNCTION IF EXISTS public.submit_payment(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.submit_payment(TEXT, TEXT, TEXT, TEXT);

-- 2. RE-CREATE fungsi submit_payment kanonik dengan 4 argumen & default 'monthly'
CREATE OR REPLACE FUNCTION public.submit_payment(
    p_sender_name TEXT,
    p_sender_bank TEXT,
    p_proof_path TEXT,
    p_plan_type TEXT DEFAULT 'monthly'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_membership RECORD;
    v_settings RECORD;
    v_amount INTEGER;
    v_duration INTEGER;
    v_new_payment_id UUID;
    v_has_pending BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: user belum login';
    END IF;

    IF trim(COALESCE(p_sender_name, '')) = '' THEN
        RAISE EXCEPTION 'Nama pengirim wajib diisi';
    END IF;
    IF trim(COALESCE(p_sender_bank, '')) = '' THEN
        RAISE EXCEPTION 'Bank pengirim wajib diisi';
    END IF;
    IF trim(COALESCE(p_proof_path, '')) = '' THEN
        RAISE EXCEPTION 'Bukti transfer wajib diunggah';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.payments
        WHERE user_id = v_user_id AND status = 'pending'
    ) INTO v_has_pending;

    IF v_has_pending THEN
        RAISE EXCEPTION 'Kamu masih memiliki pembayaran yang sedang menunggu verifikasi admin';
    END IF;

    SELECT pro_price, pro_duration_days INTO v_settings FROM public.app_settings WHERE id = 1;
    SELECT payment_code INTO v_membership FROM public.memberships WHERE user_id = v_user_id;

    IF v_settings.pro_price IS NULL OR v_membership.payment_code IS NULL THEN
        RAISE EXCEPTION 'Pengaturan sistem atau kode pembayaran tidak ditemukan';
    END IF;

    IF lower(trim(COALESCE(p_plan_type, 'monthly'))) = 'yearly' THEN
        -- Paket tahunan Rp 249.000 + payment_code (hemat 28%, durasi 365 hari)
        v_amount := 249000 + v_membership.payment_code;
        v_duration := 365;
    ELSE
        v_amount := v_settings.pro_price + v_membership.payment_code;
        v_duration := v_settings.pro_duration_days;
    END IF;

    INSERT INTO public.payments (
        user_id,
        amount,
        duration_days,
        sender_name,
        sender_bank,
        proof_path,
        status
    ) VALUES (
        v_user_id,
        v_amount,
        v_duration,
        trim(p_sender_name),
        trim(p_sender_bank),
        trim(p_proof_path),
        'pending'
    )
    RETURNING id INTO v_new_payment_id;

    RETURN v_new_payment_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_payment(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. DROP & RE-CREATE get_my_plan() kanonik
DROP FUNCTION IF EXISTS public.get_my_plan();
CREATE OR REPLACE FUNCTION public.get_my_plan()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_membership RECORD;
    v_settings RECORD;
    v_product_count INTEGER;
    v_is_pro BOOLEAN;
    v_payment_code INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: user belum login';
    END IF;

    SELECT role, pro_until, is_suspended, payment_code
    INTO v_membership
    FROM public.memberships
    WHERE user_id = v_user_id;

    SELECT pro_price, pro_duration_days, free_product_limit,
           bank_name, bank_account_number, bank_account_name, admin_whatsapp,
           payment_methods
    INTO v_settings
    FROM public.app_settings
    WHERE id = 1;

    -- Hitung produk aktif milik user
    SELECT count(*) INTO v_product_count
    FROM public.products
    WHERE user_id = v_user_id AND is_active = true;

    v_is_pro := (v_membership.pro_until IS NOT NULL AND v_membership.pro_until > now());

    -- Gunakan kode pembayaran unik yang persisten jika belum terisi
    IF v_membership.payment_code IS NULL THEN
        v_payment_code := floor(random() * 900 + 100)::integer;
        UPDATE public.memberships SET payment_code = v_payment_code WHERE user_id = v_user_id;
    ELSE
        v_payment_code := v_membership.payment_code;
    END IF;

    RETURN jsonb_build_object(
        'role', v_membership.role,
        'is_pro', v_is_pro,
        'pro_until', v_membership.pro_until,
        'is_suspended', v_membership.is_suspended,
        'payment_code', v_payment_code,
        'product_count', v_product_count,
        'free_product_limit', v_settings.free_product_limit,
        'pro_price', v_settings.pro_price,
        'pro_duration_days', v_settings.pro_duration_days,
        'bank_name', v_settings.bank_name,
        'bank_account_number', v_settings.bank_account_number,
        'bank_account_name', v_settings.bank_account_name,
        'admin_whatsapp', v_settings.admin_whatsapp,
        'payment_methods', COALESCE(v_settings.payment_methods, '[]'::jsonb)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_plan() TO authenticated;

