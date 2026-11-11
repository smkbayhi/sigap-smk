# SIGAP-SMK (Sistem Informasi Gerak Cepat & Administrasi Terpadu SMK Bayt Al-Hikmah)

Aplikasi Web Modern **E-Office & Sistem Informasi Manajemen Sekolah (SIMS)** terpadu untuk **SMK Bayt Al-Hikmah Kota Pasuruan, Jawa Timur**. Dibangun dengan arsitektur modern berbasis **Next.js 14 (App Router), React, TypeScript, Tailwind CSS**, dan kompatibel penuh dengan **PostgreSQL / Supabase**.

Antarmuka dirancang bersih, profesional, dan responsif (PC & Mobile Smartphone) dengan identitas warna institusi pendidikan Islam modern:
- **Emerald Green (Hijau Zamrud)**: `#064e3b`, `#047857`, `#059669` (Mencerminkan nilai kepesantrenan dan pertumbuhan)
- **Yellow Gold (Kuning Emas)**: `#f59e0b`, `#fbbf24`, `#d97706` (Mencerminkan keunggulan dan prestasi santri)
- **Crisp White & Slate Gray**: Keterbacaan optimal dokumen resmi kedinasan

---

## 🚀 Fitur Utama & Modul Aplikasi

### 1. Sistem Otentikasi & Hak Akses (Role-Based Access Control / RBAC)
Aplikasi mendukung 4 level hak akses pengguna dengan simulasi Quick Switcher di bagian navigasi atas:
1. **Kepala Sekolah (Admin / Approver):**
   - Akses penuh ke Dashboard Eksekutif.
   - Menyetujui atau menolak Surat Keluar disertai pembubuhan Tanda Tangan Digital transparan dan Stempel Sekolah otomatis.
   - Menyetujui atau menolak Rencana Kerja Tahunan (RKT) dengan catatan revisi.
   - Memantau delegasi tugas lembar disposisi dan laporan kinerja bulanan.
2. **Tata Usaha (TU):**
   - Membuat draf Surat Keluar dengan pilihan template dan penomoran otomatis.
   - Mengunggah & mengarsipkan Surat Masuk dengan bantuan AI OCR.
   - Mengelola Master Data: Master Perspektif RKT (dinamis) dan Pengguna.
3. **Kasubag / Struktural (Kurikulum, Kesiswaan, Sarpras, Humas/BKK):**
   - Menginput Rencana Kerja Tahunan (RKT) sesuai bidangnya.
   - Membuat Action Plan bulanan wajib memilih Induk Kegiatan dari RKT yang berstatus Disetujui.
   - Mengunggah Action Report bulanan beserta lampiran berkas laporan (.docx, .pdf, .xlsx).
   - Menerima dan menindaklanjuti lembar disposisi surat masuk.
4. **Guru:**
   - Menerima lembar disposisi tugas kedinasan melalui WhatsApp Magic Link.
   - Memperbarui status tugas (*Sedang Diproses* / *Selesai*) dan memberikan laporan balik.

---

### 2. Modul E-Office & Persuratan

#### A. Surat Keluar (Auto-Generate & Digital Signature)
- **Penomoran Otomatis Baku Sekolah:** `[No_Urut]/SMK-BAH/[Bulan_Romawi]/[Tahun]` (Contoh: `042/SMK-BAH/XI/2026`).
- **Pilihan Template:** Surat Tugas, Surat Undangan, Surat Keterangan, Surat Edaran, Surat Rekomendasi Magang, dan Surat Pengantar.
- **Kop Surat Resmi:** Lengkap dengan Logo SMK Bayt Al-Hikmah Pasuruan, akreditasi "A" BAN-SM, alamat, kontak, dan garis ganda standar kedinasan.
- **Pembubuhan TTD Digital & Stempel:** Kepala Sekolah dapat menandatangani dokumen langsung menggunakan TTD terverifikasi atau goresan canvas live, disertai stempel ungu lembaga transparan.
- **Export & Print:** Tampilan cetak bersih yang secara otomatis menyesuaikan ukuran kertas A4 untuk pencetakan langsung atau simpan ke PDF.

#### B. Arsip Surat Masuk & Disposisi Cerdas (AI OCR + WhatsApp)
- **AI Vision OCR Ekstraksi:** Membaca dokumen scan (PDF/JPG/PNG) dan secara cerdas mengisi *Nomor Surat, Tanggal, Pengirim, Perihal, Ringkasan Isi*, serta memberikan rekomendasi bidang tujuan disposisi.
- **Delegasi Cerdas:** Memilih penerima disposisi, menentukan batas waktu (*deadline*), tingkat urgensi (*Biasa, Penting, Segera, Rahasia*), serta instruksi penugasan.
- **Integrasi Notifikasi WhatsApp:** Tombol *"Kirim Disposisi ke WhatsApp"* yang men-generate pesan otomatis berisi detail surat, catatan instruksi Kepala Sekolah, dan *magic link* (`/disposisi/[id]`) untuk langsung memperbarui status.

---

### 3. Modul SIMS & Perencanaan Strategis

#### A. Rencana Kerja Tahunan (RKT) - Struktur Dinamis
- Form fleksibel mengantisipasi perubahan regulasi yayasan:
  - *Tahun Anggaran* (Dropdown).
  - *Bidang Struktural* (Otomatis sesuai akun Kasubag).
  - *Perspektif / Kategori* (Dinamis dari tabel Master Perspektif).
  - *Nama Kegiatan, Waktu Pelaksanaan, PIC, Target Capaian*.
- Sub-Menu RKT:
  1. `Tambah Rencana` (Status awal: *Menunggu Persetujuan*).
  2. `Daftar Rencana` (Hanya menampilkan rencana yang disetujui Kepala Sekolah).
  3. `Rencana Ditolak` (Menampilkan catatan revisi dari Kepala Sekolah dan tombol ajukan ulang).
  4. `Verifikasi & Persetujuan` (Antrean khusus Kepala Sekolah).

#### B. Action Plan & Action Report Bulanan
- **Action Plan:**
  - Form otomatis dengan *Hari & Tanggal Dibuat*.
  - Pemilihan *Induk Kegiatan* secara ketat hanya dari **Daftar RKT yang berstatus Disetujui** milik bidang terkait.
  - Kartu header kalkulasi **Total Akumulasi Anggaran Bulanan**.
- **Action Report:**
  - Daftar rencana aksi bulan berjalan.
  - Tombol *"Laporkan / Update"* untuk memperbarui *Status Ketercapaian (Selesai 100%, Dalam Proses, Tertunda)*, *Persentase*, *Keterangan Realisasi / Evaluasi*, dan *Upload Berkas Lampiran* (.docx, .doc, .pdf, .xls, .xlsx hingga 10MB).

---

## 🗄️ Skema Database Relasional

Skema database PostgreSQL / Supabase telah disiapkan pada file `src/sql/schema.sql` yang mencakup:
- `users`: ID, NIP, Nama, Email, Role, Jabatan, Bidang, No. WhatsApp, URL TTD & Stempel.
- `master_perspektif`: Master kategori fleksibel untuk RKT yayasan.
- `surat_keluar`: Nomor otomatis, no urut, jenis surat, perihal, isi surat, status, TTD & Stempel.
- `surat_masuk`: Nomor surat, pengirim, ringkasan, scan URL, urgensi, metadata AI analysis.
- `disposisi`: Relasi surat masuk, pemberi & penerima disposisi, instruksi, deadline, status, tanggapan.
- `rkt`: Tahun anggaran, bidang, perspektif id, nama kegiatan, PIC, target capaian, status persetujuan.
- `action_plans`: Foreign key ke RKT disetujui, bulan pelaksanaan, estimasi anggaran (Rp).
- `action_reports`: Foreign key ke Action Plan, tanggal lapor, persentase, evaluasi, nama & url file lampiran.

---

## 💻 Panduan Menjalankan Aplikasi

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Buka browser pada: `http://localhost:3000`

### 3. Build & Produksi
```bash
npm run build
npm start
```

---

## 👤 Akun Uji Coba Bawaan (Demo Seeder)

Anda dapat berganti peran secara langsung melalui tombol akun di pojok kanan atas aplikasi:

| Peran | Nama | NIP | Jabatan | Bidang |
|---|---|---|---|---|
| **Kepala Sekolah** | Dr. H. Ahmad Fauzi, M.Pd. | 19780512 200312 1 002 | Kepala Sekolah (Approver) | Pimpinan |
| **Tata Usaha** | Siti Rahmawati, S.Kom. | 19850920 201001 2 015 | Kepala Tata Usaha | Administrasi |
| **Kasubag Kurikulum** | M. Ridwan, S.T., M.Kom. | 19820315 200801 1 007 | Kasubag Kurikulum & Akademik | Kurikulum |
| **Kasubag Kesiswaan** | Ust. Farhan Maulana, S.Pd.I. | 19880714 201402 1 003 | Kasubag Kesiswaan & Kedisiplinan | Kesiswaan |
| **Kasubag Sarpras** | Bambang Haryanto, S.T. | 19801128 200604 1 009 | Kasubag Sarana & Prasarana | Sarpras |
| **Kasubag Humas/BKK** | Nabila Zahra, M.Si. | 19910405 201801 2 004 | Kasubag Hubungan Industri & BKK | Humas BKK |
| **Guru** | Ahmad Junaidi, S.Pd. | 19940118 202012 1 004 | Guru Kejuruan TJKT / OSIS | Pengajar |

---

*Dikembangkan untuk SMK Bayt Al-Hikmah Pasuruan — Berakhlak Qur'ani, Mandiri, Unggul & Berdaya Saing Global.*
