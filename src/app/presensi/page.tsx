"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { usePresensi } from "@/context/PresensiContext";
import { exportPresensiToExcel } from "@/lib/presensiExport";
import { matchUserWithTeacher, findTeacherRecordForUser } from "@/lib/presensiParser";
import { getBidangLabel } from "@/lib/utils";
import { StatusKehadiran, TeacherAttendanceSummary } from "@/lib/presensi.types";
import {
  UploadCloud,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  FileCheck,
  ShieldAlert,
  Send,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Check,
  X,
  Edit3,
  Trash2,
  Cloud,
  AlertCircle,
} from "lucide-react";

export default function PresensiPage() {
  const { isKepsek, isTU, currentUser, users } = useAuth();
  const { addToast } = useAppData();
  const {
    currentReport,
    allReports,
    isProcessing,
    isCloudSynced,
    isSyncing,
    lastSyncedAt,
    processUpload,
    updateTeacherAttendance,
    updateDailyStatus,
    selectReport,
    deleteReport,
    resetToSample,
    syncFromCloud,
  } = usePresensi();

  // Helper to dynamically resolve official teacher biodata from Master Pengguna & Hak Akses
  const getTeacherBiodata = (t: TeacherAttendanceSummary) => {
    const matched = matchUserWithTeacher(t, users);
    const displayName = matched ? matched.name : t.nama;
    const displayPin = matched ? (matched.niy || matched.nip || t.pin) : t.pin;
    const displayJabatan = matched ? matched.jabatan : t.jabatan;
    const displayBidang = matched?.bidang ? getBidangLabel(matched.bidang) : undefined;
    const displayAvatar = matched?.avatar;
    const isMasterSynced = Boolean(matched);

    return {
      displayName,
      displayPin,
      displayJabatan,
      displayBidang,
      displayAvatar,
      isMasterSynced,
      matchedUser: matched,
    };
  };

  // Permissions: Kepala Sekolah & TU can manage all; Guru & Kasubag monitor personal presensi only
  const canManageAllPresensi = isKepsek || isTU;
  const myTeacherRecord = findTeacherRecordForUser(currentReport?.teachers, currentUser);

  const [activeTab, setActiveTab] = useState<"rekap" | "rincian" | "evaluasi" | "upload">(
    canManageAllPresensi ? "rekap" : "rincian"
  );

  React.useEffect(() => {
    if (!canManageAllPresensi && (activeTab === "rekap" || activeTab === "upload")) {
      setActiveTab("rincian");
    }
  }, [canManageAllPresensi, activeTab]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterKkm, setFilterKkm] = useState<"all" | "kkm" | "tidak_kkm">("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    myTeacherRecord?.id || currentReport?.teachers[0]?.id || "g-08"
  );

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCutOffStart, setUploadCutOffStart] = useState("2026-10-26");
  const [uploadCutOffEnd, setUploadCutOffEnd] = useState("2026-11-25");
  const [uploadBulan, setUploadBulan] = useState("Oktober - November");
  const [uploadTahun, setUploadTahun] = useState(2026);
  const [dragActive, setDragActive] = useState(false);

  // If regular teacher, locked strictly to their personal record; if admin, allow switching
  const selectedTeacher = !canManageAllPresensi && myTeacherRecord
    ? myTeacherRecord
    : currentReport?.teachers.find((t) => t.id === selectedTeacherId) || myTeacherRecord || currentReport?.teachers[0] || null;

  // Filtered teachers list (searches against both raw and master synchronized biodata)
  const filteredTeachers = (currentReport?.teachers || []).filter((t) => {
    const bio = getTeacherBiodata(t);
    const q = searchTerm.toLowerCase();
    const matchSearch =
      bio.displayName.toLowerCase().includes(q) ||
      t.nama.toLowerCase().includes(q) ||
      bio.displayPin.toLowerCase().includes(q) ||
      t.pin.toLowerCase().includes(q) ||
      bio.displayJabatan.toLowerCase().includes(q) ||
      t.jabatan.toLowerCase().includes(q) ||
      (bio.displayBidang && bio.displayBidang.toLowerCase().includes(q));

    if (filterKkm === "kkm") return matchSearch && t.statusKkm === "KKM";
    if (filterKkm === "tidak_kkm") return matchSearch && t.statusKkm === "TIDAK KKM";
    return matchSearch;
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      addToast("info", "Memproses File Mesin", "Menganalisa data presensi fingerprint & menghitung rumus KKM...");
      const result = await processUpload(file, {
        bulan: uploadBulan,
        tahun: uploadTahun,
        cutOffStart: uploadCutOffStart,
        cutOffEnd: uploadCutOffEnd,
      });
      addToast(
        "success",
        "Rekapitulasi Berhasil Disimpan",
        `Berhasil merekap ${result.totalGuru} guru & disinkronkan ke Cloud. Terdapat ${result.guruTidakKkmCount} guru perlu pembinaan (Tidak KKM).`
      );
      setActiveTab("rekap");
    } catch (err: any) {
      console.error("Gagal parse file presensi:", err);
      addToast("error", "Format File Tidak Sesuai", "Pastikan file merupakan output mentah dari mesin fingerprint atau Excel presensi.");
    }
  };

  const handleExportExcel = () => {
    if (!currentReport) return;
    try {
      exportPresensiToExcel(currentReport, users);
      addToast("success", "Export Berhasil", "File Rekapitulasi Presensi (.xlsx) berhasil diunduh.");
    } catch (err) {
      console.error("Gagal export excel:", err);
      addToast("error", "Gagal Export", "Terjadi kesalahan saat membuat file Excel.");
    }
  };

  const handleSendWaReminder = (teacher: TeacherAttendanceSummary) => {
    if (!currentReport) return;
    const bio = getTeacherBiodata(teacher);
    const cleanPhone = bio.matchedUser?.phone ? bio.matchedUser.phone.replace(/\D/g, "") : "";
    const waBase = cleanPhone ? `https://wa.me/${cleanPhone}` : `https://wa.me/`;

    const lupaFingerRow = teacher.totalLupaFinger && teacher.totalLupaFinger > 0
      ? `• Lupa Checklock (Finger): ${teacher.totalLupaFinger} Hari (Diakui Hadir, Alpha = 0)\n`
      : "";

    const lupaFingerNote = teacher.totalLupaFinger && teacher.totalLupaFinger > 0
      ? `\n📌 CATATAN EVALUASI PRIBADI:
Tercatat ada ${teacher.totalLupaFinger} hari di mana Anda hadir bertugas namun tidak melakukan checklock fingerprint (masuk dan/atau pulang). Meskipun kehadiran tetap diakui (bukan Alpha), mohon untuk melakukan evaluasi mandiri dan lebih tertib melakukan checklock pada mesin fingerprint saat datang & pulang demi ketertiban administrasi bersama.\n`
      : "";

    const text = `Assalamu’alaikum Wr. Wb.
Yth. Ust/Ustzh ${bio.displayName},
Kami sampaikan rekapitulasi kehadiran Anda pada periode ${currentReport.rentangTanggal}:
• Total Hari Kerja: ${teacher.totalHariKerja} Hari
• Total Hadir: ${teacher.totalHadir} Hari
• Terlambat: ${teacher.totalTerlambatHari} Hari (${teacher.totalMenitTerlambat} menit)
• Persentase Keterlambatan: ${teacher.persentaseTerlambat}%
• Izin: ${teacher.totalIzin || 0} | Sakit: ${teacher.totalSakit || 0} | Alpha: ${teacher.totalAlpha || 0}
${lupaFingerRow}• Status Kedisiplinan: ${teacher.statusKkm}
${lupaFingerNote}
${
  teacher.statusKkm === "TIDAK KKM"
    ? "⚠️ PERINGATAN: Keterlambatan Anda mencapai/melebihi ambang batas 50%. Mohon untuk meningkatkan ketaatan jam kerja demi ketertiban bersama."
    : "Alhamdulillah, ketaatan jam kerja Anda telah memenuhi standar KKM. Pertahankan kedisiplinan ini."
}

Demikian kami sampaikan untuk evaluasi bersama, terima kasih.
Wassalamu’alaikum Wr. Wb.
- Bagian Tata Usaha SMK Bayt Al-Hikmah Pasuruan`;

    const url = `${waBase}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          {canManageAllPresensi && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Modul Tata Usaha & Ketenagaan
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-xs text-gray-500 font-medium">
                Fingerprint Engine Terintegrasi
              </span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-brand-700 shrink-0" />
            {canManageAllPresensi
              ? "Rekapitulasi Presensi & Kinerja Guru"
              : "Monitoring Presensi & Kinerja Pribadi"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {canManageAllPresensi ? (
              <>
                Periode Aktif:{" "}
                <strong className={currentReport ? "text-slate-800" : "text-gray-400 italic"}>
                  {currentReport ? currentReport.rentangTanggal : "Tidak Ada Periode Aktif"}
                </strong>
              </>
            ) : (
              <>
                Evaluasi kehadiran mandiri periode:{" "}
                <strong className={currentReport ? "text-slate-800" : "text-gray-400 italic"}>
                  {currentReport ? currentReport.rentangTanggal : "Tidak Ada Periode Aktif"}
                </strong>
                {" "}untuk peningkatan kedisiplinan kerja.
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Period Selector & Delete Button */}
          {allReports.length > 0 && currentReport && (
            <div className="flex items-center gap-1">
              <select
                value={currentReport.id}
                onChange={(e) => selectReport(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                {allReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.bulan} {r.tahun} {canManageAllPresensi ? `(${r.teachers.length} Staf)` : ""}
                  </option>
                ))}
              </select>

              {canManageAllPresensi && (
                <button
                  onClick={async () => {
                    const confirmMsg =
                      allReports.length > 1
                        ? `Apakah Anda yakin ingin menghapus arsip periode "${currentReport.bulan} ${currentReport.tahun}" (${currentReport.teachers.length} guru/pegawai)?\n\nData yang dihapus akan otomatis tersinkronisasi ke Cloud.`
                        : `Apakah Anda yakin ingin menghapus seluruh data arsip periode "${currentReport.bulan} ${currentReport.tahun}" dari database?\n\nSetelah dihapus, data absensi ini akan hilang dari sistem dan Cloud.`;
                    if (confirm(confirmMsg)) {
                      await deleteReport(currentReport.id);
                      addToast("info", "Arsip Dihapus", "Periode presensi berhasil dihapus dari sistem & database Cloud.");
                    }
                  }}
                  title="Hapus arsip periode aktif ini"
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Cloud Sync Status & Manual Refresh */}
          <button
            onClick={async () => {
              await syncFromCloud();
              addToast("success", "Sinkronisasi Cloud", "Data presensi terbaru berhasil dimuat dari Cloud Database.");
            }}
            disabled={isSyncing}
            title={lastSyncedAt ? `Terakhir sinkron: ${new Date(lastSyncedAt).toLocaleTimeString("id-ID")}` : "Sinkronkan dengan Cloud"}
            className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
            <span className="hidden sm:inline">{isSyncing ? "Sinkronisasi..." : "Sinkron Cloud"}</span>
            {isCloudSynced && !isSyncing && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5" title="Tersambung Cloud" />
            )}
          </button>

          {canManageAllPresensi && (
            <button
              onClick={() => setActiveTab("upload")}
              className="py-2 px-3.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Mesin</span>
            </button>
          )}

          {currentReport && (
            <>
              {canManageAllPresensi && (
                <button
                  onClick={handleExportExcel}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Excel</span>
                </button>
              )}

              <Link
                href="/presensi/print"
                className="py-2 px-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{canManageAllPresensi ? "Cetak PDF" : "Cetak Slip Presensi"}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Empty State when no reports exist in database */}
      {!currentReport ? (
        activeTab !== "upload" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-14 text-center shadow-xs">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Belum Ada Periode Presensi
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              {canManageAllPresensi
                ? "Data absensi belum tersedia atau telah dihapus. Silakan unggah file presensi baru dari mesin fingerprint atau spreadsheet untuk memulai rekapitulasi."
                : "Belum ada rekapitulasi data presensi aktif yang dipublikasikan oleh Bagian Tata Usaha untuk akun Anda."}
            </p>
            {canManageAllPresensi && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab("upload")}
                  className="py-2.5 px-5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Unggah File Presensi Sekarang</span>
                </button>
                <button
                  onClick={() => {
                    resetToSample();
                    addToast("info", "Data Contoh Dimuat", "Periode contoh telah dimuat kembali.");
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Muat Contoh Data Uji Coba
                </button>
              </div>
            )}
          </div>
        ) : null
      ) : (
        <>
          {/* STAT CARDS */}
          {canManageAllPresensi ? (
            /* 4 Administrative School-Wide Stat Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Guru */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Pegawai</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-0.5">
                    {currentReport.totalGuru}{" "}
                    <span className="text-xs font-normal text-gray-500">Guru/Staf</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {currentReport.totalHariEfektif} Hari Kerja Efektif
                  </p>
                </div>
              </div>

              {/* Card 2: Rata-Rata Kehadiran */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Rata-Rata Kehadiran</p>
                  <h3 className="text-2xl font-black text-blue-900 mt-0.5">
                    {currentReport.rataRataKehadiran}%
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> Sangat Baik
                  </p>
                </div>
              </div>

              {/* Card 3: Peringatan Tidak KKM (Terlambat >= 50%) */}
              <div
                className={`p-5 rounded-2xl border shadow-xs flex items-center gap-4 transition-all ${
                  currentReport.guruTidakKkmCount > 0
                    ? "bg-rose-50/80 border-rose-200 text-rose-900"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    currentReport.guruTidakKkmCount > 0
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    Tidak KKM (Telat ≥ 50%)
                  </p>
                  <h3 className="text-2xl font-black mt-0.5 text-rose-700">
                    {currentReport.guruTidakKkmCount}{" "}
                    <span className="text-xs font-normal">Guru Perlu Pembinaan</span>
                  </h3>
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    {currentReport.guruTidakKkmCount > 0
                      ? "Wajib Evaluasi & Bimbingan TU"
                      : "Seluruh guru memenuhi KKM"}
                  </p>
                </div>
              </div>

              {/* Card 4: Total Menit Keterlambatan */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Akumulasi Telat</p>
                  <h3 className="text-2xl font-black text-amber-900 mt-0.5">
                    {currentReport.teachers.reduce((acc, t) => acc + t.totalMenitTerlambat, 0)}{" "}
                    <span className="text-xs font-normal text-gray-500">Menit</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Rerata{" "}
                    {(
                      currentReport.teachers.reduce((acc, t) => acc + t.totalMenitTerlambat, 0) /
                      (currentReport.totalGuru || 1)
                    ).toFixed(1)}{" "}
                    mnt/guru
                  </p>
                </div>
              </div>
            </div>
          ) : myTeacherRecord ? (
            <>
            {/* 4 Personal Monitoring KPI Cards for regular teachers/kasubag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Personal Card 1: Hari Kerja Efektif */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Hari Kerja Efektif
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {myTeacherRecord.totalHariKerja}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Hari</span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5 truncate">
                    {myTeacherRecord.totalHadir} Hari Hadir Bertugas
                  </p>
                </div>
              </div>

              {/* Personal Card 2: Kehadiran Saya */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Tingkat Kehadiran
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-blue-900 tracking-tight">
                      {Math.round((myTeacherRecord.totalHadir / (myTeacherRecord.totalHariKerja || 1)) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    {myTeacherRecord.totalIzin || 0} Izin • {myTeacherRecord.totalSakit || 0} Sakit • {myTeacherRecord.totalAlpha || 0} Alpha{myTeacherRecord.totalLupaFinger ? ` • ${myTeacherRecord.totalLupaFinger} Lupa Finger` : ""}
                  </p>
                </div>
              </div>

              {/* Personal Card 3: Keterlambatan Saya */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Keterlambatan
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-amber-900 tracking-tight">
                      {myTeacherRecord.totalTerlambatHari}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Hari</span>
                    <span className="text-xs text-amber-800 font-semibold ml-1">
                      ({myTeacherRecord.totalMenitTerlambat} mnt)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    {myTeacherRecord.persentaseTerlambat}% dari jadwal kedatangan
                  </p>
                </div>
              </div>

              {/* Personal Card 4: Status KKM Disiplin */}
              <div className={`p-5 rounded-2xl border shadow-xs hover:shadow-sm transition-all flex items-center gap-4 ${
                myTeacherRecord.statusKkm === "TIDAK KKM"
                  ? "bg-rose-50/60 border-rose-200"
                  : "bg-emerald-50/60 border-emerald-200"
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  myTeacherRecord.statusKkm === "TIDAK KKM"
                    ? "bg-rose-100 text-rose-700 border-rose-200"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}>
                  {myTeacherRecord.statusKkm === "TIDAK KKM" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${
                    myTeacherRecord.statusKkm === "TIDAK KKM" ? "text-rose-700" : "text-emerald-700"
                  }`}>
                    Status KKM Disiplin
                  </p>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black tracking-wide ${
                      myTeacherRecord.statusKkm === "TIDAK KKM"
                        ? "bg-rose-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}>
                      {myTeacherRecord.statusKkm}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 font-medium truncate ${
                    myTeacherRecord.statusKkm === "TIDAK KKM" ? "text-rose-800" : "text-emerald-800"
                  }`}>
                    {myTeacherRecord.statusKkm === "TIDAK KKM"
                      ? `Telat ${myTeacherRecord.persentaseTerlambat}% (Ambang < 50%)`
                      : "Memenuhi Standar Disiplin"}
                  </p>
                </div>
              </div>
            </div>

            {/* Banner Evaluasi Pribadi: Lupa Checklock Fingerprint */}
            {myTeacherRecord.totalLupaFinger && myTeacherRecord.totalLupaFinger > 0 ? (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 shadow-xs">
                <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl shrink-0 border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-amber-950">
                      Catatan Evaluasi Pribadi: Lupa Checklock Fingerprint
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-[10px]">
                      {myTeacherRecord.totalLupaFinger} Hari Terdeteksi
                    </span>
                  </div>
                  <p className="text-amber-900 leading-relaxed">
                    Sistem mendeteksi <strong>{myTeacherRecord.totalLupaFinger} hari</strong> di mana Anda hadir namun tidak terekam sidik jari mesin (lupa checklock jam masuk dan/atau jam pulang).
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed pt-0.5">
                    💡 <strong>Status Tetap Diakui Hadir (Bukan Alpha):</strong> Jam kerja Anda tidak dianggap membolos dan hak kehadiran tetap dihitung. Namun demi ketertiban administrasi kepegawaian dan pelaporan sekolah, dimohon untuk melakukan evaluasi mandiri serta membiasakan checklock tepat waktu pada saat datang dan pulang.
                  </p>
                </div>
              </div>
            ) : null}
            </>
          ) : (
            /* Unlinked User Notice */
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-3.5 shadow-xs">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Data Presensi Belum Terhubung dengan Akun Anda</h4>
                <p className="text-xs text-amber-800 mt-1">
                  Akun Anda (<strong>{currentUser.name}</strong>, NIY: {currentUser.niy || "-"}) belum terdaftar atau belum cocok dengan PIN mesin fingerprint pada periode aktif <strong>{currentReport.rentangTanggal}</strong>.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Silakan hubungi Bagian Tata Usaha untuk mendaftarkan PIN mesin absensi Anda atau periksa periode bulan lainnya melalui menu di atas.
                </p>
              </div>
            </div>
          )}

          {/* ALERTS & REFLECTION BANNERS */}
          {canManageAllPresensi && currentReport.guruTidakKkmCount > 0 && (
            /* School-Wide High Alert Banner (Only for Kepsek & TU) */
            <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-rose-500/80 font-black px-2 py-0.5 rounded tracking-wider uppercase">
                      Peringatan Kedisiplinan Kerja
                    </span>
                    <span className="text-xs text-rose-200">•</span>
                    <span className="text-xs text-rose-200">
                      {currentReport.rentangTanggal}
                    </span>
                  </div>
                  <h4 className="text-base font-bold mt-1">
                    Terdapat {currentReport.guruTidakKkmCount} Guru dengan Keterlambatan ≥ 50% (TIDAK KKM)
                  </h4>
                  <p className="text-xs text-rose-100/90 mt-0.5 max-w-2xl">
                    Guru berikut terdeteksi memiliki tingkat keterlambatan di atas batas toleransi:{" "}
                    {currentReport.teachers
                      .filter((t) => t.statusKkm === "TIDAK KKM")
                      .map((t) => `${getTeacherBiodata(t).displayName} (${t.persentaseTerlambat}%)`)
                      .join(", ")}
                    . Disarankan untuk segera diberikan surat pembinaan disiplin.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setFilterKkm("tidak_kkm")}
                className="py-2.5 px-4 bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Daftar Prioritas</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!canManageAllPresensi && myTeacherRecord && (
            /* Personal Reflection Banner (Only visible to the individual teacher) */
            myTeacherRecord.statusKkm === "TIDAK KKM" ? (
              <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                      Peringatan Evaluasi Diri
                    </span>
                    <span className="text-xs text-rose-400 font-bold">•</span>
                    <span className="text-xs font-semibold text-rose-800">
                      Periode {currentReport.rentangTanggal}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-rose-950">
                    Keterlambatan Kehadiran Anda Mencapai {myTeacherRecord.persentaseTerlambat}% (Status: TIDAK KKM)
                  </h4>
                  <p className="text-xs text-rose-900/90 mt-1 leading-relaxed max-w-4xl">
                    Sesuai ketentuan kedisiplinan Yayasan & Tata Usaha SMK Bayt Al-Hikmah, ambang batas toleransi keterlambatan kehadiran adalah di bawah 50%.
                    Pada periode ini Anda tercatat terlambat sebanyak <strong>{myTeacherRecord.totalTerlambatHari} hari</strong> ({myTeacherRecord.totalMenitTerlambat} menit akumulasi).
                    Mohon untuk memperhatikan jam kedatangan (06:50 WIB) sebagai ikhtiar perbaikan ketertiban presensi pada periode berikutnya.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                      Kedisiplinan Memenuhi Standar
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">•</span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Periode {currentReport.rentangTanggal}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-emerald-950">
                    Alhamdulillah, Kehadiran Anda Memenuhi Standar KKM ({myTeacherRecord.persentaseTerlambat}% Keterlambatan)
                  </h4>
                  <p className="text-xs text-emerald-900/90 mt-1 leading-relaxed max-w-4xl">
                    Terima kasih atas ketepatan waktu dan dedikasi Anda dalam bertugas di SMK Bayt Al-Hikmah. Terus pertahankan kedisiplinan waktu demi kelancaran KBM dan keteladanan bagi para santri/siswa.
                  </p>
                </div>
              </div>
            )
          )}

          {/* Navigation Tabs (Modern Segmented Control) */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0">
              {canManageAllPresensi && (
                <button
                  onClick={() => setActiveTab("rekap")}
                  className={`py-2 px-3.5 font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "rekap"
                      ? "bg-white text-emerald-900 shadow-xs border border-slate-200/60 font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Rekapitulasi Presensi & KKM</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab("rincian")}
                className={`py-2 px-3.5 font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "rincian"
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200/60 font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>
                  {canManageAllPresensi
                    ? `Log Harian Guru (${selectedTeacher ? getTeacherBiodata(selectedTeacher).displayName.split(",")[0] : ""})`
                    : "Log Harian Presensi Saya"}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("evaluasi")}
                className={`py-2 px-3.5 font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "evaluasi"
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200/60 font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>
                  {canManageAllPresensi
                    ? "Dimensi Kinerja (Bobot 0.40)"
                    : "Evaluasi Dimensi Kinerja Saya"}
                </span>
              </button>

              {canManageAllPresensi && (
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`py-2 px-3.5 font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "upload"
                      ? "bg-white text-emerald-900 shadow-xs border border-slate-200/60 font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  <span>Unggah File Mesin</span>
                </button>
              )}
            </div>
          </div>

      {/* TAB 1: REKAPITULASI PRESENSI & KKM */}
      {activeTab === "rekap" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama guru atau PIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Filter KKM:</span>
              <button
                onClick={() => setFilterKkm("all")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  filterKkm === "all"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Semua ({currentReport.teachers.length})
              </button>
              <button
                onClick={() => setFilterKkm("tidak_kkm")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filterKkm === "tidak_kkm"
                    ? "bg-rose-700 text-white"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <span>Tidak KKM</span>
                <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full font-black">
                  {currentReport.guruTidakKkmCount}
                </span>
              </button>
              <button
                onClick={() => setFilterKkm("kkm")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  filterKkm === "kkm"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                KKM ({currentReport.teachers.filter((t) => t.statusKkm === "KKM").length})
              </button>
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[220px]">Nama Guru & Pegawai</th>
                  <th className="py-3 px-3 text-center">Hari Kerja</th>
                  <th className="py-3 px-3 text-center">Hadir</th>
                  <th className="py-3 px-3 text-center">Terlambat</th>
                  <th className="py-3 px-3 text-center">Total Menit</th>
                  <th className="py-3 px-4 min-w-[140px]">Persentase Telat</th>
                  <th className="py-3 px-3 text-center">Status KKM</th>
                  <th className="py-3 px-2 text-center text-blue-700">Izin</th>
                  <th className="py-3 px-2 text-center text-amber-700">Sakit</th>
                  <th className="py-3 px-2 text-center text-rose-700">Alpha</th>
                  <th className="py-3 px-2 text-center text-orange-700" title="Tercatat hadir namun lupa checklock fingerprint (evaluasi mandiri)">Lupa Finger</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filteredTeachers.map((t, idx) => {
                  const isLateHigh = t.persentaseTerlambat >= 50.0;
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLateHigh ? "bg-rose-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const bio = getTeacherBiodata(t);
                          return (
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-emerald-200">
                                {bio.displayAvatar && !bio.displayAvatar.startsWith("{") ? (
                                  <img src={bio.displayAvatar} alt={bio.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  bio.displayName.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span className="truncate">{bio.displayName}</span>
                                  {bio.isMasterSynced && (
                                    <span
                                      className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded shrink-0"
                                      title="Tersinkron dengan Master Pengguna & Hak Akses"
                                    >
                                      Sinkron
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  PIN: <span className="font-mono">{bio.displayPin}</span> • {bio.displayJabatan}
                                  {bio.displayBidang && (
                                    <span className="text-blue-600 font-medium"> ({bio.displayBidang})</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold">{t.totalHariKerja}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                        {t.totalHadir}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            isLateHigh
                              ? "bg-rose-100 text-rose-800"
                              : t.totalTerlambatHari > 0
                              ? "bg-amber-100 text-amber-800"
                              : "text-gray-400"
                          }`}
                        >
                          {t.totalTerlambatHari} Hari
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-600 font-mono">
                        {t.totalMenitTerlambat > 0 ? `${t.totalMenitTerlambat} mnt` : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full ${
                                isLateHigh
                                  ? "bg-rose-600"
                                  : t.persentaseTerlambat > 20
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, t.persentaseTerlambat)}%` }}
                            />
                          </div>
                          <span
                            className={`font-black text-xs ${
                              isLateHigh
                                ? "text-rose-700"
                                : t.persentaseTerlambat > 20
                                ? "text-amber-700"
                                : "text-gray-700"
                            }`}
                          >
                            {t.persentaseTerlambat}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {t.statusKkm === "TIDAK KKM" ? (
                          <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                            <AlertTriangle className="w-3 h-3" />
                            TIDAK KKM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-emerald-600" />
                            KKM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center text-blue-700 font-bold">
                        {t.totalIzin || "-"}
                      </td>
                      <td className="py-3.5 px-2 text-center text-amber-700 font-bold">
                        {t.totalSakit || "-"}
                      </td>
                      <td className="py-3.5 px-2 text-center text-rose-700 font-bold">
                        {t.totalAlpha || "-"}
                      </td>
                      <td className="py-3.5 px-2 text-center text-orange-700 font-bold">
                        {t.totalLupaFinger ? (
                          <span className="bg-orange-100 text-orange-900 border border-orange-200 px-1.5 py-0.5 rounded text-[11px]">
                            {t.totalLupaFinger}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTeacherId(t.id);
                              setActiveTab("rincian");
                            }}
                            title="Lihat Log Harian"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-brand-800 hover:text-brand-900 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSendWaReminder(t)}
                            title="Kirim Notifikasi WA"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <p>
              Menampilkan <strong>{filteredTeachers.length}</strong> dari{" "}
              <strong>{currentReport.teachers.length}</strong> guru & pegawai SMK Bayt Al-Hikmah.
            </p>
            <p className="text-[11px] text-gray-400">
              *Ambang Batas KKM Disiplin: Keterlambatan $\ge 50.0\%$ dinyatakan <strong>TIDAK KKM</strong>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: RINCIAN LOG HARIAN GURU */}
      {activeTab === "rincian" && selectedTeacher && (
        <div className="space-y-4">
          {/* Teacher Selector Card */}
          {(() => {
            const bio = getTeacherBiodata(selectedTeacher);
            return (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-800 font-black flex items-center justify-center text-lg overflow-hidden shrink-0 border border-brand-200">
                    {bio.displayAvatar && !bio.displayAvatar.startsWith("{") ? (
                      <img src={bio.displayAvatar} alt={bio.displayName} className="w-full h-full object-cover" />
                    ) : (
                      bio.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-gray-900">{bio.displayName}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedTeacher.statusKkm === "TIDAK KKM"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {selectedTeacher.statusKkm}
                      </span>
                      {bio.isMasterSynced && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded"
                          title="Tersinkron dengan Master Pengguna & Hak Akses"
                        >
                          Master Pengguna
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      PIN / NIY: <span className="font-mono font-medium">{bio.displayPin}</span> • {bio.displayJabatan}
                      {bio.displayBidang && (
                        <span className="text-blue-600 font-semibold"> ({bio.displayBidang})</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canManageAllPresensi ? (
                    <>
                      <label className="text-xs font-bold text-gray-600">Pilih Guru:</label>
                      <select
                        value={selectedTeacher.id}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="text-xs py-2 px-3 bg-slate-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      >
                        {currentReport.teachers.map((t) => {
                          const b = getTeacherBiodata(t);
                          return (
                            <option key={t.id} value={t.id}>
                              {b.displayName} ({t.statusKkm})
                            </option>
                          );
                        })}
                      </select>

                      <button
                        onClick={() => handleSendWaReminder(selectedTeacher)}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-200">
                      Rekam Presensi Mandiri
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Lupa Finger Notice for Selected Teacher */}
          {selectedTeacher.totalLupaFinger && selectedTeacher.totalLupaFinger > 0 ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/90 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-xs text-orange-950 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-800 rounded-xl shrink-0 mt-0.5 sm:mt-0 border border-orange-200">
                  <AlertCircle className="w-4 h-4 text-orange-700" />
                </div>
                <div>
                  <p className="font-bold text-orange-950">
                    Guru memiliki {selectedTeacher.totalLupaFinger} hari dengan status &quot;Lupa Finger&quot;
                  </p>
                  <p className="text-[11px] text-orange-800 mt-0.5">
                    Tercatat hadir di sekolah namun tidak terekam mesin sidik jari saat datang dan/atau pulang. Status ini tetap diakui Hadir (Alpha = 0) sebagai evaluasi mandiri guru.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 bg-orange-200/80 text-orange-900 font-extrabold text-[10px] rounded-lg shrink-0">
                {selectedTeacher.totalLupaFinger} Hari Evaluasi
              </span>
            </div>
          ) : null}

          {/* Daily Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Rincian Absensi Harian Mesin Fingerprint (Bulan {currentReport.bulan} {currentReport.tahun})
              </h4>
              <span className="text-[11px] text-gray-500">
                Jam Kerja Standar: 06:50 - 13:30 WIB
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">Hari & Tanggal</th>
                    <th className="py-2.5 px-3 text-center">Jadwal Masuk</th>
                    <th className="py-2.5 px-3 text-center">Jam Masuk (Finger)</th>
                    <th className="py-2.5 px-3 text-center">Jam Pulang</th>
                    <th className="py-2.5 px-3 text-center">Terlambat</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4">Keterangan / Alasan</th>
                    {canManageAllPresensi && (
                      <th className="py-2.5 px-3 text-center">Ubah Status</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {selectedTeacher.dailyDetails.map((day, idx) => {
                    const isLate = day.terlambatMenit > 0;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          day.status === "terlambat"
                            ? "bg-amber-50/20"
                            : day.status === "lupa_finger"
                            ? "bg-orange-50/30"
                            : day.status === "tugas_luar"
                            ? "bg-sky-50/20"
                            : day.status === "izin"
                            ? "bg-blue-50/20"
                            : day.status === "sakit"
                            ? "bg-purple-50/20"
                            : day.status === "alpha"
                            ? "bg-rose-50/30"
                            : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-gray-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {day.hari}, {day.tanggal}
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-500">{day.jadwalMasuk}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-800">
                          {day.jamMasuk}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-gray-600">
                          {day.jamPulang}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {day.terlambatMenit > 0 ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              +{day.terlambatMenit} mnt
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              day.status === "hadir"
                                ? "bg-emerald-100 text-emerald-800"
                                : day.status === "terlambat"
                                ? "bg-amber-100 text-amber-800"
                                : day.status === "lupa_finger"
                                ? "bg-orange-100 text-orange-900 border border-orange-200 font-extrabold"
                                : day.status === "tugas_luar"
                                ? "bg-sky-100 text-sky-800 border border-sky-200 font-bold"
                                : day.status === "izin"
                                ? "bg-blue-100 text-blue-800"
                                : day.status === "sakit"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {day.status === "lupa_finger"
                              ? "Lupa Finger"
                              : day.status === "tugas_luar"
                              ? "Tugas Luar"
                              : day.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-600 text-[11px]">
                          {day.keterangan || "-"}
                        </td>
                        {canManageAllPresensi && (
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={day.status}
                              onChange={(e) =>
                                updateDailyStatus(
                                  selectedTeacher.id,
                                  day.tanggal,
                                  e.target.value as StatusKehadiran
                                )
                              }
                              className="text-[11px] py-1 px-1.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                            >
                              <option value="hadir">Hadir</option>
                              <option value="terlambat">Terlambat</option>
                              <option value="lupa_finger">Lupa Finger</option>
                              <option value="tugas_luar">Tugas Luar</option>
                              <option value="izin">Izin</option>
                              <option value="sakit">Sakit</option>
                              <option value="alpha">Alpha</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVALUASI KINERJA (BOBOT 0.40 KEBIASAAN KERJA) */}
      {activeTab === "evaluasi" && (
        <div className="space-y-4">
          {!canManageAllPresensi && myTeacherRecord && (
            /* Summary Scorecard Grid for Personal Evaluation */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Skor Ketaatan Waktu
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-emerald-800">
                    {myTeacherRecord.skorKetaatan || "4.0"}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Telat {myTeacherRecord.totalTerlambatHari} hari ({myTeacherRecord.persentaseTerlambat}%)
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Skor Hadir Acara
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-blue-800">
                    {myTeacherRecord.skorAcara || "4.0"}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  2 Acara Resmi Sekolah
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Nilai Kebiasaan Kerja
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-amber-900">
                    {myTeacherRecord.nilaiKebiasaanKerja || "4.1"}
                  </span>
                  <span className="text-xs text-amber-800 font-bold">(Bobot 40%)</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kontribusi 0.40 pada PKG
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <p className="text-[11px] font-bold text-brand-800 uppercase tracking-wider">
                  Estimasi Nilai Akhir
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-brand-900">
                    {myTeacherRecord.totalNilaiKinerja || "4.34"}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 ml-1">Amat Baik</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status: {myTeacherRecord.statusKkm}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                {canManageAllPresensi
                  ? "Format Penilaian Dimensi Kinerja Guru & Karyawan (Dokumen Resmi Sekolah)"
                  : "Rincian Format Penilaian Dimensi Kinerja Guru (Dokumen Resmi)"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Dimensi Kebiasaan Kerja (Bobot 0.40), Hubungan Kerja (0.15), Kinerja (0.15), Pelanggaran (0.30)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3 text-center">No</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Guru & Karyawan</th>
                    <th className="py-3 px-3 text-center bg-emerald-50/50">Jml Telat</th>
                    <th className="py-3 px-3 text-center bg-emerald-50/50">% Telat</th>
                    <th className="py-3 px-3 text-center bg-emerald-50/50">Skor Ketaatan</th>
                    <th className="py-3 px-3 text-center bg-blue-50/50">Hadir Acara</th>
                    <th className="py-3 px-3 text-center bg-blue-50/50">Skor Acara</th>
                    <th className="py-3 px-4 text-center bg-amber-50/60 font-black">
                      Nilai Kebiasaan Kerja (0.40)
                    </th>
                    <th className="py-3 px-3 text-center font-bold">Status KKM</th>
                    <th className="py-3 px-4 text-center bg-brand-50/80 font-black text-brand-900">
                      Total Nilai Akhir
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {(canManageAllPresensi
                    ? currentReport.teachers
                    : myTeacherRecord
                    ? [myTeacherRecord]
                    : []
                  ).map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {(() => {
                          const bio = getTeacherBiodata(t);
                          return (
                            <div>
                              <div>{bio.displayName}</div>
                              <div className="text-[10.5px] font-normal text-gray-500">
                                PIN: <span className="font-mono">{bio.displayPin}</span> • {bio.displayJabatan}
                                {bio.displayBidang ? ` • ${bio.displayBidang}` : ""}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3 text-center bg-emerald-50/20">{t.totalTerlambatHari}</td>
                      <td className="py-3 px-3 text-center bg-emerald-50/20 font-bold">
                        {t.persentaseTerlambat}%
                      </td>
                      <td className="py-3 px-3 text-center bg-emerald-50/20 font-mono font-bold text-emerald-700">
                        {t.skorKetaatan || "4.0"}
                      </td>
                      <td className="py-3 px-3 text-center bg-blue-50/20">2 Kali</td>
                      <td className="py-3 px-3 text-center bg-blue-50/20 font-mono font-bold text-blue-700">
                        {t.skorAcara || "4.0"}
                      </td>
                      <td className="py-3 px-4 text-center bg-amber-50/40 font-mono font-black text-amber-900 text-xs">
                        {t.nilaiKebiasaanKerja || "4.1"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            t.statusKkm === "TIDAK KKM"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {t.statusKkm}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center bg-brand-50/40 font-mono font-black text-brand-900 text-sm">
                        {t.totalNilaiKinerja || "4.34"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
              <p>
                {canManageAllPresensi ? (
                  <>
                    Menampilkan <strong>{currentReport.teachers.length}</strong> guru & pegawai SMK Bayt Al-Hikmah.
                  </>
                ) : (
                  <>
                    Menampilkan evaluasi dimensi kinerja pribadi untuk <strong>{currentUser.name}</strong>.
                  </>
                )}
              </p>
              <p className="text-[11px] text-gray-400">
                *Bobot Dimensi: Kebiasaan Kerja (40%), Hubungan Kerja (15%), Hasil Kerja (15%), Pelanggaran (30%).
              </p>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* TAB 4: UNGGAH DATA FINGERPRINT BARU */}
      {activeTab === "upload" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6 max-w-3xl mx-auto">
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-gray-900">
              Unggah File Mentah Mesin Fingerprint (HCD / HRD)
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Sistem akan otomatis mengekstrak log kehadiran seluruh guru, mencocokkan PIN, dan menghitung persentase keterlambatan & KKM secara instan.
            </p>
          </div>

          {/* Cut-off Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tanggal Awal Cut-Off:
              </label>
              <input
                type="date"
                value={uploadCutOffStart}
                onChange={(e) => setUploadCutOffStart(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tanggal Akhir Cut-Off:
              </label>
              <input
                type="date"
                value={uploadCutOffEnd}
                onChange={(e) => setUploadCutOffEnd(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Bulan Rekapitulasi:
              </label>
              <input
                type="text"
                value={uploadBulan}
                onChange={(e) => setUploadBulan(e.target.value)}
                placeholder="Contoh: Oktober - November"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tahun:
              </label>
              <input
                type="number"
                value={uploadTahun}
                onChange={(e) => setUploadTahun(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
              />
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-emerald-600 bg-emerald-50/50"
                : "border-gray-300 hover:border-emerald-500 bg-slate-50/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800">
              {isProcessing ? "Sedang Mengolah Data..." : "Klik untuk Pilih File atau Seret File ke Sini"}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Mendukung format file output mesin absensi: <strong>.xlsx, .xls, atau .csv</strong>
            </p>
          </div>

          {/* Reset or Load Pre-set Sample */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <button
              onClick={() => {
                resetToSample();
                addToast("info", "Data Baku Dimuat", "Menampilkan data presensi resmi SMK Bayt Al-Hikmah.");
                setActiveTab("rekap");
              }}
              className="py-2 px-3 text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Gunakan Data Baku SMK (Sample Asli)</span>
            </button>

            <button
              onClick={() => setActiveTab("rekap")}
              className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
            >
              Kembali ke Rekapitulasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
