import * as XLSX from "xlsx";
import { User } from "./database.types";
import { PresensiPeriodReport } from "./presensi.types";
import { matchUserWithTeacher } from "./presensiParser";
import { getBidangLabel } from "./utils";

export function exportPresensiToExcel(report: PresensiPeriodReport, users?: User[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rekapitulasi Utama
  const summaryHeaders = [
    ["YAYASAN PONDOK PESANTREN BAYT AL-HIKMAH"],
    ["SMK BAYT AL-HIKMAH PASURUAN"],
    [`REKAPITULASI PRESENSI GURU & KARYAWAN - ${report.rentangTanggal}`],
    [],
    [
      "NO",
      "PIN / NIY",
      "NAMA GURU & KARYAWAN",
      "JABATAN",
      "HARI KERJA",
      "HADIR",
      "TERLAMBAT (HARI)",
      "TOTAL MENIT TELAT",
      "% TELAT",
      "STATUS KKM (>=50%)",
      "IZIN",
      "SAKIT",
      "ALPHA",
      "LUPA FINGER",
      "NILAI KETAATAN",
      "NILAI PRESTASI",
    ],
  ];

  const summaryData = report.teachers.map((t, idx) => {
    const matched = matchUserWithTeacher(t, users);
    const displayName = matched ? matched.name : t.nama;
    const displayPin = matched ? (matched.niy || matched.nip || t.pin) : t.pin;
    const displayJabatan = matched
      ? `${matched.jabatan}${matched.bidang ? ` (${getBidangLabel(matched.bidang)})` : ""}`
      : t.jabatan;

    return [
      idx + 1,
      displayPin,
      displayName,
      displayJabatan,
      t.totalHariKerja,
      t.totalHadir,
      t.totalTerlambatHari,
      t.totalMenitTerlambat,
      `${t.persentaseTerlambat}%`,
      t.statusKkm,
      t.totalIzin,
      t.totalSakit,
      t.totalAlpha,
      t.totalLupaFinger || 0,
      t.skorKetaatan || "-",
      t.totalNilaiKinerja || "-",
    ];
  });

  const wsSummary = XLSX.utils.aoa_to_sheet([...summaryHeaders, ...summaryData]);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Rekap Bulanan");

  // Sheet 2: Guru Tidak KKM (Peringatan Khusus >= 50%)
  const tidakKkmTeachers = report.teachers.filter((t) => t.statusKkm === "TIDAK KKM");
  const alertHeaders = [
    ["DAFTAR GURU KETERLAMBATAN KERJA >= 50% (TIDAK KKM)"],
    [`Periode: ${report.rentangTanggal}`],
    ["Catatan: Memerlukan pembinaan kedisiplinan dan evaluasi jam kerja"],
    [],
    [
      "NO",
      "NAMA GURU",
      "JABATAN",
      "TOTAL TERLAMBAT (HARI)",
      "TOTAL MENIT TELAT",
      "PERSENTASE TELAT",
      "STATUS",
      "TINDAK LANJUT",
    ],
  ];

  const alertData = tidakKkmTeachers.map((t, idx) => {
    const matched = matchUserWithTeacher(t, users);
    const displayName = matched ? matched.name : t.nama;
    const displayJabatan = matched
      ? `${matched.jabatan}${matched.bidang ? ` (${getBidangLabel(matched.bidang)})` : ""}`
      : t.jabatan;

    return [
      idx + 1,
      displayName,
      displayJabatan,
      t.totalTerlambatHari,
      t.totalMenitTerlambat,
      `${t.persentaseTerlambat}%`,
      "TIDAK KKM",
      "Teguran / Pembinaan Disiplin",
    ];
  });

  const wsAlert = XLSX.utils.aoa_to_sheet([...alertHeaders, ...alertData]);
  XLSX.utils.book_append_sheet(wb, wsAlert, "Peringatan TIDAK KKM");

  // Generate file name & trigger download
  const cleanTitle = `Rekap_Presensi_SMK_${report.bulan.replace(/\s+/g, "_")}_${report.tahun}.xlsx`;
  XLSX.writeFile(wb, cleanTitle);
}
