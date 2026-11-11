"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { formatRupiah, formatIndonesianDate, getBidangLabel, getBidangBadgeColor } from "@/lib/utils";
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
} from "lucide-react";
import { DigitalSignatureModal } from "@/components/signature/DigitalSignatureModal";
import { SuratKeluar } from "@/lib/database.types";

export default function DashboardPage() {
  const { currentUser, isKepsek, isTU, isKasubag, isGuru } = useAuth();
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

  const [selectedSuratForSignature, setSelectedSuratForSignature] = useState<SuratKeluar | null>(null);

  // Statistics
  const totalSuratMasuk = suratMasuk.length;
  const totalSuratKeluar = suratKeluar.length;
  const pendingSuratKeluar = suratKeluar.filter((s) => s.status === "menunggu_persetujuan");
  const pendingDisposisi = disposisi.filter((d) => d.status === "menunggu" || d.status === "proses");
  const pendingRKT = rkt.filter((r) => r.status === "menunggu_persetujuan");

  // Total budget for Action Plans
  const totalAnggaran = actionPlans.reduce((sum, item) => sum + (Number(item.estimasi_anggaran) || 0), 0);

  // Ketercapaian per Bidang Kasubag
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

  return (
    <div className="space-y-7 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-6 sm:p-8 shadow-lg border border-emerald-700/50">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <Building2 className="w-64 h-64 text-gold-400" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-gold-400/30 px-3 py-1 rounded-full text-xs font-semibold text-gold-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Sistem Informasi Gerak Cepat & Administrasi Terpadu</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Selamat Datang, {currentUser.name}
          </h1>
          <p className="text-sm text-emerald-100 mt-2 leading-relaxed">
            Anda saat ini bertindak sebagai{" "}
            <strong className="text-gold-300 font-bold underline decoration-gold-400">
              {currentUser.jabatan}
            </strong>
            . Akses menyeluruh modul E-Office, TTD Digital & Perencanaan Kinerja SMK Bayt Al-Hikmah Pasuruan siap digunakan.
          </p>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {(isTU || isKepsek) && (
              <Link
                href="/surat-keluar/buat"
                className="inline-flex items-center gap-2 text-xs font-bold bg-gold-500 hover:bg-gold-600 text-gray-950 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <PenTool className="w-3.5 h-3.5" />
                Buat Surat Keluar
              </Link>
            )}
            {isTU && (
              <Link
                href="/surat-masuk/upload"
                className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl transition-all"
              >
                <Inbox className="w-3.5 h-3.5 text-gold-300" />
                Unggah & Scan AI Surat Masuk
              </Link>
            )}
            {isKasubag && (
              <Link
                href="/rkt"
                className="inline-flex items-center gap-2 text-xs font-bold bg-gold-500 hover:bg-gold-600 text-gray-950 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                Ajukan Rencana (RKT) Baru
              </Link>
            )}
            <Link
              href="/disposisi"
              className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-gold-300" />
              Lihat Disposisi ({pendingDisposisi.length})
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Surat Masuk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Surat Masuk (Bulan Ini)
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

        {/* Disposisi Belum Selesai */}
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

      {/* Row: Approvals For Kepsek & Progress Bar Ketercapaian */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Pending Approvals & Quick Review for Kepala Sekolah */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kepala Sekolah Approval Section */}
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
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                          {sk.nomor_surat}
                        </span>
                        <span className="text-[10px] bg-amber-200/80 text-amber-900 font-semibold px-2 py-0.5 rounded uppercase">
                          {sk.jenis_surat.replace("_", " ")}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900">{sk.perihal}</h4>
                      <p className="text-[11px] text-gray-500">
                        Tujuan: <strong>{sk.tujuan}</strong> • Dibuat oleh: {sk.creator_name || "Tata Usaha"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/surat-keluar/${sk.id}`}
                        className="text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Pratinjau
                      </Link>
                      {isKepsek && (
                        <button
                          onClick={() => setSelectedSuratForSignature(sk)}
                          className="text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          Setujui & TTD
                        </button>
                      )}
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
                    className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                      <h4 className="text-xs font-bold text-gray-900">{item.nama_kegiatan}</h4>
                      <p className="text-[11px] text-gray-600">
                        PIC: <strong>{item.pic}</strong> • Target: {item.target_capaian}
                      </p>
                    </div>

                    {isKepsek ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            const notes = prompt("Masukkan alasan revisi / penolakan:");
                            if (notes) rejectRKT(item.id, notes);
                          }}
                          className="text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => approveRKT(item.id)}
                          className="text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 px-3.5 py-1.5 rounded-lg shadow-xs transition-all"
                        >
                          Setujui RKT
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded font-medium">
                        Menunggu Kepsek
                      </span>
                    )}
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
                        Surat: {surat?.perihal || "Dokumen Masuk"} • Batas Waktu:{" "}
                        <strong className="text-rose-700">{formatIndonesianDate(disp.deadline)}</strong>
                      </p>
                    </div>

                    <Link
                      href={`/disposisi/${disp.id}`}
                      className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 flex-shrink-0 text-center"
                    >
                      Buka Detail
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Progress Bar Ketercapaian Kasubag & RKT Summary */}
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

                    {/* Progress Bar */}
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
