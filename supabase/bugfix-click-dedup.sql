-- ==============================================================================
-- BUGFIX PATCH: Click Deduplication & Server-side Security
-- Tanggal: 2026-10-26
-- Masalah: Klik berulang dari browser yang sama (session) semua terhitung.
-- Fix: Tambah kolom session_id pada clicks + fungsi record_click melakukan
--      dedup berdasarkan (product_id, session_id) dalam window 60 menit.
-- ==============================================================================

-- 1. Tambah kolom session_id pada tabel clicks (jika belum ada)
ALTER TABLE public.clicks
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_hint TEXT; -- best-effort anonymized IP

-- 2. Index partial untuk deduplication query yang cepat
CREATE INDEX IF NOT EXISTS idx_clicks_dedup
  ON public.clicks (product_id, session_id, created_at)
  WHERE session_id IS NOT NULL;

-- 3. Fungsi record_click dengan deduplication 60 menit per sesi
-- PENTING: Drop fungsi lama 1-parameter agar PostgREST tidak bentrok (PGRST203)
DROP FUNCTION IF EXISTS public.record_click(UUID);

CREATE OR REPLACE FUNCTION public.record_click(
  p_product_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product  RECORD;
  v_count    INT := 0;
BEGIN
  -- Ambil info produk dan status penangguhan akun pemilik
  SELECT p.id, p.user_id, p.affiliate_url, p.marketplace, p.is_active, m.is_suspended
  INTO v_product
  FROM public.products p
  JOIN public.memberships m ON m.user_id = p.user_id
  WHERE p.id = p_product_id;

  -- Validasi: produk ada, aktif, dan akun pemilik tidak dinonaktifkan
  IF NOT FOUND OR v_product.is_active IS NOT TRUE OR v_product.is_suspended IS TRUE THEN
    RETURN NULL;
  END IF;

  -- Deduplication: cek apakah session yang sama sudah klik dalam 60 menit terakhir
  IF p_session_id IS NOT NULL AND length(p_session_id) > 0 THEN
    SELECT COUNT(*) INTO v_count
    FROM public.clicks
    WHERE product_id = v_product.id
      AND session_id = p_session_id
      AND created_at > (now() - INTERVAL '60 minutes');

    IF v_count > 0 THEN
      -- Sudah pernah klik: kembalikan URL tanpa insert klik baru
      RETURN jsonb_build_object(
        'affiliate_url', v_product.affiliate_url,
        'marketplace',   v_product.marketplace,
        'deduplicated',  true
      );
    END IF;
  END IF;

  -- Catat klik
  INSERT INTO public.clicks (product_id, owner_id, session_id)
  VALUES (v_product.id, v_product.user_id, p_session_id);

  -- Kembalikan URL affiliate dan marketplace
  RETURN jsonb_build_object(
    'affiliate_url', v_product.affiliate_url,
    'marketplace',   v_product.marketplace,
    'deduplicated',  false
  );
END;
$$;

-- Berikan izin akses ke anon dan authenticated (tetap sama)
GRANT EXECUTE ON FUNCTION public.record_click(UUID, TEXT) TO anon, authenticated;

-- ==============================================================================
-- CATATAN PENGGUNAAN:
-- Server (page.tsx /go/[id]):
--   await supabase.rpc('record_click', {
--     p_product_id: id,
--     p_session_id: sessionCookieValue  -- dibaca dari cookies()
--   });
-- ==============================================================================
