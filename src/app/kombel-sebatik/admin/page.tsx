"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export default function KombelSebatikAdminPage() {
  const { currentUser, isKepsek } = useAuth();
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

  // Filtered List
  const filteredList = list.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.nama_guru.toLowerCase().includes(q) ||
      item.mata_pelajaran.toLowerCase().includes(q)
    );
  });

  // Calculate Metrics
  const metrics = calculateSebatikMetrics(list);

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
              Halaman ini memuat rekapitulasi data evaluasi Kombel SEBATIK untuk lampiran bukti fisik kinerja sekolah. Masukkan PIN akses pengawas/kepsek untuk melanjutkan.
            </p>
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
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
              <span>Kembali ke Halaman Instrumen</span>
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
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition-all cursor-pointer"
              title="Unduh format spreadsheet"
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
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {metrics.totalRespon} / {Math.max(metrics.totalRespon, 9)} Guru
              </span>
              <span className="text-xs font-bold text-emerald-700 ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Mengisi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Seluruh dewan guru terdata telah berpartisipasi aktif
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
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                {metrics.rataRataSkorA}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-bold">/ 100 Poin</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Tingkat akurasi konsep apersepsi pemantik vs asesmen
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
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                {metrics.persenWaktuTuntas}%
              </span>
              <span className="text-xs text-slate-500 ml-2">Tuntas (Opsi A & B)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Keterlaksanaan alokasi menit pendahuluan, inti & penutup
            </p>
          </div>
        </div>

        {/* 3 VISUAL DISTRIBUTION CHARTS */}
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

        {/* DETAIL TABLE OF TEACHERS' RESPONSES */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Hasil Isian Evaluasi Seluruh Guru ({filteredList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol "Lihat Detail" untuk memeriksa jawaban esai contoh pemantik, asesmen, dan komitmen perbaikan.
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
                  <th className="py-3 px-4">Sesi Diikuti</th>
                  <th className="py-3 px-3 text-center">Skor Bagian A</th>
                  <th className="py-3 px-3 text-center">Ketuntasan Waktu</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.nama_guru}</div>
                      <div className="text-[11px] text-slate-500">{item.mata_pelajaran}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {item.sesi_diikuti.length} Sesi Praktik Baik
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                          item.skor_bagian_a === 100
                            ? "bg-emerald-100 text-emerald-800"
                            : item.skor_bagian_a === 75
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.skor_bagian_a} Poin
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.is_waktu_tuntas
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.is_waktu_tuntas ? "✓ Tuntas Tepat Waktu" : "⚠ Sering Molor"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail Esai</span>
                      </button>
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
                  {selectedItem.jawaban_soal_5}
                </p>
              </div>

              {/* Soal 6 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">
                  Soal 6: Strategi Exit Ticket 5–7 Menit
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedItem.jawaban_soal_6}
                </p>
              </div>

              {/* Soal 10 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                  Soal 10: Perubahan Nyata & Trik Efektif Pengendalian Waktu
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedItem.jawaban_soal_10}
                </p>
              </div>

              {/* Soal 11 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                  Soal 11: Komitmen Perbaikan KBM Berikutnya
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedItem.jawaban_soal_11}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="py-2 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
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
      <div className="hidden print:block text-black bg-white p-4 max-w-4xl mx-auto font-serif">
        {/* Official Kop Surat */}
        <OfficialKopSurat />

        <div className="text-center space-y-1 pb-4 border-b-2 border-black mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            LAPORAN HASIL EVALUASI PEMAHAMAN KONSEP & REFLEKSI KEDISIPLINAN WAKTU MENGAJAR
          </h2>
          <h3 className="text-xs font-bold uppercase tracking-wide">
            KOMUNITAS BELAJAR (KOMBEL) SEBATIK – PROGRAM GURU MENYELA
          </h3>
          <p className="text-[11px] italic">
            Lampiran Bukti Fisik Verifikasi & Validasi Bukti Kinerja Kepala Sekolah (VBPG) Periode November 2026
          </p>
        </div>

        {/* Ringkasan Eksekutif Cetak */}
        <div className="mb-4 text-xs space-y-2">
          <h4 className="font-bold underline uppercase text-[11px]">I. Ringkasan Capaian Kolektif:</h4>
          <table className="w-full border-collapse border border-black text-[11px]">
            <tbody>
              <tr>
                <td className="border border-black p-1.5 font-bold w-1/3">Total Responden Dewan Guru</td>
                <td className="border border-black p-1.5">: {metrics.totalRespon} Orang Guru (100% Mengisi)</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Rata-Rata Skor Pemahaman Konsep (Bagian A)</td>
                <td className="border border-black p-1.5 font-bold">: {metrics.rataRataSkorA} / 100 Poin</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Persentase Ketuntasan Waktu Mengajar (2×30 Menit)</td>
                <td className="border border-black p-1.5">: {metrics.persenWaktuTuntas}% Dewan Guru Tuntas</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Fokus Praktik Baik yang Dikuatkan</td>
                <td className="border border-black p-1.5">
                  : 1) Strategi MELODY, 2) LKPD Kontekstual & Rubrik, 3) Media & Public Speaking
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Rekapitulasi Cetak */}
        <div className="mb-6 text-xs space-y-2">
          <h4 className="font-bold underline uppercase text-[11px]">II. Rekapitulasi Respon Dewan Guru:</h4>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-center w-8">No</th>
                <th className="border border-black p-1 text-left">Nama Guru & Gelar</th>
                <th className="border border-black p-1 text-left">Mata Pelajaran</th>
                <th className="border border-black p-1 text-center w-16">Skor A</th>
                <th className="border border-black p-1 text-center w-24">Status Waktu</th>
                <th className="border border-black p-1 text-left">Trik / Komitmen Utama</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1 text-center">{idx + 1}</td>
                  <td className="border border-black p-1 font-bold">{item.nama_guru}</td>
                  <td className="border border-black p-1">{item.mata_pelajaran}</td>
                  <td className="border border-black p-1 text-center font-bold">{item.skor_bagian_a}</td>
                  <td className="border border-black p-1 text-center">
                    {item.is_waktu_tuntas ? "Tuntas" : "Overtime"}
                  </td>
                  <td className="border border-black p-1 text-[9px] leading-tight">
                    {item.jawaban_soal_10.substring(0, 90)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Resmi Kepala Sekolah */}
        <div className="pt-4 flex justify-end text-xs">
          <div className="w-72 text-center space-y-1">
            <p>Pasuruan, 26 November 2026</p>
            <p className="font-bold">Kepala SMK Bayt Al-Hikmah,</p>
            
            {/* Stempel & TTD overlay */}
            <div className="relative h-20 flex items-center justify-center my-1">
              <img
                src={STEMPEL_SEKOLAH_DATA_URL}
                alt="Stempel Sekolah"
                className="absolute w-20 h-20 opacity-80 left-10 pointer-events-none"
              />
              <img
                src={TTD_KEPSEK_DATA_URL}
                alt="TTD Kepala Sekolah"
                className="h-16 object-contain z-10"
              />
            </div>

            <p className="font-bold underline tracking-wide">
              {schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom"}
            </p>
            <p className="text-[11px] font-mono">
              NIY. {schoolSettings?.niyKepsek || "14215094"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
