"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import {
  ClipboardList,
  Plus,
  Search,
  Printer,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  MapPin,
  UserCheck,
  CheckSquare,
  Sparkles,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/utils";

export default function NotulenListPage() {
  const { notulenList, deleteNotulen, addToast } = useAppData();
  const { currentUser, isKepsek, isTU } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const canCreateOrEdit = isKepsek || isTU || currentUser.role === "kasubag";

  // Filtered notulen
  const filteredList = notulenList.filter((n) => {
    const matchesSearch =
      n.jenis_rapat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.pemimpin_rapat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.notulis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.nomor_notulen && n.nomor_notulen.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "disetujui"
        ? n.is_approved_by_kepsek || n.status === "disetujui"
        : n.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalRapat = notulenList.length;
  const approvedRapat = notulenList.filter((n) => n.is_approved_by_kepsek || n.status === "disetujui").length;
  const allActionItems = notulenList.flatMap((n) => n.action_items || []);
  const pendingActionItems = allActionItems.filter((a) => a.status === "pending").length;
  const doneActionItems = allActionItems.filter((a) => a.status === "selesai").length;

  const handleShareWa = (notulen: typeof notulenList[0]) => {
    const itemsText = notulen.action_items && notulen.action_items.length > 0
      ? notulen.action_items.map((a, i) => `  ${i + 1}. *${a.keputusan}*\n     PIC: ${a.pic} | Deadline: ${a.tenggat_waktu}`).join("\n")
      : "  (Tidak ada action items khusus)";

    const text = `*RESUME NOTULENSI RAPAT DINAS SMK BAYT AL-HIKMAH*\n` +
      `----------------------------------------\n` +
      `📋 *Agenda:* ${notulen.jenis_rapat}\n` +
      `📅 *Waktu:* ${notulen.hari_tanggal} (${notulen.waktu})\n` +
      `📍 *Tempat:* ${notulen.tempat}\n` +
      `👤 *Pimpinan Rapat:* ${notulen.pemimpin_rapat}\n` +
      `📝 *Notulis:* ${notulen.notulis}\n\n` +
      `📌 *KEPUTUSAN RAPAT & TINDAK LANJUT (ACTION ITEMS):*\n` +
      `${itemsText}\n\n` +
      `Status Pengesahan: ${notulen.is_approved_by_kepsek ? "✅ Telah Disahkan Kepala Sekolah" : "⏳ Menunggu Pengesahan"}\n\n` +
      `_SIGAP-SMK: Sistem Informasi Gerak Cepat & Administrasi Terpadu_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDelete = (id: string, agenda: string) => {
    if (window.confirm(`Yakin ingin menghapus notulen "${agenda}"?`)) {
      deleteNotulen(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#053d2e] to-[#043326] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-gold-400" />
              <span>E-Office & Risalah Rapat Dinas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Notulensi & Risalah Rapat
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Pencatatan resmi agenda rapat sekolah, jalannya pembahasan, pengesahan digital Kepala Sekolah,
              serta pengawalan keputusan tindak lanjut (*action items*).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {canCreateOrEdit && (
              <Link
                href="/notulen/buat"
                className="py-2.5 px-4 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Notulen Baru</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Rapat */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Rapat</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalRapat}</p>
          <span className="text-[10px] text-slate-500 font-medium">Dokumen notulen</span>
        </div>

        {/* Disahkan Kepsek */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Disahkan Kepsek</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900">{approvedRapat}</p>
          <span className="text-[10px] text-blue-700 font-medium">Telah diverifikasi</span>
        </div>

        {/* Action Items Pending */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tindak Lanjut Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900">{pendingActionItems}</p>
          <span className="text-[10px] text-amber-700 font-medium">Dalam proses PIC</span>
        </div>

        {/* Action Items Selesai */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tindak Lanjut Selesai</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900">{doneActionItems}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Terealisasi penuh</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari jenis rapat, pemimpin, notulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="disetujui">Disetujui / Disahkan</option>
            <option value="final">Final (Belum Disahkan)</option>
            <option value="draft">Draft Notulen</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Tidak Ada Notulen Rapat</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Tidak ada dokumen notulen yang sesuai dengan kata kunci pencarian Anda."
                : "Belum ada risalah rapat yang dicatat. Klik tombol di atas untuk membuat notulensi baru."}
            </p>
            {canCreateOrEdit && !searchQuery && (
              <Link
                href="/notulen/buat"
                className="mt-4 inline-flex items-center gap-1.5 py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Notulen Pertama</span>
              </Link>
            )}
          </div>
        ) : (
          filteredList.map((notulen) => {
            const isApproved = notulen.is_approved_by_kepsek || notulen.status === "disetujui";
            const actionTotal = notulen.action_items?.length || 0;
            const actionDone = (notulen.action_items || []).filter((a) => a.status === "selesai").length;

            return (
              <div
                key={notulen.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isApproved ? "bg-emerald-500" : notulen.status === "final" ? "bg-blue-500" : "bg-amber-400"
                  }`}
                />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : notulen.status === "final"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {isApproved
                          ? "✓ Disahkan Kepala Sekolah"
                          : notulen.status === "final"
                          ? "Final (Menunggu Pengesahan)"
                          : "Draft Notulen"}
                      </span>

                      {notulen.nomor_notulen && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {notulen.nomor_notulen}
                        </span>
                      )}
                    </div>

                    <div>
                      <Link
                        href={`/notulen/${notulen.id}`}
                        className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-700 transition-colors inline-block"
                      >
                        {notulen.jenis_rapat}
                      </Link>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {notulen.hari_tanggal}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {notulen.waktu}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {notulen.tempat}
                        </span>
                      </div>
                    </div>

                    {/* Personnel & Participants */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Pimpinan Rapat:</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{notulen.pemimpin_rapat}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Notulis:</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{notulen.notulis}</p>
                      </div>
                    </div>

                    {/* Action Items Overview */}
                    {actionTotal > 0 && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            <strong>{actionTotal}</strong> Keputusan / Tindak Lanjut ({actionDone} Selesai)
                          </span>
                        </div>
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${(actionDone / actionTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex sm:flex-col lg:items-end justify-between sm:justify-start gap-2 pt-2 lg:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                    <Link
                      href={`/notulen/${notulen.id}`}
                      className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-emerald-200 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Risalah</span>
                    </Link>

                    <a
                      href={`/notulen/${notulen.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                      title="Cetak Dokumen PDF Resmi Sesuai Format Dinas"
                    >
                      <Printer className="w-3.5 h-3.5 text-gold-400" />
                      <span>Cetak PDF</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleShareWa(notulen)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Kirim Ringkasan Notulensi & Action Items ke Grup WhatsApp Guru"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Share WA</span>
                    </button>

                    {canCreateOrEdit && (
                      <div className="flex items-center gap-1 pt-1">
                        <Link
                          href={`/notulen/${notulen.id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Notulen"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(notulen.id, notulen.jenis_rapat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Notulen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
