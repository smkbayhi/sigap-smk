"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { formatIndonesianDate } from "@/lib/utils";

export default function SuratKeluarPrintPage() {
  const params = useParams();
  const id = String(params.id);
  const { suratKeluar } = useAppData();

  const surat = suratKeluar.find((s) => s.id === id);

  useEffect(() => {
    // Automatically trigger print dialog when component is mounted
    const timer = setTimeout(() => {
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (!surat) {
    return <div className="p-8 text-center text-sm">Dokumen tidak ditemukan.</div>;
  }

  return (
    <div className="bg-white min-h-screen text-black font-serif text-[11pt] sm:text-[11.5pt] leading-relaxed p-6 sm:p-10 print-container max-w-4xl mx-auto">
      {/* Floating Print Button (hidden when printed) */}
      <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-300">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-sans font-bold text-xs hover:bg-emerald-800 shadow"
        >
          🖨️ Cetak Dokumen Resmi / Simpan PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-sans text-xs hover:bg-gray-200"
        >
          Tutup Tab
        </button>
      </div>

      {/* Official Kop Surat Yayasan & SMK Bayt Al-Hikmah */}
      <OfficialKopSurat />

      {/* Letter Meta: Nomor, Lampiran, Perihal (Aligned colons, no top date) */}
      <div className="mb-6 font-serif text-[11pt]">
        <table className="border-collapse">
          <tbody>
            <tr>
              <td className="w-24 py-0.5">Nomor</td>
              <td className="w-4 py-0.5">:</td>
              <td className="py-0.5 font-sans font-medium">{surat.nomor_surat}</td>
            </tr>
            <tr>
              <td className="py-0.5">Lampiran</td>
              <td className="py-0.5">:</td>
              <td className="py-0.5">{surat.lampiran || "-"}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Perihal</td>
              <td className="py-0.5 align-top">:</td>
              <td className="py-0.5 font-bold">{surat.perihal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Destination */}
      <div className="mb-6 font-serif text-[11pt] leading-snug">
        <p>Kepada Yth.</p>
        <p className="font-bold">{surat.tujuan}</p>
        <p>Di tempat</p>
      </div>

      {/* Letter Body */}
      <div
        className="mb-8 font-serif text-[11pt] leading-relaxed text-justify space-y-3"
        dangerouslySetInnerHTML={{ __html: surat.isi_surat }}
      />

      {/* Signature & Official Stamp Block (Bottom Right) */}
      <div className="flex justify-end font-serif text-[11pt] mt-8 break-inside-avoid">
        <div className="text-left w-72">
          <p>Pasuruan, {formatIndonesianDate(surat.tanggal_surat)}</p>
          <p className="font-bold">Kepala SMK Bayt Al-Hikmah</p>

          {/* Stempel & Signature overlay */}
          <div className="relative h-24 my-1 flex items-center justify-start">
            {/* Official Stamp behind/intertwined with signature */}
            {surat.has_stempel && surat.stempel_image_url && (
              <div className="absolute -left-6 -top-1 pointer-events-none opacity-85 z-0">
                <img
                  src={surat.stempel_image_url}
                  alt="Stempel Resmi"
                  className="w-28 h-28 object-contain"
                />
              </div>
            )}

            {/* Signature */}
            {surat.has_ttd && surat.ttd_image_url ? (
              <div className="relative z-10 left-3">
                <img
                  src={surat.ttd_image_url}
                  alt="Tanda Tangan Mokhamat Ekhsan"
                  className="h-20 object-contain"
                />
              </div>
            ) : (
              <div className="h-16" />
            )}
          </div>

          <p className="font-bold underline text-[11.5pt] tracking-wide">
            {surat.approver_name || "Mokhamat Ekhsan, S.Kom"}
          </p>
          <p className="text-[10pt] font-sans font-medium text-black">
            NIY. 14215094
          </p>
        </div>
      </div>
    </div>
  );
}
