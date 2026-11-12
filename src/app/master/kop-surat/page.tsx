"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppData } from "@/context/AppDataContext";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import {
  Upload,
  RotateCcw,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  PenTool,
  Stamp,
  Save,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  LOGO_YAYASAN_DATA_URL,
  LOGO_SMK_CIRCULAR_DATA_URL,
  STEMPEL_SEKOLAH_DATA_URL,
  TTD_KEPSEK_DATA_URL,
} from "@/lib/seedData";

export default function MasterKopSuratPage() {
  const { schoolSettings, updateSchoolSettings, resetSchoolSettings, addToast } = useAppData();

  const [logoYayasan, setLogoYayasan] = useState(schoolSettings.logoYayasanUrl);
  const [logoSmk, setLogoSmk] = useState(schoolSettings.logoSmkUrl);
  const [ttdKepsek, setTtdKepsek] = useState(schoolSettings.ttdKepsekUrl);
  const [stempel, setStempel] = useState(schoolSettings.stempelUrl);
  const [namaKepsek, setNamaKepsek] = useState(schoolSettings.namaKepsek || "Mokhamat Ekhsan, S.Kom");
  const [niyKepsek, setNiyKepsek] = useState(schoolSettings.niyKepsek || "14215094");

  // Keep state in sync if schoolSettings loads from storage/cloud
  useEffect(() => {
    if (schoolSettings) {
      if (schoolSettings.logoYayasanUrl) setLogoYayasan(schoolSettings.logoYayasanUrl);
      if (schoolSettings.logoSmkUrl) setLogoSmk(schoolSettings.logoSmkUrl);
      if (schoolSettings.ttdKepsekUrl) setTtdKepsek(schoolSettings.ttdKepsekUrl);
      if (schoolSettings.stempelUrl) setStempel(schoolSettings.stempelUrl);
      if (schoolSettings.namaKepsek) setNamaKepsek(schoolSettings.namaKepsek);
      if (schoolSettings.niyKepsek) setNiyKepsek(schoolSettings.niyKepsek);
    }
  }, [schoolSettings]);

  const fileInputYayasan = useRef<HTMLInputElement>(null);
  const fileInputSmk = useRef<HTMLInputElement>(null);
  const fileInputTtd = useRef<HTMLInputElement>(null);
  const fileInputStempel = useRef<HTMLInputElement>(null);

  // Helper to handle file to data URL
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("error", "Ukuran File Terlalu Besar", "Maksimal ukuran file adalah 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setter(result);
      addToast("info", `${label} Dipilih`, "Jangan lupa klik 'Simpan Perubahan' di bawah.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = () => {
    updateSchoolSettings({
      logoYayasanUrl: logoYayasan,
      logoSmkUrl: logoSmk,
      ttdKepsekUrl: ttdKepsek,
      stempelUrl: stempel,
      namaKepsek,
      niyKepsek,
    });
  };

  const handleReset = () => {
    if (window.confirm("Kembalikan semua logo, stempel, dan tanda tangan ke format baku resmi bawaan?")) {
      resetSchoolSettings();
      setLogoYayasan(LOGO_YAYASAN_DATA_URL);
      setLogoSmk(LOGO_SMK_CIRCULAR_DATA_URL);
      setTtdKepsek(TTD_KEPSEK_DATA_URL);
      setStempel(STEMPEL_SEKOLAH_DATA_URL);
      setNamaKepsek("Mokhamat Ekhsan, S.Kom");
      setNiyKepsek("14215094");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Stamp className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Pengaturan Kop Surat, Logo, Stempel & Tanda Tangan
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Kelola berkas resmi logo sekolah/yayasan, stempel cap basah digital, serta TTD digital Kepala Sekolah.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Format Baku
          </button>
          <button
            onClick={handleSaveAll}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* Grid of 4 Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Logo Yayasan (Kiri) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-900">Logo Yayasan (Kiri)</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                Kop Kiri
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Logo Yayasan Pondok Pesantren Bayt Al-Hikmah Pasuruan (posisi kiri kop).
            </p>

            <div className="w-full h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-3">
              <img
                src={logoYayasan}
                alt="Pratinjau Logo Yayasan"
                className="max-h-24 max-w-full object-contain drop-shadow-sm"
              />
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputYayasan}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setLogoYayasan, "Logo Yayasan")}
            />
            <button
              type="button"
              onClick={() => fileInputYayasan.current?.click()}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Logo Baru
            </button>
          </div>
        </div>

        {/* Card 2: Logo SMK (Kanan) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-900">Logo SMK (Kanan)</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                Kop Kanan
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Logo resmi lingkaran SMK Bayt Al-Hikmah Pasuruan (posisi kanan kop).
            </p>

            <div className="w-full h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-3">
              <img
                src={logoSmk}
                alt="Pratinjau Logo SMK"
                className="max-h-24 max-w-full object-contain drop-shadow-sm"
              />
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputSmk}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setLogoSmk, "Logo SMK")}
            />
            <button
              type="button"
              onClick={() => fileInputSmk.current?.click()}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Logo Baru
            </button>
          </div>
        </div>

        {/* Card 3: Tanda Tangan Digital Kepala Sekolah */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-900">Tanda Tangan Digital</h3>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-2 py-0.5 rounded">
                Kepala Sekolah
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Goresan tanda tangan digital (format PNG transparan dianjurkan).
            </p>

            <div className="w-full h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-3 relative">
              <img
                src={ttdKepsek}
                alt="Pratinjau TTD Kepala Sekolah"
                className="max-h-20 max-w-full object-contain"
              />
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputTtd}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setTtdKepsek, "Tanda Tangan Digital")}
            />
            <button
              type="button"
              onClick={() => fileInputTtd.current?.click()}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload TTD (PNG)
            </button>
          </div>
        </div>

        {/* Card 4: Stempel Resmi Sekolah */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-900">Stempel Cap Basah</h3>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold px-2 py-0.5 rounded">
                Cap Resmi
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Cap stempel ungu resmi SMK Bayt Al-Hikmah (format PNG transparan).
            </p>

            <div className="w-full h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-3">
              <img
                src={stempel}
                alt="Pratinjau Stempel Sekolah"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputStempel}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setStempel, "Stempel Resmi")}
            />
            <button
              type="button"
              onClick={() => fileInputStempel.current?.click()}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Stempel (PNG)
            </button>
          </div>
        </div>
      </div>

      {/* Profile Pejabat Penandatangan Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <ShieldCheck className="w-5 h-5 text-brand-700" />
          <h2 className="text-sm font-bold text-gray-900">
            Data Pejabat Penandatangan Surat (Kepala Sekolah)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nama Lengkap & Gelar Kepala Sekolah:
            </label>
            <input
              type="text"
              value={namaKepsek}
              onChange={(e) => setNamaKepsek(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500"
              placeholder="Contoh: Mokhamat Ekhsan, S.Kom"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              NIY (Nomor Induk Yayasan) Kepala Sekolah:
            </label>
            <input
              type="text"
              value={niyKepsek}
              onChange={(e) => setNiyKepsek(e.target.value)}
              className="w-full text-xs font-mono font-semibold rounded-xl border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500"
              placeholder="Contoh: 14215094"
            />
          </div>
        </div>
      </div>

      {/* Live Preview Paper: Surat Resmi with Times New Roman */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-800" />
            <h2 className="text-sm font-bold text-gray-900">
              Pratinjau Langsung (Live Preview) Surat Dinas
            </h2>
          </div>
          <span className="text-[11px] bg-brand-50 text-brand-800 border border-brand-200 font-semibold px-2.5 py-0.5 rounded-full">
            Font: Times New Roman
          </span>
        </div>

        {/* Paper Simulation */}
        <div
          className="max-w-3xl mx-auto bg-white border border-gray-300 rounded-xl p-6 sm:p-10 shadow-xs surat-resmi text-gray-900 text-xs sm:text-[13px] leading-relaxed"
          style={{ fontFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", Georgia, serif' }}
        >
          {/* Kop with custom logos */}
          <OfficialKopSurat logoYayasanOverride={logoYayasan} logoSmkOverride={logoSmk} />

          {/* Metadata sample */}
          <div className="mb-4">
            <table className="border-collapse">
              <tbody>
                <tr>
                  <td className="w-20 py-0.5">Nomor</td>
                  <td className="w-3 py-0.5">:</td>
                  <td className="py-0.5 font-medium">012/SMK-BAYHI/XI/2026</td>
                </tr>
                <tr>
                  <td className="py-0.5">Lampiran</td>
                  <td className="py-0.5">:</td>
                  <td className="py-0.5">-</td>
                </tr>
                <tr>
                  <td className="py-0.5">Perihal</td>
                  <td className="py-0.5">:</td>
                  <td className="py-0.5 font-bold">Undangan Koordinasi Peningkatan Mutu Vokasi</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-4">
            <p>Kepada Yth.</p>
            <p className="font-bold">Bapak/Ibu Pimpinan Dunia Usaha & Industri (DUDI)</p>
            <p>Di tempat</p>
          </div>

          <div className="space-y-2 text-justify mb-8 text-xs sm:text-[12.5px]">
            <p className="italic font-bold">Assalamu’alaikum Warahmatullahi Wabarakatuh,</p>
            <p>
              Dengan hormat kami sampaikan bahwa dalam rangka memperkuat sinergi antara SMK Bayt Al-Hikmah
              dengan mitra industri dan penyelarasan kurikulum berbasis Teaching Factory, kami mengundang
              Bapak/Ibu untuk hadir pada rapat koordinasi resmi sekolah.
            </p>
            <p className="italic">
              Demikian surat ini kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.
            </p>
            <p className="italic font-bold">Wassalamu’alaikum Warahmatullahi Wabarakatuh.</p>
          </div>

          {/* Signature & Seal Block Live Preview */}
          <div className="flex justify-end mt-6">
            <div className="text-left w-64">
              <p>Pasuruan, 11 November 2026</p>
              <p className="font-bold">Kepala SMK Bayt Al-Hikmah</p>

              <div className="relative h-24 my-1 flex items-center justify-start">
                {/* Stamp preview (Ukuran besar sesuai Gambar 2) */}
                <div className="absolute -left-10 -top-9 pointer-events-none opacity-90 z-0">
                  <img
                    src={stempel}
                    alt="Stempel"
                    className="w-44 h-44 object-contain mix-blend-multiply"
                  />
                </div>

                {/* Signature preview (Ukuran proporsional sesuai Gambar 2) */}
                <div className="relative z-10 left-11 -top-2">
                  <img
                    src={ttdKepsek}
                    alt="TTD"
                    className="h-28 object-contain mix-blend-multiply"
                  />
                </div>
              </div>

              <p className="font-bold underline text-sm tracking-wide relative z-20">
                {namaKepsek}
              </p>
              <p className="text-xs text-gray-800 mt-0.5 relative z-20">
                NIY. {niyKepsek}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Terapkan & Simpan Seluruh Aset Surat
          </button>
        </div>
      </div>
    </div>
  );
}
