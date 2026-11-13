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
  | 'surat_pengantar';

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
