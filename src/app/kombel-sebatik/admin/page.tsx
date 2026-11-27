"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { EvaluasiSebatik } from "@/lib/database.types";
import {
  getEvaluasiSebatikList,
  calculateSebatikMetrics,
  exportSebatikToCsv,
} from "@/lib/sebatikService";
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
  const { schoolSettings } = useAppData();

  // PIN Protection State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Data State
  const [list, setList] = useState<EvaluasiSebatik[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<EvaluasiSebatik | null>(null);

  // Automatically unlock if user is logged in as Kepala Sekolah
  useEffect(() => {
    if (isKepsek) {
      setIsUnlocked(true);
    }
  }, [isKepsek]);

  // Load responses
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getEvaluasiSebatikList();
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
              <span>Penjelasan Menu & Kolom "Aksi (Detail Esai)"</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Tombol <strong>"Lihat Detail Esai"</strong> pada kolom Aksi disediakan untuk Kepala Sekolah dan Asesor VBPG guna meninjau jawaban kualitatif/esai mendalam setiap guru yang tidak dapat direpresentasikan hanya dengan angka pilihan ganda. Detail esai tersebut mencakup:
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
                  <th className="py-3 px-3 text-center">Aksi (Detail Esai)</th>
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sudah Mengisi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
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
                        <button
                          type="button"
                          onClick={() => setSelectedItem(row.evaluasiData)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors cursor-pointer border border-emerald-200/60 shadow-2xs"
                          title="Buka jawaban esai pemantik, asesmen, dan refleksi waktu guru"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Detail Esai</span>
                        </button>
                      ) : (
                        <span
                          className="text-[11px] text-slate-400 italic px-2 py-1 rounded bg-slate-50 cursor-default"
                          title="Guru belum mengirim respon evaluasi"
                        >
                          Menunggu Pengisian
                        </span>
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
      {/* 2. MODAL DETAIL JAWABAN ESAI GURU */}
      {/* ========================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedItem.nama_guru}
                </h3>
                <p className="text-xs text-slate-500">
                  Mapel: {selectedItem.mata_pelajaran} • Skor Bagian A:{" "}
                  <strong>{selectedItem.skor_bagian_a} Poin</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
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

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="py-2 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DOKUMEN CETAK RESMI PDF (VBPG FORMAT) - VISIBLE ONLY WHEN PRINTING */}
      {/* ========================================================================= */}
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
            <div className="relative h-[68px] my-1 flex items-center justify-start">
              {/* Stempel Sekolah Proporsional (Sisi kiri TTD) */}
              <div className="absolute -left-6 -top-5 pointer-events-none opacity-85 z-0">
                <img
                  src={schoolSettings?.stempelUrl || STEMPEL_SEKOLAH_DATA_URL}
                  alt="Stempel Sekolah"
                  className="w-[108px] h-[108px] object-contain mix-blend-multiply"
                />
              </div>

              {/* Tanda Tangan Digital Kepala Sekolah */}
              <div className="relative z-10 left-7 flex items-center h-full">
                <img
                  src={schoolSettings?.ttdKepsekUrl || TTD_KEPSEK_DATA_URL}
                  alt={`Tanda Tangan ${schoolSettings?.namaKepsek || "Kepala Sekolah"}`}
                  className="h-[68px] max-w-[185px] object-contain mix-blend-multiply"
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
