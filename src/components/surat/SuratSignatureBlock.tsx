"use client";

import React from "react";
import { formatIndonesianDate } from "@/lib/utils";
import { ModelTandaTangan } from "@/lib/letterTemplates";

interface SuratSignatureBlockProps {
  modelTtd?: ModelTandaTangan;
  tanggalSurat: string;
  namaKepsek: string;
  niyKepsek: string;
  displayStamp?: string | null;
  displayTtd?: string | null;
  isApprovedOrHasTtd?: boolean;
  isApprovedOrHasStempel?: boolean;
  namaPenerima?: string;
  tembusan?: string[];
  isPrint?: boolean;
}

export const SuratSignatureBlock: React.FC<SuratSignatureBlockProps> = ({
  modelTtd = "1_kepsek",
  tanggalSurat,
  namaKepsek,
  niyKepsek,
  displayStamp,
  displayTtd,
  isApprovedOrHasTtd,
  isApprovedOrHasStempel,
  namaPenerima,
  tembusan = [],
  isPrint = false,
}) => {
  const formattedDate = formatIndonesianDate(tanggalSurat);

  const renderSingleKepsek = () => (
    <div className="flex justify-end mt-6 text-[10.5pt] sm:text-[11pt] break-inside-avoid page-break-avoid">
      <div className="text-left w-72">
        <p>Pasuruan, {formattedDate}</p>
        <p className="font-bold text-gray-950">Kepala SMK Bayt Al-Hikmah</p>

        {/* Stempel & Signature overlay (Ukuran proporsional & stempel diperbesar) */}
        <div className="relative h-28 my-1 flex items-center justify-start">
          {isApprovedOrHasStempel && displayStamp && (
            <div className="absolute -left-11 -top-10 pointer-events-none opacity-90 z-0">
              <img
                src={displayStamp}
                alt="Stempel Resmi"
                className="w-[196px] h-[196px] object-contain mix-blend-multiply"
              />
            </div>
          )}

          {isApprovedOrHasTtd && displayTtd ? (
            <div className="relative z-10 left-9 -top-2">
              <img
                src={displayTtd}
                alt={`Tanda Tangan ${namaKepsek}`}
                className="h-36 sm:h-[148px] max-w-[240px] w-auto object-contain mix-blend-multiply"
              />
            </div>
          ) : (
            /* Ruang kosong putih bersih siap untuk tanda tangan & stempel basah fisik */
            <div className="w-56 h-28" />
          )}
        </div>

        <p className="font-bold underline text-[11.5pt] tracking-wide relative z-20 text-gray-950">
          {namaKepsek}
        </p>
        <p className="text-[10pt] font-medium text-gray-800 relative z-20">
          NIY. {niyKepsek}
        </p>
      </div>
    </div>
  );

  const renderDualCabdin = () => (
    <div className="mt-8 text-[10.5pt] sm:text-[11pt] break-inside-avoid page-break-avoid">
      <div className="text-right mb-2">
        <p>Pasuruan, {formattedDate}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Cabdin */}
        <div className="text-left">
          <p className="font-medium">Mengetahui,</p>
          <p className="font-bold text-gray-950">
            Kepala Cabang Dinas Pendidikan
          </p>
          <p className="font-bold text-gray-950">Wilayah Pasuruan</p>

          <div className="h-28 my-1 flex items-center" />

          <p className="font-bold underline text-[11pt] text-gray-950">
            Erwan Tjahjono, S.H, M.M
          </p>
          <p className="text-[10pt] text-gray-800">Pembina, IV/a</p>
          <p className="text-[9.5pt] text-gray-800">NIP. 19691006 199403 1 008</p>
        </div>

        {/* Right: Kepsek */}
        <div className="text-left pl-6">
          <p className="font-medium">&nbsp;</p>
          <p className="font-bold text-gray-950">Kepala SMKS Bayt Al-Hikmah</p>
          <p className="font-medium">&nbsp;</p>

          <div className="relative h-28 my-1 flex items-center justify-start">
            {isApprovedOrHasStempel && displayStamp && (
              <div className="absolute -left-10 -top-10 pointer-events-none opacity-90 z-0">
                <img
                  src={displayStamp}
                  alt="Stempel Resmi"
                  className="w-[188px] h-[188px] object-contain mix-blend-multiply"
                />
              </div>
            )}
            {isApprovedOrHasTtd && displayTtd ? (
              <div className="relative z-10 left-9 -top-2">
                <img
                  src={displayTtd}
                  alt={`Tanda Tangan ${namaKepsek}`}
                  className="h-36 sm:h-[142px] max-w-[220px] w-auto object-contain mix-blend-multiply"
                />
              </div>
            ) : (
              <div className="w-48 h-28" />
            )}
          </div>

          <p className="font-bold underline text-[11pt] text-gray-950">
            {namaKepsek}
          </p>
          <p className="text-[10pt] text-gray-800">NIY. {niyKepsek}</p>
        </div>
      </div>
    </div>
  );

  const renderDualYayasan = () => (
    <div className="mt-8 text-[10.5pt] sm:text-[11pt] break-inside-avoid page-break-avoid">
      <div className="text-right mb-2">
        <p>Pasuruan, {formattedDate}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Yayasan */}
        <div className="text-left">
          <p className="font-medium">Mengetahui,</p>
          <p className="font-bold text-gray-950">Direktur Pendidikan</p>
          <p className="font-bold text-gray-950">Bayt Al-Hikmah</p>

          <div className="h-28 my-1 flex items-center" />

          <p className="font-bold underline text-[11pt] text-gray-950">
            Dr. H. M. Nurul Huda, M.Pd.I
          </p>
          <p className="text-[10pt] text-gray-800">NIY. 10112001</p>
        </div>

        {/* Right: Kepsek */}
        <div className="text-left pl-6">
          <p className="font-medium">&nbsp;</p>
          <p className="font-bold text-gray-950">Kepala SMK Bayt Al-Hikmah</p>
          <p className="font-medium">&nbsp;</p>

          <div className="relative h-28 my-1 flex items-center justify-start">
            {isApprovedOrHasStempel && displayStamp && (
              <div className="absolute -left-10 -top-10 pointer-events-none opacity-90 z-0">
                <img
                  src={displayStamp}
                  alt="Stempel Resmi"
                  className="w-[188px] h-[188px] object-contain mix-blend-multiply"
                />
              </div>
            )}
            {isApprovedOrHasTtd && displayTtd ? (
              <div className="relative z-10 left-9 -top-2">
                <img
                  src={displayTtd}
                  alt={`Tanda Tangan ${namaKepsek}`}
                  className="h-36 sm:h-[142px] max-w-[220px] w-auto object-contain mix-blend-multiply"
                />
              </div>
            ) : (
              <div className="w-48 h-28" />
            )}
          </div>

          <p className="font-bold underline text-[11pt] text-gray-950">
            {namaKepsek}
          </p>
          <p className="text-[10pt] text-gray-800">NIY. {niyKepsek}</p>
        </div>
      </div>
    </div>
  );

  const renderTripleBankJatim = () => (
    <div className="mt-8 text-[10pt] sm:text-[10.5pt] break-inside-avoid page-break-avoid">
      <div className="text-right mb-2">
        <p>Pasuruan, {formattedDate}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Left: Bank Jatim */}
        <div className="text-left">
          <p className="font-medium text-gray-700">Yang Diberi Kuasa,</p>
          <p className="font-bold text-gray-950 leading-tight">
            PT. BPD JATIM<br />CABANG PASURUAN
          </p>
          <div className="h-20 flex items-center justify-center" />
          <p className="border-t border-black font-semibold pt-0.5 text-[9.5pt]">
            ( Pimpinan Cabang )
          </p>
        </div>

        {/* Center: Kepsek */}
        <div className="text-left">
          <p className="font-medium text-gray-700">Yang Memberi Kuasa,</p>
          <p className="font-bold text-gray-950 leading-tight">
            Kepala SMKS<br />Bayt Al-Hikmah
          </p>
          <div className="relative h-24 my-1 flex items-center justify-start">
            {isApprovedOrHasStempel && displayStamp && (
              <div className="absolute -left-7 -top-7 pointer-events-none opacity-85 z-0">
                <img
                  src={displayStamp}
                  alt="Stempel"
                  className="w-[145px] h-[145px] object-contain mix-blend-multiply"
                />
              </div>
            )}
            {isApprovedOrHasTtd && displayTtd ? (
              <div className="relative z-10 left-7">
                <img
                  src={displayTtd}
                  alt={`TTD ${namaKepsek}`}
                  className="h-28 max-w-[170px] w-auto object-contain mix-blend-multiply"
                />
              </div>
            ) : (
              <div className="w-full h-24" />
            )}
          </div>
          <p className="font-bold underline text-[10pt] text-gray-950">
            {namaKepsek}
          </p>
          <p className="text-[9pt] text-gray-800">NIY. {niyKepsek}</p>
        </div>

        {/* Right: Bendahara BOS */}
        <div className="text-left pl-2">
          <p className="font-medium text-gray-700">&nbsp;</p>
          <p className="font-bold text-gray-950 leading-tight">
            Bendahara BOSP<br />SMKS Bayt Al-Hikmah
          </p>
          <div className="h-20 flex items-center justify-center" />
          <p className="font-bold underline text-[10pt] text-gray-950">
            Ainiyatul Fitriyah, S.S
          </p>
          <p className="text-[9pt] text-gray-800">NIY. 14215112</p>
        </div>
      </div>
    </div>
  );

  const renderSpKedisiplinan = () => (
    <div className="mt-8 text-[10pt] sm:text-[10.5pt] break-inside-avoid page-break-avoid">
      <div className="text-right mb-2">
        <p>Pasuruan, {formattedDate}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Left: Penerima Surat */}
        <div className="text-left">
          <p className="font-bold text-gray-950 leading-tight">
            Penerima Surat Peringatan,
          </p>
          <div className="h-20 flex items-center justify-center" />
          <p className="font-bold underline text-[10pt] text-gray-950">
            {namaPenerima || "Yudha Prihantanto, S.Pd, M.Pd"}
          </p>
          <p className="text-[9pt] text-gray-800">Guru SMK</p>
        </div>

        {/* Center: Kepala SMK */}
        <div className="text-left">
          <p className="font-bold text-gray-950 leading-tight">
            Kepala SMK Bayt Al-Hikmah,
          </p>
          <div className="relative h-24 my-1 flex items-center justify-start">
            {isApprovedOrHasStempel && displayStamp && (
              <div className="absolute -left-7 -top-7 pointer-events-none opacity-85 z-0">
                <img
                  src={displayStamp}
                  alt="Stempel"
                  className="w-[145px] h-[145px] object-contain mix-blend-multiply"
                />
              </div>
            )}
            {isApprovedOrHasTtd && displayTtd ? (
              <div className="relative z-10 left-7">
                <img
                  src={displayTtd}
                  alt={`TTD ${namaKepsek}`}
                  className="h-28 max-w-[170px] w-auto object-contain mix-blend-multiply"
                />
              </div>
            ) : (
              <div className="w-full h-24" />
            )}
          </div>
          <p className="font-bold underline text-[10pt] text-gray-950">
            {namaKepsek}
          </p>
          <p className="text-[9pt] text-gray-800">NIY. {niyKepsek}</p>
        </div>

        {/* Right: Mengetahui Wadir */}
        <div className="text-left pl-2">
          <p className="font-medium text-gray-700">Mengetahui,</p>
          <p className="font-bold text-gray-950 leading-tight">
            Wakil Direktur Pendidikan,
          </p>
          <div className="h-20 flex items-center justify-center" />
          <p className="font-bold underline text-[10pt] text-gray-950">
            Ach. Afandi, M.Pd
          </p>
          <p className="text-[9pt] text-gray-800">NIY. 10112005</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {modelTtd === "2_cabdin" && renderDualCabdin()}
      {modelTtd === "2_yayasan" && renderDualYayasan()}
      {modelTtd === "3_bank_jatim" && renderTripleBankJatim()}
      {modelTtd === "sp_kedisiplinan" && renderSpKedisiplinan()}
      {modelTtd === "1_kepsek" && renderSingleKepsek()}

      {/* Tembusan Section at bottom left */}
      {tembusan && tembusan.length > 0 && (
        <div className="mt-6 text-[9.5pt] sm:text-[10pt] text-left break-inside-avoid page-break-avoid">
          <p className="font-semibold text-gray-900">Tembusan :</p>
          <ul className="list-none pl-0 space-y-0.5 mt-0.5 text-gray-800">
            {tembusan.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
