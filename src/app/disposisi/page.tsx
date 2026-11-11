"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatIndonesianDate,
  getStatusDisposisiBadge,
  getUrgensiBadge,
  createWhatsAppDispositionLink,
} from "@/lib/utils";
import {
  Share2,
  Search,
  Filter,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ExternalLink,
} from "lucide-react";
import { StatusDisposisi } from "@/lib/database.types";

export default function DisposisiPage() {
  const { currentUser, users, isKepsek, isTU } = useAuth();
  const { disposisi, suratMasuk, updateDisposisiStatus } = useAppData();

  const [tabFilter, setTabFilter] = useState<"semua" | "saya">("semua");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDisposisi = disposisi.filter((disp) => {
    const surat = suratMasuk.find((s) => s.id === disp.surat_masuk_id);

    // Tab filter: all vs assigned to me
    if (tabFilter === "saya" && disp.penerima_id !== currentUser.id) {
      return false;
    }

    // Status filter
    if (statusFilter !== "semua" && disp.status !== statusFilter) {
      return false;
    }

    // Search term
    const match =
      disp.penerima_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disp.instruksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (surat && surat.perihal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (surat && surat.nomor_surat.toLowerCase().includes(searchTerm.toLowerCase()));

    return match;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Pelacakan Disposisi & Delegasi Cerdas
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pantau tindak lanjut surat masuk, pengiriman notifikasi WhatsApp otomatis, dan status penyelesaian tugas staf.
          </p>
        </div>

        {/* Tab Switcher: Semua vs Tugas Saya */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTabFilter("semua")}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              tabFilter === "semua"
                ? "bg-white text-brand-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Semua Disposisi ({disposisi.length})
          </button>
          <button
            onClick={() => setTabFilter("saya")}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              tabFilter === "saya"
                ? "bg-white text-brand-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tugas Saya ({disposisi.filter((d) => d.penerima_id === currentUser.id).length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari penerima, instruksi, atau surat..."
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
            { key: "menunggu", label: "Menunggu" },
            { key: "proses", label: "Sedang Diproses" },
            { key: "selesai", label: "Selesai" },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === st.key
                  ? "bg-brand-800 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dispositions List Cards */}
      <div className="space-y-4">
        {filteredDisposisi.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-gray-400">
            <Share2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              Tidak ada data disposisi yang cocok dengan pencarian / filter.
            </p>
          </div>
        ) : (
          filteredDisposisi.map((disp) => {
            const surat = suratMasuk.find((s) => s.id === disp.surat_masuk_id);
            const statusBadge = getStatusDisposisiBadge(disp.status);
            const urgensiBadge = getUrgensiBadge(disp.sifat);
            const targetUser = users.find((u) => u.id === disp.penerima_id);

            const waUrl = createWhatsAppDispositionLink({
              phone: targetUser?.phone || "6281234567890",
              penerimaNama: disp.penerima_nama,
              nomorSurat: surat?.nomor_surat || "-",
              pengirim: surat?.pengirim || "-",
              perihal: surat?.perihal || "-",
              instruksi: disp.instruksi,
              catatan: disp.catatan,
              deadline: disp.deadline,
              disposisiId: disp.id,
            });

            return (
              <div
                key={disp.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-brand-400 hover:shadow-card p-5 sm:p-6 transition-all space-y-4"
              >
                {/* Header Row: Target User, Urgensi, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-800 text-white font-bold text-xs flex items-center justify-center border border-gold-400">
                      {disp.penerima_nama.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {disp.penerima_nama}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgensiBadge.color}`}
                        >
                          Sifat: {urgensiBadge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Pemberi Disposisi: <strong>{disp.pemberi_nama}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold border ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Surat Referensi */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono font-bold text-brand-900">
                      Surat No: {surat?.nomor_surat || "Tidak diketahui"}
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Pengirim: {surat?.pengirim}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900">{surat?.perihal}</p>
                </div>

                {/* Instruksi & Catatan */}
                <div className="space-y-1 text-xs">
                  <p className="text-gray-800 font-semibold">
                    Instruksi Kepala Sekolah:{" "}
                    <span className="font-normal text-gray-700">"{disp.instruksi}"</span>
                  </p>
                  {disp.catatan && (
                    <p className="text-gray-600 text-[11px] italic">
                      Catatan: {disp.catatan}
                    </p>
                  )}
                  <p className="text-rose-700 font-bold text-[11px] pt-1">
                    Batas Waktu (Deadline): {formatIndonesianDate(disp.deadline)}
                  </p>
                </div>

                {/* Tanggapan if any */}
                {disp.tanggapan && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950">
                    <span className="font-bold block mb-0.5">Tanggapan / Laporan Tindak Lanjut:</span>
                    <p>{disp.tanggapan}</p>
                    {disp.tanggal_selesai && (
                      <span className="text-[10px] text-emerald-700 mt-1 block">
                        Diselesaikan pada: {formatIndonesianDate(disp.tanggal_selesai)}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                  <div className="text-[11px] text-gray-400">
                    Diterbitkan pada: {formatIndonesianDate(disp.created_at)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* WhatsApp notification button */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Kirim detail disposisi via WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Kirim Disposisi ke WhatsApp
                    </a>

                    {/* Quick status change buttons for the assigned recipient */}
                    {disp.status !== "selesai" && (
                      <>
                        {disp.status === "menunggu" && (
                          <button
                            onClick={() => updateDisposisiStatus(disp.id, "proses")}
                            className="px-3 py-1.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-300 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Tandai Sedang Diproses
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const note = prompt("Masukkan laporan / tanggapan penyelesaian:", disp.tanggapan || "");
                            if (note !== null) {
                              updateDisposisiStatus(disp.id, "selesai", note);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-brand-700 text-white hover:bg-brand-800 rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          Tandai Selesai
                        </button>
                      </>
                    )}

                    <Link
                      href={`/disposisi/${disp.id}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Buka Magic Link
                    </Link>
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
