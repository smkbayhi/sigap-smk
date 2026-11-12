"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { formatIndonesianDate } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mapDbToSuratKeluar } from "@/lib/supabaseSync";
import { SuratKeluar } from "@/lib/database.types";

export default function SuratKeluarPrintPage() {
  const params = useParams();
  const id = String(params.id);
  const { suratKeluar, schoolSettings } = useAppData();

  const [surat, setSurat] = useState<SuratKeluar | null>(() => {
    return suratKeluar.find((s) => s.id === id) || null;
  });
  const [isLoading, setIsLoading] = useState(!surat);

  useEffect(() => {
    // 1. Check if found in context
    const foundInContext = suratKeluar.find((s) => s.id === id);
    if (foundInContext) {
      setSurat(foundInContext);
      setIsLoading(false);
      return;
    }

    // 2. Fetch directly from Supabase Cloud if not yet in state
    async function fetchDirect() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from("surat_keluar")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (data && !error) {
            setSurat(mapDbToSuratKeluar(data));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Direct fetch from Supabase failed:", err);
        }
      }

      // 3. Fallback: check localStorage directly
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("sigap_smk_surat_keluar");
          if (raw) {
            const list: SuratKeluar[] = JSON.parse(raw);
            const foundInStorage = list.find((s) => s.id === id);
            if (foundInStorage) {
              setSurat(foundInStorage);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Storage fetch failed", e);
        }
      }

      setIsLoading(false);
    }

    fetchDirect();
  }, [id, suratKeluar]);

  // Trigger print dialog once surat document is loaded
  useEffect(() => {
    if (!surat || isLoading) return;
    const timer = setTimeout(() => {
      window.print();
    }, 700);
    return () => clearTimeout(timer);
  }, [surat, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-6 text-center font-sans">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold text-gray-900 tracking-wide">Menyiapkan Dokumen Resmi...</h2>
        <p className="text-xs text-gray-500 mt-1">Mengambil arsip surat resmi dari server SMK Bayt Al-Hikmah</p>
      </div>
    );
  }

  if (!surat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-6 text-center font-sans">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 text-xl font-bold">
          !
        </div>
        <h2 className="text-base font-bold text-gray-900">Dokumen Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          Surat keluar dengan ID <strong>{id}</strong> tidak ditemukan pada database sistem. Pastikan tautan yang Anda buka sudah sesuai.
        </p>
        <a
          href="/"
          className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow"
        >
          Buka SIGAP-SMK
        </a>
      </div>
    );
  }

  return (
    <div 
      className="bg-white min-h-screen text-black surat-resmi text-[11pt] sm:text-[11.5pt] leading-relaxed p-6 sm:p-10 print-container max-w-4xl mx-auto"
      style={{ fontFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", Georgia, serif' }}
    >
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
      <div className="mb-6 text-[11pt]">
        <table className="border-collapse">
          <tbody>
            <tr>
              <td className="w-24 py-0.5">Nomor</td>
              <td className="w-4 py-0.5">:</td>
              <td className="py-0.5 font-medium">{surat.nomor_surat}</td>
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
      <div className="mb-6 text-[11pt] leading-snug">
        <p>Kepada Yth.</p>
        <p className="font-bold">{surat.tujuan}</p>
        <p>Di tempat</p>
      </div>

      {/* Letter Body */}
      <div
        className="mb-8 text-[11pt] leading-relaxed text-justify space-y-3"
        dangerouslySetInnerHTML={{ __html: surat.isi_surat }}
      />

      {/* Signature & Official Stamp Block (Bottom Right) */}
      {(() => {
        const isApproved = surat.status === "disetujui";
        const isApprovedOrHasTtd = surat.has_ttd || isApproved;
        const isApprovedOrHasStempel = (surat.has_stempel || isApproved) && surat.has_stempel !== false;
        const displayStamp = schoolSettings?.stempelUrl || surat.stempel_image_url;
        const displayTtd = schoolSettings?.ttdKepsekUrl || surat.ttd_image_url;
        const displayKepsek = schoolSettings?.namaKepsek || surat.approver_name || "Mokhamat Ekhsan, S.Kom";
        const displayNiy = schoolSettings?.niyKepsek || "14215094";

        return (
          <div className="flex justify-end text-[11pt] mt-8 break-inside-avoid">
            <div className="text-left w-72">
              <p>Pasuruan, {formatIndonesianDate(surat.tanggal_surat)}</p>
              <p className="font-bold">Kepala SMK Bayt Al-Hikmah</p>

              {/* Stempel & Signature overlay (Sesuai Format Baku Gambar 2) */}
              <div className="relative h-24 my-1 flex items-center justify-start">
                {/* Official Stamp: Ukuran besar (w-44 h-44 / 176px), menimpa jabatan atas & nama bawah */}
                {isApprovedOrHasStempel && displayStamp && (
                  <div className="absolute -left-10 -top-9 pointer-events-none opacity-90 z-0">
                    <img
                      src={displayStamp}
                      alt="Stempel Resmi"
                      className="w-44 h-44 object-contain mix-blend-multiply"
                    />
                  </div>
                )}

                {/* Signature: Ukuran proporsional & tinggi (h-28 / 112px), menimpa sisi kanan stempel & nama */}
                {isApprovedOrHasTtd && displayTtd ? (
                  <div className="relative z-10 left-11 -top-2">
                    <img
                      src={displayTtd}
                      alt={`Tanda Tangan ${displayKepsek}`}
                      className="h-28 object-contain mix-blend-multiply"
                    />
                  </div>
                ) : (
                  <div className="h-20" />
                )}
              </div>

              <p className="font-bold underline text-[11.5pt] tracking-wide relative z-20">
                {displayKepsek}
              </p>
              <p className="text-[10.5pt] font-medium text-black relative z-20">
                NIY. {displayNiy}
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
