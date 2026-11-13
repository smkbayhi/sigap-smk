"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatIndonesianDate,
  getStatusSuratKeluarBadge,
  getJenisSuratKeluarLabel,
} from "@/lib/utils";
import {
  Send,
  PlusCircle,
  Search,
  Filter,
  Eye,
  PenTool,
  Printer,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { DigitalSignatureModal } from "@/components/signature/DigitalSignatureModal";
import { SuratKeluar, StatusSuratKeluar } from "@/lib/database.types";

export default function SuratKeluarPage() {
  const { currentUser, isKepsek, isTU } = useAuth();
  const {
    suratKeluar,
    approveSuratKeluar,
    rejectSuratKeluar,
    deleteSuratKeluar,
  } = useAppData();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [selectedSuratForSignature, setSelectedSuratForSignature] = useState<SuratKeluar | null>(null);

  const filteredSurat = suratKeluar.filter((item) => {
    const matchSearch =
      item.nomor_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tujuan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === "semua" ? true : item.status === filterStatus;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Modul Surat Keluar & Digital Signature
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Penomoran otomatis format baku <code>[No]/SMK-BAH/[Bulan]/[Tahun]</code>, draf TU, dan pembubuhan TTD digital Kepala Sekolah.
          </p>
        </div>

        {(isTU || isKepsek) && (
          <Link
            href="/surat-keluar/buat"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Draf Surat Baru
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor surat, perihal, atau tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          {[
            { key: "semua", label: "Semua" },
            { key: "menunggu_persetujuan", label: "Menunggu TTD" },
            { key: "disetujui", label: "Disetujui" },
            { key: "draft", label: "Draf" },
            { key: "ditolak", label: "Revisi" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filterStatus === tab.key
                  ? "bg-brand-800 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">No. Surat & Jenis</th>
                <th className="py-3.5 px-4">Perihal & Tujuan</th>
                <th className="py-3.5 px-4">Tanggal Surat</th>
                <th className="py-3.5 px-4">Status & Pengesahan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSurat.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    Tidak ada surat keluar yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredSurat.map((surat) => {
                  const badge = getStatusSuratKeluarBadge(surat.status);
                  return (
                    <tr key={surat.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nomor Surat & Jenis */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 inline-block">
                          {surat.nomor_surat}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 capitalize font-medium">
                          {getJenisSuratKeluarLabel(surat.jenis_surat)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Oleh: {surat.creator_name || "Tata Usaha"}
                        </div>
                      </td>

                      {/* Perihal & Tujuan */}
                      <td className="py-3.5 px-4 align-top max-w-sm">
                        <p className="font-bold text-gray-900 leading-snug">{surat.perihal}</p>
                        <p className="text-[11px] text-gray-600 mt-1">
                          Kepada Yth. <strong className="text-gray-800">{surat.tujuan}</strong>
                        </p>
                        {surat.catatan_revisi && (
                          <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800">
                            <strong>Catatan Revisi Kepsek:</strong> {surat.catatan_revisi}
                          </div>
                        )}
                      </td>

                      {/* Tanggal Surat */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-gray-700">
                        {formatIndonesianDate(surat.tanggal_surat)}
                      </td>

                      {/* Status & Pengesahan */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {surat.has_ttd && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>TTD & Stempel Sah</span>
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pratinjau Detail */}
                          <Link
                            href={`/surat-keluar/${surat.id}`}
                            className="p-1.5 text-gray-600 hover:text-brand-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Pratinjau Surat"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Print / Cetak Langsung */}
                          <Link
                            href={`/surat-keluar/${surat.id}/print`}
                            target="_blank"
                            className="p-1.5 text-gray-600 hover:text-brand-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Cetak Dokumen Resmi (PDF)"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>

                          {/* TTD Button (Kepala Sekolah) */}
                          {isKepsek && surat.status === "menunggu_persetujuan" && (
                            <button
                              onClick={() => setSelectedSuratForSignature(surat)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-lg flex items-center gap-1 shadow-xs transition-all"
                              title="Tanda Tangani Sekarang"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              TTD
                            </button>
                          )}

                          {/* Delete Button (TU/Admin) */}
                          {(isTU || isKepsek) && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus surat ${surat.nomor_surat}?`)) {
                                  deleteSuratKeluar(surat.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Surat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Modal */}
      {selectedSuratForSignature && (
        <DigitalSignatureModal
          surat={selectedSuratForSignature}
          isOpen={Boolean(selectedSuratForSignature)}
          onClose={() => setSelectedSuratForSignature(null)}
          onApprove={(id, opts) => approveSuratKeluar(id, currentUser.name, opts)}
          onReject={(id, notes) => rejectSuratKeluar(id, notes)}
          kepsekName={currentUser.name}
        />
      )}
    </div>
  );
}
