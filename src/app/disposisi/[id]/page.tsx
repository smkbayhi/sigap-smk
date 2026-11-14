"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatIndonesianDate,
  getStatusDisposisiBadge,
  getUrgensiBadge,
  createWhatsAppDispositionLink,
  openPdfInNewTab,
} from "@/lib/utils";
import { StatusDisposisi } from "@/lib/database.types";
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
} from "lucide-react";

export default function DisposisiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { currentUser, users, isKepsek } = useAuth();
  const { disposisi, suratMasuk, updateDisposisiStatus } = useAppData();

  const disp = disposisi.find((d) => d.id === id);
  const surat = disp ? suratMasuk.find((s) => s.id === disp.surat_masuk_id) : null;

  const [currentStatus, setCurrentStatus] = useState<StatusDisposisi>(disp?.status || "menunggu");
  const [tanggapan, setTanggapan] = useState(disp?.tanggapan || "");
  const [isSaved, setIsSaved] = useState(false);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);

  if (!disp || !surat) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Disposisi Tidak Ditemukan</h2>
        <Link
          href="/disposisi"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Disposisi
        </Link>
      </div>
    );
  }

  const statusBadge = getStatusDisposisiBadge(disp.status);
  const urgensiBadge = getUrgensiBadge(disp.sifat);

  // Fallback to real static PDF if dead blob is encountered
  const effectiveFileUrl =
    surat.file_url && surat.file_url.startsWith("blob:")
      ? "/uploads/1794389111047_Surat_Undangan_Peserta_Peningkatan_Kapasitas_Oktober_2026_revisi_lokasi_tte.pdf"
      : surat.file_url || "/uploads/1794389111047_Surat_Undangan_Peserta_Peningkatan_Kapasitas_Oktober_2026_revisi_lokasi_tte.pdf";

  const targetUser = users.find((u) => u.id === disp.penerima_id);
  const waReminderUrl = createWhatsAppDispositionLink({
    phone: targetUser?.phone || "6285646682246",
    penerimaNama: disp.penerima_nama,
    nomorSurat: surat.nomor_surat,
    pengirim: surat.pengirim,
    perihal: surat.perihal,
    instruksi: disp.instruksi,
    catatan: disp.catatan,
    deadline: disp.deadline,
    disposisiId: disp.id,
  });

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateDisposisiStatus(disp.id, currentStatus, tanggapan.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/disposisi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Disposisi
        </Link>

        <span className="text-[11px] bg-brand-50 text-brand-800 border border-brand-200 px-2.5 py-0.5 rounded-full font-bold">
          Magic Link Akses Cepat Disposisi
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Share2 className="w-4 h-4" />
              </div>
              <h1 className="text-base font-bold text-gray-900">
                Lembar Disposisi & Penugasan Dinas
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dari: <strong>{disp.pemberi_nama}</strong> Kepada:{" "}
              <strong className="text-brand-900">{disp.penerima_nama}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold border ${urgensiBadge.color}`}
            >
              {urgensiBadge.label}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold border ${statusBadge.color}`}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Incoming Letter Reference Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 text-xs">
          <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
            Surat Rujukan Terkait:
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <span className="font-mono font-bold text-brand-900 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
              {surat.nomor_surat}
            </span>
            <span className="text-gray-500">
              Pengirim: <strong>{surat.pengirim}</strong>
            </span>
          </div>
          <h3 className="font-bold text-sm text-gray-900 pt-1">{surat.perihal}</h3>
          <p className="text-gray-700 leading-relaxed pt-1 bg-white p-3 rounded-lg border border-gray-200">
            {surat.ringkasan}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-gray-500 text-[11px]">
              Tanggal Surat: {formatIndonesianDate(surat.tanggal_surat)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAttachmentViewer(!showAttachmentViewer)}
                className="text-gray-600 hover:text-brand-800 font-semibold flex items-center gap-1 text-[11px] bg-white border border-gray-300 px-2.5 py-1 rounded-lg transition-colors"
              >
                {showAttachmentViewer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showAttachmentViewer ? "Tutup Pratinjau" : "Pratinjau di Halaman"}
              </button>

              <button
                type="button"
                onClick={() => openPdfInNewTab(effectiveFileUrl)}
                className="text-brand-700 hover:text-brand-800 font-bold flex items-center gap-1 text-[11px] bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Lihat Scan Lampiran ({surat.file_name})
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Embedded Viewer (if toggled) */}
          {showAttachmentViewer && (
            <div className="pt-3 border-t border-gray-200 mt-2">
              <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-xl text-[11px] flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gold-400" />
                  Dokumen Surat Masuk: {surat.file_name}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAttachmentViewer(false)}
                  className="text-gray-300 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <iframe
                src={effectiveFileUrl}
                className="w-full h-[550px] bg-white border border-slate-300 rounded-b-xl"
                title="Pratinjau Lampiran Surat Masuk"
              />
            </div>
          )}
        </div>

        {/* Instruksi & Deadline */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Instruksi Kepala Sekolah:</span>
          </div>
          <p className="text-sm font-bold text-gray-900 italic">"{disp.instruksi}"</p>
          {disp.catatan && (
            <p className="text-gray-700">
              <strong>Catatan:</strong> {disp.catatan}
            </p>
          )}
          <div className="pt-2 text-rose-700 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Batas Waktu Pelaksanaan (Deadline): {formatIndonesianDate(disp.deadline)}</span>
          </div>
        </div>

        {/* Follow-up Section: Role-based view (Kepala Sekolah vs Penerima Tugas) */}
        {isKepsek ? (
          /* ========================================================================= */
          /* TAMPILAN KEPALA SEKOLAH: MONITORING STATUS & LAPORAN TINDAK LANJUT GURU   */
          /* ========================================================================= */
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-brand-700" />
                  Monitoring Status & Laporan Pelaksanaan Tugas:
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Kepala Sekolah memantau progres pelaksanaan tugas dari staf/guru yang ditunjuk ({disp.penerima_nama})
                </p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border self-start sm:self-auto ${statusBadge.color}`}>
                Status: {statusBadge.label}
              </span>
            </div>

            {/* Kotak Laporan Tindak Lanjut dari Penerima */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Laporan Hasil Tindak Lanjut dari {disp.penerima_nama}:
              </label>
              {disp.tanggapan ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-emerald-950 text-xs leading-relaxed space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Laporan Resmi dari Penerima Tugas:</span>
                  </div>
                  <p className="text-xs font-medium text-gray-900 bg-white p-3 rounded-lg border border-emerald-200">
                    "{disp.tanggapan}"
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">
                    ⏳ Belum Ada Laporan Masuk
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Penerima tugas ({disp.penerima_nama}) sedang memproses instruksi ini dan belum mengirimkan laporan penyelesaian.
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Aksi Pengawasan Kepala Sekolah */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                Penerima Tugas: <strong className="text-gray-900">{disp.penerima_nama}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/surat-masuk/${surat.id}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Buka Arsip Surat Masuk
                </Link>
                <a
                  href={waReminderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Hubungi / Ingatkan {disp.penerima_nama} via WhatsApp
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* TAMPILAN GURU / PENERIMA DISPOSISI: FORM UPDATE STATUS & LAPORAN TUGAS   */
          /* ========================================================================= */
          <form onSubmit={handleSaveUpdate} className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Pembaruan Status & Laporan Tindak Lanjut Penerima:
              </h3>
              {disp.status === "selesai" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  Laporan Terkunci (Selesai)
                </span>
              )}
            </div>

            {/* Status radio / buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                disabled={disp.status === "selesai"}
                onClick={() => setCurrentStatus("menunggu")}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  disp.status === "selesai"
                    ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none"
                    : currentStatus === "menunggu"
                    ? "bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-400/20 shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                ⏳ Menunggu
              </button>
              <button
                type="button"
                disabled={disp.status === "selesai"}
                onClick={() => setCurrentStatus("proses")}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  disp.status === "selesai"
                    ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none"
                    : currentStatus === "proses"
                    ? "bg-sky-100 border-sky-400 text-sky-900 ring-2 ring-sky-400/20 shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                ⚙️ Sedang Diproses
              </button>
              <button
                type="button"
                disabled={disp.status === "selesai"}
                onClick={() => setCurrentStatus("selesai")}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  disp.status === "selesai"
                    ? "bg-emerald-100 border-emerald-400 text-emerald-900 shadow-xs cursor-not-allowed pointer-events-none"
                    : currentStatus === "selesai"
                    ? "bg-emerald-100 border-emerald-400 text-emerald-900 ring-2 ring-emerald-400/20 shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                ✅ Selesai Ditindaklanjuti
              </button>
            </div>

            {/* Tanggapan textarea */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Laporan Tindak Lanjut / Catatan Penyelesaian Tugas:
              </label>
              <textarea
                rows={4}
                disabled={disp.status === "selesai"}
                readOnly={disp.status === "selesai"}
                value={tanggapan}
                onChange={(e) => setTanggapan(e.target.value)}
                placeholder={
                  disp.status === "selesai"
                    ? "Laporan tugas telah diserahkan dan terkunci."
                    : "Jelaskan tindakan yang telah diambil, koordinasi yang telah dilakukan, atau hasil tindak lanjut pelaksanaan tugas..."
                }
                className={`w-full text-xs rounded-xl p-3 leading-relaxed ${
                  disp.status === "selesai"
                    ? "border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                    : "border border-gray-300 focus:ring-2 focus:ring-brand-500"
                }`}
              />
            </div>

            {disp.status === "selesai" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Laporan penugasan disposisi ini telah selesai dilaporkan. Tombol status dan formulir laporan telah dinonaktifkan/dikunci secara otomatis.</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {isSaved && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  Status dan tanggapan berhasil disimpan!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={disp.status === "selesai"}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    disp.status === "selesai"
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none pointer-events-none"
                      : "bg-brand-700 hover:bg-brand-800 text-white shadow-xs hover:shadow"
                  }`}
                >
                  {disp.status === "selesai" ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Laporan Selesai & Terkunci
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Pembaharuan Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
