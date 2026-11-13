"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { formatIndonesianDate, getUrgensiBadge } from "@/lib/utils";
import {
  Inbox,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Share2,
  Trash2,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { SuratMasuk } from "@/lib/database.types";

export default function SuratMasukPage() {
  const { isTU, isKepsek, currentUser } = useAuth();
  const { suratMasuk, deleteSuratMasuk, disposisi } = useAppData();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgensi, setFilterUrgensi] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("semua");

  const filteredSurat = (suratMasuk || []).filter((item) => {
    const nomor = item.nomor_surat || "";
    const pengirim = item.pengirim || "";
    const perihal = item.perihal || "";

    const matchSearch =
      nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perihal.toLowerCase().includes(searchTerm.toLowerCase());

    const matchUrgensi =
      filterUrgensi === "semua" ? true : item.tingkat_urgensi === filterUrgensi;

    const matchStatus =
      filterStatus === "semua" ? true : item.status_disposisi === filterStatus;

    return matchSearch && matchUrgensi && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Arsip Surat Masuk & Ekstraksi AI
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Penyimpanan scan dokumen dinas, ekstraksi OCR teks otomatis, dan delegasi disposisi cerdas.
          </p>
        </div>

        {(isTU || isKepsek) && (
          <Link
            href="/surat-masuk/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Unggah Dokumen (AI OCR)
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor, pengirim, atau perihal surat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 font-medium">Urgensi:</span>
          {["semua", "segera", "penting", "biasa"].map((urg) => (
            <button
              key={urg}
              onClick={() => setFilterUrgensi(urg)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                filterUrgensi === urg
                  ? "bg-brand-800 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {urg}
            </button>
          ))}

          <span className="text-xs text-gray-400 mx-1">|</span>
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          {["semua", "belum_disposisi", "sudah_disposisi"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === st
                  ? "bg-brand-800 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st === "semua" ? "Semua" : st === "belum_disposisi" ? "Belum Disposisi" : "Sudah Disposisi"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Incoming Letters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSurat.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              Tidak ada arsip surat masuk yang sesuai filter.
            </p>
          </div>
        ) : (
          filteredSurat.map((surat) => {
            const badgeUrgensi = getUrgensiBadge(surat.tingkat_urgensi);
            const activeDisp = (disposisi || []).filter((d) => d.surat_masuk_id === surat.id);
            const myDisp = activeDisp.find(
              (d) =>
                d.penerima_id === currentUser.id ||
                (d.penerima_nama && currentUser.name && d.penerima_nama.toLowerCase().includes(currentUser.name.toLowerCase())) ||
                (currentUser.name && currentUser.name.toLowerCase().includes("nasih") && d.catatan && d.catatan.toLowerCase().includes("nasih"))
            );
            const ai = typeof surat.ai_analysis === "string"
              ? (() => { try { return JSON.parse(surat.ai_analysis); } catch { return null; } })()
              : surat.ai_analysis;

            return (
              <div
                key={surat.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-brand-400 hover:shadow-card-hover p-5 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Urgensi & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeUrgensi.color}`}
                    >
                      {badgeUrgensi.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {myDisp && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          🎯 Disposisi Anda
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          surat.status_disposisi === "sudah_disposisi"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {surat.status_disposisi === "sudah_disposisi"
                          ? "Sudah Didisposisi"
                          : "Belum Didisposisi"}
                      </span>
                    </div>
                  </div>

                  {/* Pengirim & No Surat */}
                  <div className="font-mono text-[11px] font-bold text-brand-900 bg-brand-50/80 px-2 py-0.5 rounded border border-brand-200 inline-block mb-1.5">
                    {surat.nomor_surat || "No. Surat -"}
                  </div>
                  <h3 className="text-xs font-extrabold text-gray-900 line-clamp-2 leading-snug">
                    {surat.perihal || "Tanpa Perihal"}
                  </h3>
                  <p className="text-[11px] text-gray-600 font-medium mt-1">
                    Dari: <strong className="text-gray-900">{surat.pengirim || "-"}</strong>
                  </p>

                  {/* AI Summary snippet */}
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-gray-600 line-clamp-3 leading-relaxed">
                    <span className="font-bold text-gray-800 block text-[10px] uppercase mb-0.5 text-brand-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gold-600" />
                      Ringkasan AI:
                    </span>
                    {surat.ringkasan || "Tidak ada ringkasan teks."}
                  </div>

                  {/* Recommendation pill */}
                  {ai && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-500">
                      <span className="bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.2 rounded">
                        Saran Disposisi: Bidang {(ai.saran_bidang || "").toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Meta & Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Diterima: {formatIndonesianDate(surat.tanggal_diterima)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/surat-masuk/${surat.id}`}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </Link>

                    {(isTU || isKepsek) && (
                      <button
                        onClick={() => {
                          if (window.confirm("Hapus dokumen surat masuk ini?")) {
                            deleteSuratMasuk(surat.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Surat Masuk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
