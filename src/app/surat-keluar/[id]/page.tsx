"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { formatIndonesianDate, getStatusSuratKeluarBadge } from "@/lib/utils";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { DigitalSignatureModal } from "@/components/signature/DigitalSignatureModal";
import {
  ArrowLeft,
  Printer,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
} from "lucide-react";

export default function SuratKeluarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { currentUser, isKepsek, isTU } = useAuth();
  const {
    suratKeluar,
    approveSuratKeluar,
    rejectSuratKeluar,
    deleteSuratKeluar,
    schoolSettings,
  } = useAppData();

  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const surat = suratKeluar.find((s) => s.id === id);

  if (!surat) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Surat Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500">
          Dokumen surat keluar dengan ID "{id}" tidak ditemukan dalam sistem.
        </p>
        <Link
          href="/surat-keluar"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Surat Keluar
        </Link>
      </div>
    );
  }

  const badge = getStatusSuratKeluarBadge(surat.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/surat-keluar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Surat Keluar
        </Link>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print / Download Button */}
          <Link
            href={`/surat-keluar/${surat.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-brand-700" />
            Cetak / Download PDF Resmi
          </Link>

          {/* Kepala Sekolah Approval & Signature Trigger */}
          {isKepsek && surat.status === "menunggu_persetujuan" && (
            <button
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
            >
              <PenTool className="w-4 h-4" />
              Setujui & Tanda Tangani Dokumen
            </button>
          )}

          {/* Delete Button */}
          {(isTU || isKepsek) && (
            <button
              onClick={() => {
                if (window.confirm("Hapus dokumen surat keluar ini?")) {
                  deleteSuratKeluar(surat.id);
                  router.push("/surat-keluar");
                }
              }}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Hapus Surat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold border ${badge.color}`}
          >
            {badge.label}
          </span>
          <span className="font-mono text-xs font-bold text-brand-900 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded">
            {surat.nomor_surat}
          </span>
        </div>

        <div className="text-xs text-gray-500">
          Dibuat pada:{" "}
          <strong className="text-gray-800">
            {formatIndonesianDate(surat.created_at)}
          </strong>{" "}
          oleh {surat.creator_name || "Tata Usaha"}
        </div>
      </div>

      {/* Rejection Alert if applicable */}
      {surat.status === "ditolak" && surat.catatan_revisi && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Catatan Revisi dari Kepala Sekolah:</h4>
            <p className="mt-1 leading-relaxed">{surat.catatan_revisi}</p>
          </div>
        </div>
      )}

      {/* Document Sheet (Visual Paper Simulation matching official PDF) */}
      <div 
        className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-2xl shadow-xl p-8 sm:p-14 surat-resmi text-gray-900 text-sm leading-relaxed"
        style={{ fontFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", Georgia, serif' }}
      >
        {/* Kop Surat Resmi */}
        <OfficialKopSurat />

        {/* Letter Meta: Nomor, Lampiran, Perihal with aligned colons */}
        <div className="mb-6 font-serif text-xs sm:text-[13px]">
          <table className="border-collapse">
            <tbody>
              <tr>
                <td className="w-24 py-0.5 text-gray-700">Nomor</td>
                <td className="w-4 py-0.5">:</td>
                <td className="py-0.5 font-semibold text-gray-950">{surat.nomor_surat}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-700">Lampiran</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">{surat.lampiran || "-"}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-700 align-top">Perihal</td>
                <td className="py-0.5 align-top">:</td>
                <td className="py-0.5 font-bold text-gray-950">{surat.perihal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Destination */}
        <div className="mb-6 font-serif text-xs sm:text-[13px] leading-snug">
          <p>Kepada Yth.</p>
          <p className="font-bold text-gray-950">{surat.tujuan}</p>
          <p>Di tempat</p>
        </div>

        {/* Letter Body */}
        <div
          className="prose prose-sm max-w-none text-gray-900 mb-10 leading-relaxed font-serif text-xs sm:text-[13px]"
          dangerouslySetInnerHTML={{ __html: surat.isi_surat }}
        />

        {/* Signature & Official Seal Block (Bottom Right) */}
        {(() => {
          const isApproved = surat.status === "disetujui";
          const isApprovedOrHasTtd = surat.has_ttd || isApproved;
          const isApprovedOrHasStempel = (surat.has_stempel || isApproved) && surat.has_stempel !== false;
          const displayStamp = schoolSettings?.stempelUrl || surat.stempel_image_url;
          const displayTtd = schoolSettings?.ttdKepsekUrl || surat.ttd_image_url;
          const displayKepsek = schoolSettings?.namaKepsek || surat.approver_name || "Mokhamat Ekhsan, S.Kom";
          const displayNiy = schoolSettings?.niyKepsek || "14215094";

          return (
            <div className="flex justify-end font-serif text-xs sm:text-[13px] mt-8">
              <div className="text-left w-72">
                <p>Pasuruan, {formatIndonesianDate(surat.tanggal_surat)}</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  Kepala SMK Bayt Al-Hikmah
                </p>

                {/* Signature & Stamp Area */}
                <div className="relative h-24 my-1 flex items-center justify-start">
                  {isApprovedOrHasStempel && displayStamp && (
                    <div className="absolute -left-6 -top-1 pointer-events-none opacity-85 z-0">
                      <img
                        src={displayStamp}
                        alt="Stempel Resmi"
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                  )}

                  {isApprovedOrHasTtd && displayTtd ? (
                    <div className="relative z-10 left-3">
                      <img
                        src={displayTtd}
                        alt={`Tanda Tangan Digital ${displayKepsek}`}
                        className="h-20 object-contain drop-shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-16 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 italic text-[11px]">
                      {surat.status === "menunggu_persetujuan"
                        ? "Menunggu TTD & Pengesahan"
                        : "Draf Dokumen"}
                    </div>
                  )}
                </div>

                <p className="font-bold text-gray-950 underline text-sm tracking-wide">
                  {displayKepsek}
                </p>
                <p className="text-gray-700 text-xs font-medium">
                  NIY. {displayNiy}
                </p>

                {isApprovedOrHasTtd && (
                  <span className="inline-block mt-2 text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                    ✓ TERVERIFIKASI SISTEM SIGAP-SMK
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <DigitalSignatureModal
          surat={surat}
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onApprove={(id, opts) => approveSuratKeluar(id, schoolSettings?.namaKepsek || currentUser.name, opts)}
          onReject={(id, notes) => rejectSuratKeluar(id, notes)}
          kepsekName={schoolSettings?.namaKepsek || currentUser.name}
        />
      )}
    </div>
  );
}
