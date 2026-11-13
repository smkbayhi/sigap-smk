import { JenisSuratKeluar } from "./database.types";

export type LayoutFormatSurat = "korespondensi" | "judul_tengah";

export type ModelTandaTangan =
  | "1_kepsek"
  | "2_cabdin"
  | "2_yayasan"
  | "3_bank_jatim"
  | "sp_kedisiplinan";

export type TipeTabelSurat =
  | "none"
  | "jadwal_pelaksanaan"
  | "sppd_resmi"
  | "daftar_siswa"
  | "pengantar_berkas"
  | "outing_class"
  | "rincian_catering";

export interface LetterMetaConfig {
  layout: LayoutFormatSurat;
  judul: string;
  modelTtd: ModelTandaTangan;
  tipeTabel: TipeTabelSurat;
  tembusan: string[];
}

export interface LetterTemplateItem {
  id: string;
  category: "undangan" | "permohonan" | "tugas_sppd" | "kesiswaan" | "pengantar_kuasa" | "peringatan";
  label: string;
  perihal: string;
  tujuan: string;
  jenis: JenisSuratKeluar;
  layout: LayoutFormatSurat;
  judulSurat: string;
  inti: string;
  tipeTabel: TipeTabelSurat;
  modelTtd: ModelTandaTangan;
  penutupJenis: "permohonan" | "tugas" | "undangan" | "pemberitahuan" | "keterangan" | "peringatan";
  tembusan: string[];
  // Initial default table values
  tableData?: any;
}

// Fixed Islamic opening for Format A (Surat Dinas / Korespondensi)
export const SALAM_PEMBUKA_FIXED = `<p>Assalamu’alaikum wr. wb.</p>
<p>Salam silaturrahim kami sampaikan, semoga Allah SWT senantiasa melimpahkan rahmat, taufiq, serta hidayahNya kepada kita dalam menjalani rutinitas sehari-hari. Amin.</p>`;

// Fixed Islamic closing choices
export function getClosingHtml(
  penutupJenis: "permohonan" | "tugas" | "undangan" | "pemberitahuan" | "keterangan" | "peringatan" | string,
  layout: LayoutFormatSurat = "korespondensi"
): string {
  if (layout === "judul_tengah") {
    if (penutupJenis === "tugas") {
      return `<p>Demikian surat tugas ini diberikan agar dapat dipergunakan sebagaimana mestinya dan dilaksanakan dengan penuh rasa tanggung jawab.</p>`;
    }
    if (penutupJenis === "peringatan") {
      return `<p>Demikian Surat Peringatan ini diterbitkan untuk menjadi perhatian serius dan bahan evaluasi diri agar Saudara segera melakukan perbaikan kedisiplinan secara nyata demi kelancaran kegiatan belajar mengajar.</p>`;
    }
    if (penutupJenis === "keterangan") {
      return `<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>`;
    }
    return `<p>Demikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>`;
  }

  let phrase = "surat permohonan dari kami";
  if (penutupJenis === "tugas") phrase = "surat tugas ini kami sampaikan";
  if (penutupJenis === "undangan") phrase = "undangan ini kami sampaikan";
  if (penutupJenis === "pemberitahuan") phrase = "pemberitahuan ini kami sampaikan";
  if (penutupJenis === "keterangan") phrase = "surat keterangan ini kami sampaikan";

  return `<p>Demikian ${phrase}, atas perhatian dan kerjasamanya kami sampaikan terima kasih. <em>Jazaakumulloh Ahsanal Jazaa’.</em></p>
<p>Wassalamu’alaikum. wr. wb.</p>`;
}

// Meta encoder & decoder embedded in HTML comment for 100% Postgres & Supabase zero-schema compatibility
export function encodeLetterMeta(meta: LetterMetaConfig): string {
  return `<!--SIGAP_META:${JSON.stringify(meta)}-->`;
}

export function parseLetterMeta(rawHtml: string): {
  cleanHtml: string;
  meta: LetterMetaConfig;
} {
  const defaultMeta: LetterMetaConfig = {
    layout: "korespondensi",
    judul: "",
    modelTtd: "1_kepsek",
    tipeTabel: "none",
    tembusan: [],
  };

  if (!rawHtml) {
    return { cleanHtml: "", meta: defaultMeta };
  }

  const match = rawHtml.match(/<!--SIGAP_META:([\s\S]*?)-->/);
  if (!match) {
    // Auto-detect if body contains centered title
    if (rawHtml.includes("SURAT TUGAS") || rawHtml.includes("SURAT REKOMENDASI") || rawHtml.includes("SURAT KETERANGAN") || rawHtml.includes("SURAT KUASA")) {
      return {
        cleanHtml: rawHtml,
        meta: { ...defaultMeta, layout: "judul_tengah" },
      };
    }
    return { cleanHtml: rawHtml, meta: defaultMeta };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const cleanHtml = rawHtml.replace(/<!--SIGAP_META:[\s\S]*?-->/, "").trim();
    return {
      cleanHtml,
      meta: {
        layout: parsed.layout || "korespondensi",
        judul: parsed.judul || "",
        modelTtd: parsed.modelTtd || "1_kepsek",
        tipeTabel: parsed.tipeTabel || "none",
        tembusan: Array.isArray(parsed.tembusan) ? parsed.tembusan : [],
      },
    };
  } catch (e) {
    console.warn("Failed to parse SIGAP_META JSON:", e);
    return { cleanHtml: rawHtml, meta: defaultMeta };
  }
}

// ====================================================================
// REAL 2026 ARCHIVE TEMPLATES (Directly from SMK Bayt Al-Hikmah 2026)
// ====================================================================

export const REAL_2026_LETTER_TEMPLATES: LetterTemplateItem[] = [
  {
    id: "undangan-pembekalan-pkl",
    category: "undangan",
    label: "Undangan Pembekalan PKL Siswa DKV",
    perihal: "Undangan Pembekalan PKL",
    tujuan: "Direktur Pendidikan Bayt Al-Hikmah",
    jenis: "surat_undangan",
    layout: "korespondensi",
    judulSurat: "",
    inti: "Sehubungan dengan dilaksanakannya Praktik Kerja Lapangan (PKL) Kelas XI DKV Tahun Pelajaran 2025/2026, maka kami mengharapkan kehadirannya untuk memberikan arahan dan pembekalan pada:",
    tipeTabel: "jadwal_pelaksanaan",
    modelTtd: "1_kepsek",
    penutupJenis: "undangan",
    tembusan: ["1. Arsip Sekolah"],
    tableData: {
      hari: "Sabtu",
      tanggal: "3 Januari 2026",
      waktu: "09.00 WIB s.d selesai",
      tempat: "Ruang Rapat Pimpinan SMK",
      agenda: "Pembekalan Peserta Praktik Kerja Lapangan (PKL)",
    },
  },
  {
    id: "permohonan-ruang-laptop-blk",
    category: "permohonan",
    label: "Permohonan Izin Pemakaian Ruang & Laptop BLK",
    perihal: "Permohonan Izin Pemakaian Ruang dan Laptop",
    tujuan: "Kepala BLK Komunitas Bayt Al-Hikmah",
    jenis: "surat_permohonan",
    layout: "korespondensi",
    judulSurat: "",
    inti: "Sehubungan dengan akan dilaksanakannya kegiatan TKA (Tes Kemampuan Akademik) Susulan santri kelas XII Tahun 2026, maka kami Kepala SMK Bayt Al-Hikmah bermaksud mengajukan permohonan izin pemakaian ruang praktik BLK dan Laptop sebanyak 3 unit untuk kegiatan tersebut yang akan dilaksanakan pada:",
    tipeTabel: "jadwal_pelaksanaan",
    modelTtd: "1_kepsek",
    penutupJenis: "permohonan",
    tembusan: ["1. Arsip Sekolah"],
    tableData: {
      hari: "Senin s.d Kamis",
      tanggal: "16 s.d 19 November 2026",
      waktu: "06.30 s.d 09.00 WIB",
      tempat: "Ruang Praktik BLK Komunitas",
      agenda: "Pelaksanaan TKA Susulan Kelas XII",
    },
  },
  {
    id: "permohonan-outing-class",
    category: "permohonan",
    label: "Permohonan Izin Outing Class ke Pesantren",
    perihal: "Permohonan Izin Outing Class",
    tujuan: "Wakil Direktur Pesantren Bayt Al-Hikmah",
    jenis: "surat_permohonan",
    layout: "korespondensi",
    judulSurat: "",
    inti: "Sehubungan dengan akan dilaksanakannya kegiatan Outing Class SMK, maka kami Kepala SMK Bayt Al-Hikmah bermaksud mengajukan permohonan izin santri kelas X dan XI DKV untuk mengikuti kegiatan tersebut yang dilaksanakan pada:",
    tipeTabel: "outing_class",
    modelTtd: "1_kepsek",
    penutupJenis: "permohonan",
    tembusan: ["1. Lurah Pesantren Putra & Putri", "2. Arsip"],
    tableData: [
      {
        waktu: "Selasa, 07.00 s.d 17.30 WIB",
        pendamping: "1. Ustadz Afandi\n2. Ustadzah Iis Hannani\n3. Kedisiplinan Putra",
        tempat: "1. Putra: Telaga Madirejo Pujon\n2. Putri: Dusun Kuliner Batu\n3. Titik Kumpul: Museum Angkut Batu",
        rundown: "Terlampir",
      },
    ],
  },
  {
    id: "permohonan-biaya-catering-pkl",
    category: "permohonan",
    label: "Permohonan Biaya Catering Santri PKL (Yayasan)",
    perihal: "Permohonan Pengambilan Biaya Catering Santri PKL",
    tujuan: "Bendahara Yayasan Bayt Al-Hikmah",
    jenis: "surat_permohonan",
    layout: "korespondensi",
    judulSurat: "",
    inti: "Sehubungan dengan dilaksanakannya Praktik Kerja Lapangan (PKL) Kelas XI DKV Tahun Pelajaran 2025/2026, maka kami Kepala SMK Bayt Al-Hikmah bermaksud mengajukan permohonan pengambilan biaya catering santri dengan rincian sebagai berikut:",
    tipeTabel: "rincian_catering",
    modelTtd: "1_kepsek",
    penutupJenis: "permohonan",
    tembusan: ["1. Bagian Keuangan Yayasan", "2. Arsip"],
    tableData: [
      {
        santriJk: "Putra",
        tglPkl: "5 - 10 Januari 2026",
        jmlSantri: "4 Santri",
        jmlHari: "6 Hari",
        volume: "3 kali @ Rp 4.800",
        nominal: "Rp 345.600",
        tglCatering: "11 Januari 2026",
      },
      {
        santriJk: "Putri",
        tglPkl: "5 - 17 Januari 2026",
        jmlSantri: "10 Santri",
        jmlHari: "13 Hari",
        volume: "3 kali @ Rp 4.800",
        nominal: "Rp 1.872.000",
        tglCatering: "18 Januari 2026",
      },
    ],
  },
  {
    id: "surat-tugas-dan-sppd",
    category: "tugas_sppd",
    label: "Surat Tugas Guru + SPPD Resmi 8 Butir (Cabdin)",
    perihal: "Surat Tugas dan SPPD Workshop Standar & Uji Sertifikasi",
    tujuan: "Moh. Nasih Aminulloh, S.Mat, M.Si",
    jenis: "surat_tugas",
    layout: "judul_tengah",
    judulSurat: "SURAT TUGAS",
    inti: "Yang bertandatangan di bawah ini Kepala SMK Bayt Al-Hikmah Kota Pasuruan, dengan ini memberikan tugas kepada:\n\nNama : Moh. Nasih Aminulloh, S.Mat, M.Si\nNIY : 23060333\nJabatan : Guru Matematika\n\nUntuk menghadiri undangan yang diselenggarakan oleh Cabang Dinas Pendidikan Wilayah Pasuruan, yang akan dilaksanakan pada:",
    tipeTabel: "sppd_resmi",
    modelTtd: "1_kepsek",
    penutupJenis: "tugas",
    tembusan: ["1. Cabang Dinas Pendidikan Wilayah Pasuruan", "2. Arsip"],
    tableData: {
      hari: "Rabu",
      tanggal: "14 Januari 2026",
      waktu: "08.00 s.d 14.00 WIB",
      tempat: "Aula Pertemuan SMKN 1 Bangil",
      acara: "Workshop Pembelajaran Berbasis Standar dan Uji Sertifikasi Siswa SMK",
      pejabat: "Mokhamat Ekhsan, S.Kom",
      pegawai: "Moh. Nasih Aminulloh, S.Mat, M.Si (NIY. 23060333)",
      jabatanPegawai: "Guru Produktif / SMK Bayt Al-Hikmah",
      perjalanan: "Dari: SMK Bayt Al-Hikmah ke SMKN 1 Bangil",
      transportasi: "Mobil Operasional Sekolah",
      durasi: "Selama 1 (satu) hari",
      maksud: "Workshop Pembelajaran Berbasis Standar dan Uji Sertifikasi Siswa SMK",
      beban: "SMK Bayt Al-Hikmah",
      keterangan: "-",
    },
  },
  {
    id: "rekomendasi-siswa-kolektif",
    category: "kesiswaan",
    label: "Surat Rekomendasi Siswa Kolektif (Seleksi PTN / Golden Ticket)",
    perihal: "Surat Rekomendasi Seleksi Golden Ticket ITS Surabaya",
    tujuan: "Panitia Seleksi Golden Ticket Institut Teknologi Sepuluh Nopember",
    jenis: "surat_rekomendasi",
    layout: "judul_tengah",
    judulSurat: "SURAT REKOMENDASI",
    inti: "Yang bertanda tangan di bawah ini:\nNama : MOKHAMAT EKHSAN, S.Kom\nNIP : -\nJabatan : Kepala Sekolah\nNPSN : 60725451\n\nDengan ini merekomendasikan nama peserta didik tersebut di bawah ini sebagai wakil dari SMKS Bayt Al-Hikmah untuk mengikuti seleksi jalur Golden Ticket di Institut Teknologi Sepuluh Nopember Surabaya (ITS):",
    tipeTabel: "daftar_siswa",
    modelTtd: "1_kepsek",
    penutupJenis: "keterangan",
    tembusan: ["1. Arsip Sekolah"],
    tableData: [
      {
        no: 1,
        nama: "VINA ZAMRUDAH FARADIS",
        nisn: "0078337633",
        kelas: "XII DKV",
        keahlian: "Desain Komunikasi Visual",
      },
      {
        no: 2,
        nama: "MUHAMMAD ALIF RAMADHANI",
        nisn: "0076543210",
        kelas: "XII DKV",
        keahlian: "Desain Komunikasi Visual",
      },
    ],
  },
  {
    id: "keterangan-siswa-eligible",
    category: "kesiswaan",
    label: "Surat Keterangan Siswa Eligible SNBP",
    perihal: "Surat Keterangan Siswa Eligible SNBP 2026",
    tujuan: "Pihak yang Berkepentingan",
    jenis: "surat_keterangan",
    layout: "judul_tengah",
    judulSurat: "SURAT KETERANGAN SISWA ELIGIBLE",
    inti: "Yang bertanda tangan di bawah ini:\nNama : MOKHAMAT EKHSAN, S.Kom\nNIP : -\nJabatan : Kepala Sekolah\nNPSN : 60725451\n\nDengan ini menerangkan bahwa:\nNama : VINA ZAMRUDAH FARADIS\nTempat/Tanggal Lahir : Pasuruan, 4 Desember 2007\nNIK : 3674064412070002\nNISN : 0078337633\nNIS : 238/029.45\nKelas : XII DKV\nAlamat Rumah : Vila Dago Blok A.02/17 RT/RW 008/020 Pamulang, Tangerang Selatan\n\nMerupakan siswa berstatus Eligible pada tahun pelajaran 2025/2026 di SMK Bayt Al-Hikmah Pasuruan.",
    tipeTabel: "none",
    modelTtd: "1_kepsek",
    penutupJenis: "keterangan",
    tembusan: ["1. Arsip Sekolah"],
  },
  {
    id: "keterangan-beasiswa-spp",
    category: "kesiswaan",
    label: "Surat Keterangan Siswa Berprestasi Beasiswa SPP",
    perihal: "Surat Keterangan Penerima Beasiswa Bebas SPP Yayasan",
    tujuan: "Santri & Wali Santri Penerima Beasiswa",
    jenis: "surat_keterangan",
    layout: "judul_tengah",
    judulSurat: "SURAT KETERANGAN SISWA BERPRESTASI",
    inti: "Yang bertanda tangan di bawah ini Kepala SMK Bayt Al-Hikmah Pasuruan menerangkan bahwa:\n\nNama Siswa : AHMAD FAIZ AL-FARISI\nKelas : XI DKV\nNISN : 0082349811\n\nYang bersangkutan di atas merupakan santri terbaik kompetensi keahlian DKV dan berhak mendapatkan beasiswa bebas SPP sekolah dari Yayasan Bayt Al-Hikmah selama Semester Ganjil Tahun Pelajaran 2025/2026 dengan kriteria sebagai berikut:\n1. Ranking 1 Paralel.\n2. Baik dan istiqomah dalam ubudiyah pesantren.\n3. Siswa terbaik dalam penerapan kelas karakter dan aktif berprestasi.",
    tipeTabel: "none",
    modelTtd: "1_kepsek",
    penutupJenis: "keterangan",
    tembusan: ["1. Bendahara Yayasan Bayt Al-Hikmah", "2. Arsip"],
  },
  {
    id: "surat-pengantar-cabdin",
    category: "pengantar_kuasa",
    label: "Surat Pengantar Berkas Nominasi ke Cabdin Pasuruan",
    perihal: "Surat Pengantar Berkas Nominasi Siswa Kelas XII",
    tujuan: "Kepala Cabang Dinas Pendidikan Wilayah Pasuruan",
    jenis: "surat_pengantar",
    layout: "judul_tengah",
    judulSurat: "SURAT PENGANTAR",
    inti: "Bersama ini kami kirimkan berkas administrasi nominasi peserta ujian SMK Bayt Al-Hikmah Tahun Pelajaran 2025/2026 dengan rincian dokumen sebagai berikut:",
    tipeTabel: "pengantar_berkas",
    modelTtd: "1_kepsek",
    penutupJenis: "keterangan",
    tembusan: ["1. Arsip Sekolah"],
    tableData: [
      {
        no: 1,
        jenisSurat: "Daftar Nominatif Siswa Kelas XII SMK Bayt Al-Hikmah Tahun Pelajaran 2025/2026",
        banyak: "1 (satu) Bendel",
        keterangan: "Dikirim dengan hormat untuk mendapatkan periksa.",
      },
      {
        no: 2,
        jenisSurat: "Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Data Nominasi Siswa Sesuai Dapodik",
        banyak: "1 (satu) Lembar",
        keterangan: "Terlampir sebagai kelengkapan administrasi.",
      },
    ],
  },
  {
    id: "surat-kuasa-bank-jatim",
    category: "pengantar_kuasa",
    label: "Surat Kuasa Pemindahbukuan Rekening Giro (Bank Jatim)",
    perihal: "Surat Kuasa Pemindahbukuan Rekening Bank Jatim",
    tujuan: "Pimpinan PT. Bank Pembangunan Daerah Jawa Timur Cabang Pasuruan",
    jenis: "surat_kuasa",
    layout: "judul_tengah",
    judulSurat: "SURAT KUASA",
    inti: `Yang bertanda tangan di bawah ini:
1. Nama : Mokhamat Ekhsan, S.Kom
   Jabatan : Kepala SMK Bayt Al-Hikmah
   Alamat : Perum Tiara Candi III RT/RW 005/002 Kel. Sekargadung Kec. Purworejo Kota Pasuruan

2. Nama : Ainiyatul Fitriyah, S.S
   Jabatan : Bendahara BOSP
   Alamat : Jl. Diponegoro I/13 RT/RW 1/11 Kel. Kebonsari Kec. Panggungrejo Kota Pasuruan

Bertindak untuk dan atas nama SMKS Bayt Al-Hikmah, dengan ini memberikan kuasa penuh yang tidak dapat dicabut kembali dengan Hak Substitusi kepada:
PT. BANK PEMBANGUNAN DAERAH JAWA TIMUR (BANK JATIM) CABANG PASURUAN
Berkedudukan di Pasuruan.

KHUSUS:
Untuk memindahbukukan dari rekening Giro kami yang ada di Bank Jatim Cabang Pasuruan dengan nomor rekening 0231041061 atas nama 60725451 SMKS Bayt Al-Hikmah untuk dilimpahkan kepada rekening terlampir yang tidak terpisahkan dari surat kuasa ini, dengan jumlah total Rp 3.700.000,- (Tiga Juta Tujuh Ratus Ribu Rupiah).

Segala akibat yang timbul atas pemberian kuasa ini menjadi tanggung jawab pemberi kuasa sepenuhnya dengan membebaskan PT. Bank Jatim Cabang Pasuruan dari segala akibat tuntutan atau gugatan.`,
    tipeTabel: "none",
    modelTtd: "3_bank_jatim",
    penutupJenis: "keterangan",
    tembusan: ["1. Pimpinan Bank Jatim Cabang Pasuruan", "2. Bendahara BOSP", "3. Arsip"],
  },
  {
    id: "keterangan-mutasi-keluar-cabdin",
    category: "kesiswaan",
    label: "Surat Keterangan Mutasi Keluar Siswa (TTD Ganda Mengetahui Cabdin)",
    perihal: "Surat Keterangan Mutasi Keluar Siswa",
    tujuan: "Kepala Cabang Dinas Pendidikan & Kepala Sekolah Dituju",
    jenis: "surat_keterangan",
    layout: "judul_tengah",
    judulSurat: "SURAT KETERANGAN MUTASI KELUAR",
    inti: `Yang bertanda tangan dibawah ini Kepala Sekolah SMK Bayt Al-Hikmah Kota Pasuruan menerangkan bahwa siswa yang bernama:

Nama Siswa : MUHAMMAD FATHAN SYAH
Tempat/Tanggal Lahir : Balikpapan, 18 November 2009
Kelas : X DKV
NIS / NISN : 251/042.45 / 0096357712
Nama Orang Tua : NURDIANSYAH
Pekerjaan Orang Tua : Karyawan Swasta
Alamat : Perum Villa Permata Blok E-14 RT/RW 002/006 Kota Pasuruan

Sesuai dengan surat permohonan pindah sekolah dari orang tua/wali siswa tanggal 2 Februari 2026, telah mengajukan permohonan mutasi keluar ke sekolah yang dituju: SMK Negeri 15 Samarinda.`,
    tipeTabel: "none",
    modelTtd: "2_cabdin",
    penutupJenis: "keterangan",
    tembusan: ["1. Cabang Dinas Pendidikan Wilayah Pasuruan", "2. Sekolah yang dituju", "3. Arsip"],
  },
  {
    id: "surat-peringatan-presensi-guru",
    category: "peringatan",
    label: "Surat Peringatan Kedisiplinan / Presensi Guru (SP 2 / SP 1)",
    perihal: "Penerbitan Surat Peringatan Kedua (SP 2) Kedisiplinan Jam Kerja",
    tujuan: "Yudha Prihantanto, S.Pd, M.Pd",
    jenis: "surat_peringatan",
    layout: "judul_tengah",
    judulSurat: "SURAT PERINGATAN KEDUA (SP 2)",
    inti: `Surat Peringatan ini diterbitkan oleh Pimpinan Sekolah dan ditujukan kepada:
Nama Lengkap : Yudha Prihantanto, S.Pd, M.Pd
Jabatan : Guru SMK
Unit Kerja : SMK Bayt Al-Hikmah Pasuruan

Dasar Penerbitan Surat Peringatan:
1. Surat Peringatan Pertama (SP 1) tertanggal 12 Agustus 2026.
2. Hasil rekapitulasi data presensi mesin fingerprint check-clock periode evaluasi (keterlambatan di atas 50%).
3. Laporan Evaluasi Kedisiplinan & Monitoring Presensi Guru SMK Bayt Al-Hikmah.

Catatan Evaluasi Kedisiplinan:
- Rendahnya Tingkat Kehadiran Tepat Waktu: Dari total 26 hari kerja aktif, hanya 1 (satu) hari tercatat hadir sebelum jam 06.50 WIB.
- Keterlambatan Masuk Berulang: Tercatat sebanyak 12 kali terlambat melakukan scan fingerprint kedatangan di atas batas toleransi.
- Tingginya Angka Ketidakhadiran: Tercatat 12 hari kerja tidak melakukan absensi check-clock masuk/pulang tanpa konfirmasi izin tertulis.

Sanksi dan Ketentuan Tindak Lanjut:
Diberikan TEGURAN KERAS atas pelanggaran jam operasional sekolah yang berulang. Pembinaan dan monitoring kedisiplinan dialihkan kepada Wakil Direktur Sekolah & Pesantren. Guru bersangkutan wajib hadir paling lambat pukul 06.50 WIB dan tertib melakukan fingerprint.`,
    tipeTabel: "none",
    modelTtd: "sp_kedisiplinan",
    penutupJenis: "peringatan",
    tembusan: ["1. Wakil Direktur Pesantren", "2. Biro Kedisiplinan & HCD", "3. Arsip"],
  },
];
