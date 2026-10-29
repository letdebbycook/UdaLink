-- ==============================================================================
-- UDALINK DATABASE RPC FUNCTIONS (SPRINT 3 - BE 3.1 - BE 3.4)
-- ==============================================================================
-- Alur Langganan Pro & Fungsi Panel Admin sesuai PRD Bagian 9 & 10
-- ==============================================================================

-- 1. FUNGSI submit_payment
-- Dipanggil oleh affiliator saat upload bukti pembayaran.
-- Menghitung total amount (harga Pro + kode unik) & duration_days di database.
-- Menolak jika sudah ada pembayaran berstatus 'pending'.
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

    -- Validasi input
    IF trim(COALESCE(p_sender_name, '')) = '' THEN
        RAISE EXCEPTION 'Nama pengirim wajib diisi';
    END IF;
    IF trim(COALESCE(p_sender_bank, '')) = '' THEN
        RAISE EXCEPTION 'Bank pengirim wajib diisi';
    END IF;
    IF trim(COALESCE(p_proof_path, '')) = '' THEN
        RAISE EXCEPTION 'Bukti transfer wajib diunggah';
    END IF;

    -- Cek apakah sudah ada pembayaran pending
    SELECT EXISTS (
        SELECT 1 FROM public.payments
        WHERE user_id = v_user_id AND status = 'pending'
    ) INTO v_has_pending;

    IF v_has_pending THEN
        RAISE EXCEPTION 'Kamu masih memiliki pembayaran yang sedang menunggu verifikasi admin';
    END IF;

    -- Ambil pengaturan & payment code
    SELECT pro_price, pro_duration_days INTO v_settings FROM public.app_settings WHERE id = 1;
    SELECT payment_code INTO v_membership FROM public.memberships WHERE user_id = v_user_id;

    IF v_settings.pro_price IS NULL OR v_membership.payment_code IS NULL THEN
        RAISE EXCEPTION 'Pengaturan sistem atau kode pembayaran tidak ditemukan';
    END IF;

    IF lower(trim(COALESCE(p_plan_type, 'monthly'))) = 'yearly' THEN
        v_amount := 249000 + v_membership.payment_code;
        v_duration := 365;
    ELSE
        v_amount := v_settings.pro_price + v_membership.payment_code;
        v_duration := v_settings.pro_duration_days;
    END IF;

    -- Insert ke payments
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


-- 2. FUNGSI admin_review_payment
-- Menyetujui atau menolak pembayaran. Hanya bisa dipanggil oleh Admin.
-- Setujui: pro_until = greatest(now(), pro_until) + durasi
-- Tolak: wajib mengisi alasan penolakan.
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
        -- Setujui pembayaran
        UPDATE public.payments
        SET
            status = 'approved',
            admin_note = p_note,
            reviewed_at = now()
        WHERE id = p_payment_id;

        -- Aktifkan / perpanjang masa Pro pengguna
        UPDATE public.memberships
        SET
            pro_until = greatest(now(), COALESCE(pro_until, now())) + (v_payment.duration_days || ' days')::interval
        WHERE user_id = v_payment.user_id;

    ELSE
        -- Tolak pembayaran (wajib mengisi alasan)
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


-- 3. FUNGSI admin_dashboard_stats
-- Mengambil 4 metrik ringkasan untuk dashboard admin
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

    -- Total Pengguna
    SELECT count(*) INTO v_total_users FROM public.profiles;

    -- Total Pengguna Pro Aktif
    SELECT count(*) INTO v_pro_users
    FROM public.memberships
    WHERE pro_until IS NOT NULL AND pro_until > now();

    -- Total Pembayaran Menunggu Verifikasi
    SELECT count(*) INTO v_pending_payments
    FROM public.payments
    WHERE status = 'pending';

    -- Pemasukan Bulan Ini (Pembayaran approved pada bulan berjalan)
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


-- 4. FUNGSI admin_list_users
-- Menampilkan daftar pengguna beserta email dari auth.users dan jumlah produk
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


-- 5. FUNGSI admin_set_pro
-- Menambah atau mencabut status Pro pengguna secara manual
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
        -- Cabut Pro
        UPDATE public.memberships
        SET pro_until = NULL
        WHERE user_id = p_user_id;
    ELSE
        -- Tambah Pro
        UPDATE public.memberships
        SET pro_until = greatest(now(), COALESCE(pro_until, now())) + (p_days || ' days')::interval
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_pro(UUID, INTEGER) TO authenticated;


-- 6. FUNGSI admin_set_suspended
-- Mengaktifkan atau menonaktifkan akun pengguna
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


-- 7. FUNGSI admin_list_payments
-- Mengambil seluruh daftar pembayaran langganan Pro beserta informasi user profil
CREATE OR REPLACE FUNCTION public.admin_list_payments(p_status TEXT DEFAULT 'all')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_status TEXT := lower(trim(COALESCE(p_status, 'all')));
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat melihat riwayat pembayaran';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', pay.id,
            'user_id', pay.user_id,
            'amount', pay.amount,
            'duration_days', pay.duration_days,
            'sender_name', pay.sender_name,
            'sender_bank', pay.sender_bank,
            'proof_path', pay.proof_path,
            'status', pay.status,
            'admin_note', pay.admin_note,
            'reviewed_at', pay.reviewed_at,
            'created_at', pay.created_at,
            'user', jsonb_build_object(
                'username', COALESCE(p.username, 'unknown'),
                'display_name', COALESCE(p.display_name, 'Pengguna')
            )
        ) ORDER BY pay.created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.payments pay
    LEFT JOIN public.profiles p ON p.id = pay.user_id
    WHERE (
        v_clean_status = 'all' 
        OR pay.status = v_clean_status
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_payments(TEXT) TO authenticated;

