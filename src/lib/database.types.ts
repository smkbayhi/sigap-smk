export type UserRole = 'kepala_sekolah' | 'tata_usaha' | 'kasubag' | 'guru';

export type BidangStruktural = 'wakasek' | 'kurikulum' | 'kesiswaan' | 'sarpras' | 'humas_bkk' | 'wakil_kepala_sekolah';

export interface User {
  id: string;
  niy: string;
  nip?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  jabatan: string;
  bidang?: BidangStruktural;
  phone: string;
  avatar: string;
  ttd_url?: string;
  stempel_url?: string;
}

export interface SchoolSettings {
  logoYayasanUrl: string;
  logoSmkUrl: string;
  stempelUrl: string;
  ttdKepsekUrl: string;
  namaKepsek: string;
  niyKepsek: string;
  password?: string;
}

export interface MasterPerspektif {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  is_active: boolean;
  created_at: string;
}

export type JenisSuratKeluar = 
  | 'surat_tugas'
  | 'surat_undangan'
  | 'surat_keterangan'
  | 'surat_edaran'
  | 'surat_rekomendasi'
  | 'surat_pengantar'
  | 'surat_permohonan'
  | 'surat_kuasa'
  | 'surat_peringatan'
  | 'surat_keputusan';

export type StatusSuratKeluar = 'draft' | 'menunggu_persetujuan' | 'disetujui' | 'ditolak';

export interface SuratKeluar {
  id: string;
  nomor_surat: string;
  no_urut: number;
  bulan_romawi: string;
  tahun: number;
  jenis_surat: JenisSuratKeluar;
  perihal: string;
  tujuan: string;
  tanggal_surat: string;
  isi_surat: string;
  lampiran: string;
  status: StatusSuratKeluar;
  created_by: string; // user id
  creator_name?: string;
  approved_by?: string;
  approver_name?: string;
  approved_at?: string;
  catatan_revisi?: string;
  has_ttd: boolean;
  has_stempel: boolean;
  ttd_image_url?: string;
  stempel_image_url?: string;
  logo_yayasan_url?: string;
  logo_smk_url?: string;
  created_at: string;
}

export type TingkatUrgensi = 'biasa' | 'penting' | 'segera' | 'rahasia';

export interface SuratMasuk {
  id: string;
  nomor_surat: string;
  pengirim: string;
  tanggal_surat: string;
  tanggal_diterima: string;
  perihal: string;
  ringkasan: string;
  file_url: string;
  file_name: string;
  file_size: string;
  tingkat_urgensi: TingkatUrgensi;
  ai_analysis?: {
    saran_bidang: BidangStruktural | 'semua' | 'guru';
    saran_penerima?: string;
    confidence_score: number;
    key_points: string[];
    action_deadline_suggestion: string;
    catatan_ai?: string;
  };
  status_disposisi: 'belum_disposisi' | 'sudah_disposisi' | 'selesai';
  created_at: string;
}

export type StatusDisposisi = 'menunggu' | 'proses' | 'selesai';

export interface Disposisi {
  id: string;
  surat_masuk_id: string;
  surat_masuk?: SuratMasuk;
  pemberi_disposisi_id: string;
  pemberi_nama: string;
  penerima_id: string;
  penerima_nama: string;
  penerima_role: UserRole;
  penerima_bidang?: BidangStruktural;
  sifat: TingkatUrgensi;
  instruksi: string;
  catatan?: string;
  deadline: string;
  status: StatusDisposisi;
  tanggapan?: string;
  tanggal_selesai?: string;
  whatsapp_sent: boolean;
  created_at: string;
}

export type StatusRKT = 'menunggu_persetujuan' | 'disetujui' | 'ditolak';

export interface RKT {
  id: string;
  tahun_anggaran: string;
  bidang: BidangStruktural;
  user_id: string;
  pic: string;
  perspektif_id?: string;
  perspektif_nama?: string;
  nama_kegiatan: string;
  waktu_pelaksanaan: string;
  target_capaian: string;
  status: StatusRKT;
  catatan_revisi?: string;
  approved_at?: string;
  created_at: string;
}

export interface ActionPlan {
  id: string;
  rkt_id: string;
  rkt_nama?: string;
  user_id: string;
  bidang: BidangStruktural;
  tanggal_dibuat: string;
  bulan_pelaksanaan: string;
  nama_kegiatan: string;
  tujuan: string;
  sasaran: string;
  waktu_pelaksanaan: string;
  keterangan: string;
  estimasi_anggaran: number;
  created_at: string;
}

export type StatusKetercapaian = 'selesai' | 'dalam_proses' | 'tertunda';

export interface ActionReport {
  id: string;
  action_plan_id: string;
  action_plan?: ActionPlan;
  user_id: string;
  tanggal_lapor: string;
  status_ketercapaian: StatusKetercapaian;
  persentase: number;
  keterangan_realisasi: string;
  lampiran_file_name?: string;
  lampiran_file_url?: string;
  lampiran_file_size?: string;
  created_at: string;
}

export interface NotulenActionItem {
  id: string;
  keputusan: string;
  pic: string;
  tenggat_waktu: string;
  status?: 'pending' | 'selesai';
}

export interface NotulenPembahasanSection {
  judul: string; // e.g. "Pembukaan", "Pengarahan Kepala Sekolah", "Pembahasan Inti", "Tanggapan / Masukan Peserta"
  keterangan?: string; // e.g. "Rapat dibuka oleh pembawa acara pada pukul 09.05 WIB dengan membaca basmalah bersama."
  poin_poin: string[]; // bullet points
}

export type StatusNotulen = 'draft' | 'final' | 'disetujui';

export interface NotulenRapat {
  id: string;
  nomor_notulen?: string;
  // A. IDENTITAS RAPAT
  jenis_rapat: string;
  hari_tanggal: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;
  tempat: string;
  pemimpin_rapat: string;
  pemimpin_nip?: string;
  notulis: string;
  notulis_id?: string;
  notulis_nip?: string;
  peserta_rapat: string;
  jumlah_peserta?: number;

  // B. SUSUNAN ACARA
  susunan_acara: string[];

  // C. JALANNYA RAPAT & PEMBAHASAN
  pembahasan: NotulenPembahasanSection[];

  // D. KEPUTUSAN RAPAT & TINDAK LANJUT (ACTION ITEMS)
  action_items: NotulenActionItem[];

  // E. PENUTUP
  penutup: string;

  // PENGESAHAN & STATUS
  status: StatusNotulen;
  catatan_kepsek?: string;
  is_approved_by_kepsek: boolean;
  approved_at?: string;
  approved_by_name?: string;
  has_ttd_kepsek?: boolean;
  has_stempel?: boolean;
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at?: string;
}

// ====================================================================
// EVALUASI & REFLEKSI KBM KOMBEL SEBATIK
// ====================================================================
export interface EvaluasiSebatik {
  id: string;
  user_id?: string;
  nama_guru: string;
  mata_pelajaran: string;
  sesi_diikuti: string[]; // multi-pilih sesi 1, 2, 3
  
  // BAGIAN A: UJI PEMAHAMAN KONSEP (Soal 1–6)
  jawaban_soal_1: string; // Opsi A / B / C / D
  jawaban_soal_2: string; // Opsi A / B / C / D
  jawaban_soal_3: string; // Opsi A / B / C / D
  jawaban_soal_4: string; // Opsi A / B / C / D
  jawaban_soal_5: string; // Esai contoh pertanyaan pemantik & asesmen awal/akhir
  jawaban_soal_6: string; // Esai strategi asesmen akhir 5-7 menit
  skor_bagian_a: number;  // 0 - 100 (25 poin per jawaban benar soal 1–4)

  // BAGIAN B: REFLEKSI KEDISIPLINAN WAKTU MENGAJAR (Soal 7–11)
  jawaban_soal_7: string;   // Opsi A / B / C / D (Keterlaksanaan waktu)
  is_waktu_tuntas: boolean; // true jika memilih opsi A atau B pada soal 7
  jawaban_soal_8: string;   // Opsi A / B / C / D / E (Faktor overtime)
  jawaban_soal_9: string[]; // Checkbox strategi pengendalian waktu
  jawaban_soal_10: string;  // Esai trik manajemen waktu paling efektif
  jawaban_soal_11: string;  // Esai komitmen perbaikan

  created_at: string;
}

// ====================================================================
// DOKUMENTASI & GALERI KEGIATAN SEKOLAH
// ====================================================================
export type KategoriDokumentasi =
  | 'akademik_kurikulum'
  | 'kesiswaan'
  | 'keasramaan_pesantren'
  | 'humas_dudi'
  | 'sarpras'
  | 'rapat_dinas'
  | 'keagamaan'
  | 'lainnya';

export interface FotoDokumentasiItem {
  id: string;
  url: string;
  caption?: string;
  uploaded_at: string;
}

export interface DokumentasiKegiatan {
  id: string;
  judul_kegiatan: string;
  kategori: KategoriDokumentasi;
  tanggal_kegiatan: string; // YYYY-MM-DD
  waktu_kegiatan?: string;
  lokasi?: string;
  deskripsi?: string;
  foto_urls: string[];
  foto_items?: FotoDokumentasiItem[];
  petugas_id: string;
  petugas_nama: string;
  petugas_jabatan?: string;
  drive_url?: string;
  created_at: string;
  updated_at?: string;
}


