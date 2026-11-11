"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatIndonesianDate,
  getStatusRKTBadge,
  getBidangLabel,
  getBidangBadgeColor,
} from "@/lib/utils";
import { BidangStruktural, RKT, StatusRKT } from "@/lib/database.types";
import {
  CalendarDays,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  Edit3,
  Trash2,
} from "lucide-react";

export default function RKTPage() {
  const { currentUser, isKepsek, isTU, isKasubag, userBidang } = useAuth();
  const { rkt, perspektif, addRKT, approveRKT, rejectRKT, updateRKT, deleteRKT } =
    useAppData();

  // Active sub-menu tab: 'tambah' | 'disetujui' | 'ditolak' | 'verifikasi'
  const [activeTab, setActiveTab] = useState<"disetujui" | "tambah" | "ditolak" | "verifikasi">("disetujui");

  // Form states for Tambah Rencana
  const [tahunAnggaran, setTahunAnggaran] = useState("2026/2027");
  const [bidang, setBidang] = useState<BidangStruktural>(userBidang || "kurikulum");
  const [perspektifId, setPerspektifId] = useState(perspektif[0]?.id || "");
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState("Semester Ganjil (Juli - Desember 2026)");
  const [pic, setPic] = useState(currentUser.name);
  const [targetCapaian, setTargetCapaian] = useState("");
  const [editingRktId, setEditingRktId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBidang, setFilterBidang] = useState<string>("semua");

  // Handlers
  const handleSaveRKT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKegiatan.trim() || !waktuPelaksanaan.trim() || !pic.trim() || !targetCapaian.trim()) {
      alert("Harap lengkapi semua kolom wajib!");
      return;
    }

    const selectedPers = perspektif.find((p) => p.id === perspektifId);

    if (editingRktId) {
      // Re-submit revised RKT
      updateRKT(editingRktId, {
        tahun_anggaran: tahunAnggaran,
        bidang,
        perspektif_id: perspektifId || undefined,
        perspektif_nama: selectedPers ? `${selectedPers.kode} - ${selectedPers.nama}` : undefined,
        nama_kegiatan: namaKegiatan.trim(),
        waktu_pelaksanaan: waktuPelaksanaan.trim(),
        pic: pic.trim(),
        target_capaian: targetCapaian.trim(),
        status: "menunggu_persetujuan",
        catatan_revisi: undefined,
      });
      setEditingRktId(null);
      setActiveTab("disetujui");
    } else {
      addRKT({
        tahun_anggaran: tahunAnggaran,
        bidang,
        user_id: currentUser.id,
        perspektif_id: perspektifId || undefined,
        perspektif_nama: selectedPers ? `${selectedPers.kode} - ${selectedPers.nama}` : undefined,
        nama_kegiatan: namaKegiatan.trim(),
        waktu_pelaksanaan: waktuPelaksanaan.trim(),
        pic: pic.trim(),
        target_capaian: targetCapaian.trim(),
      });
      setActiveTab("disetujui");
    }

    // Reset Form
    setNamaKegiatan("");
    setTargetCapaian("");
  };

  const handleStartEditRejected = (item: RKT) => {
    setEditingRktId(item.id);
    setTahunAnggaran(item.tahun_anggaran);
    setBidang(item.bidang);
    setPerspektifId(item.perspektif_id || "");
    setNamaKegiatan(item.nama_kegiatan);
    setWaktuPelaksanaan(item.waktu_pelaksanaan);
    setPic(item.pic);
    setTargetCapaian(item.target_capaian);
    setActiveTab("tambah");
  };

  // Filtered lists
  const approvedList = rkt.filter((r) => r.status === "disetujui");
  const rejectedList = rkt.filter((r) => r.status === "ditolak");
  const pendingList = rkt.filter((r) => r.status === "menunggu_persetujuan");

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Rencana Kerja Tahunan (RKT) Berbasis Perspektif Dinamis
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pengajuan rencana kerja Kasubag struktural, integrasi Master Perspektif Yayasan, dan persetujuan Kepala Sekolah.
          </p>
        </div>

        {/* Quick New Plan Button */}
        <button
          onClick={() => {
            setEditingRktId(null);
            setNamaKegiatan("");
            setTargetCapaian("");
            setActiveTab("tambah");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Rencana Baru
        </button>
      </div>

      {/* 3 Main Sub-Menus requested by user + 1 Approval Tab for Kepsek */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("disetujui")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "disetujui"
              ? "border-brand-700 text-brand-900"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Daftar Rencana (Disetujui)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">
            {approvedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tambah")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "tambah"
              ? "border-brand-700 text-brand-900"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <PlusCircle className="w-4 h-4 text-brand-600" />
          <span>{editingRktId ? "Revisi & Ajukan Ulang" : "Tambah Rencana (Baru)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("ditolak")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "ditolak"
              ? "border-rose-600 text-rose-800"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-600" />
          <span>Rencana Ditolak (Revisi)</span>
          {rejectedList.length > 0 && (
            <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {rejectedList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("verifikasi")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "verifikasi"
              ? "border-amber-600 text-amber-900"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Menunggu Persetujuan Kepsek</span>
          {pendingList.length > 0 && (
            <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {pendingList.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: FORM TAMBAH RENCANA (Struktur Dinamis) */}
      {activeTab === "tambah" && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              {editingRktId ? "Formulir Revisi Usulan RKT" : "Formulir Tambah Rencana Kerja Tahunan (RKT)"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Struktur input fleksibel mengantisipasi perubahan perspektif yayasan. Status awal:{" "}
              <strong className="text-amber-700">Menunggu Persetujuan</strong>.
            </p>
          </div>

          <form onSubmit={handleSaveRKT} className="space-y-4 text-xs">
            {/* Grid 2 Cols: Tahun Anggaran & Bidang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tahun Anggaran:
                </label>
                <select
                  value={tahunAnggaran}
                  onChange={(e) => setTahunAnggaran(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="2026/2027">T.A. 2026/2027</option>
                  <option value="2025/2026">T.A. 2025/2026</option>
                  <option value="2027/2028">T.A. 2027/2028</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Bidang Struktural:
                </label>
                <select
                  value={bidang}
                  onChange={(e) => setBidang(e.target.value as BidangStruktural)}
                  disabled={Boolean(userBidang && !isKepsek && !isTU)}
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-gray-100"
                >
                  <option value="kurikulum">Kurikulum & Akademik</option>
                  <option value="kesiswaan">Kesiswaan & Karakter</option>
                  <option value="sarpras">Sarana, Prasarana & TI</option>
                  <option value="humas_bkk">Humas & Hubungan Industri (BKK)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Otomatis terisi sesuai jabatan akun Kasubag yang login.
                </p>
              </div>
            </div>

            {/* Perspektif / Kategori (Dinamis dari Master Perspektif) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-700">
                  Perspektif / Kategori Strategis (Opsional / Dinamis):
                </label>
                <Link
                  href="/master/perspektif"
                  className="text-[11px] text-brand-700 hover:underline font-semibold"
                >
                  Kelola Master Perspektif ↗
                </Link>
              </div>
              <select
                value={perspektifId}
                onChange={(e) => setPerspektifId(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="">-- Pilih Perspektif RKT (Opsional) --</option>
                {perspektif
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.kode}] {p.nama}
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Mengambil data dinamis dari tabel Master Perspektif Yayasan.
              </p>
            </div>

            {/* Nama Kegiatan */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nama Kegiatan <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Penyelarasan Kurikulum Vokasi bersama PT INKA & PT Telkom"
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Grid 2 Cols: Waktu Pelaksanaan & PIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Waktu Pelaksanaan (Bulan / Triwulan) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={waktuPelaksanaan}
                  onChange={(e) => setWaktuPelaksanaan(e.target.value)}
                  placeholder="Contoh: Triwulan I / Bulan November 2026"
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Penanggung Jawab (PIC) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  placeholder="Nama Penanggung Jawab Kegiatan"
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Keterangan / Target Capaian */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Keterangan / Target Capaian <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={3}
                required
                value={targetCapaian}
                onChange={(e) => setTargetCapaian(e.target.value)}
                placeholder="Tuliskan indikator keberhasilan, output terukur, atau dokumen hasil kegiatan..."
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 leading-relaxed focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("disetujui")}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                {editingRktId ? "Ajukan Ulang Revisi RKT" : "Simpan & Ajukan RKT ke Kepala Sekolah"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DAFTAR RENCANA (DISETUJUI KEPALA SEKOLAH) */}
      {activeTab === "disetujui" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-gray-700">
              Menampilkan {approvedList.length} Rencana Kerja Tahunan yang telah disetujui
            </span>
            <p className="text-[11px] text-gray-500">
              💡 Rencana yang disetujui di bawah ini dapat dipilih sebagai <strong>Induk Kegiatan</strong> pada Modul Action Plan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 p-5 shadow-sm hover:shadow-card transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBidangBadgeColor(
                        item.bidang
                      )}`}
                    >
                      {getBidangLabel(item.bidang)}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Disetujui
                    </span>
                  </div>

                  <h3 className="text-xs font-extrabold text-gray-900 leading-snug">
                    {item.nama_kegiatan}
                  </h3>

                  {item.perspektif_nama && (
                    <p className="text-[11px] text-gold-800 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 font-medium">
                      Perspektif: {item.perspektif_nama}
                    </p>
                  )}

                  <div className="text-[11px] text-gray-600 space-y-1">
                    <p>
                      <strong>Target:</strong> {item.target_capaian}
                    </p>
                    <p>
                      <strong>Waktu:</strong> {item.waktu_pelaksanaan} • <strong>PIC:</strong> {item.pic}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">T.A. {item.tahun_anggaran}</span>
                  <Link
                    href={`/action-plan?rkt_id=${item.id}`}
                    className="text-brand-700 hover:text-brand-900 font-bold flex items-center gap-1"
                  >
                    + Buat Action Plan Bulanan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RENCANA DITOLAK (REVISI DARI KEPALA SEKOLAH) */}
      {activeTab === "ditolak" && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Daftar Rencana yang Perlu Diperbaiki</h4>
              <p className="mt-0.5 text-rose-800">
                Silakan baca catatan koreksi dari Kepala Sekolah, klik tombol <strong>"Revisi & Ajukan Ulang"</strong> untuk mengedit dan mengirimkan kembali.
              </p>
            </div>
          </div>

          {rejectedList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-gray-700">
                Tidak ada rencana kerja yang ditolak.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rejectedList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBidangBadgeColor(
                          item.bidang
                        )}`}
                      >
                        {getBidangLabel(item.bidang)}
                      </span>
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                        Ditolak
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartEditRejected(item)}
                      className="px-3.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Revisi & Ajukan Ulang
                    </button>
                  </div>

                  <h3 className="text-xs font-bold text-gray-900">{item.nama_kegiatan}</h3>
                  <p className="text-[11px] text-gray-600">
                    Target Capaian: {item.target_capaian} • PIC: {item.pic}
                  </p>

                  {/* Rejection Notes */}
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900">
                    <strong>Catatan Revisi Kepala Sekolah:</strong>
                    <p className="mt-1 italic">{item.catatan_revisi || "Mohon periksa kembali kelayakan sasaran kegiatan."}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VERIFIKASI / MENUNGGU PERSETUJUAN */}
      {activeTab === "verifikasi" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
            <strong>Antrean Verifikasi Kepala Sekolah:</strong> Tinjau dan putuskan persetujuan usulan kegiatan RKT di bawah ini.
          </div>

          {pendingList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-600">Semua usulan RKT telah ditinjau.</p>
            </div>
          ) : (
            pendingList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBidangBadgeColor(
                        item.bidang
                      )}`}
                    >
                      {getBidangLabel(item.bidang)}
                    </span>
                    <span className="text-[11px] text-gray-500">T.A. {item.tahun_anggaran}</span>
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">{item.nama_kegiatan}</h3>
                  <p className="text-[11px] text-gray-600">
                    Target: {item.target_capaian} • PIC: <strong>{item.pic}</strong>
                  </p>
                </div>

                {isKepsek ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const note = prompt("Alasan revisi / penolakan:");
                        if (note) rejectRKT(item.id, note);
                      }}
                      className="px-3.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => approveRKT(item.id)}
                      className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Setujui RKT
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full font-bold">
                    Menunggu Kepsek
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
