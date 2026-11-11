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
} from "lucide-react";

export default function DisposisiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { currentUser, users } = useAuth();
  const { disposisi, suratMasuk, updateDisposisiStatus } = useAppData();

  const disp = disposisi.find((d) => d.id === id);
  const surat = disp ? suratMasuk.find((s) => s.id === disp.surat_masuk_id) : null;

  const [currentStatus, setCurrentStatus] = useState<StatusDisposisi>(disp?.status || "menunggu");
  const [tanggapan, setTanggapan] = useState(disp?.tanggapan || "");
  const [isSaved, setIsSaved] = useState(false);

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

  const statusBadge = getStatusDisposisiBadge(currentStatus);
  const urgensiBadge = getUrgensiBadge(disp.sifat);

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

          <div className="pt-2 flex items-center justify-between">
            <span className="text-gray-500 text-[11px]">
              Tanggal Surat: {formatIndonesianDate(surat.tanggal_surat)}
            </span>
            <a
              href={surat.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 hover:text-brand-800 font-bold flex items-center gap-1 text-[11px]"
            >
              <FileText className="w-3.5 h-3.5" />
              Lihat Scan Lampiran ({surat.file_name})
            </a>
          </div>
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

        {/* Follow-up Update Form */}
        <form onSubmit={handleSaveUpdate} className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Pembaruan Status & Laporan Tindak Lanjut Penerima:
          </h3>

          {/* Status radio / buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCurrentStatus("menunggu")}
              className={`p-3 rounded-xl border text-center font-bold transition-all ${
                currentStatus === "menunggu"
                  ? "bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-400/20 shadow-xs"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ⏳ Menunggu
            </button>
            <button
              type="button"
              onClick={() => setCurrentStatus("proses")}
              className={`p-3 rounded-xl border text-center font-bold transition-all ${
                currentStatus === "proses"
                  ? "bg-sky-100 border-sky-400 text-sky-900 ring-2 ring-sky-400/20 shadow-xs"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ⚙️ Sedang Diproses
            </button>
            <button
              type="button"
              onClick={() => setCurrentStatus("selesai")}
              className={`p-3 rounded-xl border text-center font-bold transition-all ${
                currentStatus === "selesai"
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
              value={tanggapan}
              onChange={(e) => setTanggapan(e.target.value)}
              placeholder="Jelaskan tindakan yang telah diambil, koordinasi yang telah dilakukan, atau hasil tindak lanjut..."
              className="w-full text-xs rounded-xl border border-gray-300 p-3 leading-relaxed focus:ring-2 focus:ring-brand-500"
            />
          </div>

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
                className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Pembaharuan Status
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
