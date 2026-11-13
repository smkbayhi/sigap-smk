"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { OfficialFooterSurat } from "@/components/kop-surat/OfficialFooterSurat";
import { SuratSignatureBlock } from "@/components/surat/SuratSignatureBlock";
import { parseLetterMeta } from "@/lib/letterTemplates";
import { formatIndonesianDate } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mapDbToSuratKeluar } from "@/lib/supabaseSync";
import { SuratKeluar } from "@/lib/database.types";

import { 
  STEMPEL_SEKOLAH_DATA_URL, 
  TTD_KEPSEK_DATA_URL, 
  LOGO_YAYASAN_DATA_URL, 
  LOGO_SMK_CIRCULAR_DATA_URL 
} from "@/lib/seedData";

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

  const isApproved = surat.status === "disetujui";
  const isApprovedOrHasTtd = surat.has_ttd || isApproved;
  const isApprovedOrHasStempel = (surat.has_stempel || isApproved) && surat.has_stempel !== false;
  
  // Prefer active schoolSettings if letter still uses seeder defaults
  const displayStamp =
    surat.stempel_image_url && surat.stempel_image_url !== STEMPEL_SEKOLAH_DATA_URL
      ? surat.stempel_image_url
      : (schoolSettings?.stempelUrl || surat.stempel_image_url || STEMPEL_SEKOLAH_DATA_URL);

  const displayTtd =
    surat.ttd_image_url && surat.ttd_image_url !== TTD_KEPSEK_DATA_URL
      ? surat.ttd_image_url
      : (schoolSettings?.ttdKepsekUrl || surat.ttd_image_url || TTD_KEPSEK_DATA_URL);

  const displayKepsek =
    surat.approver_name && surat.approver_name !== "Mokhamat Ekhsan, S.Kom"
      ? surat.approver_name
      : (schoolSettings?.namaKepsek || surat.approver_name || "Mokhamat Ekhsan, S.Kom");

  const displayNiy = schoolSettings?.niyKepsek || "14215094";

  const displayLogoYayasan =
    surat.logo_yayasan_url && surat.logo_yayasan_url !== LOGO_YAYASAN_DATA_URL
      ? surat.logo_yayasan_url
      : (schoolSettings?.logoYayasanUrl || LOGO_YAYASAN_DATA_URL);

  const displayLogoSmk =
    surat.logo_smk_url && surat.logo_smk_url !== LOGO_SMK_CIRCULAR_DATA_URL
      ? surat.logo_smk_url
      : (schoolSettings?.logoSmkUrl || LOGO_SMK_CIRCULAR_DATA_URL);

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 15mm 10mm 15mm !important;
        }
        @media print {
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div 
        className="bg-white min-h-screen text-black surat-resmi text-[10.5pt] sm:text-[11pt] leading-normal p-4 sm:p-8 print-container max-w-4xl mx-auto"
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

        {(() => {
          const { cleanHtml, meta } = parseLetterMeta(surat.isi_surat);
          const isJudulTengah = meta.layout === "judul_tengah";

          return (
            <>
              {/* Official Kop Surat (Sesuai Pilihan Template: Tradisional vs Modern TP 2027/2028) */}
              <OfficialKopSurat 
                variant={meta.kopVariant}
                className="mb-2.5 sm:mb-3"
                logoYayasanOverride={displayLogoYayasan}
                logoSmkOverride={displayLogoSmk}
              />

              {/* FORMAT B: JUDUL TENGAH (Surat Tugas, Surat Rekomendasi, SPPD, Surat Kuasa) */}
              {isJudulTengah ? (
                <div className="text-center my-3">
                  <h2 className="text-[12.5pt] sm:text-[13pt] font-bold uppercase underline tracking-wider text-black">
                    {meta.judul || surat.perihal}
                  </h2>
                  <p className="text-[10pt] font-semibold text-black mt-0.5">
                    Nomor: {surat.nomor_surat}
                  </p>
                </div>
              ) : (
                /* FORMAT A: KORESPONDENSI DINAS (Nomor/Lampiran/Perihal di kiri, Kepada Yth.) */
                <>
                  <div className="mb-3 text-[10.5pt] sm:text-[11pt]">
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

                  <div className="mb-3 text-[10.5pt] sm:text-[11pt] leading-snug">
                    <p>Kepada Yth.</p>
                    <p className="font-bold">{surat.tujuan}</p>
                    <p>Di tempat</p>
                  </div>
                </>
              )}

              {/* Letter Body */}
              <div
                className="mb-4 text-[10.5pt] sm:text-[11pt] leading-relaxed text-justify space-y-2.5"
                dangerouslySetInnerHTML={{ __html: cleanHtml }}
              />

              {/* Signature & Official Stamp Block (1 Pihak, 2 Pihak Cabdin/Yayasan, 3 Pihak Bank Jatim/SP) */}
              <SuratSignatureBlock
                modelTtd={meta.modelTtd}
                tanggalSurat={surat.tanggal_surat}
                namaKepsek={displayKepsek}
                niyKepsek={displayNiy}
                displayStamp={displayStamp}
                displayTtd={displayTtd}
                isApprovedOrHasTtd={isApprovedOrHasTtd}
                isApprovedOrHasStempel={isApprovedOrHasStempel}
                namaPenerima={surat.tujuan}
                tembusan={meta.tembusan}
                isPrint={true}
              />

              {/* Official Footer Accent Bar (Aktif bila Template Kop Modern TP 2027/2028 dipilih) */}
              <OfficialFooterSurat variant={meta.kopVariant} isPrint={true} />
            </>
          );
        })()}
      </div>
    </>
  );
}
