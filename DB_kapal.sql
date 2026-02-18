-- =============================================
-- SISTEM INFORMASI PRODUKSI ASDP
-- Database Schema - PostgreSQL
-- =============================================

-- =============================================
-- TABEL SISTEM
-- =============================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABEL MASTER DATA
-- =============================================

CREATE TABLE perusahaan (
    perusahaan_id SERIAL PRIMARY KEY,
    nama_perusahaan VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kapal (
    kapal_id SERIAL PRIMARY KEY,
    perusahaan_id INTEGER REFERENCES perusahaan(perusahaan_id),
    nama_kapal VARCHAR(100) NOT NULL UNIQUE,
    berat_kapal DECIMAL(10,2), -- dalam ton
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pelabuhan (
    pelabuhan_id SERIAL PRIMARY KEY,
    nama_pelabuhan VARCHAR(100) NOT NULL UNIQUE,
    lokasi VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rute (
    rute_id SERIAL PRIMARY KEY,
    pelabuhan_asal_id INTEGER REFERENCES pelabuhan(pelabuhan_id),
    pelabuhan_tujuan_id INTEGER REFERENCES pelabuhan(pelabuhan_id),
    nama_rute VARCHAR(200), -- contoh: "Mataram - Lembar"
    jarak DECIMAL(10,2), -- dalam mil
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_pelabuhan_berbeda CHECK (pelabuhan_asal_id != pelabuhan_tujuan_id)
);

-- Tabel untuk kategori penumpang (Dewasa, Bayi)
CREATE TABLE kategori_penumpang (
    kategori_penumpang_id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(50) NOT NULL UNIQUE -- 'Dewasa', 'Bayi'
);

-- Tabel untuk golongan kendaraan (hanya nomor 1-9 dan tipe muatan)
CREATE TABLE golongan_kendaraan (
    golongan_id SERIAL PRIMARY KEY,
    nomor_golongan INTEGER NOT NULL, -- 1-9
    tipe_muatan VARCHAR(30), -- 'penumpang', 'barang', NULL
    CONSTRAINT check_golongan_range CHECK (nomor_golongan BETWEEN 1 AND 9),
    CONSTRAINT unique_golongan_tipe UNIQUE (nomor_golongan, tipe_muatan)
);

-- Tabel tarif penumpang
CREATE TABLE tarif_penumpang (
    tarif_penumpang_id SERIAL PRIMARY KEY,
    rute_id INTEGER REFERENCES rute(rute_id),
    kategori_penumpang_id INTEGER REFERENCES kategori_penumpang(kategori_penumpang_id),
    tarif DECIMAL(20,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tarif_penumpang UNIQUE (rute_id, kategori_penumpang_id)
);

-- Tabel tarif kendaraan
CREATE TABLE tarif_kendaraan (
    tarif_kendaraan_id SERIAL PRIMARY KEY,
    rute_id INTEGER REFERENCES rute(rute_id),
    golongan_id INTEGER REFERENCES golongan_kendaraan(golongan_id),
    tarif DECIMAL(20,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tarif_kendaraan UNIQUE (rute_id, golongan_id)
);

-- =============================================
-- TABEL PRODUKSI (HEADER)
-- =============================================

CREATE TABLE produksi (
    produksi_id SERIAL PRIMARY KEY,
    
    -- Foreign keys ke master data (untuk filtering/reporting)
    perusahaan_id INTEGER REFERENCES perusahaan(perusahaan_id),
    kapal_id INTEGER REFERENCES kapal(kapal_id),
    pelabuhan_asal_id INTEGER REFERENCES pelabuhan(pelabuhan_id),
    rute_id INTEGER REFERENCES rute(rute_id),
    
    -- Snapshot data master (data historis yang tidak berubah)
    nama_perusahaan VARCHAR(100) NOT NULL,
    nama_kapal VARCHAR(100) NOT NULL,
    nama_pelabuhan_asal VARCHAR(100) NOT NULL,
    nama_pelabuhan_tujuan VARCHAR(100) NOT NULL,
    nama_rute VARCHAR(200) NOT NULL,
    
    -- Data operasional
    tanggal_produksi DATE NOT NULL,
    shift VARCHAR(20) NOT NULL, -- 'pagi', 'malam'
    regu VARCHAR(20) NOT NULL, -- 'regu 1', 'regu 2', 'regu 3'
    
    -- Total pendapatan
    total_penumpang INTEGER DEFAULT 0,
    total_pendapatan_penumpang DECIMAL(20,2) DEFAULT 0,
    total_kendaraan INTEGER DEFAULT 0,
    total_pendapatan_kendaraan DECIMAL(20,2) DEFAULT 0,
    total_pendapatan DECIMAL(20,2) DEFAULT 0,
    
    -- Audit
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index untuk filtering - kombinasi unik
    CONSTRAINT unique_produksi UNIQUE (kapal_id, rute_id, tanggal_produksi, shift, regu)
);

-- =============================================
-- TABEL DETAIL PRODUKSI
-- =============================================

-- Detail penumpang
CREATE TABLE produksi_penumpang (
    produksi_penumpang_id SERIAL PRIMARY KEY,
    produksi_id INTEGER REFERENCES produksi(produksi_id) ON DELETE CASCADE,
    
    -- Snapshot kategori penumpang
    kategori_penumpang_id INTEGER REFERENCES kategori_penumpang(kategori_penumpang_id),
    nama_kategori VARCHAR(50) NOT NULL, -- snapshot
    
    -- Data transaksi
    jumlah INTEGER NOT NULL DEFAULT 0,
    tarif DECIMAL(20,2) NOT NULL,
    subtotal DECIMAL(20,2) NOT NULL,
    
    -- Penanda jika tarif custom (berbeda dari master)
    is_tarif_custom BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detail kendaraan
CREATE TABLE produksi_kendaraan (
    produksi_kendaraan_id SERIAL PRIMARY KEY,
    produksi_id INTEGER REFERENCES produksi(produksi_id) ON DELETE CASCADE,
    
    -- Snapshot golongan kendaraan
    golongan_id INTEGER REFERENCES golongan_kendaraan(golongan_id),
    nomor_golongan INTEGER NOT NULL, -- snapshot
    tipe_muatan VARCHAR(30), -- snapshot: 'penumpang', 'barang', NULL
    
    -- Data transaksi
    jumlah INTEGER NOT NULL DEFAULT 0,
    tarif DECIMAL(20,2) NOT NULL,
    subtotal DECIMAL(20,2) NOT NULL,
    
    -- Penanda jika tarif custom
    is_tarif_custom BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES UNTUK PERFORMA
-- =============================================

CREATE INDEX idx_produksi_tanggal ON produksi(tanggal_produksi);
CREATE INDEX idx_produksi_perusahaan ON produksi(perusahaan_id);
CREATE INDEX idx_produksi_kapal ON produksi(kapal_id);
CREATE INDEX idx_produksi_rute ON produksi(rute_id);
CREATE INDEX idx_produksi_shift ON produksi(shift);
CREATE INDEX idx_produksi_regu ON produksi(regu);
CREATE INDEX idx_produksi_created_by ON produksi(created_by);

CREATE INDEX idx_kapal_perusahaan ON kapal(perusahaan_id);
CREATE INDEX idx_rute_asal ON rute(pelabuhan_asal_id);
CREATE INDEX idx_rute_tujuan ON rute(pelabuhan_tujuan_id);

-- =============================================
-- VIEWS UNTUK LAPORAN
-- =============================================

CREATE VIEW v_laporan_produksi_harian AS
SELECT 
    p.produksi_id,
    p.tanggal_produksi,
    p.nama_perusahaan,
    p.nama_kapal,
    p.nama_rute,
    p.shift,
    p.regu,
    p.total_penumpang,
    p.total_pendapatan_penumpang,
    p.total_kendaraan,
    p.total_pendapatan_kendaraan,
    p.total_pendapatan,
    u.nama_lengkap as created_by_name,
    p.created_at,
    p.updated_at
FROM produksi p
LEFT JOIN users u ON p.created_by = u.user_id
ORDER BY p.tanggal_produksi DESC, p.created_at DESC;

-- View untuk laporan detail lengkap
CREATE VIEW v_laporan_produksi_lengkap AS
SELECT 
    p.produksi_id,
    p.tanggal_produksi,
    
    -- Master Data (Snapshot - tidak berubah)
    p.nama_perusahaan,
    p.nama_kapal,
    p.nama_pelabuhan_asal,
    p.nama_pelabuhan_tujuan,
    p.nama_rute,
    
    -- Operasional
    p.shift,
    p.regu,
    
    -- Totals
    p.total_penumpang,
    COALESCE(p.total_pendapatan_penumpang, 0) as total_pendapatan_penumpang,
    p.total_kendaraan,
    COALESCE(p.total_pendapatan_kendaraan, 0) as total_pendapatan_kendaraan,
    COALESCE(p.total_pendapatan, 0) as total_pendapatan,
    
    -- User Information
    u_created.user_id as created_by_id,
    u_created.nama_lengkap as dibuat_oleh,
    u_created.username as username_pembuat,
    p.created_at as tanggal_dibuat,
    
    u_updated.user_id as updated_by_id,
    u_updated.nama_lengkap as diupdate_oleh,
    u_updated.username as username_pengupdate,
    p.updated_at as tanggal_update,
    
    -- Foreign Keys untuk filtering
    p.perusahaan_id,
    p.kapal_id,
    p.pelabuhan_asal_id,
    p.rute_id
    
FROM produksi p
LEFT JOIN users u_created ON p.created_by = u_created.user_id
LEFT JOIN users u_updated ON p.updated_by = u_updated.user_id;

-- =============================================
-- FUNCTIONS/TRIGGERS
-- =============================================

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_perusahaan_updated_at BEFORE UPDATE ON perusahaan 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_kapal_updated_at BEFORE UPDATE ON kapal 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_pelabuhan_updated_at BEFORE UPDATE ON pelabuhan 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_rute_updated_at BEFORE UPDATE ON rute 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tarif_penumpang_updated_at BEFORE UPDATE ON tarif_penumpang 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tarif_kendaraan_updated_at BEFORE UPDATE ON tarif_kendaraan 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk auto-calculate total di tabel produksi
CREATE OR REPLACE FUNCTION recalculate_produksi_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_produksi_id INTEGER;
BEGIN
    -- Ambil produksi_id dari NEW atau OLD
    IF TG_OP = 'DELETE' THEN
        v_produksi_id := OLD.produksi_id;
    ELSE
        v_produksi_id := NEW.produksi_id;
    END IF;
    
    -- Update total penumpang dan pendapatan penumpang
    UPDATE produksi SET
        total_penumpang = (
            SELECT COALESCE(SUM(jumlah), 0) 
            FROM produksi_penumpang 
            WHERE produksi_id = v_produksi_id
        ),
        total_pendapatan_penumpang = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM produksi_penumpang 
            WHERE produksi_id = v_produksi_id
        ),
        total_kendaraan = (
            SELECT COALESCE(SUM(jumlah), 0) 
            FROM produksi_kendaraan 
            WHERE produksi_id = v_produksi_id
        ),
        total_pendapatan_kendaraan = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM produksi_kendaraan 
            WHERE produksi_id = v_produksi_id
        )
    WHERE produksi_id = v_produksi_id;
    
    -- Update total pendapatan keseluruhan
    UPDATE produksi SET
        total_pendapatan = total_pendapatan_penumpang + total_pendapatan_kendaraan
    WHERE produksi_id = v_produksi_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_recalc_after_penumpang 
    AFTER INSERT OR UPDATE OR DELETE ON produksi_penumpang
    FOR EACH ROW EXECUTE FUNCTION recalculate_produksi_totals();

CREATE TRIGGER trigger_recalc_after_kendaraan 
    AFTER INSERT OR UPDATE OR DELETE ON produksi_kendaraan
    FOR EACH ROW EXECUTE FUNCTION recalculate_produksi_totals();

-- =============================================
-- DATA AWAL (SEED DATA)
-- =============================================

-- Insert kategori penumpang default
INSERT INTO kategori_penumpang (nama_kategori) VALUES 
('Dewasa'),
('Bayi');

-- Insert golongan kendaraan default
-- Golongan 1-3: tanpa tipe muatan
INSERT INTO golongan_kendaraan (nomor_golongan, tipe_muatan) VALUES 
(1, NULL),
(2, NULL),
(3, NULL);

-- Golongan 4-6: dengan tipe muatan (penumpang dan barang)
INSERT INTO golongan_kendaraan (nomor_golongan, tipe_muatan) VALUES 
(4, 'penumpang'),
(4, 'barang'),
(5, 'penumpang'),
(5, 'barang'),
(6, 'penumpang'),
(6, 'barang');

-- Golongan 7-9: tanpa tipe muatan
INSERT INTO golongan_kendaraan (nomor_golongan, tipe_muatan) VALUES 
(7, NULL),
(8, NULL),
(9, NULL);

-- =============================================
-- COMMENTS UNTUK DOKUMENTASI
-- =============================================

COMMENT ON TABLE perusahaan IS 'Master data perusahaan penyeberangan';
COMMENT ON TABLE kapal IS 'Master data kapal ferry';
COMMENT ON TABLE pelabuhan IS 'Master data pelabuhan';
COMMENT ON TABLE rute IS 'Master data rute penyeberangan';
COMMENT ON TABLE kategori_penumpang IS 'Kategori penumpang: Dewasa, Bayi';
COMMENT ON TABLE golongan_kendaraan IS 'Golongan kendaraan 1-9 dengan tipe muatan';
COMMENT ON TABLE tarif_penumpang IS 'Tarif penumpang per rute dan kategori';
COMMENT ON TABLE tarif_kendaraan IS 'Tarif kendaraan per rute dan golongan';
COMMENT ON TABLE produksi IS 'Header data produksi harian dengan snapshot data master';
COMMENT ON TABLE produksi_penumpang IS 'Detail penumpang per produksi';
COMMENT ON TABLE produksi_kendaraan IS 'Detail kendaraan per produksi';

COMMENT ON COLUMN produksi.nama_perusahaan IS 'Snapshot nama perusahaan saat produksi dibuat';
COMMENT ON COLUMN produksi.nama_kapal IS 'Snapshot nama kapal saat produksi dibuat';
COMMENT ON COLUMN produksi.nama_pelabuhan_asal IS 'Snapshot nama pelabuhan asal saat produksi dibuat';
COMMENT ON COLUMN produksi.nama_pelabuhan_tujuan IS 'Snapshot nama pelabuhan tujuan saat produksi dibuat';
COMMENT ON COLUMN produksi.nama_rute IS 'Snapshot nama rute saat produksi dibuat';

COMMENT ON COLUMN produksi_penumpang.is_tarif_custom IS 'TRUE jika tarif berbeda dari tarif master';
COMMENT ON COLUMN produksi_kendaraan.is_tarif_custom IS 'TRUE jika tarif berbeda dari tarif master';