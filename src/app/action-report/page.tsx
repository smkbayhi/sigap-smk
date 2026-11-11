"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatIndonesianDate,
  formatRupiah,
  getStatusKetercapaianBadge,
  getBidangLabel,
  getBidangBadgeColor,
} from "@/lib/utils";
import { StatusKetercapaian, ActionPlan } from "@/lib/database.types";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  FileText,
  Save,
  X,
  Target,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function ActionReportPage() {
  const { currentUser, isKepsek, isTU, isKasubag } = useAuth();
  const { actionPlans, actionReports, addActionReport } = useAppData();

  const [selectedBulan, setSelectedBulan] = useState("November 2026");
  const [reportingPlan, setReportingPlan] = useState<ActionPlan | null>(null);

  // Form states for reporting
  const [statusKetercapaian, setStatusKetercapaian] = useState<StatusKetercapaian>("selesai");
  const [persentase, setPersentase] = useState(100);
  const [keteranganRealisasi, setKeteranganRealisasi] = useState("");
  const [lampiranFileName, setLampiranFileName] = useState("Laporan_Realisasi_Kegiatan.pdf");
  const [lampiranFileSize, setLampiranFileSize] = useState("2.4 MB");

  // Plans of the selected month
  const plans = actionPlans.filter(
    (p) => p.bulan_pelaksanaan.toLowerCase() === selectedBulan.toLowerCase()
  );

  const openReportModal = (plan: ActionPlan) => {
    setReportingPlan(plan);
    const existing = actionReports.find((r) => r.action_plan_id === plan.id);
    if (existing) {
      setStatusKetercapaian(existing.status_ketercapaian);
      setPersentase(existing.persentase);
      setKeteranganRealisasi(existing.keterangan_realisasi);
      setLampiranFileName(existing.lampiran_file_name || "Laporan_Realisasi_Kegiatan.pdf");
      setLampiranFileSize(existing.lampiran_file_size || "2.4 MB");
    } else {
      setStatusKetercapaian("selesai");
      setPersentase(100);
      setKeteranganRealisasi("");
      setLampiranFileName("Laporan_Realisasi_Kegiatan.pdf");
      setLampiranFileSize("2.4 MB");
    }
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPlan) return;
    if (!keteranganRealisasi.trim()) {
      alert("Harap masukkan keterangan realisasi / evaluasi kegiatan!");
      return;
    }

    addActionReport({
      action_plan_id: reportingPlan.id,
      user_id: currentUser.id,
      tanggal_lapor: new Date().toISOString().split("T")[0],
      status_ketercapaian: statusKetercapaian,
      persentase: Number(persentase) || 0,
      keterangan_realisasi: keteranganRealisasi.trim(),
      lampiran_file_name: lampiranFileName,
      lampiran_file_url: "#",
      lampiran_file_size: lampiranFileSize,
    });

    setReportingPlan(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLampiranFileName(file.name);
      setLampiranFileSize((file.size / (1024 * 1024)).toFixed(1) + " MB");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Action Report & Evaluasi Ketercapaian Bulanan
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pelaporan progres pelaksanaan rencana aksi, persentase ketercapaian, dan unggah berkas bukti laporan (.docx, .pdf, .xlsx).
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
          <span className="text-xs text-gray-500 font-semibold">Bulan:</span>
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="text-xs font-bold text-brand-900 bg-transparent border-none focus:ring-0 cursor-pointer"
          >
            <option value="November 2026">November 2026</option>
            <option value="Desember 2026">Desember 2026</option>
            <option value="Januari 2027">Januari 2027</option>
            <option value="Februari 2027">Februari 2027</option>
          </select>
        </div>
      </div>

      {/* Table of Action Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Kegiatan & Bidang</th>
                <th className="py-3 px-4">Waktu & Sasaran</th>
                <th className="py-3 px-4">Status & Progres</th>
                <th className="py-3 px-4">Realisasi & Bukti Laporan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Belum ada action plan pada bulan {selectedBulan}. Silakan buat di{" "}
                    <Link href="/action-plan" className="text-brand-700 underline font-bold">
                      Menu Action Plan
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const report = actionReports.find((r) => r.action_plan_id === plan.id);
                  const badge = report
                    ? getStatusKetercapaianBadge(report.status_ketercapaian)
                    : { label: "Belum Dilaporkan", color: "bg-gray-100 text-gray-600 border-gray-200" };

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Kegiatan & Bidang */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBidangBadgeColor(
                            plan.bidang
                          )}`}
                        >
                          {getBidangLabel(plan.bidang)}
                        </span>
                        <h4 className="font-bold text-gray-900 mt-1 leading-snug">
                          {plan.nama_kegiatan}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Anggaran: <strong>{formatRupiah(plan.estimasi_anggaran)}</strong>
                        </p>
                      </td>

                      {/* Waktu & Sasaran */}
                      <td className="py-3.5 px-4 align-top text-gray-700">
                        <p className="font-semibold">{plan.waktu_pelaksanaan}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Sasaran: {plan.sasaran}
                        </p>
                      </td>

                      {/* Status & Progres */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>

                        {report && (
                          <div className="mt-2 w-32">
                            <div className="flex justify-between text-[10px] font-bold text-gray-700 mb-1">
                              <span>Ketercapaian</span>
                              <span>{report.persentase}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-1.5 rounded-full"
                                style={{ width: `${report.persentase}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Realisasi & Bukti Laporan */}
                      <td className="py-3.5 px-4 align-top max-w-sm text-gray-700">
                        {report ? (
                          <div className="space-y-1.5">
                            <p className="line-clamp-2 text-gray-800">{report.keterangan_realisasi}</p>
                            {report.lampiran_file_name && (
                              <div className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-semibold transition-colors">
                                <FileText className="w-3.5 h-3.5 text-brand-700" />
                                <span>{report.lampiran_file_name}</span>
                                <span className="text-gray-400">({report.lampiran_file_size})</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">
                            Menunggu pengisian laporan evaluasi dari Kasubag.
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => openReportModal(plan)}
                          className="px-3.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          {report ? "Update Laporan" : "Laporkan / Update"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL LAPORAN / UPDATE ACTION REPORT */}
      {reportingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-emerald-900/20 animate-in fade-in-50 zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Formulir Laporan & Evaluasi Kegiatan Bulanan
                </h3>
                <p className="text-[11px] text-emerald-200 line-clamp-1 mt-0.5">
                  {reportingPlan.nama_kegiatan}
                </p>
              </div>
              <button
                onClick={() => setReportingPlan(null)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSaveReport} className="p-6 space-y-4 text-xs">
              {/* Status Ketercapaian */}
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Status Ketercapaian <span className="text-rose-500">*</span>:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusKetercapaian("selesai");
                      setPersentase(100);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      statusKetercapaian === "selesai"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Selesai 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusKetercapaian("dalam_proses");
                      setPersentase(60);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      statusKetercapaian === "dalam_proses"
                        ? "bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Dalam Proses
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusKetercapaian("tertunda");
                      setPersentase(20);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      statusKetercapaian === "tertunda"
                        ? "bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-500/20"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Tertunda
                  </button>
                </div>
              </div>

              {/* Slider / Persentase */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-700">Persentase Realisasi (%):</label>
                  <span className="font-mono font-bold text-brand-900">{persentase}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={persentase}
                  onChange={(e) => setPersentase(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-700"
                />
              </div>

              {/* Keterangan Realisasi / Evaluasi */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Keterangan Realisasi / Evaluasi Hasil Kegiatan <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={4}
                  required
                  value={keteranganRealisasi}
                  onChange={(e) => setKeteranganRealisasi(e.target.value)}
                  placeholder="Uraikan output kegiatan, kendala yang dihadapi, atau langkah tindak lanjut..."
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 leading-relaxed focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Upload Bukti Dokumen */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Upload File Lampiran Laporan (Maks. 10MB):
                </label>
                <div className="border border-dashed border-gray-300 hover:border-brand-500 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                  <input
                    type="file"
                    id="lampiran-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="lampiran-upload"
                    className="cursor-pointer flex items-center gap-2 text-brand-700 font-bold hover:underline"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Pilih Dokumen (.docx, .doc, .pdf, .xls, .xlsx)
                  </label>
                  {lampiranFileName && (
                    <span className="text-[11px] text-gray-600 truncate max-w-xs">
                      {lampiranFileName} ({lampiranFileSize})
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReportingPlan(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Laporan Evaluasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
