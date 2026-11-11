"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { JenisSuratKeluar, StatusSuratKeluar } from "@/lib/database.types";
import { generateNomorSurat, formatIndonesianDate, getBulanRomawi } from "@/lib/utils";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import {
  ArrowLeft,
  FileCheck,
  Save,
  Eye,
  Sparkles,
  Calendar,
  CheckSquare,
  Square,
  HelpCircle,
} from "lucide-react";

// Standard fixed Islamic opening & closing at SMK Bayt Al-Hikmah Pasuruan
const SALAM_PEMBUKA_FIXED = `<p>Assalamu’alaikum wr. wb.</p>
<p>Salam silaturrahim kami sampaikan, semoga Allah SWT senantiasa melimpahkan rahmat, taufiq, serta hidayahNya kepada kita dalam menjalani rutinitas sehari-hari. Amin</p>`;

const SALAM_PENUTUP_DEFAULT = `Demikian surat permohonan dari kami, atas perhatian dan kerjasamanya kami sampaikan terima kasih. <em>Jazaakumulloh Ahsanal Jazaa’.</em></p>
<p>Wassalamu’alaikum. wr. wb.`;

// Quick sample presets for "Inti / Maksud Surat"
const CONTOH_INTI_PRESETS = [
  {
    label: "Permohonan Izin Ruang & Laptop (Contoh Resmi)",
    perihal: "Permohonan Izin Pemakaian Ruang dan Laptop",
    tujuan: "Kepala BLK Komunitas Bayt Al-Hikmah",
    jenis: "surat_permohonan" as JenisSuratKeluar,
    inti: "Sehubungan dengan akan dilaksanakannya kegiatan TKA (Tes Kemampuan Akademik) Susulan santri kelas XII Tahun 2026, maka kami Kepala SMK Bayt Al-Hikmah bermaksud mengajukan permohonan izin pemakaian ruang praktik BLK dan Laptop sebanyak 3 unit untuk kegiatan tersebut yang akan dilaksanakan pada:",
    withTable: true,
    hari: "Senin s.d Kamis",
    tanggal: "16 s.d 19 November 2026",
    waktu: "06.30 s.d 09.00 WIB",
    tempat: "Ruang Praktik BLK Komunitas",
    penutupJenis: "permohonan",
  },
  {
    label: "Surat Tugas Guru / Workshop (Dengan Jadwal)",
    perihal: "Surat Tugas Mengikuti Workshop Kurikulum Merdeka Vokasi 2026",
    tujuan: "Bapak M. Ridwan, S.T., M.Kom. & Ahmad Junaidi, S.Pd.",
    jenis: "surat_tugas" as JenisSuratKeluar,
    inti: "Kepala SMK Bayt Al-Hikmah Kota Pasuruan dengan ini menugaskan kepada:\n1. M. Ridwan, S.T., M.Kom. (NIY: 14215102) - Kasubag Kurikulum\n2. Ahmad Junaidi, S.Pd. (NIY: 14215120) - Guru Produktif TJKT\nUntuk hadir dan berpartisipasi aktif dalam kegiatan Workshop Sinkronisasi Kurikulum Merdeka Bersama Mitra Industri Nasional pada:",
    withTable: true,
    hari: "Kamis - Jumat",
    tanggal: "19 - 20 November 2026",
    waktu: "08.00 WIB s.d. Selesai",
    tempat: "Grand City Convention Hall, Surabaya",
    penutupJenis: "tugas",
  },
  {
    label: "Pemberitahuan Umum / Keterangan (Tanpa Tabel)",
    perihal: "Surat Keterangan Akreditasi Sekolah dan Kelayakan Peserta Didik",
    tujuan: "Pihak yang Berkepentingan",
    jenis: "surat_keterangan" as JenisSuratKeluar,
    inti: "Yang bertanda tangan di bawah ini Kepala SMK Bayt Al-Hikmah Pasuruan menerangkan dengan sesungguhnya bahwa Sekolah Menengah Kejuruan (SMK) Bayt Al-Hikmah Pasuruan telah Terakreditasi A (Unggul) berdasarkan Keputusan Badan Akreditasi Nasional Sekolah/Madrasah (BAN-SM).",
    withTable: false,
    hari: "",
    tanggal: "",
    waktu: "",
    tempat: "",
    penutupJenis: "keterangan",
  },
];

export default function BuatSuratKeluarPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { suratKeluar, addSuratKeluar } = useAppData();

  // Calculate next auto number: [No_Urut]/SMK-BAYHI/[Bulan_Romawi]/[Tahun]
  const currentYear = new Date().getFullYear();
  const currentMonthRomawi = getBulanRomawi(new Date().getMonth() + 1);
  const highestNoUrut = suratKeluar
    .filter((s) => s.tahun === currentYear)
    .reduce((max, s) => Math.max(max, s.no_urut || 0), 0);
  const nextNoUrut = highestNoUrut + 1;
  const previewNomorSurat = generateNomorSurat(nextNoUrut, new Date());

  // Form states
  const [jenisSurat, setJenisSurat] = useState<JenisSuratKeluar>("surat_permohonan" as any);
  const [perihal, setPerihal] = useState("Permohonan Izin Pemakaian Ruang dan Laptop");
  const [tujuan, setTujuan] = useState("Kepala BLK Komunitas Bayt Al-Hikmah");
  const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().split("T")[0]);
  const [lampiran, setLampiran] = useState("-");

  // Core content input (Inti/Maksud Surat saja)
  const [intiSurat, setIntiSurat] = useState(
    "Sehubungan dengan akan dilaksanakannya kegiatan TKA (Tes Kemampuan Akademik) Susulan santri kelas XII Tahun 2026, maka kami Kepala SMK Bayt Al-Hikmah bermaksud mengajukan permohonan izin pemakaian ruang praktik BLK dan Laptop sebanyak 3 unit untuk kegiatan tersebut yang akan dilaksanakan pada:"
  );

  // Toggle & Fields for Pelaksanaan Table
  const [useTable, setUseTable] = useState(true);
  const [hariPelaksanaan, setHariPelaksanaan] = useState("Senin s.d Kamis");
  const [tglPelaksanaan, setTglPelaksanaan] = useState("16 s.d 19 November 2026");
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState("06.30 s.d 09.00 WIB");
  const [tempatPelaksanaan, setTempatPelaksanaan] = useState("");

  // Closing wording choice
  const [jenisPenutup, setJenisPenutup] = useState<"permohonan" | "tugas" | "undangan" | "pemberitahuan">("permohonan");
  const [statusTujuan, setStatusTujuan] = useState<StatusSuratKeluar>("menunggu_persetujuan");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to get closing text
  const getClosingHtml = (type: string) => {
    let word = "surat permohonan dari kami";
    if (type === "tugas") word = "surat tugas ini kami sampaikan";
    if (type === "undangan") word = "undangan ini kami sampaikan";
    if (type === "pemberitahuan") word = "pemberitahuan ini kami sampaikan";

    return `<p>Demikian ${word}, atas perhatian dan kerjasamanya kami sampaikan terima kasih. <em>Jazaakumulloh Ahsanal Jazaa’.</em></p>\n<p>Wassalamu’alaikum. wr. wb.</p>`;
  };

  // Build the complete combined letter body
  const assembleFullBodyHtml = () => {
    let html = SALAM_PEMBUKA_FIXED + "\n";

    // Format paragraphs from user's intiSurat
    const paragraphs = intiSurat
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);

    paragraphs.forEach((p) => {
      // If paragraph contains numbered items like 1. ... 2. ...
      if (p.includes("\n1.") || p.startsWith("1.")) {
        const lines = p.split("\n");
        const normalLines = lines.filter((l) => !/^\d+\./.test(l.trim()));
        const listLines = lines.filter((l) => /^\d+\./.test(l.trim()));

        if (normalLines.length > 0) {
          html += `<p>${normalLines.join("<br/>")}</p>\n`;
        }
        if (listLines.length > 0) {
          html += `<ol style="margin-left: 20px; margin-top: 4px; margin-bottom: 6px;">\n`;
          listLines.forEach((li) => {
            const cleanLi = li.replace(/^\d+\.\s*/, "");
            html += `  <li>${cleanLi}</li>\n`;
          });
          html += `</ol>\n`;
        }
      } else {
        html += `<p>${p.replace(/\n/g, "<br/>")}</p>\n`;
      }
    });

    // Append table if toggled
    if (useTable && (hariPelaksanaan || tglPelaksanaan || waktuPelaksanaan || tempatPelaksanaan)) {
      html += `<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">\n`;
      if (hariPelaksanaan.trim()) {
        html += `  <tr><td style="width: 110px; padding: 2px 0;">Hari</td><td style="padding: 2px 0;">: ${hariPelaksanaan.trim()}</td></tr>\n`;
      }
      if (tglPelaksanaan.trim()) {
        html += `  <tr><td style="padding: 2px 0;">Tanggal</td><td style="padding: 2px 0;">: ${tglPelaksanaan.trim()}</td></tr>\n`;
      }
      if (waktuPelaksanaan.trim()) {
        html += `  <tr><td style="padding: 2px 0;">Waktu</td><td style="padding: 2px 0;">: ${waktuPelaksanaan.trim()}</td></tr>\n`;
      }
      if (tempatPelaksanaan.trim()) {
        html += `  <tr><td style="padding: 2px 0;">Tempat</td><td style="padding: 2px 0;">: ${tempatPelaksanaan.trim()}</td></tr>\n`;
      }
      html += `</table>\n`;
    }

    // Append fixed Islamic closing & prayer
    html += getClosingHtml(jenisPenutup);

    return html;
  };

  const handleApplyPreset = (preset: typeof CONTOH_INTI_PRESETS[0]) => {
    setPerihal(preset.perihal);
    setTujuan(preset.tujuan);
    setJenisSurat(preset.jenis);
    setIntiSurat(preset.inti);
    setUseTable(preset.withTable);
    setHariPelaksanaan(preset.hari);
    setTglPelaksanaan(preset.tanggal);
    setWaktuPelaksanaan(preset.waktu);
    setTempatPelaksanaan(preset.tempat);
    setJenisPenutup(preset.penutupJenis as any);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perihal.trim() || !tujuan.trim() || !intiSurat.trim()) {
      alert("Harap lengkapi Perihal, Tujuan Surat, dan Inti Surat.");
      return;
    }

    setIsSubmitting(true);
    const completeBody = assembleFullBodyHtml();

    const created = addSuratKeluar({
      jenis_surat: jenisSurat,
      perihal: perihal.trim(),
      tujuan: tujuan.trim(),
      tanggal_surat: tanggalSurat,
      lampiran: lampiran.trim() || "-",
      isi_surat: completeBody,
      status: statusTujuan,
      created_by: currentUser.id,
      creator_name: `${currentUser.name} (${currentUser.jabatan})`,
      has_ttd: false,
      has_stempel: false,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/surat-keluar/${created.id}`);
    }, 350);
  };

  const currentPreviewHtml = assembleFullBodyHtml();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/surat-keluar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Surat Keluar
        </Link>
        <div className="text-xs text-gray-500">
          Format Nomor Baku:{" "}
          <strong className="text-brand-900 font-mono">{`[No]/SMK-BAYHI/${currentMonthRomawi}/${currentYear}`}</strong>
        </div>
      </div>

      {/* Main Grid Form & Live Preview */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form Input */}
        <div className="w-full lg:w-7/12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center font-bold">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Formulir Draf Surat Keluar
                </h2>
                <p className="text-xs text-gray-500">
                  Cukup isi inti/maksud surat. Salam pembuka & penutup otomatis terpasang.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-brand-50 text-brand-900 border border-brand-200 px-2.5 py-1 rounded-md">
              {previewNomorSurat}
            </span>
          </div>

          {/* Quick preset selector buttons */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Pilihan Contoh Cepat / Template:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CONTOH_INTI_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 text-left rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50/50 text-xs transition-all"
                >
                  <span className="font-bold text-gray-900 block truncate">{p.label}</span>
                  <span className="text-[10px] text-gray-500 line-clamp-1">{p.perihal}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Nomor Otomatis & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor Surat (Auto-Generate):
                </label>
                <input
                  type="text"
                  readOnly
                  value={previewNomorSurat}
                  className="w-full text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-brand-950 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal Surat:
                </label>
                <input
                  type="date"
                  required
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Row 2: Perihal */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Perihal Surat <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={perihal}
                onChange={(e) => setPerihal(e.target.value)}
                placeholder="Contoh: Permohonan Izin Pemakaian Ruang dan Laptop"
                className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Row 3: Tujuan & Lampiran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tujuan / Penerima Surat (Yth.) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Contoh: Kepala BLK Komunitas Bayt Al-Hikmah"
                  className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Format tujuan otomatis diikuti baris "Di tempat"
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Lampiran:
                </label>
                <input
                  type="text"
                  value={lampiran}
                  onChange={(e) => setLampiran(e.target.value)}
                  placeholder="Contoh: - atau 1 Berkas"
                  className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* SALAM PEMBUKA (OTOMATIS & TETAP) */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                  Salam Pembuka Resmi (Otomatis Sesuai Format SMK):
                </span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded">
                  Otomatis
                </span>
              </div>
              <p className="text-[11px] text-gray-700 italic font-serif leading-relaxed">
                "Assalamu’alaikum wr. wb. <br />
                Salam silaturrahim kami sampaikan, semoga Allah SWT senantiasa melimpahkan rahmat, taufiq, serta hidayahNya kepada kita dalam menjalani rutinitas sehari-hari. Amin"
              </p>
            </div>

            {/* FIELD UTAMA: INTI / MAKSUD SURAT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-900">
                  Isi Surat (Inti / Maksud Surat) <span className="text-rose-500">*</span>:
                </label>
                <span className="text-[11px] text-brand-700 font-medium">
                  Cukup ketik inti/maksud surat di sini
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={intiSurat}
                onChange={(e) => setIntiSurat(e.target.value)}
                placeholder="Tuliskan inti/maksud surat... Contoh: Sehubungan dengan akan dilaksanakannya kegiatan TKA Susulan santri kelas XII Tahun 2026, maka kami Kepala SMK Bayt Al-Hikmah bermaksud mengajukan permohonan izin pemakaian ruang praktik BLK dan Laptop sebanyak 3 unit untuk kegiatan tersebut yang akan dilaksanakan pada:"
                className="w-full text-xs rounded-xl border border-gray-300 p-3 leading-relaxed focus:ring-2 focus:ring-brand-500 font-serif"
              />
            </div>

            {/* TOGGLE TABEL PELAKSANAAN */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setUseTable(!useTable)}
              >
                <div className="flex items-center gap-2">
                  {useTable ? (
                    <CheckSquare className="w-4 h-4 text-brand-700" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900">
                      Sertakan Tabel Pelaksanaan (Hari, Tanggal, Waktu, Tempat)?
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Centang jika surat memerlukan rincian jadwal kegiatan. Hilangkan centang jika tidak dibutuhkan.
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    useTable
                      ? "bg-brand-100 text-brand-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {useTable ? "Tabel Aktif" : "Tidak Muncul"}
                </span>
              </div>

              {/* Tabel Inputs (Only appears if useTable is true) */}
              {useTable && (
                <div className="pt-2 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in-50">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Hari:
                    </label>
                    <input
                      type="text"
                      value={hariPelaksanaan}
                      onChange={(e) => setHariPelaksanaan(e.target.value)}
                      placeholder="Contoh: Senin s.d Kamis"
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Tanggal Pelaksanaan:
                    </label>
                    <input
                      type="text"
                      value={tglPelaksanaan}
                      onChange={(e) => setTglPelaksanaan(e.target.value)}
                      placeholder="Contoh: 16 s.d 19 November 2026"
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Waktu / Jam:
                    </label>
                    <input
                      type="text"
                      value={waktuPelaksanaan}
                      onChange={(e) => setWaktuPelaksanaan(e.target.value)}
                      placeholder="Contoh: 06.30 s.d 09.00 WIB"
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Tempat (Opsional):
                    </label>
                    <input
                      type="text"
                      value={tempatPelaksanaan}
                      onChange={(e) => setTempatPelaksanaan(e.target.value)}
                      placeholder="Contoh: Ruang Praktik BLK Komunitas"
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SALAM PENUTUP & DOA (OTOMATIS & TETAP) */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                  Salam Penutup & Doa Resmi (Otomatis):
                </span>

                <select
                  value={jenisPenutup}
                  onChange={(e) => setJenisPenutup(e.target.value as any)}
                  className="text-[10px] font-bold bg-white border border-amber-300 rounded px-2 py-0.5 text-amber-900"
                >
                  <option value="permohonan">Format Permohonan</option>
                  <option value="tugas">Format Surat Tugas</option>
                  <option value="undangan">Format Surat Undangan</option>
                  <option value="pemberitahuan">Format Pemberitahuan</option>
                </select>
              </div>

              <div
                className="text-[11px] text-gray-700 italic font-serif leading-relaxed"
                dangerouslySetInnerHTML={{ __html: getClosingHtml(jenisPenutup) }}
              />
            </div>

            {/* Status Submission Option */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-800 block">
                  Status Pengajuan Dokumen:
                </span>
                <span className="text-[11px] text-gray-500">
                  Pilih "Menunggu Persetujuan" agar otomatis masuk ke antrean TTD Kepala Sekolah.
                </span>
              </div>

              <select
                value={statusTujuan}
                onChange={(e) => setStatusTujuan(e.target.value as StatusSuratKeluar)}
                className="text-xs font-semibold rounded-lg border border-gray-300 px-3 py-1.5 bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="menunggu_persetujuan">Menunggu Persetujuan (Kepsek)</option>
                <option value="draft">Simpan Sebagai Draf Internal</option>
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/surat-keluar"
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-50 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Menyimpan Dokumen..." : "Simpan & Ajukan Surat Keluar"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-time Live Letter Preview */}
        <div className="w-full lg:w-5/12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-brand-900 font-bold text-xs uppercase tracking-wider">
              <Eye className="w-4 h-4 text-gold-600" />
              <span>Pratinjau Hasil Akhir Dokumen</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
              Ukuran Kertas: A4
            </span>
          </div>

          {/* Letter Sheet Simulation */}
          <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm font-serif text-[11px] text-gray-900 leading-relaxed overflow-hidden">
            {/* Kop Surat Resmi */}
            <OfficialKopSurat />

            {/* Letter Meta (Nomor, Lampiran, Perihal aligned) */}
            <div className="mb-4 font-serif text-[11px]">
              <table className="border-collapse">
                <tbody>
                  <tr>
                    <td className="w-16 py-0.5 text-gray-700">Nomor</td>
                    <td className="w-3 py-0.5">:</td>
                    <td className="py-0.5 font-sans font-medium">{previewNomorSurat}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">Lampiran</td>
                    <td className="py-0.5">:</td>
                    <td className="py-0.5">{lampiran || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700 align-top">Perihal</td>
                    <td className="py-0.5 align-top">:</td>
                    <td className="py-0.5 font-bold">{perihal}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Destination */}
            <div className="mb-4 font-serif text-[11px] leading-snug">
              <p>Kepada Yth.</p>
              <p className="font-bold">{tujuan || "[Penerima Surat]"}</p>
              <p>Di tempat</p>
            </div>

            {/* Full Assembled Body (Salam Pembuka + Inti + Tabel Pelaksana [jika aktif] + Salam Penutup) */}
            <div
              className="prose prose-sm max-w-none text-[11px] text-gray-900 mb-6 font-serif space-y-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentPreviewHtml }}
            />

            {/* Closing & Placeholder TTD */}
            <div className="flex justify-end font-serif mt-6">
              <div className="text-left w-56">
                <p className="text-[11px]">Pasuruan, {formatIndonesianDate(tanggalSurat)}</p>
                <p className="font-bold text-[11px]">Kepala SMK Bayt Al-Hikmah</p>
                <div className="h-16 flex items-center justify-center text-gray-400 italic text-[10px] border border-dashed border-gray-200 my-1 rounded">
                  [Tempat TTD Digital & Stempel Sah]
                </div>
                <p className="font-bold underline text-[11px]">Mokhamat Ekhsan, S.Kom</p>
                <p className="text-[9.5px] font-sans font-medium text-gray-700">NIY. 14215094</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
