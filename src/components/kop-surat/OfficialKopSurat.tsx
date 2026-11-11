import React from "react";
import { LOGO_YAYASAN_DATA_URL, LOGO_SMK_CIRCULAR_DATA_URL } from "@/lib/seedData";

interface OfficialKopSuratProps {
  className?: string;
}

export const OfficialKopSurat: React.FC<OfficialKopSuratProps> = ({ className = "" }) => {
  return (
    <div className={`w-full text-center mb-6 ${className}`}>
      {/* Three Column Kop: Left Logo - Center Text - Right Logo */}
      <div className="flex items-center justify-between gap-3 px-1">
        {/* Left: Logo Yayasan Pondok Pesantren Bayt Al-Hikmah */}
        <div className="flex-shrink-0 w-24 flex items-center justify-center">
          <img
            src={LOGO_YAYASAN_DATA_URL}
            alt="Logo Yayasan PP Bayt Al-Hikmah"
            className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
          />
        </div>

        {/* Center: Official Institution Typography */}
        <div className="flex-1 text-center font-serif text-black leading-tight">
          <h2 className="text-[13px] sm:text-[15px] font-bold tracking-wider uppercase">
            YAYASAN PONDOK PESANTREN BAYT AL-HIKMAH
          </h2>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase mt-0.5">
            SMK BAYT AL-HIKMAH
          </h1>
          <p className="text-[10px] sm:text-[11px] mt-1 font-sans text-gray-800">
            Jalan Patiunus No. 25 Krampyangan Bugul Kidul Telp : (0343) 428544, Fax : (0343) 413549
          </p>
          <p className="text-[9.5px] sm:text-[10.5px] font-sans text-gray-800">
            Website : http//smk.baytalhikmah.sch.id, E-mail : smkbayhi@gmail.com Kode Pos. 67127
          </p>
          <p className="text-xs sm:text-sm font-bold tracking-[0.45em] uppercase font-sans mt-0.5 text-black">
            P A S U R U A N
          </p>
        </div>

        {/* Right: Logo SMK Bayt Al-Hikmah Pasuruan */}
        <div className="flex-shrink-0 w-24 flex items-center justify-center">
          <img
            src={LOGO_SMK_CIRCULAR_DATA_URL}
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
