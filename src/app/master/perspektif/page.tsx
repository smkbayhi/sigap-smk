"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { MasterPerspektif } from "@/lib/database.types";
import {
  Database,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Sparkles,
} from "lucide-react";

export default function MasterPerspektifPage() {
  const { isTU, isKepsek } = useAuth();
  const { perspektif, addPerspektif, updatePerspektif, deletePerspektif } =
    useAppData();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterPerspektif | null>(null);

  // Form states
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingItem(null);
    setKode(`P${perspektif.length + 1}`);
    setNama("");
    setDeskripsi("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (item: MasterPerspektif) => {
    setEditingItem(item);
    setKode(item.kode);
    setNama(item.nama);
    setDeskripsi(item.deskripsi);
    setIsActive(item.is_active);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !nama.trim()) {
      alert("Kode dan Nama Perspektif wajib diisi!");
      return;
    }

    if (editingItem) {
      updatePerspektif(editingItem.id, {
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        is_active: isActive,
      });
    } else {
      addPerspektif({
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        is_active: isActive,
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Master Perspektif Rencana Kerja Tahunan (RKT)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pengelolaan kategori dan perspektif dinamis yayasan untuk fleksibilitas perencanaan strategis masa depan.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Perspektif Baru
        </button>
      </div>

      {/* Grid of Perspectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perspektif.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-card transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black bg-brand-50 text-brand-900 border border-brand-200 px-2.5 py-0.5 rounded-lg">
                  {item.kode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    item.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.is_active ? "Aktif" : "Non-Aktif"}
                </span>
              </div>

              <h3 className="text-xs font-bold text-gray-900">{item.nama}</h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">{item.deskripsi}</p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(item)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Hapus perspektif ${item.kode}?`)) {
                    deletePerspektif(item.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Hapus Perspektif"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-900/20 animate-in fade-in-50 zoom-in-95">
            <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingItem ? "Ubah Data Perspektif" : "Tambah Perspektif RKT Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Kode Perspektif <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    placeholder="Contoh: P6"
                    className="w-full text-xs font-mono font-bold rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Status Keaktifan:
                  </label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="true">Aktif (Dapat Dipilih Kasubag)</option>
                    <option value="false">Non-Aktif (Arsip)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nama Perspektif <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Digitalisasi Pembelajaran & AI Vokasi"
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Deskripsi / Ruang Lingkup Sasaran:
                </label>
                <textarea
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan fokus dan kriteria capaian pada perspektif ini..."
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 leading-relaxed focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perspektif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
