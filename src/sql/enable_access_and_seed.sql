-- ====================================================================
-- SIGAP-SMK: AKTIFKAN AKSES BACA & TULIS + SEEDER AWAL SUPABASE
-- Buka Supabase -> SQL Editor -> Tempel teks ini -> Klik "Run" (Ctrl+Enter)
-- ====================================================================

-- 1. Berikan Hak Akses ke Schema Public
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 2. Nonaktifkan RLS Agar Webapp Dapat Membaca & Menyimpan Data
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS master_perspektif DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surat_keluar DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surat_masuk DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS disposisi DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rkt DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS action_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS action_reports DISABLE ROW LEVEL SECURITY;

-- 3. Masukkan Data Seeder Awal Pengguna SMK Bayt Al-Hikmah
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

-- 4. Masukkan Data Perspektif RKT Yayasan
INSERT INTO master_perspektif (id, kode, nama, deskripsi, is_active)
VALUES
  ('perspektif-1', 'P1', 'Pengembangan Kurikulum Berbasis Industri & Teaching Factory', 'Penyelarasan kurikulum vokasi, sinkronisasi dengan DUDI, dan implementasi pembelajaran berbasis produksi riil.', true),
  ('perspektif-2', 'P2', 'Pembinaan Karakter Santri, Kedisiplinan & Prestasi Siswa', 'Penguatan nilai-nilai kepesantrenan Bayt Al-Hikmah, bimbingan olimpiade vokasi, dan kejuaraan LKS.', true),
  ('perspektif-3', 'P3', 'Modernisasi Sarana Prasarana & Digitalisasi Sekolah', 'Peningkatan mutu laboratorium kejuruan, jaringan internet kampus terpadu, dan infrastruktur IT modern.', true),
  ('perspektif-4', 'P4', 'Penguatan Kemitraan DUDI, Penyaluran Kerja (BKK) & Magang Luar Negeri', 'Kerjasama rekruitmen lulusan, sertifikasi internasional, magang industri dan wirausaha muda santri.', true),
  ('perspektif-5', 'P5', 'Tata Kelola Kelembagaan, Akuntabilitas Keuangan & SDM Unggul', 'Peningkatan kualifikasi tenaga pendidik, sistem manajemen mutu ISO, serta efisiensi anggaran yayasan.', true)
ON CONFLICT (id) DO NOTHING;
