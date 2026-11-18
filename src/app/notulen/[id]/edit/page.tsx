"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { NotulenPembahasanSection, NotulenActionItem } from "@/lib/database.types";

export default function EditNotulenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { notulenList, updateNotulen } = useAppData();
  const { currentUser, isKepsek, isTU } = useAuth();

  const existing = notulenList.find((n) => n.id === id);

  const [jenisRapat, setJenisRapat] = useState("");
  const [nomorNotulen, setNomorNotulen] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [hariTanggal, setHariTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [tempat, setTempat] = useState("");
  const [pemimpinRapat, setPemimpinRapat] = useState("");
  const [pemimpinNip, setPemimpinNip] = useState("");
  const [notulis, setNotulis] = useState("");
  const [notulisNip, setNotulisNip] = useState("");
  const [pesertaRapat, setPesertaRapat] = useState("");
  const [susunanAcara, setSusunanAcara] = useState<string[]>([]);
  const [pembahasan, setPembahasan] = useState<NotulenPembahasanSection[]>([]);
  const [actionItems, setActionItems] = useState<NotulenActionItem[]>([]);
  const [penutup, setPenutup] = useState("");
  const [status, setStatus] = useState<"draft" | "final" | "disetujui">("draft");

  useEffect(() => {
    if (existing) {
      setJenisRapat(existing.jenis_rapat);
      setNomorNotulen(existing.nomor_notulen || "");
      setTanggal(existing.tanggal || "");
      setHariTanggal(existing.hari_tanggal || "");
      setWaktu(existing.waktu || "");
      setTempat(existing.tempat || "");
      setPemimpinRapat(existing.pemimpin_rapat || "");
      setPemimpinNip(existing.pemimpin_nip || "");
      setNotulis(existing.notulis || "");
      setNotulisNip(existing.notulis_nip || "");
      setPesertaRapat(existing.peserta_rapat || "");
      setSusunanAcara(existing.susunan_acara || []);
      setPembahasan(existing.pembahasan || []);
      setActionItems(existing.action_items || []);
      setPenutup(existing.penutup || "");
      setStatus(existing.status || "draft");
    }
  }, [existing]);

  if (!existing) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-base font-bold text-slate-800">Notulen tidak ditemukan.</p>
        <Link
          href="/notulen"
          className="inline-flex items-center gap-1.5 py-2 px-4 bg-emerald-800 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </Link>
      </div>
    );
  }

  // Susunan Acara Helpers
  const addSusunanAcara = () => setSusunanAcara([...susunanAcara, ""]);
  const updateSusunanAcara = (idx: number, val: string) => {
    const updated = [...susunanAcara];
    updated[idx] = val;
    setSusunanAcara(updated);
  };
  const removeSusunanAcara = (idx: number) => {
    setSusunanAcara(susunanAcara.filter((_, i) => i !== idx));
  };

  // Pembahasan Section Helpers
  const addPembahasanSection = () => {
    setPembahasan([
      ...pembahasan,
      {
        judul: `Pembahasan Bagian ${pembahasan.length + 1}`,
        keterangan: "",
        poin_poin: ["Poin pembahasan baru"],
      },
    ]);
  };

  const updateSectionJudul = (secIdx: number, val: string) => {
    const updated = [...pembahasan];
    updated[secIdx].judul = val;
    setPembahasan(updated);
  };

  const updateSectionKet = (secIdx: number, val: string) => {
    const updated = [...pembahasan];
    updated[secIdx].keterangan = val;
    setPembahasan(updated);
  };

  const removeSection = (secIdx: number) => {
    setPembahasan(pembahasan.filter((_, i) => i !== secIdx));
  };

  const addPoinToSection = (secIdx: number) => {
    const updated = [...pembahasan];
    updated[secIdx].poin_poin.push("");
    setPembahasan(updated);
  };

  const updatePoin = (secIdx: number, poinIdx: number, val: string) => {
    const updated = [...pembahasan];
    updated[secIdx].poin_poin[poinIdx] = val;
    setPembahasan(updated);
  };

  const removePoin = (secIdx: number, poinIdx: number) => {
    const updated = [...pembahasan];
    updated[secIdx].poin_poin = updated[secIdx].poin_poin.filter((_, i) => i !== poinIdx);
    setPembahasan(updated);
  };

  // Action Items Helpers
  const addActionItem = () => {
    setActionItems([
      ...actionItems,
      {
        id: "act-" + Date.now(),
        keputusan: "",
        pic: "",
        tenggat_waktu: "",
        status: "pending",
      },
    ]);
  };

  const updateActionItem = (idx: number, field: keyof NotulenActionItem, val: string) => {
    const updated = [...actionItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setActionItems(updated);
  };

  const removeActionItem = (idx: number) => {
    setActionItems(actionItems.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!jenisRapat.trim()) {
      alert("Silakan isi Jenis/Nama Rapat terlebih dahulu.");
      return;
    }

    updateNotulen(id, {
      jenis_rapat: jenisRapat.trim(),
      nomor_notulen: nomorNotulen.trim() || undefined,
      hari_tanggal: hariTanggal.trim(),
      tanggal: tanggal,
      waktu: waktu.trim(),
      tempat: tempat.trim(),
      pemimpin_rapat: pemimpinRapat.trim(),
      pemimpin_nip: pemimpinNip.trim() || undefined,
      notulis: notulis.trim(),
      notulis_nip: notulisNip.trim() || undefined,
      peserta_rapat: pesertaRapat.trim(),
      susunan_acara: susunanAcara.filter((s) => s.trim().length > 0),
      pembahasan: pembahasan.filter((p) => p.judul.trim().length > 0),
      action_items: actionItems.filter((a) => a.keputusan.trim().length > 0),
      penutup: penutup.trim(),
      status: status,
    });

    router.push(`/notulen/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href={`/notulen/${id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Batal & Kembali</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Edit Dokumen Dinas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Edit Notulensi Rapat
          </h1>
        </div>

        {/* A. IDENTITAS RAPAT */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">
              A
            </span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Identitas Rapat
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis / Agenda Rapat:
              </label>
              <input
                type="text"
                value={jenisRapat}
                onChange={(e) => setJenisRapat(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Notulen:
              </label>
              <input
                type="text"
                value={nomorNotulen}
                onChange={(e) => setNomorNotulen(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hari / Tanggal Rapat:
              </label>
              <input
                type="text"
                value={hariTanggal}
                onChange={(e) => setHariTanggal(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Waktu Pelaksanaan:
              </label>
              <input
                type="text"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tempat / Ruangan:
              </label>
              <input
                type="text"
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pemimpin Rapat:
              </label>
              <input
                type="text"
                value={pemimpinRapat}
                onChange={(e) => setPemimpinRapat(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIY / NIP Pemimpin Rapat:
              </label>
              <input
                type="text"
                value={pemimpinNip}
                onChange={(e) => setPemimpinNip(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notulis (Pencatat):
              </label>
              <input
                type="text"
                value={notulis}
                onChange={(e) => setNotulis(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIY / NIP Notulis:
              </label>
              <input
                type="text"
                value={notulisNip}
                onChange={(e) => setNotulisNip(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Peserta Rapat:
              </label>
              <input
                type="text"
                value={pesertaRapat}
                onChange={(e) => setPesertaRapat(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* B. SUSUNAN ACARA */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">
                B
              </span>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Susunan Acara
              </h2>
            </div>
            <button
              type="button"
              onClick={addSusunanAcara}
              className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Acara</span>
            </button>
          </div>

          <div className="space-y-2">
            {susunanAcara.map((acara, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-slate-500">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={acara}
                  onChange={(e) => updateSusunanAcara(idx, e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                {susunanAcara.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSusunanAcara(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* C. JALANNYA RAPAT & PEMBAHASAN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">
                C
              </span>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Jalannya Rapat & Pembahasan
              </h2>
            </div>
            <button
              type="button"
              onClick={addPembahasanSection}
              className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bagian</span>
            </button>
          </div>

          <div className="space-y-4">
            {pembahasan.map((sec, secIdx) => (
              <div
                key={secIdx}
                className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-slate-500">{secIdx + 1}.</span>
                    <input
                      type="text"
                      value={sec.judul}
                      onChange={(e) => updateSectionJudul(secIdx, e.target.value)}
                      className="flex-1 text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  {pembahasan.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(secIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={sec.keterangan || ""}
                    onChange={(e) => updateSectionKet(secIdx, e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-emerald-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">Poin Pembahasan:</span>
                    <button
                      type="button"
                      onClick={() => addPoinToSection(secIdx)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Poin</span>
                    </button>
                  </div>

                  {sec.poin_poin.map((poin, poinIdx) => (
                    <div key={poinIdx} className="flex items-start gap-2">
                      <span className="text-slate-400 text-sm mt-1">•</span>
                      <textarea
                        rows={2}
                        value={poin}
                        onChange={(e) => updatePoin(secIdx, poinIdx, e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removePoin(secIdx, poinIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors mt-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* D. KEPUTUSAN RAPAT & TINDAK LANJUT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">
                D
              </span>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Keputusan Rapat & Tindak Lanjut (Action Items)
              </h2>
            </div>
            <button
              type="button"
              onClick={addActionItem}
              className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Keputusan</span>
            </button>
          </div>

          <div className="space-y-3">
            {actionItems.map((act, actIdx) => (
              <div
                key={act.id || actIdx}
                className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {actIdx + 1}
                </span>

                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={act.keputusan}
                      onChange={(e) => updateActionItem(actIdx, "keputusan", e.target.value)}
                      placeholder="Keputusan / Rencana Tindak Lanjut"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={act.pic}
                      onChange={(e) => updateActionItem(actIdx, "pic", e.target.value)}
                      placeholder="Penanggung Jawab (PIC)"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={act.tenggat_waktu}
                      onChange={(e) => updateActionItem(actIdx, "tenggat_waktu", e.target.value)}
                      placeholder="Tenggat Waktu / Deadline"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-emerald-950"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeActionItem(actIdx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* E. PENUTUP */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center">
              E
            </span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Penutup
            </h2>
          </div>

          <textarea
            rows={2}
            value={penutup}
            onChange={(e) => setPenutup(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Status selector */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Status Dokumen:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="draft">Draft Notulen</option>
            <option value="final">Final (Siap Disahkan)</option>
            <option value="disetujui">Disetujui / Disahkan</option>
          </select>
        </div>

        {/* Save button */}
        <div className="pt-6 border-t border-slate-200 flex justify-end gap-2.5">
          <Link
            href={`/notulen/${id}`}
            className="py-2.5 px-5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Batal
          </Link>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
