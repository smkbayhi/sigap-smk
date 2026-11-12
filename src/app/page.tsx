"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatRupiah,
  formatIndonesianDate,
  getBidangLabel,
  getBidangBadgeColor,
} from "@/lib/utils";
import {
  Inbox,
  Send,
  Share2,
  Coins,
  ShieldCheck,
  FileCheck2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Building2,
  PenTool,
  AlertCircle,
  FileText,
  Printer,
  MessageCircle,
  Eye,
  PlusCircle,
  FileUp,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { DigitalSignatureModal } from "@/components/signature/DigitalSignatureModal";
import { SuratKeluar } from "@/lib/database.types";

export default function DashboardPage() {
  const { currentUser, users, isKepsek, isTU, isKasubag, isGuru } = useAuth();
  const {
    suratKeluar,
    suratMasuk,
    disposisi,
    rkt,
    actionPlans,
    actionReports,
    approveSuratKeluar,
    rejectSuratKeluar,
    approveRKT,
    rejectRKT,
  } = useAppData();

  const [selectedSuratForSignature, setSelectedSuratForSignature] =
    useState<SuratKeluar | null>(null);

  // General Statistics
  const totalSuratMasuk = suratMasuk.length;
  const totalSuratKeluar = suratKeluar.length;
  const pendingSuratKeluar = suratKeluar.filter(
    (s) => s.status === "menunggu_persetujuan"
  );
  const approvedSuratKeluar = suratKeluar.filter((s) => s.status === "disetujui");
  const pendingDisposisi = disposisi.filter(
    (d) => d.status === "menunggu" || d.status === "proses"
  );
  const pendingRKT = rkt.filter((r) => r.status === "menunggu_persetujuan");

  // TU Specific Filters
  const smBelumDisposisi = suratMasuk.filter(
    (s) => !s.status_disposisi || s.status_disposisi === "belum_disposisi"
  );
  const myPendingDisposisi = disposisi.filter(
    (d) =>
      (d.penerima_id === currentUser.id ||
        d.penerima_role === currentUser.role ||
        d.penerima_nama?.toLowerCase().includes("tata usaha")) &&
      d.status !== "selesai"
  );

  // Struktural / Kasubag Specific Filters
  const userBidang = currentUser.bidang || "kurikulum";
  const myRkt = rkt.filter((r) => r.bidang === userBidang);
  const myPlans = actionPlans.filter((p) => p.bidang === userBidang);
  const myAnggaran = myPlans.reduce(
    (sum, item) => sum + (Number(item.estimasi_anggaran) || 0),
    0
  );
  const myBidangDisposisi = disposisi.filter(
    (d) =>
      (d.penerima_bidang === userBidang ||
        d.penerima_id === currentUser.id) &&
      d.status !== "selesai"
  );

  // Guru Specific Filters
  const myGuruDisposisi = disposisi.filter(
    (d) =>
      (d.penerima_id === currentUser.id ||
        d.penerima_role === "guru" ||
        d.penerima_nama === currentUser.name) &&
      d.status !== "selesai"
  );

  // Executive Total Budget
  const totalAnggaran = actionPlans.reduce(
    (sum, item) => sum + (Number(item.estimasi_anggaran) || 0),
    0
  );

  // Ketercapaian per Bidang Kasubag (for Kepsek)
  const bidangList = [
    { key: "kurikulum", name: "Kurikulum & Akademik", color: "from-blue-500 to-indigo-600" },
    { key: "kesiswaan", name: "Kesiswaan & Karakter", color: "from-emerald-500 to-teal-600" },
    { key: "sarpras", name: "Sarana & Prasarana", color: "from-purple-500 to-violet-600" },
    { key: "humas_bkk", name: "Humas & Mitra Industri (BKK)", color: "from-amber-500 to-orange-600" },
  ];

  const calculateBidangProgress = (bidangKey: string) => {
    const plansInBidang = actionPlans.filter((p) => p.bidang === bidangKey);
    if (plansInBidang.length === 0) return { percent: 0, total: 0, completed: 0 };

    let totalScore = 0;
    let completedCount = 0;

    plansInBidang.forEach((plan) => {
      const report = actionReports.find((r) => r.action_plan_id === plan.id);
      if (report) {
        totalScore += report.persentase || (report.status_ketercapaian === "selesai" ? 100 : 50);
        if (report.status_ketercapaian === "selesai") completedCount++;
      }
    });

    const percent = Math.round(totalScore / plansInBidang.length);
    return { percent, total: plansInBidang.length, completed: completedCount };
  };

  // Find Kepsek user for WhatsApp notifications
  const kepsekUser = users.find((u) => u.role === "kepala_sekolah");

  return (
    <div className="space-y-7 pb-12">
      {/* ========================================================================= */}
      {/* 1. ROLE: TATA USAHA (TU) DASHBOARD */}
      {/* ========================================================================= */}
      {isTU && (
        <>
          {/* Welcome Banner TU */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-6 sm:p-8 shadow-lg border border-emerald-700/50">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
              <Building2 className="w-64 h-64 text-gold-400" />
            </div>

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Pusat Operasional Tata Usaha & Administrasi Persuratan</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Selamat Bertugas, {currentUser.name}
              </h1>
              <p className="text-sm text-emerald-100 mt-2 leading-relaxed">
                Anda masuk sebagai{" "}
                <strong className="text-gold-300 font-bold underline decoration-gold-400">
                  {currentUser.jabatan}
                </strong>
                . Kelola alur registrasi persuratan dinas, penerimaan berkas masuk, pembuatan draf surat keluar, dan koordinasi disposisi lembaga secara terpadu.
              </p>

              {/* Quick Action Buttons for TU */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <Link
                  href="/surat-keluar/buat"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-gold-500 hover:bg-gold-600 text-gray-950 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <PenTool className="w-4 h-4" />
                  Buat Draf Surat Keluar
                </Link>
                <Link
                  href="/surat-masuk/upload"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/25 text-white px-4 py-2.5 rounded-xl transition-all shadow-2xs"
                >
                  <FileUp className="w-4 h-4 text-emerald-200" />
                  Unggah & Scan AI Surat Masuk
                </Link>
                <Link
                  href="/disposisi"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl transition-all"
                >
                  <Share2 className="w-4 h-4 text-gold-300" />
                  Buku Agenda Disposisi ({myPendingDisposisi.length})
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards for TU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Surat Masuk */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Surat Masuk
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-gray-900">{totalSuratMasuk}</span>
                  <span className="text-xs text-gray-500 ml-2">Arsip Dokumen</span>
                </div>
                {smBelumDisposisi.length > 0 && (
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    {smBelumDisposisi.length} Menunggu Disposisi
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Terintegrasi OCR Ekstraksi AI</span>
              </div>
            </div>

            {/* Total Draf Surat Keluar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Draf Surat Keluar
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-amber-700">{pendingSuratKeluar.length}</span>
                  <span className="text-xs text-gray-500 ml-2">Draf Diajukan</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Menunggu TTD
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <span>Perlu ditandatangani Kepala Sekolah</span>
              </div>
            </div>

            {/* Surat Keluar Disetujui & Siap Kirim */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Surat Siap Kirim
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-emerald-700">{approvedSuratKeluar.length}</span>
                  <span className="text-xs text-gray-500 ml-2">Surat Resmi Sah</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ✓ Sah & Bertanda Tangan
                </span>
              </div>
              <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Siap diunduh PDF & dikirim WA</span>
              </div>
            </div>

            {/* Disposisi untuk Tata Usaha */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Tugas Disposisi TU
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-purple-800">{myPendingDisposisi.length}</span>
                  <span className="text-xs text-gray-500 ml-2">Instruksi Aktif</span>
                </div>
                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  Delegasi Kepsek
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <span>Instruksi yang perlu ditindaklanjuti TU</span>
              </div>
            </div>
          </div>

          {/* TU Main Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Monitoring Draf & Surat Keluar Siap Kirim */}
            <div className="lg:col-span-2 space-y-6">
              {/* Panel 1: Draf Menunggu TTD Kepsek */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">
                        Draf Surat Keluar Menunggu TTD Kepala Sekolah
                      </h2>
                      <p className="text-xs text-gray-500">
                        Surat dinas yang telah dibuat TU dan sedang diajukan untuk ditandatangani
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                    {pendingSuratKeluar.length} Surat
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {pendingSuratKeluar.length === 0 ? (
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
                      Semua draf surat keluar telah selesai disahkan oleh Kepala Sekolah.
                    </div>
                  ) : (
                    pendingSuratKeluar.map((sk) => {
                      const waMessage = `Assalamu'alaikum Wr. Wb. Yth. Kepala SMK Bayt Al-Hikmah, kami staf Tata Usaha telah mengajukan draf Surat Keluar Nomor ${sk.nomor_surat} (${sk.perihal}) untuk ${sk.tujuan}. Mohon berkenan memeriksa & menandatangani digital melalui SIGAP-SMK: https://sigap-smk.vercel.app/surat-keluar/${sk.id}`;
                      const kepsekPhone = kepsekUser?.phone || "6281234567890";
                      const waLink = `https://wa.me/${kepsekPhone}?text=${encodeURIComponent(waMessage)}`;

                      return (
                        <div
                          key={sk.id}
                          className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-brand-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                                {sk.nomor_surat}
                              </span>
                              <span className="text-[10px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded uppercase">
                                {sk.jenis_surat.replace("_", " ")}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900">{sk.perihal}</h4>
                            <p className="text-[11px] text-gray-500">
                              Tujuan: <strong>{sk.tujuan}</strong> • Dibuat oleh: {sk.creator_name || "Tata Usaha"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                              title="Kirim pengingat WhatsApp ke Kepala Sekolah"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Ingatkan Kepsek</span>
                            </a>
                            <Link
                              href={`/surat-keluar/${sk.id}`}
                              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-semibold rounded-lg transition-colors"
                            >
                              Lihat Draf
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Panel 2: Surat Sah Terbaru (Siap Kirim & Cetak) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">
                        Surat Keluar Sah & Siap Dikirim
                      </h2>
                      <p className="text-xs text-gray-500">
                        Surat yang telah ditandatangani digital & dibubuhi stempel resmi Kepala Sekolah
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/surat-keluar"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    Semua Surat Keluar
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {approvedSuratKeluar.slice(0, 3).map((sk) => (
                    <div
                      key={sk.id}
                      className="p-3.5 rounded-xl border border-gray-200 hover:border-emerald-300 bg-white hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 bg-slate-100 px-2 py-0.5 rounded">
                            {sk.nomor_surat}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ TTD Sah
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900">{sk.perihal}</h4>
                        <p className="text-[11px] text-gray-500">
                          Tujuan: <strong>{sk.tujuan}</strong> • Pengesahan: {sk.approver_name || "Kepala Sekolah"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/surat-keluar/${sk.id}/print`}
                          target="_blank"
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-gray-600" />
                          <span>Cetak PDF</span>
                        </Link>
                        <Link
                          href={`/surat-keluar/${sk.id}`}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rincian & Kirim</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Surat Masuk Terbaru & Disposisi TU */}
            <div className="space-y-6">
              {/* Surat Masuk Terbaru */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Surat Masuk Terbaru</h3>
                  </div>
                  <Link
                    href="/surat-masuk"
                    className="text-xs font-bold text-blue-700 hover:text-blue-800"
                  >
                    Buka Arsip
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {suratMasuk.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                      Belum ada surat masuk yang tercatat.
                    </div>
                  ) : (
                    suratMasuk.slice(0, 3).map((sm) => (
                      <div
                        key={sm.id}
                        className="p-3 rounded-xl border border-gray-200 bg-slate-50/50 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 truncate max-w-[160px]">
                            {sm.pengirim}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {formatIndonesianDate(sm.tanggal_surat)}
                          </span>
                        </div>
                        <p className="text-gray-700 truncate" title={sm.perihal}>
                          {sm.perihal}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              sm.status_disposisi === "sudah_disposisi"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {sm.status_disposisi === "sudah_disposisi"
                              ? "Sudah Didisposisi"
                              : "Belum Didisposisi"}
                          </span>
                          <Link
                            href={`/surat-masuk/${sm.id}`}
                            className="text-blue-700 hover:underline font-bold"
                          >
                            Detail →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/surat-masuk/upload"
                  className="mt-4 w-full block text-center py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition-colors"
                >
                  + Unggah Surat Masuk Baru
                </Link>
              </div>

              {/* Disposisi Kepsek untuk TU */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-gray-900">Disposisi Masuk ke TU</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {myPendingDisposisi.length} Tugas
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {myPendingDisposisi.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                      Tidak ada instruksi disposisi yang tertunda untuk Tata Usaha.
                    </div>
                  ) : (
                    myPendingDisposisi.slice(0, 3).map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1.5 text-xs"
                      >
                        <p className="font-bold text-purple-950">"{d.instruksi}"</p>
                        {d.catatan && (
                          <p className="text-[11px] text-gray-600 italic">Catatan: {d.catatan}</p>
                        )}
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="text-rose-700 font-bold">
                            Batas: {formatIndonesianDate(d.deadline)}
                          </span>
                          <Link
                            href={`/disposisi/${d.id}`}
                            className="text-purple-700 hover:underline font-bold"
                          >
                            Tanggapi Disposisi →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. ROLE: STRUKTURAL / KASUBAG DASHBOARD */}
      {/* ========================================================================= */}
      {isKasubag && (
        <>
          {/* Welcome Banner Kasubag */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-lg border border-indigo-700/50">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Dashboard Kinerja & Perencanaan Bidang {getBidangLabel(userBidang)}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Selamat Datang, {currentUser.name}
              </h1>
              <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
                Kelola usulan Rencana Kerja Tahunan (RKT), target Action Plan bulanan, serta pelaksanaan disposisi dinas khusus bidang {getBidangLabel(userBidang)}.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <Link
                  href="/rkt"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-gray-950 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Ajukan Usulan RKT Baru
                </Link>
                <Link
                  href="/action-plan"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/25 text-white px-4 py-2.5 rounded-xl transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Action Plan Bulanan
                </Link>
                <Link
                  href="/disposisi"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Disposisi Masuk ({myBidangDisposisi.length})
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Cards Kasubag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                RKT Bidang Saya
              </span>
              <span className="text-3xl font-extrabold text-blue-900">{myRkt.length}</span>
              <p className="text-xs text-gray-500 mt-2">Program Kerja Tahunan</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Action Plan Aktif
              </span>
              <span className="text-3xl font-extrabold text-indigo-900">{myPlans.length}</span>
              <p className="text-xs text-gray-500 mt-2">Rencana Aksi Bulan Berjalan</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Total Anggaran Bidang
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-800">
                {formatRupiah(myAnggaran)}
              </span>
              <p className="text-xs text-gray-500 mt-2">Alokasi Anggaran Kegiatan</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Disposisi Perlu Respon
              </span>
              <span className="text-3xl font-extrabold text-amber-700">{myBidangDisposisi.length}</span>
              <p className="text-xs text-gray-500 mt-2">Tugas dari Kepala Sekolah</p>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. ROLE: GURU DASHBOARD */}
      {/* ========================================================================= */}
      {isGuru && (
        <>
          {/* Welcome Banner Guru */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-lg border border-purple-700/50">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-purple-950/60 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-semibold text-purple-200 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Portal Dewan Guru & Tenaga Pendidik</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Selamat Datang, Bapak/Ibu {currentUser.name}
              </h1>
              <p className="text-sm text-purple-100 mt-2 leading-relaxed">
                Pantau instruksi tugas dan disposisi dinas dari pimpinan sekolah, serta konfirmasi tindak lanjut pelaksanaan kegiatan pengajaran dan program sekolah.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <Link
                  href="/disposisi"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-gold-500 hover:bg-gold-600 text-gray-950 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Lihat Disposisi Saya ({myGuruDisposisi.length})
                </Link>
                <Link
                  href="/surat-masuk"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl transition-all"
                >
                  <Inbox className="w-4 h-4" />
                  Arsip Surat & Edaran
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Cards Guru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Tugas Disposisi Aktif
              </span>
              <span className="text-3xl font-extrabold text-purple-800">{myGuruDisposisi.length}</span>
              <p className="text-xs text-gray-500 mt-2">Instruksi Perlu Ditindaklanjuti</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Surat Edaran Dinas
              </span>
              <span className="text-3xl font-extrabold text-blue-800">{totalSuratMasuk}</span>
              <p className="text-xs text-gray-500 mt-2">Arsip Dokumen Sekolah</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Status Tugas Selesai
              </span>
              <span className="text-3xl font-extrabold text-emerald-700">
                {disposisi.filter((d) => (d.penerima_id === currentUser.id || d.penerima_nama === currentUser.name) && d.status === "selesai").length}
              </span>
              <p className="text-xs text-gray-500 mt-2">Laporan Disposisi Rampung</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Notifikasi WhatsApp
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full inline-block mt-1">
                ✓ Otomatis Aktif
              </span>
              <p className="text-xs text-gray-500 mt-2">Terkirim ke WhatsApp Pribadi</p>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. ROLE: KEPALA SEKOLAH (ADMIN) - FULL EXECUTIVE DASHBOARD */}
      {/* ========================================================================= */}
      {isKepsek && (
        <>
          {/* Welcome Banner Kepsek */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-6 sm:p-8 shadow-lg border border-emerald-700/50">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
              <Building2 className="w-64 h-64 text-gold-400" />
            </div>

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-gold-400/30 px-3 py-1 rounded-full text-xs font-semibold text-gold-300 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Dashboard Eksekutif Kepala Sekolah • Akses Penuh Sistem (Administrator)</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Selamat Datang, {currentUser.name}
              </h1>
              <p className="text-sm text-emerald-100 mt-2 leading-relaxed">
                Anda memegang kendali penuh{" "}
                <strong className="text-gold-300 font-bold underline decoration-gold-400">
                  Kepala SMK Bayt Al-Hikmah Pasuruan
                </strong>
                . Akses seluruh modul pengesahan tanda tangan digital, delegasi disposisi cerdas, rekapitulasi anggaran, dan evaluasi ketercapaian mutu 4 bidang strategis.
              </p>

              {/* Quick Shortcuts */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <Link
                  href="/surat-keluar/buat"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-gold-500 hover:bg-gold-600 text-gray-950 px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Buat Surat Keluar
                </Link>
                <Link
                  href="/disposisi"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl transition-all"
                >
                  <Share2 className="w-3.5 h-3.5 text-gold-300" />
                  Lihat Disposisi ({pendingDisposisi.length})
                </Link>
                <Link
                  href="/master/kop-surat"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-300" />
                  Kop, Logo & TTD Resmi
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Summary Stat Cards Executive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Surat Masuk */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Surat Masuk
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">{totalSuratMasuk}</span>
                <span className="text-xs text-gray-500 ml-2">Dokumen Arsip</span>
              </div>
              <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terintegrasi AI OCR Ekstraksi</span>
              </div>
            </div>

            {/* Total Surat Keluar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total Surat Keluar
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-gray-900">{totalSuratKeluar}</span>
                  <span className="text-xs text-gray-500 ml-2">Surat Dinas</span>
                </div>
                {pendingSuratKeluar.length > 0 && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {pendingSuratKeluar.length} Menunggu TTD
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Nomor otomatis format baku sekolah</span>
              </div>
            </div>

            {/* Disposisi Berjalan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Disposisi Berjalan
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-amber-700">{pendingDisposisi.length}</span>
                <span className="text-xs text-gray-500 ml-2">Perlu Tindak Lanjut</span>
              </div>
              <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Notifikasi WhatsApp terkirim</span>
              </div>
            </div>

            {/* Total Anggaran Action Plan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total Anggaran Action Plan
                </span>
                <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl sm:text-2xl font-black text-brand-900">
                  {formatRupiah(totalAnggaran)}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                <span>Bulan Berjalan ({actionPlans.length} Kegiatan)</span>
              </div>
            </div>
          </div>

          {/* Executive Row: Approvals & Evaluasi 4 Bidang */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Pending Approvals for Kepala Sekolah */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">
                        Menunggu Persetujuan & Tanda Tangan Kepala Sekolah
                      </h2>
                      <p className="text-xs text-gray-500">
                        Daftar surat keluar & usulan RKT yang memerlukan verifikasi
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                    {pendingSuratKeluar.length + pendingRKT.length} Antrean
                  </span>
                </div>

                {/* List of Pending Surat Keluar */}
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Surat Keluar Menunggu TTD ({pendingSuratKeluar.length})
                  </p>

                  {pendingSuratKeluar.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
                      🎉 Semua draf surat keluar telah selesai ditinjau dan ditandatangani.
                    </div>
                  ) : (
                    pendingSuratKeluar.map((sk) => (
                      <div
                        key={sk.id}
                        className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                              {sk.nomor_surat}
                            </span>
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 font-semibold px-2 py-0.5 rounded uppercase">
                              {sk.jenis_surat.replace("_", " ")}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900">{sk.perihal}</h4>
                          <p className="text-[11px] text-gray-500">
                            Tujuan: <strong>{sk.tujuan}</strong> • Dibuat oleh: {sk.creator_name || "Tata Usaha"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/surat-keluar/${sk.id}`}
                            className="font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Pratinjau
                          </Link>
                          <button
                            onClick={() => setSelectedSuratForSignature(sk)}
                            className="font-bold text-white bg-brand-700 hover:bg-brand-800 px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            Setujui & TTD
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* List of Pending RKT */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Usulan RKT Menunggu Persetujuan ({pendingRKT.length})
                  </p>

                  {pendingRKT.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
                      Semua Rencana Kerja Tahunan telah diproses.
                    </div>
                  ) : (
                    pendingRKT.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBidangBadgeColor(item.bidang)}`}>
                              {getBidangLabel(item.bidang)}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              T.A. {item.tahun_anggaran}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900">{item.nama_kegiatan}</h4>
                          <p className="text-[11px] text-gray-600">
                            PIC: <strong>{item.pic}</strong> • Target: {item.target_capaian}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              const notes = prompt("Masukkan alasan revisi / penolakan:");
                              if (notes) rejectRKT(item.id, notes);
                            }}
                            className="font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => approveRKT(item.id)}
                            className="font-bold text-white bg-brand-700 hover:bg-brand-800 px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            Setujui RKT
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Dispositions List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">
                        Disposisi Surat Masuk Terkini
                      </h2>
                      <p className="text-xs text-gray-500">
                        Pemantauan delegasi tugas dinas dan status tindak lanjut staf
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/disposisi"
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1"
                  >
                    Semua Disposisi
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {disposisi.slice(0, 3).map((disp) => {
                    const surat = suratMasuk.find((s) => s.id === disp.surat_masuk_id);
                    return (
                      <div
                        key={disp.id}
                        className="p-3.5 rounded-xl border border-gray-200 hover:border-brand-300 bg-white hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{disp.penerima_nama}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                disp.status === "selesai"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : disp.status === "proses"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {disp.status === "selesai"
                                ? "Selesai"
                                : disp.status === "proses"
                                ? "Sedang Diproses"
                                : "Menunggu"}
                            </span>
                          </div>
                          <p className="text-gray-700 font-medium">
                            Instruksi: "{disp.instruksi}"
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Surat: {surat?.perihal || "Dokumen Masuk"} • Batas:{" "}
                            <strong className="text-rose-700">{formatIndonesianDate(disp.deadline)}</strong>
                          </p>
                        </div>

                        <Link
                          href={`/disposisi/${disp.id}`}
                          className="font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 flex-shrink-0 text-center"
                        >
                          Buka Detail
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Progress Bar Ketercapaian 4 Bidang & Identitas */}
            <div className="space-y-6">
              {/* Progress Bar Ketercapaian Kasubag */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">
                    Ketercapaian Action Plan Bidang
                  </h3>
                  <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                    Bulan Ini
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2 mb-4">
                  Persentase realisasi kegiatan dan pelaporan bulanan masing-masing Kasubag:
                </p>

                <div className="space-y-4">
                  {bidangList.map((bidang) => {
                    const stat = calculateBidangProgress(bidang.key);
                    return (
                      <div key={bidang.key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-800">{bidang.name}</span>
                          <span className="font-bold text-brand-900">{stat.percent}%</span>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full bg-gradient-to-r ${bidang.color} transition-all duration-500`}
                            style={{ width: `${stat.percent}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>{stat.total} Rencana Aksi</span>
                          <span>{stat.completed} Kegiatan Selesai</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Total Rencana Aktif:</span>
                  <strong className="text-gray-900">{actionPlans.length} Kegiatan</strong>
                </div>

                <Link
                  href="/action-report"
                  className="mt-4 w-full block text-center py-2 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl text-xs font-bold border border-brand-200 transition-colors"
                >
                  Lihat Detail Action Report
                </Link>
              </div>

              {/* Quick Info Institusi */}
              <div className="bg-gradient-to-br from-slate-900 to-[#064e3b] text-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-gold-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Identitas Institusi
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">SMK Bayt Al-Hikmah Pasuruan</h4>
                <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                  Mewujudkan generasi santri vokasi yang berkarakter Qur'ani, mandiri, unggul secara teknologi, dan terserap optimal di industri global.
                </p>

                <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[11px] text-emerald-100/80">
                  <div className="flex justify-between">
                    <span>NPSN / Akreditasi:</span>
                    <strong className="text-gold-300">20579998 / Unggul (A)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status Sekolah:</span>
                    <strong className="text-gold-300">SMK Pusat Keunggulan (PK)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pondok Pesantren:</span>
                    <span className="text-white">Bayt Al-Hikmah Kota Pasuruan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Signature Modal if opened from Dashboard */}
      {selectedSuratForSignature && (
        <DigitalSignatureModal
          surat={selectedSuratForSignature}
          isOpen={Boolean(selectedSuratForSignature)}
          onClose={() => setSelectedSuratForSignature(null)}
          onApprove={(id, opts) => approveSuratKeluar(id, currentUser.name, opts)}
          onReject={(id, notes) => rejectSuratKeluar(id, notes)}
          kepsekName={currentUser.name}
        />
      )}
    </div>
  );
}