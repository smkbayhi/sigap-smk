import { User, MasterPerspektif, SuratKeluar, SuratMasuk, Disposisi, RKT, ActionPlan, ActionReport, SchoolSettings } from "./database.types";

// Official Logo Yayasan Pondok Pesantren Bayt Al-Hikmah (Left Logo)
// Official Logo Yayasan PP Bayt Al-Hikmah (Authentic extracted from School Doc)
export const LOGO_YAYASAN_DATA_URL = "data:image/jpeg;base64,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";

// Official Logo SMK Bayt Al-Hikmah (Authentic extracted from School Doc)
export const LOGO_SMK_CIRCULAR_DATA_URL = "data:image/jpeg;base64,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";

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

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  logoYayasanUrl: LOGO_YAYASAN_DATA_URL,
  logoSmkUrl: LOGO_SMK_CIRCULAR_DATA_URL,
  stempelUrl: STEMPEL_SEKOLAH_DATA_URL,
  ttdKepsekUrl: TTD_KEPSEK_DATA_URL,
  namaKepsek: "Mokhamat Ekhsan, S.Kom",
  niyKepsek: "14215094",
};

export const INITIAL_USERS: User[] = [
  {
    id: "user-kepsek",
    niy: "14215094",
    nip: "14215094",
    name: "Mokhamat Ekhsan, S.Kom",
    email: "kepsek@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "kepala_sekolah",
    jabatan: "Kepala SMK Bayt Al-Hikmah",
    phone: "6281234567890",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    ttd_url: TTD_KEPSEK_DATA_URL,
    stempel_url: STEMPEL_SEKOLAH_DATA_URL,
  },
  {
    id: "user-1794453469307",
    niy: "11861027",
    nip: "11861027",
    name: "AINIYATUL FITRIYAH, S.S",
    email: "smkbayhi@gmail.com",
    password: "password123",
    role: "tata_usaha",
    jabatan: "Kepala TU & Bendahara",
    phone: "6285646682246",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    ttd_url: undefined,
    stempel_url: undefined,
  },
  {
    id: "user-luluk-wakasek",
    niy: "12616042",
    nip: "12616042",
    name: "Luluk Mamlu'atus S.,S.S",
    email: "luluk@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "kasubag",
    jabatan: "Guru Bahasa Inggris",
    bidang: "wakil_kepala_sekolah",
    phone: "6281234567801",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user-1794529320093",
    niy: "13559090",
    nip: "13559090",
    name: "Yudha Prihantanto, S.Pd, M.Pd",
    email: "yudha@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "guru",
    jabatan: "Guru Produktif & Koord. Kejuruhan",
    phone: "6281234567802",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user-1794529404389",
    niy: "11556022",
    nip: "11556022",
    name: "Nur Faizah, S.Kom",
    email: "nurfaizah@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "guru",
    jabatan: "Guru Informatika",
    phone: "6281234567803",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user-1794529520784",
    niy: "16402178",
    nip: "16402178",
    name: "Nur Afandi, S.Pd",
    email: "nurafandi@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "guru",
    jabatan: "Guru PJOK & Wali Kelas",
    phone: "6281234567804",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user-1794529612527",
    niy: "18076236",
    nip: "18076236",
    name: "Akhmad Khoiron, Lc",
    email: "khoiron@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "kasubag",
    jabatan: "Guru PAI",
    bidang: "sarpras",
    phone: "6281234567805",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user-1794531757439",
    niy: "19070265",
    nip: "19070265",
    name: "Achmad Jabbar, S. Sn",
    email: "jabbar@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "kasubag",
    jabatan: "Guru Produktif",
    bidang: "kesiswaan",
    phone: "6281234567806",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user-1794531842979",
    niy: "22060315",
    nip: "22060315",
    name: "Muhammad Fajarul Afthon, S.Pd",
    email: "fajarul@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "kasubag",
    jabatan: "Guru Bahasa Indonesia",
    bidang: "humas_bkk",
    phone: "6281234567807",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "user-1794531941264",
    niy: "23060333",
    nip: "23060333",
    name: "Moh. Nasih Aminulloh, S.Mat, M.Si",
    email: "nasih@smk.baytalhikmah.sch.id",
    password: "password123",
    role: "kasubag",
    jabatan: "Guru Matematika",
    bidang: "kurikulum",
    phone: "6281234567808",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
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

export const INITIAL_SURAT_KELUAR: SuratKeluar[] = [];
export const INITIAL_SURAT_MASUK: SuratMasuk[] = [];
export const INITIAL_DISPOSISI: Disposisi[] = [];
export const INITIAL_RKT: RKT[] = [];
export const INITIAL_ACTION_PLANS: ActionPlan[] = [];
export const INITIAL_ACTION_REPORTS: ActionReport[] = [];
