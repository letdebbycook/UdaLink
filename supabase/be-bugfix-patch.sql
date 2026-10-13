-- ==============================================================================
-- UDALINK DATABASE BUGFIX & IMPROVEMENT PATCH (BACKEND)
-- ==============================================================================
-- File patch mandiri untuk memperbaiki relasi PostgREST, RLS Admin, 
-- RPC admin_list_payments, dan sanitasi format nomor WhatsApp.
-- Jalankan skrip ini di SQL Editor Supabase.
-- ==============================================================================

-- 1. FOREIGN KEY CONSTRAINT: payments -> profiles
-- Menambahkan relasi eksplisit agar schema cache PostgREST dapat mengenali
-- relasi antara tabel payments dan profiles untuk query bertingkat.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_user_id_fkey' AND table_name = 'payments'
    ) THEN
        ALTER TABLE public.payments
        ADD CONSTRAINT payments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 2. RLS POLICY: profiles (Izinkan Pemilik dan Admin)
-- Memperbarui policy SELECT pada public.profiles agar Admin dapat membaca 
-- informasi profil seluruh pengguna, selaras dengan policy memberships dan payments.
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_admin());


-- 3. RPC FUNCTION: admin_list_payments(p_status TEXT DEFAULT 'all')
-- Mengambil seluruh daftar pembayaran langganan Pro beserta informasi username & 
-- nama affiliator. Didesain dengan SECURITY DEFINER dan pengecekan is_admin().
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
    -- Guard hak akses admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat melihat riwayat pembayaran';
    END IF;

    -- Ambil daftar pembayaran dan gabungkan dengan informasi profil
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


-- 4. TRIGGER NORMALISASI: app_settings.admin_whatsapp
-- Secara otomatis mengubah nomor '08...' menjadi '628...' serta membuang spasi, 
-- tanda plus, atau strip sebelum constraint CHECK (admin_whatsapp ~ '^62[0-9]+$') dievaluasi.
CREATE OR REPLACE FUNCTION public.handle_normalize_admin_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cleaned TEXT;
BEGIN
    IF NEW.admin_whatsapp IS NOT NULL THEN
        -- Bersihkan semua karakter selain angka
        v_cleaned := regexp_replace(NEW.admin_whatsapp, '[^0-9]', '', 'g');

        -- Jika diawali '08', konversi ke awalan '628'
        IF v_cleaned LIKE '08%' THEN
            v_cleaned := '62' || substr(v_cleaned, 2);
        END IF;

        NEW.admin_whatsapp := v_cleaned;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_admin_whatsapp ON public.app_settings;
CREATE TRIGGER trg_normalize_admin_whatsapp
    BEFORE INSERT OR UPDATE OF admin_whatsapp ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_normalize_admin_whatsapp();

-- Notifikasi selesai
DO $$
BEGIN
    RAISE NOTICE 'Patch Backend UdaLink berhasil diaplikasikan secara penuh.';
END $$;
