"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatRupiah,
  formatIndonesianDate,
  getBidangLabel,
  getBidangBadgeColor,
} from "@/lib/utils";
import { BidangStruktural } from "@/lib/database.types";
import {
  Target,
  PlusCircle,
  Coins,
  Calendar,
  Layers,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

function ActionPlanInner() {
  const searchParams = useSearchParams();
  const preselectedRktId = searchParams.get("rkt_id");

  const { currentUser, isKepsek, isTU, isKasubag, userBidang } = useAuth();
  const { rkt, actionPlans, addActionPlan, deleteActionPlan } = useAppData();

  const [showAddForm, setShowAddForm] = useState(Boolean(preselectedRktId));
  const [selectedBulan, setSelectedBulan] = useState("November 2026");

  // RKT Approved filter: ONLY approved RKT can be selected as parent!
  const approvedRkts = rkt.filter((r) => r.status === "disetujui");

  // Form states
  const [rktId, setRktId] = useState(preselectedRktId || approvedRkts[0]?.id || "");
  const [bulanPelaksanaan, setBulanPelaksanaan] = useState("November 2026");
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [sasaran, setSasaran] = useState("");
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState("Pekan ke-2 (12-15 November 2026)");
  const [keterangan, setKeterangan] = useState("");
  const [estimasiAnggaran, setEstimasiAnggaran] = useState<number>(5000000);

  useEffect(() => {
    if (preselectedRktId) {
      setRktId(preselectedRktId);
      const found = rkt.find((r) => r.id === preselectedRktId);
      if (found) {
        setNamaKegiatan("Tindak Lanjut: " + found.nama_kegiatan);
      }
      setShowAddForm(true);
    }
  }, [preselectedRktId, rkt]);

  // Current date
  const todayFormatted = formatIndonesianDate(new Date(), true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parentRkt = approvedRkts.find((r) => r.id === rktId);
    if (!parentRkt) {
      alert("Harap pilih Induk Kegiatan dari RKT yang sudah disetujui!");
      return;
    }

    addActionPlan({
      rkt_id: parentRkt.id,
      rkt_nama: parentRkt.nama_kegiatan,
      user_id: currentUser.id,
      bidang: parentRkt.bidang,
      tanggal_dibuat: new Date().toISOString().split("T")[0],
      bulan_pelaksanaan: bulanPelaksanaan,
      nama_kegiatan: namaKegiatan.trim(),
      tujuan: tujuan.trim(),
      sasaran: sasaran.trim(),
      waktu_pelaksanaan: waktuPelaksanaan.trim(),
      keterangan: keterangan.trim(),
      estimasi_anggaran: Number(estimasiAnggaran) || 0,
    });

    setShowAddForm(false);
    setNamaKegiatan("");
    setTujuan("");
    setSasaran("");
    setKeterangan("");
  };

  // Filter action plans by selected month
  const currentMonthPlans = actionPlans.filter(
    (p) => p.bulan_pelaksanaan.toLowerCase() === selectedBulan.toLowerCase()
  );

  // Total monthly budget accumulation
  const totalAnggaranBulanIni = currentMonthPlans.reduce(
    (acc, curr) => acc + (Number(curr.estimasi_anggaran) || 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-800 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Modul Action Plan Bulanan (Struktural)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Penetapan rincian rencana aksi bulanan wajib menginduk pada <strong>RKT yang telah disetujui Kepala Sekolah</strong>.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          {showAddForm ? "Tutup Formulir" : "Tambah Action Plan"}
        </button>
      </div>

      {/* Akumulasi Anggaran Bulanan Card */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-950 text-white rounded-2xl p-6 shadow-md border border-brand-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-gold-400 uppercase tracking-widest flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-gold-400" />
            Total Akumulasi Anggaran Periode: {selectedBulan}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {formatRupiah(totalAnggaranBulanIni)}
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Terdiri dari <strong>{currentMonthPlans.length} kegiatan</strong> rencana aksi kasubag.
          </p>
        </div>

        {/* Month selector pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-200">Pilih Periode:</span>
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="text-xs font-bold text-gray-900 bg-white rounded-xl px-3 py-2 border-0 shadow-sm focus:ring-2 focus:ring-gold-400"
          >
            <option value="November 2026">November 2026</option>
            <option value="Desember 2026">Desember 2026</option>
            <option value="Januari 2027">Januari 2027</option>
            <option value="Februari 2027">Februari 2027</option>
          </select>
        </div>
      </div>

      {/* FORM INPUT ACTION PLAN */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border-2 border-brand-500 p-6 sm:p-8 shadow-xl space-y-5 animate-in fade-in-50">
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Formulir Rencana Aksi (Action Plan) Baru
              </h2>
              <p className="text-xs text-gray-500">
                Pastikan memilih induk kegiatan dari daftar RKT yang telah disetujui.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
            >
              ✕ Tutup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Automatic Hari & Tanggal Dibuat */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-gray-500 block text-[11px]">Hari & Tanggal Dibuat (Otomatis):</span>
                <span className="font-bold text-gray-900 text-xs">{todayFormatted}</span>
              </div>
              <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded">
                Sistem Otomatis
              </span>
            </div>

            {/* Grid 2 Cols: Bulan Pelaksanaan & Induk Kegiatan RKT Disetujui */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Bulan Pelaksanaan <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={bulanPelaksanaan}
                  onChange={(e) => setBulanPelaksanaan(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="November 2026">November 2026</option>
                  <option value="Desember 2026">Desember 2026</option>
                  <option value="Januari 2027">Januari 2027</option>
                  <option value="Februari 2027">Februari 2027</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Induk Kegiatan (Wajib RKT Disetujui) <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={rktId}
                  onChange={(e) => setRktId(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  {approvedRkts.length === 0 ? (
                    <option value="">Belum ada RKT disetujui!</option>
                  ) : (
                    approvedRkts.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{getBidangLabel(r.bidang)}] {r.nama_kegiatan}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Nama Kegiatan */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nama Kegiatan Rencana Aksi <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: FGD Finalisasi Silabus Praktikum TJKT bersama Tim Industri"
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Grid 2 Cols: Tujuan & Sasaran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tujuan Kegiatan <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={2}
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Tujuan spesifik yang ingin dicapai..."
                  className="w-full text-xs rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Sasaran Peserta / Output <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={2}
                  required
                  value={sasaran}
                  onChange={(e) => setSasaran(e.target.value)}
                  placeholder="Contoh: 12 Guru Kejuruan TJKT & RPL..."
                  className="w-full text-xs rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Grid 2 Cols: Waktu Pelaksanaan & Estimasi Anggaran (Rp) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Waktu Pelaksanaan Spesifik <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={waktuPelaksanaan}
                  onChange={(e) => setWaktuPelaksanaan(e.target.value)}
                  placeholder="Contoh: 12 - 14 November 2026"
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Estimasi Anggaran (Rp) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={estimasiAnggaran}
                  onChange={(e) => setEstimasiAnggaran(Number(e.target.value))}
                  placeholder="Contoh: 8500000"
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 font-mono focus:ring-2 focus:ring-brand-500 font-bold"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Terbilang: <strong>{formatRupiah(estimasiAnggaran)}</strong>
                </span>
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Keterangan Tambahan / Lokasi Kegiatan:
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Kegiatan luring di Meeting Room Gedung Sains Pesantren"
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Simpan Action Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE DAFTAR ACTION PLAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Daftar Kegiatan Action Plan Periode: {selectedBulan}
          </h3>
          <Link
            href="/action-report"
            className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1"
          >
            Buka Menu Action Report & Evaluasi
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama Kegiatan & Induk RKT</th>
                <th className="py-3 px-4">Tujuan & Sasaran</th>
                <th className="py-3 px-4">Waktu & Keterangan</th>
                <th className="py-3 px-4 text-right">Estimasi Anggaran</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentMonthPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Belum ada action plan untuk periode bulan {selectedBulan}.
                  </td>
                </tr>
              ) : (
                currentMonthPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                    {/* Kegiatan & Induk */}
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
                        Induk RKT: <em>{plan.rkt_nama}</em>
                      </p>
                    </td>

                    {/* Tujuan & Sasaran */}
                    <td className="py-3.5 px-4 align-top text-gray-700 max-w-xs">
                      <p>
                        <strong>Tujuan:</strong> {plan.tujuan}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        <strong>Sasaran:</strong> {plan.sasaran}
                      </p>
                    </td>

                    {/* Waktu & Keterangan */}
                    <td className="py-3.5 px-4 align-top text-gray-700">
                      <p className="font-semibold">{plan.waktu_pelaksanaan}</p>
                      {plan.keterangan && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{plan.keterangan}</p>
                      )}
                    </td>

                    {/* Anggaran */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap font-mono font-bold text-brand-900">
                      {formatRupiah(plan.estimasi_anggaran)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (window.confirm("Hapus kegiatan action plan ini?")) {
                            deleteActionPlan(plan.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus Action Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ActionPlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Memuat Action Plan...</div>}>
      <ActionPlanInner />
    </Suspense>
  );
}
