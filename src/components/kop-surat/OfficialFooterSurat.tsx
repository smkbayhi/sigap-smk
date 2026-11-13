"use client";

import React from "react";
import { KOP_FOOTER_2027_DATA_URL } from "@/lib/kopAssets2027";
import { TemplateKopSurat } from "@/lib/letterTemplates";

interface OfficialFooterSuratProps {
  variant?: TemplateKopSurat;
  isPrint?: boolean;
}

export const OfficialFooterSurat: React.FC<OfficialFooterSuratProps> = ({
  variant = "tradisional",
  isPrint = false,
}) => {
  // Only Template 2 (Modern TP 2027/2028) has the official bottom golden accent bar
  if (variant !== "modern_2027") return null;

  return (
    <div
      className={`w-full select-none ${
        isPrint
          ? "fixed bottom-0 left-0 right-0 w-full z-50 print:block"
          : "mt-8 w-full"
      }`}
    >
      <img
        src={KOP_FOOTER_2027_DATA_URL}
        alt="Footer Bar TP 2027/2028 SMK Bayt Al-Hikmah"
        className="w-full h-auto object-fill max-h-7"
      />
    </div>
  );
};
