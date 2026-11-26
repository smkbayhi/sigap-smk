import { EvaluasiSebatik } from "./database.types";

export const SEBATIK_SESI_OPTIONS = [
  "Sesi 1: Strategi MELODY – Dari RPP ke Bukti Belajar (Ustadzah Luluk Mamluatus S., S.S)",
  "Sesi 2: Penguatan LKPD Kontekstual & Rubrik Terukur (Ustadz Akhmad Khoiron, Lc.)",
  "Sesi 3: Media Kreatif & Public Speaking dalam KBM (Ustadz M. Fajarul Afthon, S.Pd.)",
];

export interface PilihanGandaSoal {
  nomor: number;
  pertanyaan: string;
  opsi: { kode: string; teks: string }[];
  kunci: string;
  pembahasan: string;
  bobotPoin: number;
}

export const SOAL_BAGIAN_A_PILIHAN: PilihanGandaSoal[] = [
  {
    nomor: 1,
    pertanyaan:
      'Di awal pembelajaran (5 menit pertama), seorang guru menampilkan contoh desain poster yang kurang proporsional lalu bertanya kepada santri: "Menurut kalian, bagian mana dari poster ini yang membuat mata cepat lelah saat membacanya?" Tujuan guru mengajukan pertanyaan tersebut adalah memancing rasa ingin tahu dan mengaitkan pengalaman santri dengan topik baru. Aktivitas ini termasuk kategori...',
    opsi: [
      { kode: "A", teks: "Asesmen Sumatif Akhir" },
      { kode: "B", teks: "Asesmen Awal Diagnostik Kognitif" },
      { kode: "C", teks: "Pertanyaan Pemantik (Apersepsi)" },
      { kode: "D", teks: "Asesmen Proses Keterampilan" },
    ],
    kunci: "C",
    pembahasan:
      "Pertanyaan pemantik di 5 menit pertama berfungsi memantik rasa ingin tahu dan menghubungkan skema awal santri dengan materi baru tanpa tujuan penskoran kemampuan dasar.",
    bobotPoin: 25,
  },
  {
    nomor: 2,
    pertanyaan:
      "Manakah pernyataan yang paling tepat membedakan antara Pertanyaan Pemantik dengan Asesmen Awal (Diagnostik Prasyarat)?",
    opsi: [
      {
        kode: "A",
        teks: "Pertanyaan pemantik wajib diberi skor angka 0–100, sedangkan asesmen awal tidak perlu dicatat.",
      },
      {
        kode: "B",
        teks: "Pertanyaan pemantik bertujuan memicu minat dan diskusi awal, sedangkan asesmen awal bertujuan memetakan kesiapan/kemampuan dasar santri sebelum masuk materi inti.",
      },
      {
        kode: "C",
        teks: "Pertanyaan pemantik dilakukan di akhir pelajaran, sedangkan asesmen awal dilakukan di tengah pelajaran.",
      },
      {
        kode: "D",
        teks: "Keduanya memiliki fungsi yang sama sehingga guru cukup memilih salah satu saja di dalam RPP.",
      },
    ],
    kunci: "B",
    pembahasan:
      "Pertanyaan pemantik membangkitkan rasa ingin tahu dan diskusi pembuka, sedangkan asesmen awal mengukur kemampuan awal/prasyarat santri sebagai dasar diferensiasi pembelajaran.",
    bobotPoin: 25,
  },
  {
    nomor: 3,
    pertanyaan:
      "Dalam alokasi waktu KBM 2×30 menit, agar pelaksanaan Asesmen Akhir (Exit Ticket) benar-benar terukur dan tidak tertukar dengan tugas kelompok (LKPD), bagaimana bentuk pelaksanaan yang paling ideal?",
    opsi: [
      {
        kode: "A",
        teks: "Dikerjakan secara mandiri oleh masing-masing santri selama 5–7 menit terakhir sebelum bel berbunyi dengan pedoman penskoran yang jelas.",
      },
      {
        kode: "B",
        teks: "Digabungkan menjadi satu dengan lembar diskusi kelompok agar menghemat waktu koreksi.",
      },
      {
        kode: "C",
        teks: "Diberikan sebagai pekerjaan rumah (PR) jika waktu kegiatan inti di kelas tidak mencukupi.",
      },
      {
        kode: "D",
        teks: "Cukup berupa pertanyaan lisan secara klasikal kepada satu atau dua santri yang paling aktif.",
      },
    ],
    kunci: "A",
    pembahasan:
      "Exit Ticket adalah bukti belajar individu mandiri yang dikerjakan di 5–7 menit penutup agar guru memperoleh feedback akurat ketercapaian setiap santri secara terpisah dari kerja kelompok.",
    bobotPoin: 25,
  },
  {
    nomor: 4,
    pertanyaan:
      "Mengapa penyusunan rubrik penskoran yang jelas (seperti pada materi LKPD dan asesmen) sangat penting dalam pelaksanaan evaluasi pembelajaran?",
    opsi: [
      {
        kode: "A",
        teks: "Agar santri merasa takut jika tidak mengerjakan tugas tepat waktu.",
      },
      {
        kode: "B",
        teks: "Untuk memperpanjang durasi kegiatan inti di dalam kelas.",
      },
      {
        kode: "C",
        teks: "Menjamin objektivitas penilaian guru, memberikan umpan balik yang terukur bagi santri, serta mempercepat proses koreksi.",
      },
      {
        kode: "D",
        teks: "Sebagai pelengkap administrasi RPP semata tanpa perlu disampaikan kepada santri.",
      },
    ],
    kunci: "C",
    pembahasan:
      "Rubrik terukur memberikan standar penilaian objektif yang transparan bagi santri, memudahkan umpan balik konstruktif, serta mengefisiensikan waktu koreksi guru.",
    bobotPoin: 25,
  },
];

export const SOAL_7_OPSI = [
  {
    kode: "A",
    teks: "Selalu tuntas tepat waktu (kegiatan pendahuluan, inti, dan asesmen penutup berjalan sesuai alokasi menit).",
  },
  {
    kode: "B",
    teks: "Sebagian besar tuntas (sesekali terpotong 2–3 menit di bagian penutup).",
  },
  {
    kode: "C",
    teks: "Sering molor di kegiatan inti (sehingga asesmen akhir sering terlewat atau dijadikan tugas lanjutan).",
  },
  {
    kode: "D",
    teks: "Masih kesulitan membagi waktu dan membutuhkan pendampingan teknis lebih lanjut.",
  },
];

export const SOAL_8_OPSI = [
  {
    kode: "A",
    teks: "Penjelasan materi pengantar dari guru terlalu panjang di awal sesi.",
  },
  {
    kode: "B",
    teks: "Proses praktik/diskusi kelompok santri berjalan lebih lambat dari perkiraan waktu.",
  },
  {
    kode: "C",
    teks: "Tidak menggunakan pengingat waktu (timer visual/alarm) saat KBM berlangsung.",
  },
  {
    kode: "D",
    teks: "Kendala teknis perangkat/media pembelajaran di kelas.",
  },
  {
    kode: "E",
    teks: "Tidak pernah mengalami kelebihan waktu (selalu tepat waktu).",
  },
];

export const SOAL_9_OPSI = [
  "Mencantumkan rincian pembagian menit (misal: 10 menit awal – 35 menit inti – 15 menit penutup) secara eksplisit di Modul Ajar/RPP.",
  "Menggunakan timer / pengingat waktu di layar proyektor atau gawai saat santri mengerjakan proyek/diskusi.",
  "Membatasi jumlah butir soal pada LKPD dan Exit Ticket agar proporsional dengan durasi 60 menit.",
  "Menyampaikan batas waktu pengerjaan tugas secara tegas di awal aktivitas santri.",
];

export function hitungSkorBagianA(j1: string, j2: string, j3: string, j4: string): number {
  let skor = 0;
  if (j1 === SOAL_BAGIAN_A_PILIHAN[0].kunci) skor += 25;
  if (j2 === SOAL_BAGIAN_A_PILIHAN[1].kunci) skor += 25;
  if (j3 === SOAL_BAGIAN_A_PILIHAN[2].kunci) skor += 25;
  if (j4 === SOAL_BAGIAN_A_PILIHAN[3].kunci) skor += 25;
  return skor;
}

export function cekWaktuTuntas(jawabanSoal7: string): boolean {
  return jawabanSoal7 === "A" || jawabanSoal7 === "B";
}

// 9 DATA AWAL RESPON RESMI GURU SMK BAYT AL-HIKMAH PASURUAN
export const SEED_EVALUASI_SEBATIK: EvaluasiSebatik[] = [
  {
    id: "seb-1",
    user_id: "guru-luluk",
    nama_guru: "Luluk Mamluatus S., S.S.",
    mata_pelajaran: "Bahasa Inggris & Literasi Kejuruan",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[1],
      SEBATIK_SESI_OPTIONS[2],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Have you ever ordered food online in English, and what was your biggest challenge?' | Soal Asesmen Akhir: 'Write a 3-sentence polite request to handle customer complaint based on the context!'",
    jawaban_soal_6:
      "Menggunakan lembar Exit Ticket 1/4 kuarto berisi 2 butir soal terfokus dengan rubrik checklist 3 kriteria, dikumpulkan tepat saat bel sisa 3 menit.",
    jawaban_soal_7: "A",
    is_waktu_tuntas: true,
    jawaban_soal_8: "E",
    jawaban_soal_9: [
      SOAL_9_OPSI[0],
      SOAL_9_OPSI[1],
      SOAL_9_OPSI[2],
      SOAL_9_OPSI[3],
    ],
    jawaban_soal_10:
      "Memasang countdown timer di proyektor saat sesi dialog santri. Santri menjadi sangat disiplin dan tahu kapan harus bersiap menyimpulkan materi.",
    jawaban_soal_11:
      "Menyelaraskan alokasi menit di modul ajar dengan jadwal bel pondok agar fase refleksi penutup tidak pernah terlewatkan.",
    skor_bagian_a: 100,
    created_at: "2026-11-20T09:15:00Z",
  },
  {
    id: "seb-2",
    user_id: "guru-khoiron",
    nama_guru: "Akhmad Khoiron, Lc.",
    mata_pelajaran: "Pendidikan Agama Islam & Bahasa Arab",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[1],
      SEBATIK_SESI_OPTIONS[2],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Mengapa dalam akad transaksi modern ada klausul gharar yang dihindari?' | Soal Asesmen Akhir: 'Tentukan hukum studi kasus pinjol syariah berikut dan sebutkan rukun yang tidak terpenuhi!'",
    jawaban_soal_6:
      "Rubrik penilaian hanya 2 kolom (Memenuhi Syarat / Belum Memenuhi Syarat) dengan 1 studi kasus singkat sehingga koreksi selesai dalam hitungan detik per anak.",
    jawaban_soal_7: "A",
    is_waktu_tuntas: true,
    jawaban_soal_8: "E",
    jawaban_soal_9: [
      SOAL_9_OPSI[0],
      SOAL_9_OPSI[2],
      SOAL_9_OPSI[3],
    ],
    jawaban_soal_10:
      "Mengurangi ceramah fikih klasik menjadi 10 menit pertama, kemudian santri langsung telaah kasus pada LKPD berbatas waktu 30 menit.",
    jawaban_soal_11:
      "Memastikan lembar rubrik LKPD dibagikan bersamaan dengan pengantar tugas agar santri tidak banyak bertanya teknis saat KBM inti.",
    skor_bagian_a: 100,
    created_at: "2026-11-20T10:30:00Z",
  },
  {
    id: "seb-3",
    user_id: "guru-fajar",
    nama_guru: "M. Fajarul Afthon, S.Pd.",
    mata_pelajaran: "Desain Komunikasi Visual (DKV) & Multimedia",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[1],
      SEBATIK_SESI_OPTIONS[2],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Mengapa logo brand terkenal dunia tidak pernah menggunakan lebih dari 3 warna utama?' | Soal Asesmen Akhir: 'Analisis proporsi hierarki visual pada karya flyer teman sebelahmu!'",
    jawaban_soal_6:
      "Asesmen akhir berupa peer-review digital cepat menggunakan form bintang 1–5 pada 3 indikator warna, font, dan margin.",
    jawaban_soal_7: "A",
    is_waktu_tuntas: true,
    jawaban_soal_8: "E",
    jawaban_soal_9: [
      SOAL_9_OPSI[1],
      SOAL_9_OPSI[2],
      SOAL_9_OPSI[3],
    ],
    jawaban_soal_10:
      "Memutar musik instrumen berdurasi 35 menit di lab komputer. Begitu musik berhenti, santri wajib berhenti mendesain dan memulai asesmen akhir.",
    jawaban_soal_11:
      "Melatih public speaking santri saat presentasi karya maksimal 60 detik per perwakilan kelompok.",
    skor_bagian_a: 100,
    created_at: "2026-11-21T08:20:00Z",
  },
  {
    id: "seb-4",
    user_id: "guru-nasih",
    nama_guru: "Nasihul Umam, S.Pd.",
    mata_pelajaran: "Matematika Terapan & Kurikulum",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[1],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Jika kecepatan data internetmu 20 Mbps, berapa menit waktu unduh file video 1,5 GB?' | Soal Asesmen Akhir: 'Hitung efisiensi biaya kuota bulanan lab menggunakan rumus perbandingan berbalik nilai!'",
    jawaban_soal_6:
      "Exit ticket 2 soal komputasi singkat langsung ditulis di sticky note dan ditempel di papan target sebelum keluar kelas.",
    jawaban_soal_7: "B",
    is_waktu_tuntas: true,
    jawaban_soal_8: "B",
    jawaban_soal_9: [
      SOAL_9_OPSI[0],
      SOAL_9_OPSI[2],
      SOAL_9_OPSI[3],
    ],
    jawaban_soal_10:
      "Membatasi langkah pengerjaan rumus matematika pada LKPD kontekstual agar santri fokus ke konsep penerapan bukan perhitungan angka rumit.",
    jawaban_soal_11:
      "Memberikan toleransi waktu maksimal 2 menit pada sesi tanya jawab agar tidak memakan waktu fase penutup.",
    skor_bagian_a: 100,
    created_at: "2026-11-21T11:00:00Z",
  },
  {
    id: "seb-5",
    user_id: "guru-aminah",
    nama_guru: "Siti Aminah, S.Pd.",
    mata_pelajaran: "Bahasa Indonesia & Notulensi",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[2],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Pernahkah kalian menerima surat undangan yang tanggal dan harinya salah ketik? Apa dampaknya?' | Soal Asesmen Akhir: 'Identifikasi 3 kesalahan tanda baca pada kutipan surat dinas terlampir!'",
    jawaban_soal_6:
      "Memberikan lembar mini-exit ticket berisi 1 paragraf untuk dikoreksi ejaannya dalam 5 menit.",
    jawaban_soal_7: "B",
    is_waktu_tuntas: true,
    jawaban_soal_8: "A",
    jawaban_soal_9: [
      SOAL_9_OPSI[0],
      SOAL_9_OPSI[3],
    ],
    jawaban_soal_10:
      "Menghentikan penjelasan teori ejaan saat waktu menunjukkan menit ke-15, langsung dialihkan ke bedah teks mandiri santri.",
    jawaban_soal_11:
      "Menyusun rubrik penskoran kalimat baku yang jelas agar santri bisa self-assessment secara cepat.",
    skor_bagian_a: 100,
    created_at: "2026-11-22T09:40:00Z",
  },
  {
    id: "seb-6",
    user_id: "guru-budi",
    nama_guru: "Budi Santoso, S.Kom.",
    mata_pelajaran: "Teknik Jaringan Komputer (TKJ)",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[1],
      SEBATIK_SESI_OPTIONS[2],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Mengapa saat kabel LAN salah pasang susunan warna, internet tetap tidak bisa terkoneksi padahal lampu port menyala?' | Soal Asesmen Akhir: 'Lakukan uji ping ke gateway 192.168.1.1 dan tunjukkan hasil TTL!'",
    jawaban_soal_6:
      "Checklist cepat berupa paraf pada kartu kendali praktikum per santri sebelum meja lab dirapikan.",
    jawaban_soal_7: "B",
    is_waktu_tuntas: true,
    jawaban_soal_8: "B",
    jawaban_soal_9: [
      SOAL_9_OPSI[1],
      SOAL_9_OPSI[3],
    ],
    jawaban_soal_10:
      "Membagi tugas kelompok jaringan komputer: 1 santri crimping, 1 konfigurasi IP, dan 1 pencatat laporan agar praktikum tidak overtime.",
    jawaban_soal_11:
      "Memastikan alat tester kabel dan crimping tool dicek sebelum kelas dimulai untuk mencegah kendala teknis.",
    skor_bagian_a: 100,
    created_at: "2026-11-22T13:10:00Z",
  },
  {
    id: "seb-7",
    user_id: "guru-rina",
    nama_guru: "Rina Kartika, S.Pd.",
    mata_pelajaran: "Kimia & Ilmu Pengetahuan Alam Terapan",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[1],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "C", // Skor 75 (1 salah di soal 3)
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Mengapa besi pagar di dekat tambak garam lebih cepat berkarat dibanding di pegunungan?' | Soal Asesmen Akhir: 'Tuliskan reaksi redoks singkat dari fenomena korosi!'",
    jawaban_soal_6:
      "Pertanyaan exit ticket 1 butir esai analisis konsep kimia dalam kehidupan sehari-hari.",
    jawaban_soal_7: "B",
    is_waktu_tuntas: true,
    jawaban_soal_8: "B",
    jawaban_soal_9: [
      SOAL_9_OPSI[0],
      SOAL_9_OPSI[1],
      SOAL_9_OPSI[2],
    ],
    jawaban_soal_10:
      "Menyiapkan bahan praktikum kimia sederhana di atas meja sebelum santri masuk ke laboratorium.",
    jawaban_soal_11:
      "Tidak lagi memberikan exit ticket sebagai PR, melainkan harus tuntas mandiri di 7 menit terakhir kelas.",
    skor_bagian_a: 75,
    created_at: "2026-11-23T08:50:00Z",
  },
  {
    id: "seb-8",
    user_id: "guru-zainal",
    nama_guru: "Zainal Abidin, S.Pd.",
    mata_pelajaran: "Pendidikan Jasmani, Olahraga & Kesehatan",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[2],
    ],
    jawaban_soal_1: "C",
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Mengapa sebelum lari sprint atlet dilarang makan berat?' | Soal Asesmen Akhir: 'Hitung denyut nadi pemulihan setelah pendinginan 5 menit!'",
    jawaban_soal_6:
      "Pencatatan denyut nadi mandiri santri di lembar rekap fisik sebelum masuk ruang ganti pakaian olahraga.",
    jawaban_soal_7: "A",
    is_waktu_tuntas: true,
    jawaban_soal_8: "E",
    jawaban_soal_9: [
      SOAL_9_OPSI[0],
      SOAL_9_OPSI[1],
      SOAL_9_OPSI[3],
    ],
    jawaban_soal_10:
      "Peluit pelatih berbunyi 10 menit sebelum jam usai menandai santri wajib pendinginan dan pengisian lembar refleksi fisik.",
    jawaban_soal_11:
      "Konsisten menjaga waktu ganti seragam santri agar jam pelajaran guru setelah PJOK tidak terganggu.",
    skor_bagian_a: 100,
    created_at: "2026-11-23T10:15:00Z",
  },
  {
    id: "seb-9",
    user_id: "guru-dewi",
    nama_guru: "Dewi Masithoh, S.Pd.",
    mata_pelajaran: "Sejarah Indonesia & Seni Budaya",
    sesi_diikuti: [
      SEBATIK_SESI_OPTIONS[0],
      SEBATIK_SESI_OPTIONS[1],
      SEBATIK_SESI_OPTIONS[2],
    ],
    jawaban_soal_1: "B", // Skor 75 (1 salah di soal 1)
    jawaban_soal_2: "B",
    jawaban_soal_3: "A",
    jawaban_soal_4: "C",
    jawaban_soal_5:
      "Pertanyaan Pemantik: 'Menurutmu mengapa Candi Borobudur dibangun di atas bukit, bukan di dekat pantai?' | Soal Asesmen Akhir: 'Sebutkan 2 peninggalan akulturasi budaya Islam dan Hindu di Pasuruan!'",
    jawaban_soal_6:
      "Santri menuliskan 1 hikmah sejarah pada kartu refleksi di akhir jam pelajaran.",
    jawaban_soal_7: "B",
    is_waktu_tuntas: true,
    jawaban_soal_8: "A",
    jawaban_soal_9: [
      SOAL_9_OPSI[0],
      SOAL_9_OPSI[2],
    ],
    jawaban_soal_10:
      "Meringkas cerita narasi sejarah ke dalam tayangan video 3 menit, sehingga sisa waktu bisa difokuskan untuk analisis kritis santri.",
    jawaban_soal_11:
      "Memperjelas batas antara apersepsi pemantik dan asesmen diagnostik di kegiatan pendahuluan.",
    skor_bagian_a: 75,
    created_at: "2026-11-24T09:00:00Z",
  },
];
