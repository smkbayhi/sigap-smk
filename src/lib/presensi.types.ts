export type StatusKehadiran = 
  | "hadir" 
  | "terlambat" 
  | "izin" 
  | "sakit" 
  | "alpha" 
  | "libur" 
  | "tugas_luar"
  | "lupa_finger";

export interface DailyAttendanceRecord {
  tanggal: string; // e.g. "2026-10-26" or "26/10/2026"
  tanggalNum: number;
  hari: string; // e.g. "Senin", "Selasa", ...
  jadwalMasuk: string; // e.g. "06:50"
  jadwalPulang: string; // e.g. "13:30"
  jamMasuk: string; // e.g. "06:57" or "-"
  jamPulang: string; // e.g. "13:52" or "-"
  terlambatMenit: number;
  pulangAwalMenit: number;
  status: StatusKehadiran;
  keterangan?: string;
  isLibur?: boolean;
}

export interface TeacherAttendanceSummary {
  id: string;
  pin: string;
  nama: string;
  gelar?: string;
  jabatan: string;
  totalHariKerja: number;
  totalHadir: number;
  totalTerlambatHari: number;
  totalMenitTerlambat: number;
  persentaseTerlambat: number; // in percent, e.g. 50.0
  statusKkm: "KKM" | "TIDAK KKM";
  totalIzin: number;
  totalSakit: number;
  totalAlpha: number;
  totalLupaFinger?: number;
  totalTugasLuar?: number;
  
  // Penilaian Dimensi Dokumen Sekolah
  skorKetaatan?: number; // 1 - 5
  skorAcara?: number; // 1 - 5
  nilaiKebiasaanKerja?: number; // Bobot 0.40
  totalNilaiKinerja?: number; // Nilai Akhir Prestasi

  dailyDetails: DailyAttendanceRecord[];
}

export interface PresensiPeriodReport {
  id: string;
  judul: string; // e.g. "Rekap Presensi Guru & Karyawan"
  bulan: string; // e.g. "Oktober - November" or "Juni"
  tahun: number; // e.g. 2026
  rentangTanggal: string; // e.g. "26 Oktober s.d 25 November 2026"
  cutOffStart: string;
  cutOffEnd: string;
  totalHariEfektif: number;
  totalGuru: number;
  guruTidakKkmCount: number;
  rataRataKehadiran: number;
  teachers: TeacherAttendanceSummary[];
  uploadedAt: string;
  uploadedBy: string;
  catatan?: string;
}
