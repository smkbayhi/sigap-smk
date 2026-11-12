"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePresensi } from "@/context/PresensiContext";
import { useAppData } from "@/context/AppDataContext";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { Printer, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function PrintPresensiPage() {
  const { currentReport } = usePresensi();
  const { schoolSettings } = useAppData();

  useEffect(() => {
    // Automatically trigger print dialog after page renders
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const namaKepsek = schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom";
  const niyKepsek = schoolSettings?.niyKepsek || "14215094";
  const ttdKepsek = schoolSettings?.ttdKepsekUrl;
  const stempel = schoolSettings?.stempelUrl;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-gray-900">
      {/* Top Floating Print Bar (Hidden on print) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
        <Link
          href="/presensi"
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Presensi</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Sekarang</span>
        </button>
      </div>

      {/* A4 Paper Document Container */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-12 shadow-lg print:shadow-none print:p-0 rounded-xl print:rounded-none">
        {/* Official Kop Surat */}
        <OfficialKopSurat />

        {/* Document Title */}
        <div className="text-center my-6">
          <h2 className="text-sm font-black uppercase tracking-wider underline">
            REKAPITULASI PRESENSI & EVALUASI KEDISIPLINAN GURU
          </h2>
          <p className="text-xs font-bold text-gray-700 mt-1">
            PERIODE: {currentReport.rentangTanggal.toUpperCase()}
          </p>
        </div>

        {/* Main Table */}
        <div className="mb-6">
          <table className="w-full text-left text-[10px] border border-black border-collapse">
            <thead>
              <tr className="bg-gray-100 font-bold text-center border-b border-black">
                <th className="border border-black p-1.5 w-7">NO</th>
                <th className="border border-black p-1.5 text-left">NAMA GURU & PEGAWAI</th>
                <th className="border border-black p-1.5 w-12">HARI KERJA</th>
                <th className="border border-black p-1.5 w-10">HADIR</th>
                <th className="border border-black p-1.5 w-14">TERLAMBAT (HARI)</th>
                <th className="border border-black p-1.5 w-14">TOTAL TELAT</th>
                <th className="border border-black p-1.5 w-14">% TELAT</th>
                <th className="border border-black p-1.5 w-16">STATUS KKM</th>
                <th className="border border-black p-1.5 w-8">IZIN</th>
                <th className="border border-black p-1.5 w-8">SAKIT</th>
                <th className="border border-black p-1.5 w-8">ALPHA</th>
              </tr>
            </thead>
            <tbody>
              {currentReport.teachers.map((t, idx) => {
                const isTidakKkm = t.statusKkm === "TIDAK KKM";
                return (
                  <tr
                    key={t.id}
                    className={`border-b border-black ${
                      isTidakKkm ? "bg-red-50/50 font-bold" : ""
                    }`}
                  >
                    <td className="border border-black p-1 text-center">{idx + 1}</td>
                    <td className="border border-black p-1 font-semibold">{t.nama}</td>
                    <td className="border border-black p-1 text-center">{t.totalHariKerja}</td>
                    <td className="border border-black p-1 text-center font-bold">{t.totalHadir}</td>
                    <td className="border border-black p-1 text-center">{t.totalTerlambatHari}</td>
                    <td className="border border-black p-1 text-center font-mono">
                      {t.totalMenitTerlambat > 0 ? `${t.totalMenitTerlambat} m` : "-"}
                    </td>
                    <td className="border border-black p-1 text-center font-bold">
                      {t.persentaseTerlambat}%
                    </td>
                    <td
                      className={`border border-black p-1 text-center font-black ${
                        isTidakKkm ? "text-red-700" : ""
                      }`}
                    >
                      {t.statusKkm}
                    </td>
                    <td className="border border-black p-1 text-center">{t.totalIzin || "-"}</td>
                    <td className="border border-black p-1 text-center">{t.totalSakit || "-"}</td>
                    <td className="border border-black p-1 text-center">{t.totalAlpha || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Catatan / Keterangan KKM */}
        <div className="mb-8 p-3 border border-gray-300 rounded-lg text-[10px] space-y-1">
          <p className="font-bold text-gray-800">Keterangan Standar Kedisiplinan Yayasan & Sekolah:</p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-600">
            <li>
              Ambang Batas KKM (Kriteria Ketuntasan Minimal): Persentase keterlambatan jam kerja{" "}
              <strong>&lt; 50%</strong>.
            </li>
            <li>
              Guru dengan persentase keterlambatan <strong>$\ge 50.0\%$ (TIDAK KKM)</strong> diberikan
              surat pembinaan ketaatan jam kerja oleh pihak manajemen sekolah dan Kepala Tata Usaha.
            </li>
          </ul>
        </div>

        {/* Signature Area */}
        <div className="flex items-start justify-between text-xs pt-4">
          {/* Left: Kepala Sekolah */}
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala SMK Bayt Al-Hikmah</p>

            {/* Signature & Stamp Overlay */}
            <div className="relative h-24 my-1 flex items-center justify-center">
              {stempel && (
                <img
                  src={stempel}
                  alt="Stempel Sekolah"
                  className="absolute w-24 h-24 object-contain opacity-80 -left-2 pointer-events-none"
                />
              )}
              {ttdKepsek && (
                <img
                  src={ttdKepsek}
                  alt="TTD Kepala Sekolah"
                  className="h-20 max-w-full object-contain relative z-10"
                />
              )}
            </div>

            <p className="font-bold underline text-xs">{namaKepsek}</p>
            <p className="text-[10px] text-gray-600">NIY. {niyKepsek}</p>
          </div>

          {/* Right: Kepala Tata Usaha */}
          <div className="text-center w-64">
            <p>Pasuruan, {todayStr}</p>
            <p className="font-bold">Kepala Tata Usaha</p>

            <div className="h-24 my-1 flex items-center justify-center">
              {/* Space for manual or digital signature */}
            </div>

            <p className="font-bold underline text-xs">Ainiyatul Fitriyah, S.S</p>
            <p className="text-[10px] text-gray-600">NIY. 11861027</p>
          </div>
        </div>
      </div>
    </div>
  );
}
