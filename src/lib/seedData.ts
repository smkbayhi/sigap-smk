import { User, MasterPerspektif, SuratKeluar, SuratMasuk, Disposisi, RKT, ActionPlan, ActionReport } from "./database.types";

// Official Logo Yayasan Pondok Pesantren Bayt Al-Hikmah (Left Logo)
export const LOGO_YAYASAN_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" width="110" height="110">
  <defs>
    <linearGradient id="ygold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="ygreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16a34a" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
  </defs>
  <!-- Outer tilted rhombus shield in gold -->
  <rect x="20" y="20" width="70" height="70" rx="14" transform="rotate(45 55 55)" fill="url(#ygold)" stroke="#a16207" stroke-width="2"/>
  <!-- Inner green diamond -->
  <rect x="25" y="25" width="60" height="60" rx="10" transform="rotate(45 55 55)" fill="url(#ygreen)"/>
  <!-- Ribbon / Emblem zigzag Bayt Al-Hikmah 'B' calligraphy in white & yellow -->
  <path d="M42,32 L68,32 L46,55 L68,55 L42,78 L74,78" fill="none" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M42,32 L68,32 L46,55 L68,55 L42,78 L74,78" fill="none" stroke="url(#ygold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="55" cy="55" r="4" fill="#ffffff"/>
</svg>
`)}`;

// Official Logo SMK Bayt Al-Hikmah Pasuruan (Right Logo)
export const LOGO_SMK_CIRCULAR_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <!-- Circular Path for Top Arc Text -->
    <path id="smkTopText" d="M 20, 60 A 40, 40 0 1, 1 100, 60" fill="none"/>
    <!-- Circular Path for Bottom Arc Text -->
    <path id="smkBottomText" d="M 100, 60 A 40, 40 0 0, 1 20, 60" fill="none"/>
    <linearGradient id="smkGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>
  <!-- Outer black circle with gold ring -->
  <circle cx="60" cy="60" r="56" fill="#111827" stroke="url(#smkGold)" stroke-width="3.5"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#ca8a04" stroke-width="1.2"/>
  <circle cx="60" cy="60" r="32" fill="#15803d" stroke="url(#smkGold)" stroke-width="2.5"/>
  
  <!-- Arc Text in White -->
  <text font-family="'Arial Black', Arial, sans-serif" font-size="8" font-weight="900" fill="#ffffff" letter-spacing="1.2">
    <textPath href="#smkTopText" startOffset="50%" text-anchor="middle">
      SMK BAYT AL-HIKMAH
    </textPath>
  </text>
  <text font-family="'Arial Black', Arial, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" letter-spacing="2">
    <textPath href="#smkBottomText" startOffset="50%" text-anchor="middle">
      PASURUAN
    </textPath>
  </text>

  <!-- Center Emblem -->
  <polygon points="60,39 63,47 72,48 65,54 67,63 60,58 53,63 55,54 48,48 57,47" fill="url(#smkGold)"/>
  <path d="M49,67 Q60,63 71,67 L68,74 Q60,71 52,74 Z" fill="#ffffff"/>
</svg>
`)}`;

// Alias for general logo compatibility
export const LOGO_SMK_DATA_URL = LOGO_SMK_CIRCULAR_DATA_URL;

// Authentic Signature of Mokhamat Ekhsan, S.Kom.
export const TTD_KEPSEK_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120" width="220" height="120">
  <!-- Pen signature stroke matching sample -->
  <path d="M40,75 C45,45 60,20 70,45 C80,70 75,95 85,60 C95,25 110,35 115,70 C120,50 128,45 135,65 C142,50 150,55 158,70 L185,55" 
        fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Underline swirl & flourish -->
  <path d="M60,65 Q110,85 175,70 C190,65 195,50 185,45 C175,40 165,55 170,80 Q175,100 195,95" 
        fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="198" cy="95" r="2" fill="#0f172a"/>
</svg>
`)}`;

// Official Stamp SMK Bayt Al-Hikmah Pasuruan (Matching Image: Double ring, SEKOLAH MENENGAH KEJURUAN, PASURUAN, BAYT AL-HIKMAH, TERAKREDITASI)
export const STEMPEL_SEKOLAH_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" opacity="0.85">
  <defs>
    <!-- Top Arc Path -->
    <path id="stampTopArc" d="M 28, 100 A 72, 72 0 0, 1 172, 100" fill="none"/>
    <!-- Bottom Arc Path -->
    <path id="stampBottomArc" d="M 172, 100 A 72, 72 0 0, 1 28, 100" fill="none"/>
  </defs>
  <!-- Double Circle Rings in Official Violet-Blue #3b28cc / #4338ca -->
  <circle cx="100" cy="100" r="90" fill="none" stroke="#3730a3" stroke-width="3.5"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="#3730a3" stroke-width="1.8"/>

  <!-- Top Arc: SEKOLAH MENENGAH KEJURUAN -->
  <text font-family="'Arial Black', Arial, sans-serif" font-size="10.5" font-weight="900" fill="#3730a3" letter-spacing="1.5">
    <textPath href="#stampTopArc" startOffset="50%" text-anchor="middle">
      ★ SEKOLAH MENENGAH KEJURUAN ★
    </textPath>
  </text>

  <!-- Bottom Arc: PASURUAN -->
  <text font-family="'Arial Black', Arial, sans-serif" font-size="10" font-weight="900" fill="#3730a3" letter-spacing="3.5">
    <textPath href="#stampBottomArc" startOffset="50%" text-anchor="middle">
      PASURUAN
    </textPath>
  </text>

  <!-- Center Double Lines & Box for BAYT AL-HIKMAH -->
  <line x1="22" y1="84" x2="178" y2="84" stroke="#3730a3" stroke-width="1.8"/>
  <rect x="36" y="87" width="128" height="25" fill="none" stroke="#3730a3" stroke-width="1.5"/>
  <text x="100" y="104" font-family="'Arial Black', Arial, sans-serif" font-size="12" font-weight="900" fill="#3730a3" text-anchor="middle" letter-spacing="0.5">
    BAYT AL-HIKMAH
  </text>
  <line x1="22" y1="115" x2="178" y2="115" stroke="#3730a3" stroke-width="1.8"/>

  <!-- Sub-text: TERAKREDITASI -->
  <text x="100" y="126" font-family="'Arial Black', Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#3730a3" text-anchor="middle" letter-spacing="1">
    TERAKREDITASI
  </text>
</svg>
`)}`;

export const INITIAL_USERS: User[] = [
  {
    id: "user-kepsek",
    nip: "14215094", // NIY. 14215094
    name: "Mokhamat Ekhsan, S.Kom",
    email: "kepsek@smk.baytalhikmah.sch.id",
    role: "kepala_sekolah",
    jabatan: "Kepala SMK Bayt Al-Hikmah",
    phone: "6281234567890",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    ttd_url: TTD_KEPSEK_DATA_URL,
    stempel_url: STEMPEL_SEKOLAH_DATA_URL,
  },
  {
    id: "user-tu",
    nip: "14215098",
    name: "Siti Rahmawati, S.Kom.",
    email: "smkbayhi@gmail.com",
    role: "tata_usaha",
    jabatan: "Kepala Tata Usaha",
    phone: "6281398765432",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-kasubag-kurikulum",
    nip: "14215102",
    name: "M. Ridwan, S.T., M.Kom.",
    email: "kurikulum@smk.baytalhikmah.sch.id",
    role: "kasubag",
    jabatan: "Kasubag Kurikulum & Akademik",
    bidang: "kurikulum",
    phone: "6285231234567",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-kasubag-kesiswaan",
    nip: "14215105",
    name: "Ust. Farhan Maulana, S.Pd.I.",
    email: "kesiswaan@smk.baytalhikmah.sch.id",
    role: "kasubag",
    jabatan: "Kasubag Kesiswaan & Kedisiplinan",
    bidang: "kesiswaan",
    phone: "6285645678901",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-kasubag-sarpras",
    nip: "14215110",
    name: "Bambang Haryanto, S.T.",
    email: "sarpras@smk.baytalhikmah.sch.id",
    role: "kasubag",
    jabatan: "Kasubag Sarana & Prasarana",
    bidang: "sarpras",
    phone: "6281987654321",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-kasubag-humas",
    nip: "14215114",
    name: "Nabila Zahra, M.Si.",
    email: "humas@smk.baytalhikmah.sch.id",
    role: "kasubag",
    jabatan: "Kasubag Hubungan Industri & BKK",
    bidang: "humas_bkk",
    phone: "6282134567899",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-guru-1",
    nip: "14215120",
    name: "Ahmad Junaidi, S.Pd.",
    email: "junaidi@smk.baytalhikmah.sch.id",
    role: "guru",
    jabatan: "Guru Kejuruan TJKT / Pembina OSIS",
    phone: "6287812345678",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  }
];

export const INITIAL_PERSPEKTIF: MasterPerspektif[] = [
  {
    id: "perspektif-1",
    kode: "P1",
    nama: "Pengembangan Kurikulum Berbasis Industri & Teaching Factory",
    deskripsi: "Penyelarasan kurikulum vokasi, sinkronisasi dengan DUDI, dan implementasi pembelajaran berbasis produksi riil.",
    is_active: true,
    created_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "perspektif-2",
    kode: "P2",
    nama: "Pembinaan Karakter Santri, Kedisiplinan & Prestasi Siswa",
    deskripsi: "Penguatan nilai-nilai kepesantrenan Bayt Al-Hikmah, bimbingan olimpiade vokasi, dan kejuaraan LKS.",
    is_active: true,
    created_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "perspektif-3",
    kode: "P3",
    nama: "Modernisasi Sarana Prasarana & Digitalisasi Sekolah",
    deskripsi: "Peningkatan mutu laboratorium kejuruan, jaringan internet kampus terpadu, dan infrastruktur IT modern.",
    is_active: true,
    created_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "perspektif-4",
    kode: "P4",
    nama: "Penguatan Kemitraan DUDI, Penyaluran Kerja (BKK) & Magang Luar Negeri",
    deskripsi: "Kerjasama rekruitmen lulusan, sertifikasi internasional, magang industri dan wirausaha muda santri.",
    is_active: true,
    created_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "perspektif-5",
    kode: "P5",
    nama: "Tata Kelola Kelembagaan, Akuntabilitas Keuangan & SDM Unggul",
    deskripsi: "Peningkatan kualifikasi tenaga pendidik, sistem manajemen mutu ISO, serta efisiensi anggaran yayasan.",
    is_active: true,
    created_at: "2026-01-10T08:00:00Z",
  },
];

export const INITIAL_SURAT_KELUAR: SuratKeluar[] = [
  {
    id: "sk-146",
    nomor_surat: "146/SMK-BAYHI/XI/2026",
    no_urut: 146,
    bulan_romawi: "XI",
    tahun: 2026,
    jenis_surat: "surat_permohonan" as any,
    perihal: "Permohonan Izin Pemakaian Ruang dan Laptop",
    tujuan: "Kepala BLK Komunitas Bayt Al-Hikmah",
    tanggal_surat: "2026-11-10",
    lampiran: "-",
    isi_surat: `<p>Assalamu’alaikum wr. wb.</p>
<p>Salam silaturrahim kami sampaikan, semoga Allah SWT senantiasa melimpahkan rahmat, taufiq, serta hidayahNya kepada kita dalam menjalani rutinitas sehari-hari. Amin</p>
<p>Sehubungan dengan akan dilaksanakannya kegiatan TKA (Tes Kemampuan Akademik) Susulan santri kelas XII Tahun 2026, maka kami Kepala SMK Bayt Al-Hikmah bermaksud mengajukan permohonan izin pemakaian ruang praktik BLK dan Laptop sebanyak 3 unit untuk kegiatan tersebut yang akan dilaksanakan pada:</p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
  <tr><td style="width: 110px; font-weight: normal;">Hari</td><td>: Senin s.d Kamis</td></tr>
  <tr><td style="font-weight: normal;">Tanggal</td><td>: 16 s.d 19 November 2026</td></tr>
  <tr><td style="font-weight: normal;">Waktu</td><td>: 06.30 s.d 09.00 WIB</td></tr>
</table>
<p>Demikian surat permohonan dari kami, atas perhatian dan kerjasamanya kami sampaikan terima kasih. <em>Jazaakumulloh Ahsanal Jazaa’.</em></p>
<p>Wassalamu’alaikum. wr. wb.</p>`,
    status: "disetujui",
    created_by: "user-tu",
    creator_name: "Siti Rahmawati, S.Kom. (Tata Usaha)",
    approved_by: "user-kepsek",
    approver_name: "Mokhamat Ekhsan, S.Kom",
    approved_at: "2026-11-10T10:00:00Z",
    has_ttd: true,
    has_stempel: true,
    ttd_image_url: TTD_KEPSEK_DATA_URL,
    stempel_image_url: STEMPEL_SEKOLAH_DATA_URL,
    created_at: "2026-11-10T08:30:00Z",
  },
  {
    id: "sk-147",
    nomor_surat: "147/SMK-BAYHI/XI/2026",
    no_urut: 147,
    bulan_romawi: "XI",
    tahun: 2026,
    jenis_surat: "surat_tugas",
    perihal: "Surat Tugas Mengikuti Workshop Kurikulum Merdeka Vokasi 2026",
    tujuan: "Bapak M. Ridwan, S.T., M.Kom. & Ahmad Junaidi, S.Pd.",
    tanggal_surat: "2026-11-11",
    lampiran: "1 Lembar Rundown Acara",
    isi_surat: `<p>Assalamu’alaikum wr. wb.</p>
<p>Salam silaturrahim kami sampaikan, semoga Allah SWT senantiasa melimpahkan rahmat, taufiq, serta hidayahNya kepada kita dalam menjalani rutinitas sehari-hari. Amin</p>
<p>Kepala SMK Bayt Al-Hikmah Kota Pasuruan dengan ini menugaskan kepada:</p>
<ol style="margin-left: 20px;">
  <li><strong>M. Ridwan, S.T., M.Kom.</strong> (NIY: 14215102) - Kasubag Kurikulum</li>
  <li><strong>Ahmad Junaidi, S.Pd.</strong> (NIY: 14215120) - Guru Produktif TJKT</li>
</ol>
<p>Untuk hadir dan berpartisipasi aktif dalam kegiatan <em>"Workshop Sinkronisasi Kurikulum Merdeka Bersama Mitra Industri Nasional"</em> yang diselenggarakan pada:</p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
  <tr><td style="width: 110px;">Hari, Tanggal</td><td>: Kamis - Jumat, 19 - 20 November 2026</td></tr>
  <tr><td>Waktu</td><td>: 08.00 WIB s.d. Selesai</td></tr>
  <tr><td>Tempat</td><td>: Grand City Convention Hall, Surabaya</td></tr>
</table>
<p>Demikian surat tugas ini diberikan untuk dilaksanakan dengan penuh rasa tanggung jawab. <em>Jazaakumulloh Ahsanal Jazaa’.</em></p>
<p>Wassalamu’alaikum. wr. wb.</p>`,
    status: "menunggu_persetujuan",
    created_by: "user-tu",
    creator_name: "Siti Rahmawati, S.Kom. (Tata Usaha)",
    has_ttd: false,
    has_stempel: false,
    created_at: "2026-11-11T09:00:00Z",
  }
];

export const INITIAL_SURAT_MASUK: SuratMasuk[] = [
  {
    id: "sm-001",
    nomor_surat: "421.5/7821/101.4/2026",
    pengirim: "Dinas Pendidikan Provinsi Jawa Timur (Cabang Dinas Wilayah Pasuruan)",
    tanggal_surat: "2026-11-07",
    tanggal_diterima: "2026-11-09",
    perihal: "Undangan Rapat Koordinasi Evaluasi Bantuan SMK Pusat Keunggulan (SMK-PK) 2026",
    ringkasan: "Dinas Pendidikan Provinsi Jawa Timur mengundang Kepala Sekolah dan Tim Pengembang Kurikulum untuk memaparkan progres serapan program bantuan SMK Pusat Keunggulan skema lanjutan serta penyerapan lulusan ke industri rekanan.",
    file_url: "/surat-keluar/sk-146/print",
    file_name: "scan_surat_dinas_pendidikan_smk_pk.pdf",
    file_size: "1.4 MB",
    tingkat_urgensi: "segera",
    ai_analysis: {
      saran_bidang: "kurikulum",
      saran_penerima: "M. Ridwan, S.T., M.Kom. (Kasubag Kurikulum)",
      confidence_score: 96,
      key_points: [
        "Wajib dihadiri Kepala Sekolah & Kasubag Kurikulum",
        "Menyiapkan Laporan Pertanggungjawaban Realisasi Fisik & Finansial SMK-PK",
        "Batas konfirmasi kehadiran paling lambat 14 November 2026"
      ],
      action_deadline_suggestion: "2026-11-13",
      catatan_ai: "Dokumen terdeteksi memiliki urgensi tinggi dan tenggat waktu konfirmasi ketat (4 hari kerja)."
    },
    status_disposisi: "sudah_disposisi",
    created_at: "2026-11-09T08:30:00Z",
  },
  {
    id: "sm-002",
    nomor_surat: "TEL.204/BS/WTL-PAS/2026",
    pengirim: "PT Telkom Indonesia (Persero) Tbk - Witel Pasuruan",
    tanggal_surat: "2026-11-06",
    tanggal_diterima: "2026-11-08",
    perihal: "Program Kerjasama Sertifikasi Fiber Optic & Peluang Magang Guru Kejuruan",
    ringkasan: "PT Telkom Indonesia menawarkan kuota beasiswa sertifikasi teknisi Fiber Optic (Certified Fiber Optics Specialist) bagi 2 guru produktif dan 20 santri/siswa SMK Bayt Al-Hikmah jurusan TJKT tanpa dipungut biaya.",
    file_url: "/surat-keluar/sk-146/print",
    file_name: "surat_penawaran_telkom_fiber_optic.pdf",
    file_size: "2.1 MB",
    tingkat_urgensi: "penting",
    ai_analysis: {
      saran_bidang: "humas_bkk",
      saran_penerima: "Nabila Zahra, M.Si. (Kasubag Humas/BKK) & Ahmad Junaidi, S.Pd. (Guru TJKT)",
      confidence_score: 94,
      key_points: [
        "Beasiswa gratis uji sertifikasi industri Telkom",
        "Penempatan magang khusus bagi siswa berprestasi",
        "Perlu MoU tindak lanjut dan seleksi calon peserta"
      ],
      action_deadline_suggestion: "2026-11-16",
      catatan_ai: "Peluang strategis untuk peningkatan serapan kerja lulusan dan sertifikasi keahlian."
    },
    status_disposisi: "belum_disposisi",
    created_at: "2026-11-08T11:15:00Z",
  }
];

export const INITIAL_DISPOSISI: Disposisi[] = [
  {
    id: "disp-001",
    surat_masuk_id: "sm-001",
    pemberi_disposisi_id: "user-kepsek",
    pemberi_nama: "Mokhamat Ekhsan, S.Kom (Kepala SMK Bayt Al-Hikmah)",
    penerima_id: "user-kasubag-kurikulum",
    penerima_nama: "M. Ridwan, S.T., M.Kom.",
    penerima_role: "kasubag",
    penerima_bidang: "kurikulum",
    sifat: "segera",
    instruksi: "Tindak lanjuti segera dan susun draf materi laporan progres kurikulum SMK-PK bersama tim.",
    catatan: "Harap draf laporan dipresentasikan ke saya tanggal 12 November pagi sebelum dikirim ke Cabdin.",
    deadline: "2026-11-13",
    status: "proses",
    tanggapan: "Siap, draf progres serapan kurikulum dan modul ajar industri sudah 80% siap diuji.",
    whatsapp_sent: true,
    created_at: "2026-11-09T10:15:00Z",
  }
];

export const INITIAL_RKT: RKT[] = [
  {
    id: "rkt-001",
    tahun_anggaran: "2026/2027",
    bidang: "kurikulum",
    user_id: "user-kasubag-kurikulum",
    pic: "M. Ridwan, S.T., M.Kom.",
    perspektif_id: "perspektif-1",
    perspektif_nama: "Pengembangan Kurikulum Berbasis Industri & Teaching Factory",
    nama_kegiatan: "Penyelarasan Kurikulum Vokasi bersama PT Telkom & PT Inka",
    waktu_pelaksanaan: "Semester Ganjil (Juli - Desember 2026)",
    target_capaian: "Terbitnya silabus terintegrasi standar industri dan modul ajar praktikum berbasis proyek nyata.",
    status: "disetujui",
    approved_at: "2026-08-15T10:00:00Z",
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "rkt-002",
    tahun_anggaran: "2026/2027",
    bidang: "kurikulum",
    user_id: "user-kasubag-kurikulum",
    pic: "M. Ridwan, S.T., M.Kom.",
    perspektif_id: "perspektif-5",
    perspektif_nama: "Tata Kelola Kelembagaan, Akuntabilitas Keuangan & SDM Unggul",
    nama_kegiatan: "Pelatihan & Sertifikasi Asesor Kompetensi BNSP bagi Guru Kejuruan",
    waktu_pelaksanaan: "Bulan November 2026",
    target_capaian: "5 orang guru kejuruan memiliki sertifikat Asesor Lisensi BNSP aktif.",
    status: "disetujui",
    approved_at: "2026-08-20T11:00:00Z",
    created_at: "2026-08-05T09:00:00Z",
  }
];

export const INITIAL_ACTION_PLANS: ActionPlan[] = [
  {
    id: "ap-001",
    rkt_id: "rkt-001",
    rkt_nama: "Penyelarasan Kurikulum Vokasi bersama PT Telkom & PT Inka",
    user_id: "user-kasubag-kurikulum",
    bidang: "kurikulum",
    tanggal_dibuat: "2026-11-01",
    bulan_pelaksanaan: "November 2026",
    nama_kegiatan: "Focus Group Discussion (FGD) Finalisasi Silabus Praktikum TJKT bersama Tim Ahli Telkom",
    tujuan: "Menyelaraskan kompetensi dasar jaringan fiber optic dan cloud computing sesuai standar sertifikasi industri.",
    sasaran: "12 Guru Kejuruan TJKT & RPL",
    waktu_pelaksanaan: "Pekan ke-2 November 2026 (12 - 14 November)",
    keterangan: "Kegiatan luring di Meeting Room Gedung Sains Pesantren.",
    estimasi_anggaran: 8500000,
    created_at: "2026-11-01T09:00:00Z",
  }
];

export const INITIAL_ACTION_REPORTS: ActionReport[] = [
  {
    id: "ar-001",
    action_plan_id: "ap-001",
    user_id: "user-kasubag-kurikulum",
    tanggal_lapor: "2026-11-10",
    status_ketercapaian: "dalam_proses",
    persentase: 75,
    keterangan_realisasi: "Persiapan materi modul ajar praktikum telah rampung. Undangan narasumber dari PT Telkom telah dikonfirmasi hadir pada tanggal 13 November 2026.",
    lampiran_file_name: "Draf_Silabus_TJKT_Telkom_v2.docx",
    lampiran_file_url: "#",
    lampiran_file_size: "1.8 MB",
    created_at: "2026-11-10T16:30:00Z",
  }
];
