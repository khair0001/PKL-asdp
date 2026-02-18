-- =============================================
-- SUPABASE PERMISSIONS FIX - COMPLETE SOLUTION
-- Jalankan script ini di Supabase SQL Editor
-- =============================================

-- STEP 1: Disable Row Level Security (RLS) untuk semua tabel
-- Ini penting karena RLS bisa block akses meskipun sudah ada permission
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS perusahaan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kapal DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pelabuhan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rute DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kategori_penumpang DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS golongan_kendaraan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarif_penumpang DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarif_kendaraan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS produksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS produksi_penumpang DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS produksi_kendaraan DISABLE ROW LEVEL SECURITY;

-- STEP 2: Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- STEP 3: Grant permissions untuk semua tabel yang ada
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- STEP 4: Grant permissions untuk anon (untuk register/login)
GRANT ALL ON public.users TO anon;

-- STEP 5: Set default privileges untuk tabel yang akan dibuat
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;

-- STEP 6: Grant spesifik per tabel untuk authenticated (double check)
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.perusahaan TO authenticated;
GRANT ALL ON public.kapal TO authenticated;
GRANT ALL ON public.pelabuhan TO authenticated;
GRANT ALL ON public.rute TO authenticated;
GRANT ALL ON public.kategori_penumpang TO authenticated;
GRANT ALL ON public.golongan_kendaraan TO authenticated;
GRANT ALL ON public.tarif_penumpang TO authenticated;
GRANT ALL ON public.tarif_kendaraan TO authenticated;
GRANT ALL ON public.produksi TO authenticated;
GRANT ALL ON public.produksi_penumpang TO authenticated;
GRANT ALL ON public.produksi_kendaraan TO authenticated;

-- STEP 7: Grant sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================
-- VERIFICATION (Optional - untuk cek hasil)
-- =============================================

-- Uncomment baris di bawah untuk verifikasi:
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.table_privileges 
-- WHERE table_schema = 'public' 
-- AND table_name = 'perusahaan'
-- ORDER BY grantee;

-- Expected result:
-- anon         | perusahaan | SELECT
-- authenticated| perusahaan | SELECT, INSERT, UPDATE, DELETE, etc.

-- =============================================
-- SELESAI!
-- Jika masih error:
-- 1. Refresh Supabase Dashboard (F5)
-- 2. Restart backend server (Ctrl+C lalu npm run dev)
-- 3. Clear browser localStorage (localStorage.clear())
-- 4. Jalankan: npm run test-db
-- =============================================
