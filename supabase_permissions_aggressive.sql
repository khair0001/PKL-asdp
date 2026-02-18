-- =============================================
-- SUPABASE PERMISSIONS FIX - AGGRESSIVE MODE
-- Gunakan ini jika supabase_permissions.sql tidak berhasil
-- =============================================

-- WARNING: Script ini akan:
-- 1. Disable semua RLS
-- 2. Revoke semua permission yang ada
-- 3. Grant ulang dengan permission penuh
-- 4. Cocok untuk development, TIDAK untuk production!

-- =============================================
-- STEP 1: DISABLE RLS
-- =============================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- =============================================
-- STEP 2: REVOKE ALL (Clean slate)
-- =============================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON SCHEMA public FROM anon, authenticated, public;

-- =============================================
-- STEP 3: GRANT SCHEMA
-- =============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, public;
GRANT CREATE ON SCHEMA public TO authenticated;

-- =============================================
-- STEP 4: GRANT ALL TABLES
-- =============================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- For anon (public access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================
-- STEP 5: DEFAULT PRIVILEGES
-- =============================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- =============================================
-- STEP 6: SPECIFIC TABLES (Extra safety)
-- =============================================

-- Users table
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT USAGE, SELECT ON SEQUENCE users_user_id_seq TO authenticated, anon;

-- Perusahaan
GRANT ALL ON public.perusahaan TO authenticated;
GRANT ALL ON public.perusahaan TO anon;
GRANT USAGE, SELECT ON SEQUENCE perusahaan_perusahaan_id_seq TO authenticated, anon;

-- Kapal
GRANT ALL ON public.kapal TO authenticated;
GRANT ALL ON public.kapal TO anon;
GRANT USAGE, SELECT ON SEQUENCE kapal_kapal_id_seq TO authenticated, anon;

-- Pelabuhan
GRANT ALL ON public.pelabuhan TO authenticated;
GRANT ALL ON public.pelabuhan TO anon;
GRANT USAGE, SELECT ON SEQUENCE pelabuhan_pelabuhan_id_seq TO authenticated, anon;

-- Rute
GRANT ALL ON public.rute TO authenticated;
GRANT ALL ON public.rute TO anon;
GRANT USAGE, SELECT ON SEQUENCE rute_rute_id_seq TO authenticated, anon;

-- Kategori Penumpang
GRANT ALL ON public.kategori_penumpang TO authenticated;
GRANT ALL ON public.kategori_penumpang TO anon;
GRANT USAGE, SELECT ON SEQUENCE kategori_penumpang_kategori_penumpang_id_seq TO authenticated, anon;

-- Golongan Kendaraan
GRANT ALL ON public.golongan_kendaraan TO authenticated;
GRANT ALL ON public.golongan_kendaraan TO anon;
GRANT USAGE, SELECT ON SEQUENCE golongan_kendaraan_golongan_id_seq TO authenticated, anon;

-- Tarif Penumpang
GRANT ALL ON public.tarif_penumpang TO authenticated;
GRANT ALL ON public.tarif_penumpang TO anon;
GRANT USAGE, SELECT ON SEQUENCE tarif_penumpang_tarif_penumpang_id_seq TO authenticated, anon;

-- Tarif Kendaraan
GRANT ALL ON public.tarif_kendaraan TO authenticated;
GRANT ALL ON public.tarif_kendaraan TO anon;
GRANT USAGE, SELECT ON SEQUENCE tarif_kendaraan_tarif_kendaraan_id_seq TO authenticated, anon;

-- Produksi
GRANT ALL ON public.produksi TO authenticated;
GRANT ALL ON public.produksi TO anon;
GRANT USAGE, SELECT ON SEQUENCE produksi_produksi_id_seq TO authenticated, anon;

-- Produksi Penumpang
GRANT ALL ON public.produksi_penumpang TO authenticated;
GRANT ALL ON public.produksi_penumpang TO anon;
GRANT USAGE, SELECT ON SEQUENCE produksi_penumpang_produksi_penumpang_id_seq TO authenticated, anon;

-- Produksi Kendaraan
GRANT ALL ON public.produksi_kendaraan TO authenticated;
GRANT ALL ON public.produksi_kendaraan TO anon;
GRANT USAGE, SELECT ON SEQUENCE produksi_kendaraan_produksi_kendaraan_id_seq TO authenticated, anon;

-- =============================================
-- VERIFICATION
-- =============================================

-- Check permissions
SELECT 
    grantee, 
    table_name, 
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'perusahaan', 'kapal')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- SELESAI!
-- Semua permission sudah di-grant dengan mode aggressive
-- RLS sudah disabled
-- Sekarang restart backend dan test lagi
-- =============================================
