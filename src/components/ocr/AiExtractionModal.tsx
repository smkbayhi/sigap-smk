"use client";

import React, { useState } from "react";
import { Sparkles, Scan, FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { TingkatUrgensi, BidangStruktural } from "@/lib/database.types";

interface ExtractedData {
  nomor_surat: string;
  pengirim: string;
  tanggal_surat: string;
  perihal: string;
  ringkasan: string;
  tingkat_urgensi: TingkatUrgensi;
  saran_bidang: BidangStruktural;
  saran_penerima: string;
  confidence_score: number;
  key_points: string[];
}

interface AiExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: ExtractedData) => void;
}

const SAMPLE_SCAN_PRESETS: {
  title: string;
  sender: string;
  data: ExtractedData;
}[] = [
  {
    title: "Surat Undangan Dindik Jatim - Rapat SMK Pusat Keunggulan",
    sender: "Dinas Pendidikan Provinsi Jawa Timur",
    data: {
      nomor_surat: "421.5/9012/101.4/2026",
      pengirim: "Dinas Pendidikan Provinsi Jawa Timur - Bidang Pembinaan SMK",
      tanggal_surat: "2026-11-10",
      perihal: "Undangan Sinkronisasi Bantuan Penguatan Pembelajaran Berbasis Industri (SMK-PK)",
      ringkasan:
        "Dinas Pendidikan Provinsi Jawa Timur mengundang Tim Manajemen SMK Bayt Al-Hikmah untuk memaparkan kurikulum berbasis industri dan laporan penyerapan anggaran program vokasi tahun berjalan.",
      tingkat_urgensi: "segera",
      saran_bidang: "kurikulum",
      saran_penerima: "M. Ridwan, S.T., M.Kom. (Kasubag Kurikulum)",
      confidence_score: 98,
      key_points: [
        "Membawa dokumen Kurikulum Operasional Satuan Pendidikan (KOSP)",
        "Konfirmasi kehadiran paling lambat 16 November 2026",
        "Disertai draf kerjasama mitra DUDI aktif",
      ],
    },
  },
  {
    title: "Surat Penawaran Kemitraan PT Astra Honda Motor",
    sender: "PT Astra Honda Motor (AHM) Regional Jatim",
    data: {
      nomor_surat: "AHM/CSR-VOK/11/2026-088",
      pengirim: "PT Astra Honda Motor (AHM) - Divisi Vokasi & Kemitraan",
      tanggal_surat: "2026-11-09",
      perihal: "Penawaran Donasi Unit Praktik Engine Injection & Seleksi Magang Guru",
      ringkasan:
        "Pemberitahuan program hibah fasilitas teaching factory berupa 2 unit mesin motor injeksi dan program upskilling magang industri guru vokasi selama 1 bulan di pabrik AHM.",
      tingkat_urgensi: "penting",
      saran_bidang: "humas_bkk",
      saran_penerima: "Nabila Zahra, M.Si. (Kasubag Humas & BKK)",
      confidence_score: 96,
      key_points: [
        "Hibah 2 unit modul transmisi & injeksi",
        "Kuato magang 2 guru kejuruan",
        "Tindak lanjut penandatanganan addendum MoU",
      ],
    },
  },
  {
    title: "Surat Pengajuan Sarana Laboratorium TIK dari Kemenkomdigi",
    sender: "Kementerian Komunikasi dan Digital RI",
    data: {
      nomor_surat: "KOMDIGI/BPSDM/PK/2441/2026",
      pengirim: "Badan Pengembangan SDM Kementerian Komunikasi dan Digital RI",
      tanggal_surat: "2026-11-08",
      perihal: "Sosialisasi Program Bantuan Fiber Optic Network & Cloud Academy Santri",
      ringkasan:
        "Penetapan kuota bantuan server mini cloud dan modem fiber optik terintegrasi bagi laboratorium komputer SMK berbasis pondok pesantren di Kota Pasuruan.",
      tingkat_urgensi: "penting",
      saran_bidang: "sarpras",
      saran_penerima: "Bambang Haryanto, S.T. (Kasubag Sarpras)",
      confidence_score: 95,
      key_points: [
        "Bantuan 1 Rack Server Mini & Bandwidth Dedicated",
        "Diperuntukkan mendukung Lab Kejuruan TJKT & RPL",
        "Perlu persiapan ruang server steril",
      ],
    },
  },
];

export const AiExtractionModal: React.FC<AiExtractionModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [activeData, setActiveData] = useState<ExtractedData>(SAMPLE_SCAN_PRESETS[0].data);

  if (!isOpen) return null;

  const handleStartScan = (presetIdx: number) => {
    setSelectedPresetIndex(presetIdx);
    setActiveData(SAMPLE_SCAN_PRESETS[presetIdx].data);
    setIsScanning(true);
    setScanProgress(10);
    setScanCompleted(false);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanCompleted(true);
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  const handleApply = () => {
    onApplyData(activeData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-emerald-900/20 animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400">
              <Sparkles className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                AI Vision OCR: Ekstraksi Cerdas Surat Masuk
              </h3>
              <p className="text-xs text-emerald-200">
                Pindai teks otomatis & berikan rekomendasi bidang disposisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Pilih Contoh Berkas Masuk untuk Disimulasikan:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SAMPLE_SCAN_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStartScan(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPresetIndex === idx
                      ? "bg-brand-50 border-brand-600 ring-2 ring-brand-500/20 shadow-xs"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-1.5 py-0.5 rounded">
                      Dokumen #{idx + 1}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 line-clamp-1">{preset.title}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{preset.sender}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scanning Progress or Result */}
          {isScanning ? (
            <div className="border border-brand-200 rounded-xl p-8 bg-brand-50/40 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <Scan className="w-12 h-12 text-brand-600 animate-pulse" />
                <div className="absolute inset-0 border-t-2 border-gold-500 animate-bounce" />
              </div>
              <h4 className="font-bold text-sm text-brand-900">
                Memproses Ekstraksi AI & Analisis Dokumen...
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Membaca kop surat, mengekstrak nomor, perihal, dan menentukan rekomendasi bidang disposisi.
              </p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-brand-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-brand-700 mt-2">{scanProgress}% Selesai</span>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-900">
                    Hasil Ekstraksi AI Berhasil Ditemukan
                  </span>
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                  Tingkat Akurasi: {activeData.confidence_score}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block text-[11px]">Nomor Surat:</span>
                  <span className="font-mono font-bold text-brand-900">{activeData.nomor_surat}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Tanggal Dokumen:</span>
                  <span className="font-medium text-gray-800">{activeData.tanggal_surat}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500 block text-[11px]">Pengirim:</span>
                  <span className="font-semibold text-gray-900">{activeData.pengirim}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500 block text-[11px]">Perihal:</span>
                  <span className="font-semibold text-brand-900">{activeData.perihal}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500 block text-[11px]">Ringkasan Isi Surat:</span>
                  <p className="text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200 leading-relaxed text-[11.5px]">
                    {activeData.ringkasan}
                  </p>
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  <span className="text-xs font-bold text-brand-900">
                    Rekomendasi Disposisi Cerdas oleh AI:
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  Disarankan didelegasikan ke:{" "}
                  <strong className="text-brand-900 uppercase font-black">
                    Bidang {activeData.saran_bidang} ({activeData.saran_penerima})
                  </strong>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeData.key_points.map((pt, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-white/90 text-gray-700 border border-amber-200 px-2 py-0.5 rounded-full"
                    >
                      • {pt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isScanning}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-50 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            Terapkan Data ke Form Surat Masuk
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
