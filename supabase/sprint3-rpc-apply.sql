-- ==============================================================================
-- 8. FUNGSI DATABASE (RPC) PEMBAYARAN & PANEL ADMIN (SPRINT 3)
-- ==============================================================================

-- 8.1 submit_payment
CREATE OR REPLACE FUNCTION public.submit_payment(
    p_sender_name TEXT,
    p_sender_bank TEXT,
    p_proof_path TEXT
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

    v_amount := v_settings.pro_price + v_membership.payment_code;

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
        v_settings.pro_duration_days,
        trim(p_sender_name),
        trim(p_sender_bank),
        trim(p_proof_path),
        'pending'
    )
    RETURNING id INTO v_new_payment_id;

    RETURN v_new_payment_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_payment(TEXT, TEXT, TEXT) TO authenticated;

-- 8.2 admin_review_payment
CREATE OR REPLACE FUNCTION public.admin_review_payment(
    p_payment_id UUID,
    p_approve BOOLEAN,
    p_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat meninjau pembayaran';
    END IF;

    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data pembayaran tidak ditemukan';
    END IF;

    IF v_payment.status != 'pending' THEN
        RAISE EXCEPTION 'Pembayaran ini sudah pernah diproses sebelumnya (%)', v_payment.status;
    END IF;

    IF p_approve IS TRUE THEN
        UPDATE public.payments
        SET
            status = 'approved',
            admin_note = p_note,
            reviewed_at = now()
        WHERE id = p_payment_id;

        UPDATE public.memberships
        SET
            pro_until = greatest(now(), COALESCE(pro_until, now())) + (v_payment.duration_days || ' days')::interval
        WHERE user_id = v_payment.user_id;
    ELSE
        IF trim(COALESCE(p_note, '')) = '' THEN
            RAISE EXCEPTION 'Alasan penolakan wajib diisi';
        END IF;

        UPDATE public.payments
        SET
            status = 'rejected',
            admin_note = trim(p_note),
            reviewed_at = now()
        WHERE id = p_payment_id;
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_review_payment(UUID, BOOLEAN, TEXT) TO authenticated;

-- 8.3 admin_dashboard_stats
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_users BIGINT;
    v_pro_users BIGINT;
    v_pending_payments BIGINT;
    v_monthly_revenue BIGINT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    SELECT count(*) INTO v_total_users FROM public.profiles;

    SELECT count(*) INTO v_pro_users
    FROM public.memberships
    WHERE pro_until IS NOT NULL AND pro_until > now();

    SELECT count(*) INTO v_pending_payments
    FROM public.payments
    WHERE status = 'pending';

    SELECT COALESCE(sum(amount), 0) INTO v_monthly_revenue
    FROM public.payments
    WHERE status = 'approved'
      AND created_at >= date_trunc('month', now());

    RETURN jsonb_build_object(
        'total_users', v_total_users,
        'pro_users', v_pro_users,
        'pending_payments', v_pending_payments,
        'monthly_revenue', v_monthly_revenue
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

-- 8.4 admin_list_users
CREATE OR REPLACE FUNCTION public.admin_list_users(p_search TEXT DEFAULT '')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_search TEXT := lower(trim(COALESCE(p_search, '')));
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'username', p.username,
            'display_name', p.display_name,
            'role', m.role,
            'is_pro', (m.pro_until IS NOT NULL AND m.pro_until > now()),
            'pro_until', m.pro_until,
            'is_suspended', m.is_suspended,
            'product_count', COALESCE(prod.cnt, 0),
            'created_at', p.created_at
        ) ORDER BY p.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    JOIN public.memberships m ON m.user_id = p.id
    LEFT JOIN (
        SELECT user_id, count(*) AS cnt
        FROM public.products
        GROUP BY user_id
    ) prod ON prod.user_id = p.id
    WHERE (
        v_clean_search = ''
        OR lower(p.username) LIKE '%' || v_clean_search || '%'
        OR lower(u.email) LIKE '%' || v_clean_search || '%'
        OR lower(p.display_name) LIKE '%' || v_clean_search || '%'
    );

    RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT) TO authenticated;

-- 8.5 admin_set_pro
CREATE OR REPLACE FUNCTION public.admin_set_pro(
    p_user_id UUID,
    p_days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    IF p_days <= 0 THEN
        UPDATE public.memberships
        SET pro_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.memberships
        SET pro_until = greatest(now(), COALESCE(pro_until, now())) + (p_days || ' days')::interval
        WHERE user_id = p_user_id;
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_pro(UUID, INTEGER) TO authenticated;

-- 8.6 admin_set_suspended
CREATE OR REPLACE FUNCTION public.admin_set_suspended(
    p_user_id UUID,
    p_value BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin';
    END IF;

    UPDATE public.memberships
    SET is_suspended = p_value
    WHERE user_id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_suspended(UUID, BOOLEAN) TO authenticated;


