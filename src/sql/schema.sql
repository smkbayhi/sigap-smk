-- ====================================================================
-- SKEMA DATABASE RELASIONAL SIGAP-SMK
-- (Sistem Informasi Gerak Cepat & Administrasi Terpadu SMK Bayt Al-Hikmah)
-- Target RDBMS: PostgreSQL / Supabase
-- ====================================================================

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('kepala_sekolah', 'tata_usaha', 'kasubag', 'guru');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bidang_struktural_enum AS ENUM ('kurikulum', 'kesiswaan', 'sarpras', 'humas_bkk');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE jenis_surat_keluar_enum AS ENUM ('surat_tugas', 'surat_undangan', 'surat_keterangan', 'surat_edaran', 'surat_rekomendasi', 'surat_pengantar', 'surat_permohonan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_surat_keluar_enum AS ENUM ('draft', 'menunggu_persetujuan', 'disetujui', 'ditolak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tingkat_urgensi_enum AS ENUM ('biasa', 'penting', 'segera', 'rahasia');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_disposisi_enum AS ENUM ('menunggu', 'proses', 'selesai');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_rkt_enum AS ENUM ('menunggu_persetujuan', 'disetujui', 'ditolak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_ketercapaian_enum AS ENUM ('selesai', 'dalam_proses', 'tertunda');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABEL: USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    nip VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role_enum NOT NULL,
    jabatan VARCHAR(255) NOT NULL,
    bidang bidang_struktural_enum,
    phone VARCHAR(32) NOT NULL,
    avatar TEXT,
    ttd_url TEXT,
    stempel_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL: MASTER_PERSPEKTIF (Fleksibel & Dinamis untuk RKT)
CREATE TABLE IF NOT EXISTS master_perspektif (
    id VARCHAR(64) PRIMARY KEY,
    kode VARCHAR(16) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL: SURAT_KELUAR (Auto-Generate No & TTD Digital)
CREATE TABLE IF NOT EXISTS surat_keluar (
    id VARCHAR(64) PRIMARY KEY,
    nomor_surat VARCHAR(100) UNIQUE NOT NULL,
    no_urut INTEGER NOT NULL,
    bulan_romawi VARCHAR(8) NOT NULL,
    tahun INTEGER NOT NULL,
    jenis_surat jenis_surat_keluar_enum NOT NULL,
    perihal VARCHAR(255) NOT NULL,
    tujuan VARCHAR(255) NOT NULL,
    tanggal_surat DATE NOT NULL,
    lampiran VARCHAR(100) DEFAULT '-',
    isi_surat TEXT NOT NULL,
    status status_surat_keluar_enum DEFAULT 'draft',
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    approved_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    catatan_revisi TEXT,
    has_ttd BOOLEAN DEFAULT FALSE,
    has_stempel BOOLEAN DEFAULT FALSE,
    ttd_image_url TEXT,
    stempel_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL: SURAT_MASUK (AI Extraction & OCR Ready)
CREATE TABLE IF NOT EXISTS surat_masuk (
    id VARCHAR(64) PRIMARY KEY,
    nomor_surat VARCHAR(100) NOT NULL,
    pengirim VARCHAR(255) NOT NULL,
    tanggal_surat DATE NOT NULL,
    tanggal_diterima DATE NOT NULL,
    perihal VARCHAR(255) NOT NULL,
    ringkasan TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(32),
    tingkat_urgensi tingkat_urgensi_enum DEFAULT 'biasa',
    ai_analysis JSONB,
    status_disposisi VARCHAR(32) DEFAULT 'belum_disposisi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL: DISPOSISI (Delegasi Cerdas & Integrasi WhatsApp)
CREATE TABLE IF NOT EXISTS disposisi (
    id VARCHAR(64) PRIMARY KEY,
    surat_masuk_id VARCHAR(64) NOT NULL REFERENCES surat_masuk(id) ON DELETE CASCADE,
    pemberi_disposisi_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    penerima_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    sifat tingkat_urgensi_enum DEFAULT 'biasa',
    instruksi TEXT NOT NULL,
    catatan TEXT,
    deadline DATE NOT NULL,
    status status_disposisi_enum DEFAULT 'menunggu',
    tanggapan TEXT,
    tanggal_selesai TIMESTAMP WITH TIME ZONE,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABEL: RKT (Rencana Kerja Tahunan)
CREATE TABLE IF NOT EXISTS rkt (
    id VARCHAR(64) PRIMARY KEY,
    tahun_anggaran VARCHAR(32) NOT NULL,
    bidang bidang_struktural_enum NOT NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    pic VARCHAR(255) NOT NULL,
    perspektif_id VARCHAR(64) REFERENCES master_perspektif(id) ON DELETE SET NULL,
    nama_kegiatan VARCHAR(255) NOT NULL,
    waktu_pelaksanaan VARCHAR(100) NOT NULL,
    target_capaian TEXT NOT NULL,
    status status_rkt_enum DEFAULT 'menunggu_persetujuan',
    catatan_revisi TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABEL: ACTION_PLANS (Rencana Aksi Bulanan Terikat RKT Disetujui)
CREATE TABLE IF NOT EXISTS action_plans (
    id VARCHAR(64) PRIMARY KEY,
    rkt_id VARCHAR(64) NOT NULL REFERENCES rkt(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    bidang bidang_struktural_enum NOT NULL,
    tanggal_dibuat DATE NOT NULL DEFAULT CURRENT_DATE,
    bulan_pelaksanaan VARCHAR(64) NOT NULL,
    nama_kegiatan VARCHAR(255) NOT NULL,
    tujuan TEXT NOT NULL,
    sasaran TEXT NOT NULL,
    waktu_pelaksanaan VARCHAR(100) NOT NULL,
    keterangan TEXT,
    estimasi_anggaran NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABEL: ACTION_REPORTS (Pelaporan & Evaluasi Bulanan)
CREATE TABLE IF NOT EXISTS action_reports (
    id VARCHAR(64) PRIMARY KEY,
    action_plan_id VARCHAR(64) NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    tanggal_lapor DATE NOT NULL DEFAULT CURRENT_DATE,
    status_ketercapaian status_ketercapaian_enum DEFAULT 'dalam_proses',
    persentase INTEGER DEFAULT 0 CHECK (persentase >= 0 AND persentase <= 100),
    keterangan_realisasi TEXT NOT NULL,
    lampiran_file_name VARCHAR(255),
    lampiran_file_url TEXT,
    lampiran_file_size VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_surat_keluar_status ON surat_keluar(status);
CREATE INDEX IF NOT EXISTS idx_surat_masuk_status_disp ON surat_masuk(status_disposisi);
CREATE INDEX IF NOT EXISTS idx_disposisi_penerima ON disposisi(penerima_id);
CREATE INDEX IF NOT EXISTS idx_disposisi_status ON disposisi(status);
CREATE INDEX IF NOT EXISTS idx_rkt_bidang_status ON rkt(bidang, status);
CREATE INDEX IF NOT EXISTS idx_action_plans_bulan ON action_plans(bulan_pelaksanaan);
CREATE INDEX IF NOT EXISTS idx_action_reports_plan ON action_reports(action_plan_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Memastikan akses API aman dan dapat diakses oleh client
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_perspektif ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE rkt ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write for users" ON users FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public read-write for master_perspektif" ON master_perspektif FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public read-write for surat_keluar" ON surat_keluar FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public read-write for surat_masuk" ON surat_masuk FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public read-write for disposisi" ON disposisi FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public read-write for rkt" ON rkt FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public read-write for action_plans" ON action_plans FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public read-write for action_reports" ON action_reports FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TRIGGER AUTO-UPDATE `updated_at`
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_surat_keluar_updated ON surat_keluar;
CREATE TRIGGER trg_surat_keluar_updated BEFORE UPDATE ON surat_keluar FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_surat_masuk_updated ON surat_masuk;
CREATE TRIGGER trg_surat_masuk_updated BEFORE UPDATE ON surat_masuk FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_disposisi_updated ON disposisi;
CREATE TRIGGER trg_disposisi_updated BEFORE UPDATE ON disposisi FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_rkt_updated ON rkt;
CREATE TRIGGER trg_rkt_updated BEFORE UPDATE ON rkt FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_action_plans_updated ON action_plans;
CREATE TRIGGER trg_action_plans_updated BEFORE UPDATE ON action_plans FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_action_reports_updated ON action_reports;
CREATE TRIGGER trg_action_reports_updated BEFORE UPDATE ON action_reports FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ====================================================================
-- DATA AWAL (SEEDER) PEGAWAI SMK BAYT AL-HIKMAH PASURUAN
-- ====================================================================
INSERT INTO users (id, nip, name, email, role, jabatan, bidang, phone)
VALUES 
  ('user-kepsek', '14215094', 'Mokhamat Ekhsan, S.Kom', 'kepsek@smk.baytalhikmah.sch.id', 'kepala_sekolah', 'Kepala SMK Bayt Al-Hikmah', NULL, '6281234567890'),
  ('user-tu', '14215098', 'Siti Rahmawati, S.Kom.', 'smkbayhi@gmail.com', 'tata_usaha', 'Kepala Tata Usaha', NULL, '6281398765432'),
  ('user-kasubag-kurikulum', '14215102', 'M. Ridwan, S.T., M.Kom.', 'kurikulum@smk.baytalhikmah.sch.id', 'kasubag', 'Kasubag Kurikulum & Akademik', 'kurikulum', '6285231234567'),
  ('user-kasubag-kesiswaan', '14215105', 'Ust. Farhan Maulana, S.Pd.I.', 'kesiswaan@smk.baytalhikmah.sch.id', 'kasubag', 'Kasubag Kesiswaan & Kedisiplinan', 'kesiswaan', '6285645678901'),
  ('user-kasubag-sarpras', '14215110', 'Bambang Haryanto, S.T.', 'sarpras@smk.baytalhikmah.sch.id', 'kasubag', 'Kasubag Sarana & Prasarana', 'sarpras', '6281987654321'),
  ('user-kasubag-humas', '14215114', 'Nabila Zahra, M.Si.', 'humas@smk.baytalhikmah.sch.id', 'kasubag', 'Kasubag Hubungan Industri & BKK', 'humas_bkk', '6282134567899'),
  ('user-guru-1', '14215120', 'Ahmad Junaidi, S.Pd.', 'junaidi@smk.baytalhikmah.sch.id', 'guru', 'Guru Kejuruan TJKT / OSIS', NULL, '6287812345678')
ON CONFLICT (id) DO NOTHING;

INSERT INTO master_perspektif (id, kode, nama, deskripsi, is_active)
VALUES
  ('perspektif-1', 'P1', 'Pengembangan Kurikulum Berbasis Industri & Teaching Factory', 'Penyelarasan kurikulum vokasi, sinkronisasi dengan DUDI, dan implementasi pembelajaran berbasis produksi riil.', true),
  ('perspektif-2', 'P2', 'Pembinaan Karakter Santri, Kedisiplinan & Prestasi Siswa', 'Penguatan nilai-nilai kepesantrenan Bayt Al-Hikmah, bimbingan olimpiade vokasi, dan kejuaraan LKS.', true),
  ('perspektif-3', 'P3', 'Modernisasi Sarana Prasarana & Digitalisasi Sekolah', 'Peningkatan mutu laboratorium kejuruan, jaringan internet kampus terpadu, dan infrastruktur IT modern.', true),
  ('perspektif-4', 'P4', 'Penguatan Kemitraan DUDI, Penyaluran Kerja (BKK) & Magang Luar Negeri', 'Kerjasama rekruitmen lulusan, sertifikasi internasional, magang industri dan wirausaha muda santri.', true),
  ('perspektif-5', 'P5', 'Tata Kelola Kelembagaan, Akuntabilitas Keuangan & SDM Unggul', 'Peningkatan kualifikasi tenaga pendidik, sistem manajemen mutu ISO, serta efisiensi anggaran yayasan.', true)
ON CONFLICT (id) DO NOTHING;
