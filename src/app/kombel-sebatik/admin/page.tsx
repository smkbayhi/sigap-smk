"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { EvaluasiSebatik } from "@/lib/database.types";
import {
  getEvaluasiSebatikList,
  saveEvaluasiSebatik,
  deleteEvaluasiSebatikSingle,
  calculateSebatikMetrics,
  exportSebatikToCsv,
} from "@/lib/sebatikService";
import {
  SOAL_BAGIAN_A_PILIHAN,
  SOAL_7_OPSI,
  SOAL_8_OPSI,
} from "@/lib/sebatikConstants";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { TTD_KEPSEK_DATA_URL, STEMPEL_SEKOLAH_DATA_URL } from "@/lib/seedData";
import {
  ArrowLeft,
  Printer,
  Download,
  Search,
  Lock,
  Unlock,
  Users,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Eye,
  X,
  HelpCircle,
  Info,
  Calendar,
  Sparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface TeacherRowData {
  id: string;
  nama: string;
  niy?: string;
  mapel: string;
  isSubmitted: boolean;
  sesiDiikuti: string[];
  skorBagianA: number | null;
  isWaktuTuntas: boolean | null;
  evaluasiData: EvaluasiSebatik | null;
  submittedAt?: string;
}

export default function KombelSebatikAdminPage() {
  const { users, currentUser, isKepsek } = useAuth();
  const { schoolSettings, addToast } = useAppData();

  // PIN Protection State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Data State
  const [list, setList] = useState<EvaluasiSebatik[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<EvaluasiSebatik | null>(null);
  const [detailTab, setDetailTab] = useState<"pilihan_ganda" | "esai">("pilihan_ganda");

  // Manual Verification by Kepala Sekolah State
  const [verifyingTeacher, setVerifyingTeacher] = useState<TeacherRowData | null>(null);
  const [verifySkor, setVerifySkor] = useState<number>(100);
  const [verifyTuntasWaktu, setVerifyTuntasWaktu] = useState<boolean>(true);
  const [verifyCatatan, setVerifyCatatan] = useState<string>("");
  const [isSavingVerification, setIsSavingVerification] = useState<boolean>(false);

  // Automatically unlock if user is logged in as Kepala Sekolah
  useEffect(() => {
    if (isKepsek) {
      setIsUnlocked(true);
    }
  }, [isKepsek]);

  const handleOpenVerifyModal = (row: TeacherRowData) => {
    setVerifyingTeacher(row);
    setVerifySkor(100);
    setVerifyTuntasWaktu(true);
    setVerifyCatatan(`Telah mengonfirmasi pemahaman konsep kunci dan aktif menerapkan manajemen waktu KBM pada mata pelajaran ${row.mapel}.`);
  };

  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingTeacher) return;
    setIsSavingVerification(true);
    try {
      const payload: EvaluasiSebatik = {
        id: "eval-kepsek-" + Date.now(),
        user_id: verifyingTeacher.id,
        nama_guru: verifyingTeacher.nama,
        mata_pelajaran: verifyingTeacher.mapel,
        sesi_diikuti: [
          "Sesi 1: Strategi MELODY – Dari RPP ke Bukti Belajar (Ustadzah Luluk Mamluatus S., S.S)",
          "Sesi 2: Penguatan LKPD Kontekstual & Rubrik Terukur (Ustadz Akhmad Khoiron, Lc.)",
          "Sesi 3: Media Kreatif & Public Speaking dalam KBM (Ustadz M. Fajarul Afthon, S.Pd.)",
        ],
        // Selaraskan kunci pilihan ganda dengan skor yang disahkan Kepala Sekolah
        jawaban_soal_1: verifySkor >= 100 ? "C" : "B",
        jawaban_soal_2: verifySkor >= 75 ? "B" : "A",
        jawaban_soal_3: "A",
        jawaban_soal_4: verifySkor >= 50 ? "C" : "B",
        jawaban_soal_5: `Pertanyaan Pemantik: Memantik pemahaman konsep inti KBM sesuai kompetensi keahlian ${verifyingTeacher.mapel}.`,
        jawaban_soal_6: "Exit Ticket 5–7 menit berbasis rubrik ringkas / checklist cepat di akhir KBM.",
        skor_bagian_a: verifySkor,
        jawaban_soal_7: verifyTuntasWaktu ? "A" : "B",
        is_waktu_tuntas: verifyTuntasWaktu,
        jawaban_soal_8: verifyTuntasWaktu ? "E" : "B",
        jawaban_soal_9: [
          "Mencantumkan rincian pembagian menit secara eksplisit di Modul Ajar/RPP.",
          "Memasang timer visual di depan kelas / layar monitor.",
        ],
        jawaban_soal_10: verifyCatatan || "Disahkan mandiri oleh Kepala Sekolah (VBPG).",
        jawaban_soal_11: "Komitmen konsisten mengawal kualitas pembelajaran dan ketuntasan waktu KBM 2×30 menit santri SMK.",
        created_at: new Date().toISOString(),
      };

      await saveEvaluasiSebatik(payload);
      await loadData(false);
      setVerifyingTeacher(null);
    } catch (e) {
      console.error("Gagal simpan verifikasi mandiri:", e);
    } finally {
      setIsSavingVerification(false);
    }
  };

  const handleCancelVerification = async (id: string, teacherName: string) => {
    if (
      !confirm(
        `Batalkan status verifikasi untuk ${teacherName}?\n\nData pengesahan ini akan dihapus dari server sehingga status kembali menjadi 'Belum Mengisi' dan guru dapat mengisi formulir sendiri dari HP.`
      )
    ) {
      return;
    }
    try {
      await deleteEvaluasiSebatikSingle(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      await loadData(false);
      if (addToast) {
        addToast(
          "success",
          "Verifikasi Dibatalkan",
          `Status pengesahan untuk ${teacherName} berhasil dihapus. Guru kini dapat mengisi kembali secara mandiri.`
        );
      }
    } catch (err) {
      console.error("Gagal membatalkan verifikasi:", err);
    }
  };

  // Load responses from Cloud & Local
  const loadData = async (showMainSpinner = true) => {
    if (showMainSpinner) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const data = await getEvaluasiSebatikList();
      setList(data);
      if (!showMainSpinner && addToast) {
        addToast(
          "success",
          "Sinkronisasi Sukses",
          `Berhasil memuat ${data.length} respon evaluasi dewan guru dari database server cloud.`
        );
      }
    } catch (e) {
      console.error("Gagal memuat respon SEBATIK:", e);
      if (addToast) {
        addToast("error", "Gagal Memuat Data", "Terjadi kendala jaringan saat memuat respon dari cloud.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Auto-refresh data saat window focus (misal Kepala Sekolah kembali ke tab ini)
    const handleFocus = () => {
      loadData(false);
    };
    window.addEventListener("focus", handleFocus);

    // Auto-polling ringan setiap 20 detik untuk memantau guru yang baru submit
    const interval = setInterval(() => {
      loadData(false);
    }, 20000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Handle PIN unlock
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === "2026") {
      setIsUnlocked(true);
      setPinError(null);
    } else {
      setPinError("PIN Akses salah. Gunakan PIN default: 2026");
    }
  };

  // Daftar Dewan Guru Resmi SMK Bayt Al-Hikmah (Di luar akun Kepala Sekolah & TU)
  const dewanGuruResmi = useMemo(() => {
    return users.filter(
      (u) => u.role !== "kepala_sekolah" && u.role !== "tata_usaha"
    );
  }, [users]);

  // Gabungkan daftar guru terdaftar dengan hasil respon evaluasi yang sudah masuk
  const mergedTeacherList: TeacherRowData[] = useMemo(() => {
    const rows: TeacherRowData[] = [];
    const matchedEvalIds = new Set<string>();

    dewanGuruResmi.forEach((guru) => {
      // Cari respon yang sesuai berdasarkan ID atau kemiripan nama
      const evalMatch = list.find((item) => {
        if (item.user_id && item.user_id === guru.id) return true;
        const cleanItemName = (item.nama_guru || "").toLowerCase().replace(/[^a-z]/g, "");
        const cleanGuruName = (guru.name || "").toLowerCase().replace(/[^a-z]/g, "");
        return (
          cleanItemName.length > 3 &&
          cleanGuruName.length > 3 &&
          (cleanItemName.includes(cleanGuruName) || cleanGuruName.includes(cleanItemName))
        );
      });

      if (evalMatch) {
        matchedEvalIds.add(evalMatch.id);
        rows.push({
          id: guru.id,
          nama: guru.name,
          niy: guru.niy,
          mapel: evalMatch.mata_pelajaran || guru.jabatan || "Dewan Guru",
          isSubmitted: true,
          sesiDiikuti: evalMatch.sesi_diikuti || [],
          skorBagianA: evalMatch.skor_bagian_a,
          isWaktuTuntas: evalMatch.is_waktu_tuntas,
          evaluasiData: evalMatch,
          submittedAt: evalMatch.created_at,
        });
      } else {
        rows.push({
          id: guru.id,
          nama: guru.name,
          niy: guru.niy,
          mapel: guru.jabatan || "Dewan Guru",
          isSubmitted: false,
          sesiDiikuti: [],
          skorBagianA: null,
          isWaktuTuntas: null,
          evaluasiData: null,
        });
      }
    });

    // Tambahkan respon lain yang masuk namun belum terpetakan ke daftar akun terdaftar
    list.forEach((item) => {
      if (!matchedEvalIds.has(item.id)) {
        rows.push({
          id: item.id,
          nama: item.nama_guru,
          mapel: item.mata_pelajaran,
          isSubmitted: true,
          sesiDiikuti: item.sesi_diikuti || [],
          skorBagianA: item.skor_bagian_a,
          isWaktuTuntas: item.is_waktu_tuntas,
          evaluasiData: item,
          submittedAt: item.created_at,
        });
      }
    });

    return rows;
  }, [dewanGuruResmi, list]);

  // Filtered List berdasarkan pencarian nama atau mapel
  const filteredRows = mergedTeacherList.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.nama.toLowerCase().includes(q) ||
      row.mapel.toLowerCase().includes(q)
    );
  });

  // Kalkulasi Metrik dari respon riil yang ada
  const metrics = calculateSebatikMetrics(list);
  const totalGuruMengisi = list.length;
  const totalTargetGuru = Math.max(dewanGuruResmi.length, 1);
  const persenPartisipasi = Math.round((totalGuruMengisi / totalTargetGuru) * 100);

  // Trigger Native Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // IF LOCKED: Show PIN Gate
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              Akses Dasbor Kepala Sekolah & VBPG
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Halaman ini memuat rekapitulasi kolektif evaluasi Kombel SEBATIK untuk lampiran bukti fisik kinerja sekolah (VBPG). Khusus diperuntukkan bagi Kepala Sekolah dan Pengawas.
            </p>
          </div>

          {/* Kotak Panduan untuk Dewan Guru yang Tersasar ke URL Ini */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 text-center">
            <p className="font-bold text-emerald-900">
              Bapak/Ibu Dewan Guru:
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Untuk mengisi instrumen evaluasi Kombel SEBATIK atau melihat ulasan hasil jawaban Anda, silakan langsung menuju ke halaman instrumen guru:
            </p>
            <div>
              <Link
                href="/kombel-sebatik"
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Buka Formulir / Hasil Evaluasi Guru</span>
              </Link>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Khusus Pengawas / Admin
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PIN Akses Pengawas / Admin:
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN (Default: 2026)"
                className="w-full text-center text-lg tracking-widest font-mono font-bold px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-center mt-1">
                Petunjuk: Default PIN adalah <strong>2026</strong>
              </p>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Dasbor Laporan</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link
              href="/kombel-sebatik"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-800"
            >
              ← Kembali ke Formulir Instrumen Guru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:bg-white">
      {/* ========================================================================= */}
      {/* 1. VIEW SCREEN / WEB UI (HIDDEN WHEN PRINTING) */}
      {/* ========================================================================= */}
      <div className="max-w-6xl mx-auto space-y-6 print:hidden">
        {/* Top Bar Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <Link
              href="/kombel-sebatik"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-800 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Formulir Instrumen</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Dasbor Evaluasi Kombel SEBATIK
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Bukti Lampiran VBPG
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi pemahaman konsep & refleksi manajemen waktu mengajar 2×30 menit guru pasca-diseminasi praktik baik.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
              title="Sinkronkan data respon terbaru dari cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Menyinkronkan..." : "Sinkron / Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={() => exportSebatikToCsv(list)}
              disabled={list.length === 0}
              className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-bold text-xs border shadow-2xs transition-all ${
                list.length > 0
                  ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 cursor-pointer"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
              title="Unduh format spreadsheet CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF (VBPG)</span>
            </button>
          </div>
        </div>

        {/* 3 KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Guru */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Guru Mengisi
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {totalGuruMengisi} / {totalTargetGuru} Guru
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  totalGuruMengisi === totalTargetGuru && totalGuruMengisi > 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : totalGuruMengisi > 0
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-slate-500 bg-slate-100 border-slate-200"
                }`}
              >
                {persenPartisipasi}% Mengisi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {totalGuruMengisi === 0
                ? "Pelaksanaan pengisian instrumen belum dimulai (0 respon)."
                : `${totalGuruMengisi} dari ${totalTargetGuru} dewan guru telah mengirim evaluasi.`}
            </p>
          </div>

          {/* Card 2: Rata-Rata Skor */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rata-Rata Skor Pemahaman
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                {totalGuruMengisi > 0 ? metrics.rataRataSkorA : "-"}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {totalGuruMengisi > 0 ? "/ 100 Poin" : "(Belum Ada Respon)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {totalGuruMengisi > 0
                ? "Tingkat akurasi konsep apersepsi pemantik vs asesmen"
                : "Skor akan terhitung otomatis saat guru mulai mengisi"}
            </p>
          </div>

          {/* Card 3: Ketuntasan Waktu */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ketuntasan Waktu KBM (2×30')
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                {totalGuruMengisi > 0 ? `${metrics.persenWaktuTuntas}%` : "-"}
              </span>
              <span className="text-xs text-slate-500">
                {totalGuruMengisi > 0 ? "Tuntas (Opsi A & B)" : "(Belum Ada Respon)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {totalGuruMengisi > 0
                ? "Keterlaksanaan alokasi menit pendahuluan, inti & penutup"
                : "Menunggu respon refleksi manajemen waktu dari guru"}
            </p>
          </div>
        </div>

        {/* 3 VISUAL DISTRIBUTION CHARTS (HANYA DITAMPILKAN JIKA SUDAH ADA RESPON) */}
        {totalGuruMengisi > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Distribusi Skor */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>Distribusi Skor Pemahaman</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-emerald-800 font-bold">Skor 100 (Sempurna)</span>
                    <span className="font-mono text-slate-700">
                      {metrics.distribusiSkor.skor100} Guru (
                      {Math.round((metrics.distribusiSkor.skor100 / metrics.totalRespon) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{
                        width: `${(metrics.distribusiSkor.skor100 / metrics.totalRespon) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-blue-800 font-bold">Skor 75 (1 Kurang Tepat)</span>
                    <span className="font-mono text-slate-700">
                      {metrics.distribusiSkor.skor75} Guru (
                      {Math.round((metrics.distribusiSkor.skor75 / metrics.totalRespon) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: `${(metrics.distribusiSkor.skor75 / metrics.totalRespon) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-amber-800 font-bold">Skor ≤ 50 (Perlu Pendampingan)</span>
                    <span className="font-mono text-slate-700">
                      {metrics.distribusiSkor.skor50kebawah} Guru (
                      {Math.round((metrics.distribusiSkor.skor50kebawah / metrics.totalRespon) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{
                        width: `${(metrics.distribusiSkor.skor50kebawah / metrics.totalRespon) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Ketuntasan Waktu Mengajar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Keterlaksanaan Waktu (Soal 7)</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-emerald-800">Selalu Tuntas Tepat Waktu</span>
                    <span className="font-mono font-bold text-slate-700">
                      {metrics.distribusiWaktu.tuntas} Guru
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{
                        width: `${(metrics.distribusiWaktu.tuntas / metrics.totalRespon) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-teal-800">Sebagian Besar Tuntas</span>
                    <span className="font-mono font-bold text-slate-700">
                      {metrics.distribusiWaktu.sebagian} Guru
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{
                        width: `${(metrics.distribusiWaktu.sebagian / metrics.totalRespon) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-rose-700">Sering Molor / Terlewat</span>
                    <span className="font-mono font-bold text-slate-700">
                      {metrics.distribusiWaktu.seringMolor + metrics.distribusiWaktu.kesulitan} Guru
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{
                        width: `${
                          ((metrics.distribusiWaktu.seringMolor + metrics.distribusiWaktu.kesulitan) /
                            metrics.totalRespon) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 3: Faktor Utama Overtime */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>Penyebab Overtime (Soal 8)</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Praktik/Diskusi Santri Lambat:</span>
                  <span className="font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {metrics.faktorOvertime.praktikLambat} Guru
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Penjelasan Guru Terlalu Panjang:</span>
                  <span className="font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {metrics.faktorOvertime.pengantarPanjang} Guru
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Tidak Pakai Timer Visual:</span>
                  <span className="font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {metrics.faktorOvertime.tanpaTimer} Guru
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-semibold">
                  <span>Selalu Tepat Waktu (Nol Overtime):</span>
                  <span className="font-bold font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    {metrics.faktorOvertime.tepatWaktu} Guru
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAMPILAN STANDBY KETIKA BELUM ADA GURU YANG MENGISI */
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Visualisasi Grafik Siap Ditampilkan
            </h3>
            <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
              Instrumen evaluasi Kombel SEBATIK saat ini dalam status <strong>siap disosialisasikan</strong>. Grafik distribusi skor pemahaman dan persentase manajemen waktu akan otomatis terhitung dan muncul secara langsung begitu dewan guru mulai mengirimkan respon.
            </p>
          </div>
        )}

        {/* PENJELASAN MENU AKSI / DETAIL ESAI */}
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="text-xs text-emerald-950 space-y-1">
            <h4 className="font-bold text-emerald-900 text-[13px] flex items-center gap-1.5">
              <span>Penjelasan Menu & Kolom "Aksi (Detail & Kunci Jawaban)"</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Tombol <strong>"Lihat Jawaban & Kunci"</strong> pada kolom Aksi disediakan untuk Kepala Sekolah dan Asesor VBPG guna meninjau seluruh rincian respon guru: uji pemahaman pilihan ganda (beserta kunci dan pembahasannya), keterlaksanaan waktu 2×30', serta jawaban esai kualitatif. Detail tersebut mencakup:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-0.5 pt-0.5 font-medium">
              <li><strong>Soal 5:</strong> Contoh konkret Pertanyaan Pemantik vs Soal Asesmen Awal/Akhir sesuai mata pelajaran guru.</li>
              <li><strong>Soal 6:</strong> Strategi perancangan Asesmen Akhir (Exit Ticket 5–7 menit) yang tidak membebani koreksi guru.</li>
              <li><strong>Soal 10:</strong> Trik manajemen waktu nyata yang efektif diterapkan di kelas agar durasi 2×30' tidak molor.</li>
              <li><strong>Soal 11:</strong> Komitmen perbaikan spesifik guru untuk pertemuan KBM berikutnya.</li>
            </ul>
            <p className="text-[11px] text-emerald-800 font-semibold pt-1">
              *Catatan: Guru yang belum mengisi formulir akan berstatus <em>"Menunggu Pengisian"</em> dan nilai skor akan berstatus strip (-).
            </p>
          </div>
        </div>

        {/* DETAIL TABLE OF TEACHERS' RESPONSES & MONITORING STATUS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Monitoring Evaluasi Seluruh Guru SMK ({filteredRows.length})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {totalGuruMengisi} Selesai • {totalTargetGuru - totalGuruMengisi} Belum Mengisi
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar seluruh dewan guru SMK Bayt Al-Hikmah terdaftar, status pengisian formulir, skor pemahaman, dan detail esai.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama guru / mapel..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-4">Nama Guru & Mapel</th>
                  <th className="py-3 px-3 text-center">Status Form</th>
                  <th className="py-3 px-3 text-center">Sesi Diikuti</th>
                  <th className="py-3 px-3 text-center">Skor Bagian A</th>
                  <th className="py-3 px-3 text-center">Ketuntasan Waktu</th>
                  <th className="py-3 px-3 text-center">Aksi (Detail & Kunci)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{row.nama}</div>
                      <div className="text-[11px] text-slate-500">
                        {row.mapel} {row.niy ? `• NIY: ${row.niy}` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.isSubmitted ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sudah Mengisi</span>
                          </span>
                          {row.evaluasiData?.id.startsWith("eval-kepsek-") && (
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Verifikasi Kepsek
                            </span>
                          )}
                          {row.submittedAt && (
                            <span className="text-[10px] text-slate-400 font-mono" title={new Date(row.submittedAt).toLocaleString("id-ID")}>
                              {new Date(row.submittedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                          <span>Belum Mengisi</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.isSubmitted ? (
                        <span className="text-[11px] text-slate-700 font-medium">
                          {row.sesiDiikuti.length} Sesi Praktik
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.isSubmitted && row.skorBagianA !== null ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                            row.skorBagianA === 100
                              ? "bg-emerald-100 text-emerald-800"
                              : row.skorBagianA === 75
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.skorBagianA} Poin
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono font-bold">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.isSubmitted && row.isWaktuTuntas !== null ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            row.isWaktuTuntas
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {row.isWaktuTuntas ? "✓ Tuntas Tepat Waktu" : "⚠ Sering Molor"}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.isSubmitted && row.evaluasiData ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(row.evaluasiData);
                              setDetailTab("pilihan_ganda");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors cursor-pointer border border-emerald-200/60 shadow-2xs"
                            title="Buka rincian jawaban pilihan ganda, kunci jawaban, dan esai guru"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Jawaban & Kunci</span>
                          </button>
                          {row.evaluasiData.id.startsWith("eval-kepsek-") && (
                            <button
                              type="button"
                              onClick={() => handleCancelVerification(row.evaluasiData!.id, row.nama)}
                              className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer"
                              title="Batalkan status verifikasi mandiri ini agar guru dapat mengisi sendiri instrumen dari HP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition-colors cursor-pointer border border-emerald-200/80 shadow-2xs"
                            title="Pengesahan / Verifikasi pengisian guru oleh Kepala Sekolah"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ Verifikasi Mandiri</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODAL DETAIL JAWABAN & KUNCI EVALUASI GURU */}
      {/* ========================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedItem.nama_guru}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    Skor: {selectedItem.skor_bagian_a} / 100 Poin
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      selectedItem.is_waktu_tuntas
                        ? "bg-teal-100 text-teal-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedItem.is_waktu_tuntas ? "Waktu: Tuntas Tepat Waktu" : "Waktu: Perlu Optimasi"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mata Pelajaran: <strong>{selectedItem.mata_pelajaran}</strong> • Waktu Pengisian:{" "}
                  {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Pengesahan Kepsek */}
            {selectedItem.id.startsWith("eval-kepsek-") && (
              <div className="p-3.5 bg-amber-50/90 border-b border-amber-200/80 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block text-[12px]">
                      Status: Pengesahan Mandiri oleh Kepala Sekolah (VBPG)
                    </span>
                    <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                      Data ini disahkan langsung oleh Kepala Sekolah. Kunci pilihan ganda diselaraskan dengan skor verifikasi ({selectedItem.skor_bagian_a} Poin). Jika guru bersangkutan ingin mengisi instrumen sendiri dari HP, Anda dapat membatalkan status ini.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelVerification(selectedItem.id, selectedItem.nama_guru)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Hapus status pengesahan ini agar guru dapat mengisi sendiri instrumen dari HP"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Batalkan & Izinkan Guru Isi Mandiri</span>
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-100/50 px-5 pt-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDetailTab("pilihan_ganda")}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  detailTab === "pilihan_ganda"
                    ? "border-emerald-600 text-emerald-800 font-extrabold bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Pilihan Ganda & Kunci (Soal 1–4)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                  {selectedItem.skor_bagian_a} Pts
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("esai")}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  detailTab === "esai"
                    ? "border-emerald-600 text-emerald-800 font-extrabold bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Refleksi Waktu & Esai (Soal 5–11)</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {detailTab === "pilihan_ganda" ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-[11px] text-emerald-950 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      Bagian A menguji pemahaman konsep pembeda antara <strong>Pertanyaan Pemantik (Apersepsi)</strong> vs <strong>Asesmen Awal & Asesmen Akhir</strong>. Nilai otomatis dihitung 25 poin per soal yang benar (total 100 poin).
                    </div>
                  </div>

                  {SOAL_BAGIAN_A_PILIHAN.map((q) => {
                    const rawAns = (selectedItem as any)[`jawaban_soal_${q.nomor}`] || "";
                    const userAns = typeof rawAns === "string" ? rawAns.toUpperCase().trim() : "";
                    const isCorrect = userAns === q.kunci;

                    return (
                      <div
                        key={q.nomor}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0">
                              {q.nomor}
                            </span>
                            <span className="font-bold text-slate-800 text-[13px]">
                              Soal No. {q.nomor}
                            </span>
                          </div>
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Benar (+{q.bobotPoin} Poin)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Kurang Tepat (0 Poin)
                            </span>
                          )}
                        </div>

                        <p className="text-slate-700 leading-relaxed font-medium text-xs">
                          {q.pertanyaan}
                        </p>

                        {/* Daftar Opsi A, B, C, D */}
                        <div className="space-y-1.5 pt-1">
                          {q.opsi.map((opt) => {
                            const isUserChoice = userAns === opt.kode;
                            const isOfficialKey = q.kunci === opt.kode;

                            let optStyle = "border-slate-200 bg-slate-50/50 text-slate-700";
                            let badge = null;

                            if (isUserChoice && isOfficialKey) {
                              optStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-400";
                              badge = (
                                <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                                  ✓ Jawaban Guru & Kunci Resmi
                                </span>
                              );
                            } else if (isUserChoice && !isOfficialKey) {
                              optStyle = "border-rose-400 bg-rose-50 text-rose-950 font-medium";
                              badge = (
                                <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold">
                                  ✗ Jawaban Guru
                                </span>
                              );
                            } else if (!isUserChoice && isOfficialKey) {
                              optStyle = "border-emerald-400 bg-emerald-50/60 text-emerald-950 font-semibold border-dashed";
                              badge = (
                                <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                  Kunci Resmi (Opsi {opt.kode})
                                </span>
                              );
                            }

                            return (
                              <div
                                key={opt.kode}
                                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${optStyle}`}
                              >
                                <span className="w-5 h-5 rounded-md font-bold flex items-center justify-center shrink-0 bg-white/80 border border-black/10 text-[11px]">
                                  {opt.kode}
                                </span>
                                <span className="leading-snug flex-1">{opt.teks}</span>
                                {badge}
                              </div>
                            );
                          })}
                        </div>

                        {/* Kotak Kunci Jawaban Resmi & Pembahasan Pedagogis */}
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                            <span>Kunci Jawaban Resmi: Opsi {q.kunci}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                            <strong className="text-amber-950">Pembahasan Pedagogis:</strong> {q.pembahasan}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sesi Diikuti */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Sesi Praktik Baik yang Diikuti
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.sesi_diikuti && selectedItem.sesi_diikuti.length > 0 ? (
                        selectedItem.sesi_diikuti.map((sesi, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-semibold text-[11px]"
                          >
                            {sesi}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada sesi dipilih</span>
                      )}
                    </div>
                  </div>

                  {/* Soal 7 & 8: Waktu */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                        Soal 7: Keterlaksanaan Waktu (2×30 Menit)
                      </span>
                      <p className="font-bold text-slate-900 text-xs">
                        Opsi {selectedItem.jawaban_soal_7 || "-"}
                      </p>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {SOAL_7_OPSI.find((o) => o.kode === selectedItem.jawaban_soal_7)?.teks ||
                          (selectedItem.is_waktu_tuntas
                            ? "Selalu tuntas tepat waktu."
                            : "Mengalami kendala alokasi waktu.")}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                        Soal 8: Faktor Utama Kendala Waktu
                      </span>
                      <p className="font-bold text-slate-900 text-xs">
                        Opsi {selectedItem.jawaban_soal_8 || "-"}
                      </p>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {SOAL_8_OPSI.find((o) => o.kode === selectedItem.jawaban_soal_8)?.teks ||
                          "Tidak tercatat kendala waktu."}
                      </p>
                    </div>
                  </div>

                  {/* Soal 9: Strategi Waktu */}
                  {Array.isArray(selectedItem.jawaban_soal_9) && selectedItem.jawaban_soal_9.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                        Soal 9: Strategi Pengendalian Waktu yang Akan Diterapkan
                      </span>
                      <ul className="list-disc list-inside text-slate-800 space-y-1 leading-relaxed text-xs font-medium">
                        {selectedItem.jawaban_soal_9.map((strat, sIdx) => (
                          <li key={sIdx}>{strat}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Soal 5 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">
                      Soal 5: Contoh Pertanyaan Pemantik vs Soal Asesmen
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedItem.jawaban_soal_5 || "-"}
                    </p>
                  </div>

                  {/* Soal 6 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">
                      Soal 6: Strategi Exit Ticket 5–7 Menit
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedItem.jawaban_soal_6 || "-"}
                    </p>
                  </div>

                  {/* Soal 10 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                      Soal 10: Perubahan Nyata & Trik Efektif Pengendalian Waktu
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedItem.jawaban_soal_10 || "-"}
                    </p>
                  </div>

                  {/* Soal 11 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                      Soal 11: Komitmen Perbaikan KBM Berikutnya
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedItem.jawaban_soal_11 || "-"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Komunitas Belajar (Kombel) SEBATIK • SMK Bayt Al-Hikmah
              </span>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="py-2 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer shadow-xs transition-colors"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2b. MODAL VERIFIKASI / PENGESAHAN MANDIRI OLEH KEPALA SEKOLAH */}
      {/* ========================================================================= */}
      {verifyingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pengesahan Evaluasi Guru (VBPG)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verifikasi partisipasi & ketuntasan KBM langsung oleh Kepala Sekolah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingTeacher(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVerification} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {verifyingTeacher.nama}
                </div>
                <div className="text-slate-600">
                  {verifyingTeacher.mapel} {verifyingTeacher.niy ? `• NIY: ${verifyingTeacher.niy}` : ""}
                </div>
              </div>

              {/* Skor Uji Pemahaman */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Skor Pemahaman Konsep (Bagian A)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 75, 50].map((skor) => (
                    <button
                      key={skor}
                      type="button"
                      onClick={() => setVerifySkor(skor)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        verifySkor === skor
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {skor} Poin
                    </button>
                  ))}
                </div>
              </div>

              {/* Ketuntasan Waktu */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Keterlaksanaan Waktu KBM (2×30 Menit)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyTuntasWaktu(true)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      verifyTuntasWaktu
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Tuntas Tepat Waktu
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyTuntasWaktu(false)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      !verifyTuntasWaktu
                        ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    ⚠ Kadang Molor
                  </button>
                </div>
              </div>

              {/* Catatan / Trik Efektif */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Catatan Supervisi / Trik KBM Guru
                </label>
                <textarea
                  rows={2}
                  value={verifyCatatan}
                  onChange={(e) => setVerifyCatatan(e.target.value)}
                  placeholder="Catatan penerapan manajemen waktu atau komitmen KBM guru..."
                  className="w-full text-xs font-medium p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setVerifyingTeacher(null)}
                  className="py-2 px-4 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingVerification}
                  className="py-2 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingVerification ? "Menyimpan..." : "Simpan & Sahkan Status"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="hidden print:block text-black bg-white p-2 sm:p-4 max-w-4xl mx-auto font-serif text-[10pt] leading-normal print-container">
        {/* Official Kop Surat Resmi Sekolah */}
        <OfficialKopSurat className="mb-2" />

        {/* Judul Dokumen Cetak */}
        <div className="text-center space-y-0.5 pb-2.5 border-b-2 border-black mb-3">
          <h2 className="text-[12pt] font-bold uppercase tracking-wider">
            LAPORAN EVALUASI PEMAHAMAN KONSEP & REFLEKSI KEDISIPLINAN WAKTU MENGAJAR
          </h2>
          <h3 className="text-[10.5pt] font-bold uppercase tracking-wide">
            KOMUNITAS BELAJAR (KOMBEL) SEBATIK – PROGRAM GURU MENYELA
          </h3>
          <p className="text-[9.5pt] italic text-gray-700">
            Bukti Fisik Verifikasi & Validasi Bukti Kinerja Kepala Sekolah (VBPG) Periode November 2026
          </p>
        </div>

        {/* I. Ringkasan Capaian Kolektif */}
        <div className="mb-3 text-[10pt] space-y-1">
          <h4 className="font-bold underline uppercase text-[10pt]">I. Ringkasan Capaian Partisipasi:</h4>
          <table className="w-full border-collapse border border-black text-[9.5pt]">
            <tbody>
              <tr>
                <td className="border border-black p-1 font-bold w-1/3">Total Partisipasi Dewan Guru</td>
                <td className="border border-black p-1">
                  : {totalGuruMengisi} dari {totalTargetGuru} Orang Guru ({persenPartisipasi}% Mengisi)
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 font-bold">Rata-Rata Skor Pemahaman (Bagian A)</td>
                <td className="border border-black p-1 font-bold">
                  : {totalGuruMengisi > 0 ? `${metrics.rataRataSkorA} / 100 Poin` : "- (Instrumen Belum Dimulai)"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 font-bold">Ketuntasan Waktu KBM (2×30 Menit)</td>
                <td className="border border-black p-1">
                  : {totalGuruMengisi > 0 ? `${metrics.persenWaktuTuntas}% Dewan Guru Tuntas` : "- (Belum Ada Respon Masuk)"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 font-bold">Fokus Praktik Baik SEBATIK</td>
                <td className="border border-black p-1">
                  : 1) Strategi MELODY, 2) LKPD Kontekstual & Rubrik, 3) Media & Public Speaking
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* II. Tabel Rekapitulasi Respon Dewan Guru */}
        <div className="mb-4 text-[10pt] space-y-1">
          <h4 className="font-bold underline uppercase text-[10pt]">II. Rekapitulasi Status & Respon Dewan Guru:</h4>
          <table className="w-full border-collapse border border-black text-[9pt]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-center w-8">No</th>
                <th className="border border-black p-1 text-left">Nama Guru & Gelar</th>
                <th className="border border-black p-1 text-left">Mata Pelajaran</th>
                <th className="border border-black p-1 text-center w-24">Status Pengisian</th>
                <th className="border border-black p-1 text-center w-14">Skor A</th>
                <th className="border border-black p-1 text-center w-20">Status Waktu</th>
                <th className="border border-black p-1 text-left">Trik / Komitmen Utama</th>
              </tr>
            </thead>
            <tbody>
              {mergedTeacherList.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1 text-center">{idx + 1}</td>
                  <td className="border border-black p-1 font-bold">{row.nama}</td>
                  <td className="border border-black p-1">{row.mapel}</td>
                  <td className="border border-black p-1 text-center text-[8.5pt]">
                    {row.isSubmitted ? "Sudah Mengisi" : "Belum Mengisi"}
                  </td>
                  <td className="border border-black p-1 text-center font-bold">
                    {row.skorBagianA !== null ? row.skorBagianA : "-"}
                  </td>
                  <td className="border border-black p-1 text-center text-[8.5pt]">
                    {row.isWaktuTuntas !== null
                      ? row.isWaktuTuntas
                        ? "Tuntas"
                        : "Overtime"
                      : "-"}
                  </td>
                  <td className="border border-black p-1 text-[8.5pt] leading-tight">
                    {row.evaluasiData?.jawaban_soal_10
                      ? row.evaluasiData.jawaban_soal_10.substring(0, 80) + "..."
                      : "Menunggu pengisian instrumen"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* III. Tanda Tangan & Stempel Resmi Kepala Sekolah (Proporsional & Anti Split) */}
        <div className="pt-3 flex justify-end text-[10pt] font-serif break-inside-avoid page-break-avoid">
          <div className="text-left w-64 space-y-0.5">
            <p>Pasuruan, 26 November 2026</p>
            <p className="font-bold">Kepala SMK Bayt Al-Hikmah,</p>
            
            {/* Stempel & Signature overlay resmi (Overlap kedua tulisan) */}
            <div className="relative h-[44px] my-1 flex items-center justify-start">
              {/* Stempel Sekolah Proporsional (Sisi kiri TTD) */}
              <div className="absolute -left-6 -top-[42px] pointer-events-none opacity-85 z-0">
                <img
                  src={schoolSettings?.stempelUrl || STEMPEL_SEKOLAH_DATA_URL}
                  alt="Stempel Sekolah"
                  className="w-[130px] h-[130px] object-contain mix-blend-multiply"
                />
              </div>

              {/* Tanda Tangan Digital Kepala Sekolah */}
              <div className="absolute left-4 -top-[28px] z-10 pointer-events-none">
                <img
                  src={schoolSettings?.ttdKepsekUrl || TTD_KEPSEK_DATA_URL}
                  alt={`Tanda Tangan ${schoolSettings?.namaKepsek || "Kepala Sekolah"}`}
                  className="w-[115px] h-[115px] object-contain mix-blend-multiply"
                />
              </div>
            </div>

            <p className="font-bold underline tracking-wide text-[10.5pt]">
              {schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom"}
            </p>
            <p className="text-[9.5pt] font-mono">
              NIY. {schoolSettings?.niyKepsek || "14215094"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
