"use client";

import React from "react";
import { useAppData } from "@/context/AppDataContext";
import { LOGO_YAYASAN_DATA_URL, LOGO_SMK_CIRCULAR_DATA_URL } from "@/lib/seedData";
import { KOP_HEADER_2027_DATA_URL } from "@/lib/kopAssets2027";
import { TemplateKopSurat } from "@/lib/letterTemplates";

interface OfficialKopSuratProps {
  className?: string;
  variant?: TemplateKopSurat;
  logoYayasanOverride?: string;
  logoSmkOverride?: string;
}

export const OfficialKopSurat: React.FC<OfficialKopSuratProps> = ({
  className = "",
  variant = "tradisional",
  logoYayasanOverride,
  logoSmkOverride,
}) => {
  const { schoolSettings } = useAppData();

  const logoYayasan = logoYayasanOverride || schoolSettings?.logoYayasanUrl || LOGO_YAYASAN_DATA_URL;
  const logoSmk = logoSmkOverride || schoolSettings?.logoSmkUrl || LOGO_SMK_CIRCULAR_DATA_URL;

  // TEMPLATE 2: KOP MODERN BARU (RESMI TAHUN PELAJARAN 2027/2028)
  if (variant === "modern_2027") {
    return (
      <div className={`w-full mb-5 select-none ${className}`}>
        <img
          src={KOP_HEADER_2027_DATA_URL}
          alt="Kop Surat Resmi TP 2027/2028 SMK Bayt Al-Hikmah"
          className="w-full h-auto object-contain max-h-36 sm:max-h-40"
        />
      </div>
    );
  }

  // TEMPLATE 1: KOP TRADISIONAL RESMI (STANDAR SAAT INI)
  return (
    <div
      className={`w-full text-center mb-6 select-none ${className}`}
      style={{ fontFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", Georgia, serif' }}
    >
      {/* Three Column Kop: Left Logo - Center Text - Right Logo */}
      <div className="flex items-center justify-between gap-3 px-1">
        {/* Left: Logo Yayasan Pondok Pesantren Bayt Al-Hikmah */}
        <div className="flex-shrink-0 w-24 flex items-center justify-center">
          <img
            src={logoYayasan}
            alt="Logo Yayasan PP Bayt Al-Hikmah"
            className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
          />
        </div>

        {/* Center: Official Institution Typography (Times New Roman) */}
        <div className="flex-1 text-center text-black leading-tight">
          <h2 className="text-[13px] sm:text-[15px] font-bold tracking-wider uppercase">
            YAYASAN PONDOK PESANTREN BAYT AL-HIKMAH
          </h2>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase mt-0.5">
            SMK BAYT AL-HIKMAH
          </h1>
          <p className="text-[10px] sm:text-[11px] mt-1 text-gray-800 leading-normal">
            Jalan Patiunus No. 25 Krampyangan Bugul Kidul Telp : (0343) 428544, Fax : (0343) 413549
          </p>
          <p className="text-[9.5px] sm:text-[10.5px] text-gray-800 leading-normal">
            Website : http://smk.baytalhikmah.sch.id, E-mail : smkbayhi@gmail.com Kode Pos. 67127
          </p>
          <p className="text-xs sm:text-sm font-bold tracking-[0.45em] uppercase mt-0.5 text-black">
            P A S U R U A N
          </p>
        </div>

        {/* Right: Logo SMK Bayt Al-Hikmah Pasuruan */}
        <div className="flex-shrink-0 w-24 flex items-center justify-center">
          <img
            src={logoSmk}
            alt="Logo SMK Bayt Al-Hikmah"
            className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
          />
        </div>
      </div>

      {/* Double Border Rule (Thick top rule, thin bottom rule) matching official letter */}
      <div className="mt-3">
        <div className="border-t-[3px] border-black w-full" />
        <div className="border-t-[1px] border-black w-full mt-[1.5px]" />
      </div>
    </div>
  );
};
