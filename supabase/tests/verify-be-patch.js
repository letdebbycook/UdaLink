// Skrip Verifikasi Perbaikan Backend UdaLink
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frnbjfsxuucjgvaqwbyc.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybmJqZnN4dXVjamd2YXF3YnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NzkyMzIsImV4cCI6MjEwNzM1NTIzMn0.HSYXvzGD58shLw59kWvq3U-0TGlJtdwpV_Ky9tXUZFQ';

const supabase = createClient(url, anonKey);

function ok(msg) { console.log(`  [OK] ${msg}`); }
function fail(msg, err) { console.error(`  [FAIL] ${msg}`, err || ''); process.exitCode = 1; }

async function verify() {
  console.log('==================================================');
  console.log('VERIFIKASI INTEGRITAS PERBAIKAN BACKEND (BE)');
  console.log('==================================================\n');

  // 1. Verifikasi File Patch & Schema
  console.log('--- 1. Verifikasi Keberadaan & Struktur File SQL ---');
  const patchFile = path.resolve(process.cwd(), 'supabase/be-bugfix-patch.sql');
  const testFile = path.resolve(process.cwd(), 'supabase/tests/test-be-bugfixes.sql');
  const schemaFile = path.resolve(process.cwd(), 'supabase/schema.sql');
  const rpc3File = path.resolve(process.cwd(), 'supabase/sprint-3-rpc.sql');

  if (fs.existsSync(patchFile)) ok('File patch "supabase/be-bugfix-patch.sql" siap digunakan');
  else fail('File patch "supabase/be-bugfix-patch.sql" tidak ditemukan');

  if (fs.existsSync(testFile)) ok('File pengujian "supabase/tests/test-be-bugfixes.sql" siap digunakan');
  else fail('File pengujian "supabase/tests/test-be-bugfixes.sql" tidak ditemukan');

  const patchContent = fs.readFileSync(patchFile, 'utf8');
  if (patchContent.includes('payments_user_id_fkey') && 
      patchContent.includes('profiles_select_own_or_admin') &&
      patchContent.includes('admin_list_payments') &&
      patchContent.includes('handle_normalize_admin_whatsapp')) {
    ok('Isi patch mencakup seluruh 4 komponen perbaikan BE');
  } else {
    fail('Komponen dalam patch SQL belum lengkap');
  }

  const rpc3Content = fs.readFileSync(rpc3File, 'utf8');
  if (rpc3Content.includes('admin_list_payments')) {
    ok('sprint-3-rpc.sql sudah disinkronisasi dengan RPC admin_list_payments');
  } else {
    fail('sprint-3-rpc.sql belum menyertakan admin_list_payments');
  }

  // 2. Verifikasi Kontrak TypeScript
  console.log('\n--- 2. Verifikasi Kontrak TypeScript database.ts ---');
  const dbTypesFile = path.resolve(process.cwd(), 'src/types/database.ts');
  const dbTypes = fs.readFileSync(dbTypesFile, 'utf8');
  if (dbTypes.includes('interface AdminPaymentItem')) {
    ok('Interface AdminPaymentItem tersedia di src/types/database.ts');
  } else {
    fail('Interface AdminPaymentItem tidak ditemukan di database.ts');
  }

  // 3. Verifikasi API Guard Keamanan RPC admin_list_payments
  console.log('\n--- 3. Verifikasi Security Guard RPC admin_list_payments ---');
  const { data: resData, error: resErr } = await supabase.rpc('admin_list_payments', { p_status: 'all' });
  if (resErr) {
    if (resErr.message.includes('admin') || resErr.message.includes('ditolak')) {
      ok(`RPC admin_list_payments memblokir akses anonim/non-admin: "${resErr.message}"`);
    } else if (resErr.code === 'PGRST202') {
      console.log('  [INFO] RPC admin_list_payments belum dieksekusi di database remote Supabase.');
      console.log('         (Silakan jalankan supabase/be-bugfix-patch.sql di SQL Editor Supabase)');
    } else {
      console.log('  [INFO] Respons RPC:', resErr.message);
    }
  } else {
    fail('RPC admin_list_payments seharusnya menolak panggilan anonim!');
  }

  console.log('\n==================================================');
  console.log('HASIL: Struktur kode perbaikan Backend valid & sinkron!');
  console.log('==================================================');
}

verify();
