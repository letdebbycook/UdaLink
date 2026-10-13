// Skrip verifikasi koneksi Supabase & PostgREST API setelah schema.sql diterapkan
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frnbjfsxuucjgvaqwbyc.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybmJqZnN4dXVjamd2YXF3YnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NzkyMzIsImV4cCI6MjEwNzM1NTIzMn0.HSYXvzGD58shLw59kWvq3U-0TGlJtdwpV_Ky9tXUZFQ';

const supabase = createClient(url, anonKey);

async function verify() {
  console.log('--- VERIFIKASI POSTGREST & SUPABASE API (SPRINT 1) ---');
  console.log('Project URL:', url);

  // 1. Uji baca app_settings (publik / anon)
  const { data: settings, error: errSettings } = await supabase.from('app_settings').select('*').limit(1);
  if (errSettings) {
    console.error('❌ [FAIL] Tabel app_settings belum dapat diakses:', errSettings.message);
  } else {
    console.log('✅ [OK] app_settings terbaca:', settings[0]?.bank_name, '| Harga Pro:', settings[0]?.pro_price);
  }

  // 2. Uji RPC is_username_available
  const { data: availValid, error: errAvail } = await supabase.rpc('is_username_available', { p_username: 'tokoberkah_123' });
  const { data: availReserved } = await supabase.rpc('is_username_available', { p_username: 'admin' });

  if (errAvail) {
    console.error('❌ [FAIL] RPC is_username_available gagal:', errAvail.message);
  } else if (availValid === true && availReserved === false) {
    console.log('✅ [OK] RPC is_username_available bekerja sempurna (tokoberkah_123: true, admin: false).');
  } else {
    console.warn('⚠️ [WARN] Output is_username_available tidak sesuai ekspektasi:', { availValid, availReserved });
  }

  // 3. Uji Storage Buckets
  const { data: buckets, error: errBuckets } = await supabase.storage.listBuckets();
  if (errBuckets) {
    console.error('❌ [FAIL] List storage buckets gagal:', errBuckets.message);
  } else {
    const bucketIds = buckets.map(b => b.id);
    const expected = ['avatars', 'product-images', 'banners', 'payment-proofs'];
    const matched = expected.filter(id => bucketIds.includes(id));
    console.log(`✅ [OK] Storage buckets: ${matched.length}/4 ditemukan (${matched.join(', ')})`);
  }
}

verify();
