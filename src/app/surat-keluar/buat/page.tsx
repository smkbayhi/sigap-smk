"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { JenisSuratKeluar, StatusSuratKeluar } from "@/lib/database.types";
import { generateNomorSurat, formatIndonesianDate, getBulanRomawi } from "@/lib/utils";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { SuratSignatureBlock } from "@/components/surat/SuratSignatureBlock";
import {
  REAL_2026_LETTER_TEMPLATES,
  LetterTemplateItem,
  LayoutFormatSurat,
  ModelTandaTangan,
  TipeTabelSurat,
  SALAM_PEMBUKA_FIXED,
  getClosingHtml,
  encodeLetterMeta,
} from "@/lib/letterTemplates";
import {
  generateJadwalPelaksanaanHtml,
  generateSppdHtml,
  generateDaftarSiswaHtml,
  generatePengantarBerkasHtml,
  generateOutingClassHtml,
  generateRincianCateringHtml,
} from "@/lib/tableGenerators";
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
  Plus,
  Trash2,
  Table as TableIcon,
  PenTool,
  Bookmark,
  Layers,
} from "lucide-react";

export default function BuatSuratKeluarPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { suratKeluar, addSuratKeluar, schoolSettings } = useAppData();

  // Auto Number: [No_Urut]/SMK-BAYHI/[Bulan_Romawi]/[Tahun]
  const currentYear = new Date().getFullYear();
  const currentMonthRomawi = getBulanRomawi(new Date().getMonth() + 1);
  const highestNoUrut = suratKeluar
    .filter((s) => s.tahun === currentYear)
    .reduce((max, s) => Math.max(max, s.no_urut || 0), 0);
  const nextNoUrut = highestNoUrut + 1;
  const previewNomorSurat = generateNomorSurat(nextNoUrut, new Date());

  // Form core states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("undangan-pembekalan-pkl");
  const [jenisSurat, setJenisSurat] = useState<JenisSuratKeluar>("surat_undangan");
  const [layoutFormat, setLayoutFormat] = useState<LayoutFormatSurat>("korespondensi");
  const [judulSurat, setJudulSurat] = useState("");
  const [perihal, setPerihal] = useState("Undangan Pembekalan PKL");
  const [tujuan, setTujuan] = useState("Direktur Pendidikan Bayt Al-Hikmah");
  const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().split("T")[0]);
  const [lampiran, setLampiran] = useState("-");

  // Core content
  const [intiSurat, setIntiSurat] = useState(
    "Sehubungan dengan dilaksanakannya Praktik Kerja Lapangan (PKL) Kelas XI DKV Tahun Pelajaran 2025/2026, maka kami mengharapkan kehadirannya untuk memberikan arahan dan pembekalan pada:"
  );

  // Table Configuration
  const [tipeTabel, setTipeTabel] = useState<TipeTabelSurat>("jadwal_pelaksanaan");

  // Table Data States
  const [jadwalData, setJadwalData] = useState({
    hari: "Sabtu",
    tanggal: "3 Januari 2026",
    waktu: "09.00 WIB s.d selesai",
    tempat: "Ruang Rapat Pimpinan SMK",
    agenda: "Pembekalan Peserta Praktik Kerja Lapangan (PKL)",
  });

  const [sppdData, setSppdData] = useState({
    hari: "Rabu",
    tanggal: "14 Januari 2026",
    waktu: "08.00 s.d 14.00 WIB",
    tempat: "Aula Pertemuan SMKN 1 Bangil",
    acara: "Workshop Pembelajaran Berbasis Standar dan Uji Sertifikasi Siswa SMK",
    pejabat: "Mokhamat Ekhsan, S.Kom",
    pegawai: "Moh. Nasih Aminulloh, S.Mat, M.Si (NIY. 23060333)",
    jabatanPegawai: "Guru Produktif / SMK Bayt Al-Hikmah",
    perjalanan: "Dari: SMK Bayt Al-Hikmah ke SMKN 1 Bangil",
    transportasi: "Mobil Operasional Sekolah",
    durasi: "Selama 1 (satu) hari",
    maksud: "Workshop Pembelajaran Berbasis Standar dan Uji Sertifikasi Siswa SMK",
    beban: "SMK Bayt Al-Hikmah",
    keterangan: "-",
  });

  const [siswaData, setSiswaData] = useState([
    { no: 1, nama: "VINA ZAMRUDAH FARADIS", nisn: "0078337633", kelas: "XII DKV", keahlian: "Desain Komunikasi Visual" },
    { no: 2, nama: "MUHAMMAD ALIF RAMADHANI", nisn: "0076543210", kelas: "XII DKV", keahlian: "Desain Komunikasi Visual" },
  ]);

  const [pengantarData, setPengantarData] = useState([
    {
      no: 1,
      jenisSurat: "Daftar Nominatif Siswa Kelas XII SMK Bayt Al-Hikmah Tahun Pelajaran 2025/2026",
      banyak: "1 (satu) Bendel",
      keterangan: "Dikirim dengan hormat untuk mendapatkan periksa.",
    },
    {
      no: 2,
      jenisSurat: "Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Data Nominasi Siswa Sesuai Dapodik",
      banyak: "1 (satu) Lembar",
      keterangan: "Terlampir sebagai kelengkapan administrasi.",
    },
  ]);

  const [outingData, setOutingData] = useState([
    {
      waktu: "Selasa, 07.00 s.d 17.30 WIB",
      pendamping: "1. Ustadz Afandi\n2. Ustadzah Iis Hannani\n3. Kedisiplinan Putra",
      tempat: "1. Putra: Telaga Madirejo Pujon\n2. Putri: Dusun Kuliner Batu\n3. Titik Kumpul: Museum Angkut Batu",
      rundown: "Terlampir",
    },
  ]);

  const [cateringData, setCateringData] = useState([
    {
      santriJk: "Putra",
      tglPkl: "5 - 10 Januari 2026",
      jmlSantri: "4 Santri",
      jmlHari: "6 Hari",
      volume: "3 kali @ Rp 4.800",
      nominal: "Rp 345.600",
      tglCatering: "11 Januari 2026",
    },
    {
      santriJk: "Putri",
      tglPkl: "5 - 17 Januari 2026",
      jmlSantri: "10 Santri",
      jmlHari: "13 Hari",
      volume: "3 kali @ Rp 4.800",
      nominal: "Rp 1.872.000",
      tglCatering: "18 Januari 2026",
    },
  ]);

  // Signature & Closing choice
  const [modelTtd, setModelTtd] = useState<ModelTandaTangan>("1_kepsek");
  const [jenisPenutup, setJenisPenutup] = useState<string>("undangan");
  const [tembusanList, setTembusanList] = useState<string[]>(["1. Arsip Sekolah"]);
  const [newTembusanInput, setNewTembusanInput] = useState("");

  const [statusTujuan, setStatusTujuan] = useState<StatusSuratKeluar>("menunggu_persetujuan");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply template
  const handleApplyTemplate = (tmpl: LetterTemplateItem) => {
    setSelectedTemplateId(tmpl.id);
    setJenisSurat(tmpl.jenis);
    setLayoutFormat(tmpl.layout);
    setJudulSurat(tmpl.judulSurat);
    setPerihal(tmpl.perihal);
    setTujuan(tmpl.tujuan);
    setIntiSurat(tmpl.inti);
    setTipeTabel(tmpl.tipeTabel);
    setModelTtd(tmpl.modelTtd);
    setJenisPenutup(tmpl.penutupJenis);
    if (tmpl.tembusan) setTembusanList(tmpl.tembusan);

    // Apply template table data
    if (tmpl.tipeTabel === "jadwal_pelaksanaan" && tmpl.tableData) {
      setJadwalData(tmpl.tableData);
    } else if (tmpl.tipeTabel === "sppd_resmi" && tmpl.tableData) {
      setSppdData(tmpl.tableData);
    } else if (tmpl.tipeTabel === "daftar_siswa" && Array.isArray(tmpl.tableData)) {
      setSiswaData(tmpl.tableData);
    } else if (tmpl.tipeTabel === "pengantar_berkas" && Array.isArray(tmpl.tableData)) {
      setPengantarData(tmpl.tableData);
    } else if (tmpl.tipeTabel === "outing_class" && Array.isArray(tmpl.tableData)) {
      setOutingData(tmpl.tableData);
    } else if (tmpl.tipeTabel === "rincian_catering" && Array.isArray(tmpl.tableData)) {
      setCateringData(tmpl.tableData);
    }
  };

  // Helper to generate the Table HTML based on active selection
  const assembleTableHtml = () => {
    switch (tipeTabel) {
      case "jadwal_pelaksanaan":
        return generateJadwalPelaksanaanHtml(jadwalData);
      case "sppd_resmi":
        return generateSppdHtml(sppdData);
      case "daftar_siswa":
        return generateDaftarSiswaHtml(siswaData);
      case "pengantar_berkas":
        return generatePengantarBerkasHtml(pengantarData);
      case "outing_class":
        return generateOutingClassHtml(outingData);
      case "rincian_catering":
        return generateRincianCateringHtml(cateringData);
      case "none":
      default:
        return "";
    }
  };

  // Build the complete combined letter body (with SIGAP_META comment header)
  const assembleFullBodyHtml = () => {
    let html = "";

    // 1. If layout is korespondensi, prepend Islamic opening
    if (layoutFormat === "korespondensi") {
      html += SALAM_PEMBUKA_FIXED + "\n";
    }

    // 2. Format paragraphs from user's intiSurat
    const paragraphs = intiSurat
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);

    paragraphs.forEach((p) => {
      // Check for numbered list
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

    // 3. Append Table HTML
    const tableMarkup = assembleTableHtml();
    if (tableMarkup) {
      html += "\n" + tableMarkup + "\n";
    }

    // 4. Append Closing
    html += getClosingHtml(jenisPenutup, layoutFormat);

    return html;
  };

  const currentPreviewBody = assembleFullBodyHtml();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perihal.trim() || !intiSurat.trim()) {
      alert("Harap lengkapi Perihal dan Inti Surat.");
      return;
    }
    if (layoutFormat === "korespondensi" && !tujuan.trim()) {
      alert("Harap lengkapi Tujuan Surat.");
      return;
    }

    setIsSubmitting(true);

    const bodyHtml = assembleFullBodyHtml();
    const metaHeader = encodeLetterMeta({
      layout: layoutFormat,
      judul: judulSurat.trim() || perihal.trim(),
      modelTtd,
      tipeTabel,
      tembusan: tembusanList.filter(Boolean),
    });

    const completePayloadHtml = `${metaHeader}\n${bodyHtml}`;

    const created = addSuratKeluar({
      jenis_surat: jenisSurat,
      perihal: perihal.trim(),
      tujuan: (tujuan.trim() || (layoutFormat === "judul_tengah" ? "Pihak yang Berkepentingan" : "-")),
      tanggal_surat: tanggalSurat,
      lampiran: lampiran.trim() || "-",
      isi_surat: completePayloadHtml,
      status: statusTujuan,
      created_by: currentUser.id,
      creator_name: `${currentUser.name} (${currentUser.jabatan})`,
      has_ttd: false,
      has_stempel: false,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/surat-keluar/${created.id}`);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/surat-keluar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Surat Keluar
        </Link>
        <div className="text-xs text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs">
          Format Nomor Baku 2026:{" "}
          <strong className="text-brand-900 font-mono font-bold">{previewNomorSurat}</strong>
        </div>
      </div>

      {/* Main Grid: Form Editor (Left) & Real-time A4 Simulation (Right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ================= LEFT COLUMN: FORM CONTROLS ================= */}
        <div className="w-full lg:w-7/12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Header */}
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Pembuat Draf Surat Keluar Resmi
                </h2>
                <p className="text-xs text-gray-500">
                  Format baku disesuaikan dengan Arsip Surat SMK Bayt Al-Hikmah Tahun 2026.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-brand-50 text-brand-900 border border-brand-200 px-2.5 py-1 rounded-md hidden sm:inline-block">
              {previewNomorSurat}
            </span>
          </div>

          {/* TEMPLATE PICKER (Real 2026 Archive) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-brand-700" />
                Pilihan Contoh Cepat / Template Resmi 2026:
              </label>
              <span className="text-[10px] font-bold text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full">
                {REAL_2026_LETTER_TEMPLATES.length} Template Siap Pakai
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {REAL_2026_LETTER_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/80 text-brand-950 font-bold ring-2 ring-brand-500/20 shadow-xs"
                        : "border-gray-200 bg-white hover:border-brand-400 hover:bg-slate-50 text-gray-700"
                    }`}
                  >
                    <span className="font-bold text-[11.5px] line-clamp-1">{tmpl.label}</span>
                    <span className="text-[10px] text-gray-500 mt-1 line-clamp-1 font-normal">
                      {tmpl.layout === "judul_tengah" ? `[Tengah] ${tmpl.judulSurat}` : `[Dinas] ${tmpl.perihal}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Format Layout & Identitas Dokumen */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                1. Tata Letak (Layout) & Identitas Surat
              </h3>

              {/* Layout Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setLayoutFormat("korespondensi")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    layoutFormat === "korespondensi"
                      ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                      : "border-gray-200 bg-slate-50/50 hover:bg-slate-100/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="layoutFormat"
                    checked={layoutFormat === "korespondensi"}
                    onChange={() => setLayoutFormat("korespondensi")}
                    className="mt-0.5 text-brand-700 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Format A: Korespondensi / Surat Dinas
                    </span>
                    <span className="text-[10.5px] text-gray-500 leading-tight block mt-0.5">
                      Nomor, Lampiran, & Perihal di sisi kiri, Kepada Yth., serta Salam Pembuka & Doa Penutup Islami.
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setLayoutFormat("judul_tengah")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    layoutFormat === "judul_tengah"
                      ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                      : "border-gray-200 bg-slate-50/50 hover:bg-slate-100/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="layoutFormat"
                    checked={layoutFormat === "judul_tengah"}
                    onChange={() => setLayoutFormat("judul_tengah")}
                    className="mt-0.5 text-brand-700 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Format B: Judul Tengah (Surat Tugas / Rekomendasi)
                    </span>
                    <span className="text-[10.5px] text-gray-500 leading-tight block mt-0.5">
                      Judul kapital bergaris bawah tebal di tengah, Nomor di bawah judul, langsung pengantar resmi.
                    </span>
                  </div>
                </div>
              </div>

              {/* Conditional Judul Surat for Format B */}
              {layoutFormat === "judul_tengah" && (
                <div className="animate-in fade-in-50">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Judul Dokumen (Kapital & Garis Bawah di Tengah) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={judulSurat}
                    onChange={(e) => setJudulSurat(e.target.value)}
                    placeholder="Contoh: SURAT TUGAS, SURAT REKOMENDASI, SURAT KUASA, dll."
                    className="w-full text-xs font-bold font-mono tracking-wider rounded-xl border border-gray-300 px-3 py-2 uppercase focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Nomor & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nomor Surat (Otomatis):
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

              {/* Perihal & Lampiran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Perihal / Hal Surat <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={perihal}
                    onChange={(e) => setPerihal(e.target.value)}
                    placeholder="Contoh: Undangan Pembekalan PKL"
                    className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500"
                  />
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

              {/* Tujuan Surat (Shown for Format A, or optional note for Format B) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tujuan / Penerima Surat (Yth.) {layoutFormat === "korespondensi" && <span className="text-rose-500">*</span>}:
                </label>
                <input
                  type="text"
                  required={layoutFormat === "korespondensi"}
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder={
                    layoutFormat === "korespondensi"
                      ? "Contoh: Direktur Pendidikan Bayt Al-Hikmah / Kepala BLK Komunitas"
                      : "Contoh: Moh. Nasih Aminulloh, S.Mat, M.Si (atau pihak terkait)"
                  }
                  className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500"
                />
                {layoutFormat === "korespondensi" && (
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Format korespondensi otomatis dilengkapi baris "Di tempat"
                  </span>
                )}
              </div>
            </div>

            {/* Section 2: Isi Surat (Inti/Maksud Surat) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-brand-600" />
                  2. Isi Utama Dokumen
                </h3>
                {layoutFormat === "korespondensi" && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    Salam Pembuka Islami Terpasang Otomatis
                  </span>
                )}
              </div>

              {/* Salam info banner */}
              {layoutFormat === "korespondensi" && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-950 italic font-serif leading-relaxed">
                  "Assalamu’alaikum wr. wb. Salam silaturrahim kami sampaikan, semoga Allah SWT senantiasa melimpahkan rahmat, taufiq, serta hidayahNya kepada kita dalam menjalani rutinitas sehari-hari. Amin."
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Inti / Maksud Surat <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={6}
                  required
                  value={intiSurat}
                  onChange={(e) => setIntiSurat(e.target.value)}
                  placeholder="Ketikkan teks inti surat Anda di sini..."
                  className="w-full text-xs rounded-xl border border-gray-300 p-3 leading-relaxed focus:ring-2 focus:ring-brand-500 font-serif"
                />
                <span className="text-[10.5px] text-gray-400 block mt-1">
                  Tips: Pisahkan antar-paragraf dengan menekan Enter 2 kali. Gunakan penomoran (1., 2.) untuk daftar butir.
                </span>
              </div>
            </div>

            {/* Section 3: Sertakan Tabel Interaktif */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5 text-brand-700" />
                  3. Sertakan Tabel Pelaksanaan / Rincian Dokumen
                </h3>
                <span className="text-[10px] font-bold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full">
                  {tipeTabel === "none" ? "Tanpa Tabel" : "Tabel Aktif"}
                </span>
              </div>

              {/* Tipe Tabel Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Pilih Format Tabel:
                </label>
                <select
                  value={tipeTabel}
                  onChange={(e) => setTipeTabel(e.target.value as TipeTabelSurat)}
                  className="w-full text-xs font-semibold rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="none">Tanpa Tabel</option>
                  <option value="jadwal_pelaksanaan">📅 Tabel Jadwal Pelaksanaan (Hari, Tanggal, Waktu, Tempat, Agenda)</option>
                  <option value="sppd_resmi">🎖️ Tabel SPPD Resmi (8 Butir Standar Pemerintah)</option>
                  <option value="daftar_siswa">🎓 Tabel Siswa / Rekomendasi Kolektif (Daftar Nama Siswa)</option>
                  <option value="pengantar_berkas">📂 Tabel Pengantar Berkas Cabdin (No, Berkas, Jumlah, Keterangan)</option>
                  <option value="outing_class">🚌 Tabel Outing Class Santri (Rute & Rundown)</option>
                  <option value="rincian_catering">🍱 Tabel Rincian Anggaran / Catering Santri PKL</option>
                </select>
              </div>

              {/* TABEL TYPE A: JADWAL PELAKSANAAN */}
              {tipeTabel === "jadwal_pelaksanaan" && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 animate-in fade-in-50">
                  <span className="text-xs font-bold text-brand-900 block">
                    Isi Rincian Jadwal Pelaksanaan:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Hari:</label>
                      <input
                        type="text"
                        value={jadwalData.hari}
                        onChange={(e) => setJadwalData({ ...jadwalData, hari: e.target.value })}
                        placeholder="Contoh: Sabtu"
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Tanggal Pelaksanaan:</label>
                      <input
                        type="text"
                        value={jadwalData.tanggal}
                        onChange={(e) => setJadwalData({ ...jadwalData, tanggal: e.target.value })}
                        placeholder="Contoh: 3 Januari 2026"
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Pukul / Waktu:</label>
                      <input
                        type="text"
                        value={jadwalData.waktu}
                        onChange={(e) => setJadwalData({ ...jadwalData, waktu: e.target.value })}
                        placeholder="Contoh: 09.00 WIB s.d selesai"
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Tempat:</label>
                      <input
                        type="text"
                        value={jadwalData.tempat}
                        onChange={(e) => setJadwalData({ ...jadwalData, tempat: e.target.value })}
                        placeholder="Contoh: Ruang Rapat Pimpinan SMK"
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-gray-700 mb-1">Agenda / Acara:</label>
                      <input
                        type="text"
                        value={jadwalData.agenda}
                        onChange={(e) => setJadwalData({ ...jadwalData, agenda: e.target.value })}
                        placeholder="Contoh: Pembekalan Peserta Praktik Kerja Lapangan (PKL)"
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TABEL TYPE B: SPPD RESMI 8 BUTIR */}
              {tipeTabel === "sppd_resmi" && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 animate-in fade-in-50 text-xs">
                  <span className="text-xs font-bold text-brand-900 block">
                    Isian Formulir SPPD Resmi (8 Butir Standar Cabdin & Kemdikbud):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">1. Pejabat yang Berwenang:</label>
                      <input
                        type="text"
                        value={sppdData.pejabat}
                        onChange={(e) => setSppdData({ ...sppdData, pejabat: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">2. Pegawai yang Diperintahkan:</label>
                      <input
                        type="text"
                        value={sppdData.pegawai}
                        onChange={(e) => setSppdData({ ...sppdData, pegawai: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">3. Jabatan / Golongan:</label>
                      <input
                        type="text"
                        value={sppdData.jabatanPegawai}
                        onChange={(e) => setSppdData({ ...sppdData, jabatanPegawai: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">4. Perjalanan Dinas Dari & Ke:</label>
                      <input
                        type="text"
                        value={sppdData.perjalanan}
                        onChange={(e) => setSppdData({ ...sppdData, perjalanan: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Transportasi Menggunakan:</label>
                      <input
                        type="text"
                        value={sppdData.transportasi}
                        onChange={(e) => setSppdData({ ...sppdData, transportasi: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">5. Lamanya Perjalanan Dinas:</label>
                      <input
                        type="text"
                        value={sppdData.durasi}
                        onChange={(e) => setSppdData({ ...sppdData, durasi: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-gray-700 mb-1">6. Maksud Perjalanan Dinas:</label>
                      <input
                        type="text"
                        value={sppdData.maksud}
                        onChange={(e) => setSppdData({ ...sppdData, maksud: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">7. Pembebanan Biaya:</label>
                      <input
                        type="text"
                        value={sppdData.beban}
                        onChange={(e) => setSppdData({ ...sppdData, beban: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">8. Keterangan Lain-Lain:</label>
                      <input
                        type="text"
                        value={sppdData.keterangan}
                        onChange={(e) => setSppdData({ ...sppdData, keterangan: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 p-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TABEL TYPE C: DAFTAR SISWA DINAMIS */}
              {tipeTabel === "daftar_siswa" && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 animate-in fade-in-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-900">Daftar Baris Siswa:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSiswaData([
                          ...siswaData,
                          {
                            no: siswaData.length + 1,
                            nama: "",
                            nisn: "",
                            kelas: "XII DKV",
                            keahlian: "Desain Komunikasi Visual",
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Siswa
                    </button>
                  </div>

                  <div className="space-y-2">
                    {siswaData.map((row, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-1 font-bold text-center text-gray-500">{idx + 1}</span>
                        <input
                          type="text"
                          value={row.nama}
                          onChange={(e) => {
                            const updated = [...siswaData];
                            updated[idx].nama = e.target.value;
                            setSiswaData(updated);
                          }}
                          placeholder="Nama Siswa"
                          className="col-span-4 text-xs rounded border border-gray-300 p-1.5"
                        />
                        <input
                          type="text"
                          value={row.nisn}
                          onChange={(e) => {
                            const updated = [...siswaData];
                            updated[idx].nisn = e.target.value;
                            setSiswaData(updated);
                          }}
                          placeholder="NISN"
                          className="col-span-3 text-xs rounded border border-gray-300 p-1.5"
                        />
                        <input
                          type="text"
                          value={row.kelas}
                          onChange={(e) => {
                            const updated = [...siswaData];
                            updated[idx].kelas = e.target.value;
                            setSiswaData(updated);
                          }}
                          placeholder="Kelas"
                          className="col-span-2 text-xs rounded border border-gray-300 p-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => setSiswaData(siswaData.filter((_, i) => i !== idx))}
                          className="col-span-2 text-rose-600 hover:text-rose-800 p-1 flex justify-center"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TABEL TYPE D: PENGANTAR BERKAS DINAMIS */}
              {tipeTabel === "pengantar_berkas" && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 animate-in fade-in-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-900">Daftar Berkas Pengantar:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPengantarData([
                          ...pengantarData,
                          {
                            no: pengantarData.length + 1,
                            jenisSurat: "",
                            banyak: "1 (satu) Berkas",
                            keterangan: "Dikirim dengan hormat untuk mendapatkan periksa.",
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Berkas
                    </button>
                  </div>

                  <div className="space-y-2">
                    {pengantarData.map((row, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-700">Berkas #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setPengantarData(pengantarData.filter((_, i) => i !== idx))}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                        <input
                          type="text"
                          value={row.jenisSurat}
                          onChange={(e) => {
                            const updated = [...pengantarData];
                            updated[idx].jenisSurat = e.target.value;
                            setPengantarData(updated);
                          }}
                          placeholder="Nama/Jenis Dokumen..."
                          className="w-full text-xs rounded border border-gray-300 p-1.5"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={row.banyak}
                            onChange={(e) => {
                              const updated = [...pengantarData];
                              updated[idx].banyak = e.target.value;
                              setPengantarData(updated);
                            }}
                            placeholder="Jumlah (misal: 1 Bendel)"
                            className="text-xs rounded border border-gray-300 p-1.5"
                          />
                          <input
                            type="text"
                            value={row.keterangan}
                            onChange={(e) => {
                              const updated = [...pengantarData];
                              updated[idx].keterangan = e.target.value;
                              setPengantarData(updated);
                            }}
                            placeholder="Keterangan..."
                            className="text-xs rounded border border-gray-300 p-1.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TABEL TYPE E: OUTING CLASS */}
              {tipeTabel === "outing_class" && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 animate-in fade-in-50 text-xs">
                  <span className="font-bold text-brand-900 block">Rincian Lokasi Outing Class & Pendamping:</span>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Waktu Pelaksanaan:</label>
                      <input
                        type="text"
                        value={outingData[0]?.waktu || ""}
                        onChange={(e) => {
                          const updated = [...outingData];
                          updated[0].waktu = e.target.value;
                          setOutingData(updated);
                        }}
                        className="w-full text-xs rounded border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Daftar Pendamping:</label>
                      <textarea
                        rows={3}
                        value={outingData[0]?.pendamping || ""}
                        onChange={(e) => {
                          const updated = [...outingData];
                          updated[0].pendamping = e.target.value;
                          setOutingData(updated);
                        }}
                        className="w-full text-xs rounded border border-gray-300 p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Tempat Tujuan (Putra / Putri):</label>
                      <textarea
                        rows={3}
                        value={outingData[0]?.tempat || ""}
                        onChange={(e) => {
                          const updated = [...outingData];
                          updated[0].tempat = e.target.value;
                          setOutingData(updated);
                        }}
                        className="w-full text-xs rounded border border-gray-300 p-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TABEL TYPE F: RINCIAN CATERING */}
              {tipeTabel === "rincian_catering" && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 animate-in fade-in-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-900">Rincian Biaya Santri:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCateringData([
                          ...cateringData,
                          {
                            santriJk: "Putra",
                            tglPkl: "Januari 2026",
                            jmlSantri: "4",
                            jmlHari: "6",
                            volume: "3 kali @ Rp 4.800",
                            nominal: "Rp 345.600",
                            tglCatering: "11 Januari 2026",
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cateringData.map((row, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={row.santriJk}
                          onChange={(e) => {
                            const upd = [...cateringData];
                            upd[idx].santriJk = e.target.value;
                            setCateringData(upd);
                          }}
                          placeholder="Putra/Putri"
                          className="col-span-2 text-xs rounded border border-gray-300 p-1"
                        />
                        <input
                          type="text"
                          value={row.tglPkl}
                          onChange={(e) => {
                            const upd = [...cateringData];
                            upd[idx].tglPkl = e.target.value;
                            setCateringData(upd);
                          }}
                          placeholder="Tgl PKL"
                          className="col-span-3 text-xs rounded border border-gray-300 p-1"
                        />
                        <input
                          type="text"
                          value={row.volume}
                          onChange={(e) => {
                            const upd = [...cateringData];
                            upd[idx].volume = e.target.value;
                            setCateringData(upd);
                          }}
                          placeholder="Volume"
                          className="col-span-3 text-xs rounded border border-gray-300 p-1"
                        />
                        <input
                          type="text"
                          value={row.nominal}
                          onChange={(e) => {
                            const upd = [...cateringData];
                            upd[idx].nominal = e.target.value;
                            setCateringData(upd);
                          }}
                          placeholder="Nominal"
                          className="col-span-3 text-xs rounded border border-gray-300 p-1 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setCateringData(cateringData.filter((_, i) => i !== idx))}
                          className="col-span-1 text-rose-600 hover:text-rose-800 p-1 flex justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Model Pengesahan & Tanda Tangan */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <PenTool className="w-3.5 h-3.5 text-brand-600" />
                4. Model Tanda Tangan & Tembusan
              </h3>

              {/* Model TTD Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Format Penandatangan Dokumen:
                </label>
                <select
                  value={modelTtd}
                  onChange={(e) => setModelTtd(e.target.value as ModelTandaTangan)}
                  className="w-full text-xs font-semibold rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="1_kepsek">1 Pihak: Kepala SMK Bayt Al-Hikmah (Standar Resmi)</option>
                  <option value="2_cabdin">2 Pihak: Mengetahui Kepala Cabang Dinas Pendidikan (Kiri) + Kepala Sekolah (Kanan)</option>
                  <option value="2_yayasan">2 Pihak: Mengetahui Direktur Pendidikan Yayasan (Kiri) + Kepala Sekolah (Kanan)</option>
                  <option value="3_bank_jatim">3 Pihak: Surat Kuasa Bank Jatim (Penerima Kuasa + Kepala SMKS + Bendahara BOS)</option>
                  <option value="sp_kedisiplinan">3 Pihak: Surat Peringatan SP (Penerima SP + Kepala Sekolah + Mengetahui Wadir)</option>
                </select>
              </div>

              {/* Salam Penutup Pilihan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pilihan Kalimat Penutup & Doa:
                </label>
                <select
                  value={jenisPenutup}
                  onChange={(e) => setJenisPenutup(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 p-2 bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="undangan">Format Surat Undangan ("Demikian undangan ini...")</option>
                  <option value="permohonan">Format Permohonan ("Demikian surat permohonan dari kami...")</option>
                  <option value="tugas">Format Surat Tugas ("Demikian surat tugas ini diberikan...")</option>
                  <option value="keterangan">Format Keterangan / Rekomendasi ("Demikian surat keterangan ini...")</option>
                  <option value="pemberitahuan">Format Pemberitahuan Umum</option>
                  <option value="peringatan">Format Surat Peringatan / Evaluasi</option>
                </select>
              </div>

              {/* Tembusan Dinamis */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tembusan Surat (Opsional):
                </label>
                <div className="space-y-1.5 mb-2">
                  {tembusanList.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                      <span className="text-gray-800">{t}</span>
                      <button
                        type="button"
                        onClick={() => setTembusanList(tembusanList.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTembusanInput}
                    onChange={(e) => setNewTembusanInput(e.target.value)}
                    placeholder="Tambah tembusan baru (Contoh: Arsip)"
                    className="flex-1 text-xs rounded-xl border border-gray-300 px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTembusanInput.trim()) {
                        const prefix = `${tembusanList.length + 1}. `;
                        setTembusanList([...tembusanList, prefix + newTembusanInput.trim()]);
                        setNewTembusanInput("");
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Submission Status */}
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

            {/* Submit Action Buttons */}
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

        {/* ================= RIGHT COLUMN: REAL-TIME LIVE PREVIEW ================= */}
        <div className="w-full lg:w-5/12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-brand-900 font-bold text-xs uppercase tracking-wider">
              <Eye className="w-4 h-4 text-gold-600" />
              <span>Pratinjau Hasil Akhir Dokumen</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
              Ukuran Kertas: A4 (Standar Pasuruan)
            </span>
          </div>

          {/* Letter Sheet Simulation */}
          <div
            className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm surat-resmi text-[11px] text-gray-900 leading-relaxed overflow-hidden"
            style={{ fontFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", Georgia, serif' }}
          >
            {/* Kop Surat Resmi */}
            <OfficialKopSurat />

            {/* FORMAT B: JUDUL TENGAH */}
            {layoutFormat === "judul_tengah" && (
              <div className="text-center my-3">
                <h2 className="text-[13pt] font-bold uppercase underline tracking-wider text-black">
                  {judulSurat || perihal || "SURAT RESMI"}
                </h2>
                <p className="text-[10pt] font-medium text-black mt-0.5">
                  Nomor: {previewNomorSurat}
                </p>
              </div>
            )}

            {/* FORMAT A: KORESPONDENSI DINAS */}
            {layoutFormat === "korespondensi" && (
              <>
                <div className="mb-3 text-[11px]">
                  <table className="border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-16 py-0.5 text-gray-700">Nomor</td>
                        <td className="w-3 py-0.5">:</td>
                        <td className="py-0.5 font-medium">{previewNomorSurat}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-gray-700">Lampiran</td>
                        <td className="py-0.5">:</td>
                        <td className="py-0.5">{lampiran || "-"}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-gray-700 align-top">Perihal</td>
                        <td className="py-0.5 align-top">:</td>
                        <td className="py-0.5 font-bold text-black">{perihal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Destination */}
                <div className="mb-3 text-[11px] leading-snug">
                  <p>Kepada Yth.</p>
                  <p className="font-bold text-black">{tujuan || "[Penerima Surat]"}</p>
                  <p>Di tempat</p>
                </div>
              </>
            )}

            {/* Assembled Body Preview */}
            <div
              className="prose prose-sm max-w-none text-[11px] text-black mb-4 space-y-2 leading-relaxed text-justify"
              dangerouslySetInnerHTML={{ __html: currentPreviewBody }}
            />

            {/* Signature Block Simulation */}
            <SuratSignatureBlock
              modelTtd={modelTtd}
              tanggalSurat={tanggalSurat}
              namaKepsek={schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom"}
              niyKepsek={schoolSettings?.niyKepsek || "14215094"}
              namaPenerima={tujuan}
              tembusan={tembusanList.filter(Boolean)}
              isPrint={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
