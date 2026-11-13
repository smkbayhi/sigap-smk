"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { JenisSuratKeluar, StatusSuratKeluar } from "@/lib/database.types";
import { generateNomorSurat, formatIndonesianDate, getBulanRomawi } from "@/lib/utils";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { OfficialFooterSurat } from "@/components/kop-surat/OfficialFooterSurat";
import { SuratSignatureBlock } from "@/components/surat/SuratSignatureBlock";
import {
  REAL_2026_LETTER_TEMPLATES,
  LetterTemplateItem,
  LayoutFormatSurat,
  TemplateKopSurat,
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
  Bookmark,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [jenisSurat, setJenisSurat] = useState<JenisSuratKeluar>("surat_undangan");
  const [kopVariant, setKopVariant] = useState<TemplateKopSurat>("tradisional");
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
      // 1. Check for numbered list
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
        return;
      }

      // 2. Check for key-value pair lines (e.g. Nama : ..., NIY : ..., Jabatan : ...)
      const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
      const kvRegex = /^([A-Za-z0-9\s\/\(\)\.,'-]{2,30})\s*:\s*(.+)$/;
      const kvLines = lines.filter((l) => kvRegex.test(l));
      const nonKvLines = lines.filter((l) => !kvRegex.test(l));

      if (kvLines.length >= 2 && kvLines.length >= lines.length / 2) {
        if (nonKvLines.length > 0) {
          html += `<p>${nonKvLines.join("<br/>")}</p>\n`;
        }
        html += `<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11pt;">\n`;
        kvLines.forEach((l, idx) => {
          const m = l.match(kvRegex);
          if (m) {
            const widthStyle = idx === 0 ? "width: 130px; " : "";
            html += `  <tr><td style="${widthStyle}padding: 3px 0; vertical-align: top;">${m[1].trim()}</td><td style="padding: 3px 0; vertical-align: top;">: ${m[2].trim()}</td></tr>\n`;
          }
        });
        html += `</table>\n`;
        return;
      }

      // 3. Normal paragraph
      html += `<p>${p.replace(/\n/g, "<br/>")}</p>\n`;
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
      kopVariant,
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

  const handleSelectBlank = () => {
    setSelectedTemplateId("");
    setJenisSurat("surat_undangan");
    setLayoutFormat("korespondensi");
    setJudulSurat("");
    setPerihal("");
    setTujuan("");
    setIntiSurat("");
    setTipeTabel("none");
    setModelTtd("1_kepsek");
    setJenisPenutup("undangan");
    setLampiran("-");
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
                  Buat Surat Keluar
                </h2>
                <p className="text-xs text-gray-500">
                  Pilih contoh surat untuk isi otomatis, atau ketik langsung kebutuhan Anda.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-brand-50 text-brand-900 border border-brand-200 px-2.5 py-1 rounded-md hidden sm:inline-block">
              {previewNomorSurat}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Pilih Contoh / Template Surat (1 Dropdown Ringkas) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-brand-700" />
                  Pilih Contoh Surat (Otomatis Mengisi Format):
                </span>
                <span className="text-[10px] text-gray-400 font-normal">Bisa diedit kembali</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    handleSelectBlank();
                  } else {
                    const tmpl = REAL_2026_LETTER_TEMPLATES.find((t) => t.id === val);
                    if (tmpl) handleApplyTemplate(tmpl);
                  }
                }}
                className="w-full text-xs font-semibold rounded-xl border border-gray-300 p-2.5 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer"
              >
                <option value="">-- Ketik Surat Kosong / Kustom Sendiri --</option>
                <optgroup label="Surat Undangan & Kegiatan">
                  <option value="undangan-pembekalan-pkl">Undangan Pembekalan Siswa PKL DKV</option>
                </optgroup>
                <optgroup label="Surat Tugas & SPPD">
                  <option value="surat-tugas-guru">Surat Tugas Guru / Workshop</option>
                </optgroup>
                <optgroup label="Surat Permohonan">
                  <option value="permohonan-ruang-laptop-blk">Permohonan Izin Pemakaian Ruang & Laptop BLK</option>
                  <option value="permohonan-outing-class">Permohonan Izin Outing Class ke Pesantren</option>
                  <option value="permohonan-biaya-catering-pkl">Permohonan Biaya Catering Santri PKL (Yayasan)</option>
                </optgroup>
                <optgroup label="Kesiswaan & Beasiswa">
                  <option value="rekomendasi-siswa-kolektif">Surat Rekomendasi Siswa Kolektif (Golden Ticket ITS)</option>
                  <option value="keterangan-siswa-eligible">Surat Keterangan Siswa Eligible SNBP</option>
                  <option value="keterangan-beasiswa-spp">Surat Keterangan Siswa Berprestasi Bebas SPP</option>
                  <option value="keterangan-mutasi-keluar-cabdin">Surat Keterangan Mutasi Keluar Siswa</option>
                </optgroup>
                <optgroup label="Pengantar & Kuasa">
                  <option value="surat-pengantar-cabdin">Surat Pengantar Berkas Nominasi ke Cabdin</option>
                  <option value="surat-kuasa-bank-jatim">Surat Kuasa Rekening Giro BOS Bank Jatim</option>
                </optgroup>
                <optgroup label="Peringatan & Evaluasi">
                  <option value="surat-peringatan-presensi-guru">Surat Peringatan (SP) Kedisiplinan Guru</option>
                </optgroup>
              </select>
            </div>

            {/* 2. Tujuan / Penerima Surat */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {layoutFormat === "korespondensi" ? "Kepada Yth. (Tujuan Surat)" : "Penerima Tugas / Pihak yang Dituju"} <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
                placeholder={
                  layoutFormat === "korespondensi"
                    ? "Contoh: Direktur Pendidikan Bayt Al-Hikmah / Kepala BLK Komunitas"
                    : "Contoh: Moh. Nasih Aminulloh, S.Mat, M.Si"
                }
                className="w-full text-xs font-medium rounded-xl border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-brand-500"
              />
              {layoutFormat === "korespondensi" && (
                <span className="text-[10px] text-gray-400 mt-1 block">
                  * Baris "Di tempat" otomatis ditambahkan di bawah nama penerima.
                </span>
              )}
            </div>

            {/* 3. Perihal & Tanggal Surat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Perihal / Hal Surat <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Contoh: Undangan Pembekalan PKL"
                  className="w-full text-xs font-medium rounded-xl border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Tanggal Surat:
                </label>
                <input
                  type="date"
                  required
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* 4. Waktu & Tempat Pelaksanaan (Hanya jika surat berjadwal) */}
            {tipeTabel === "jadwal_pelaksanaan" && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-700" />
                    Waktu, Tempat & Agenda Pelaksanaan:
                  </span>
                  <span className="text-[10px] text-brand-700 font-semibold bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                    Tabel Terpasang Otomatis
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Hari:</label>
                    <input
                      type="text"
                      value={jadwalData.hari}
                      onChange={(e) => setJadwalData({ ...jadwalData, hari: e.target.value })}
                      placeholder="Hari (Sabtu)"
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Tanggal Pelaksanaan:</label>
                    <input
                      type="text"
                      value={jadwalData.tanggal}
                      onChange={(e) => setJadwalData({ ...jadwalData, tanggal: e.target.value })}
                      placeholder="3 Januari 2026"
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Pukul / Waktu:</label>
                    <input
                      type="text"
                      value={jadwalData.waktu}
                      onChange={(e) => setJadwalData({ ...jadwalData, waktu: e.target.value })}
                      placeholder="09.00 WIB s.d selesai"
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Tempat:</label>
                    <input
                      type="text"
                      value={jadwalData.tempat}
                      onChange={(e) => setJadwalData({ ...jadwalData, tempat: e.target.value })}
                      placeholder="Ruang Rapat SMK"
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-gray-600 mb-0.5">Agenda / Acara:</label>
                    <input
                      type="text"
                      value={jadwalData.agenda}
                      onChange={(e) => setJadwalData({ ...jadwalData, agenda: e.target.value })}
                      placeholder="Agenda kegiatan"
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Isi / Redaksi Surat */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-800">
                  Isi / Maksud Surat <span className="text-rose-500">*</span>:
                </label>
                <span className="text-[10px] text-gray-400">
                  Salam pembuka & penutup Islami baku disisipkan otomatis
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={intiSurat}
                onChange={(e) => setIntiSurat(e.target.value)}
                placeholder="Ketikkan teks inti surat di sini..."
                className="w-full text-xs rounded-xl border border-gray-300 p-3 leading-relaxed focus:ring-2 focus:ring-brand-500 font-serif"
              />
            </div>

            {/* 6. Pengaturan Lanjutan (Accordion Lipat Rapi) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-700 hover:text-gray-900 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-700" />
                  Opsi Tambahan (Lampiran, Pilihan Kop, Penandatangan)
                </span>
                {showAdvancedOptions ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {showAdvancedOptions && (
                <div className="p-3.5 border-t border-slate-200 bg-white space-y-3.5 text-xs animate-in fade-in-50">
                  {/* Kop Surat Variant */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Pilihan Template Kop Surat:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setKopVariant("tradisional")}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                          kopVariant === "tradisional"
                            ? "border-brand-600 bg-brand-50/80 font-bold text-brand-950 ring-1 ring-brand-500/30"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-slate-50"
                        }`}
                      >
                        Kop Tradisional (Standar)
                      </button>
                      <button
                        type="button"
                        onClick={() => setKopVariant("modern_2027")}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                          kopVariant === "modern_2027"
                            ? "border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-1 ring-emerald-500/30"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-slate-50"
                        }`}
                      >
                        Kop Modern (TP 2027/2028)
                      </button>
                    </div>
                  </div>

                  {/* Format Layout */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Format Surat:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLayoutFormat("korespondensi")}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                          layoutFormat === "korespondensi"
                            ? "border-brand-600 bg-brand-50/80 font-bold text-brand-950 ring-1 ring-brand-500/30"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-slate-50"
                        }`}
                      >
                        Surat Dinas (Korespondensi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLayoutFormat("judul_tengah")}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                          layoutFormat === "judul_tengah"
                            ? "border-brand-600 bg-brand-50/80 font-bold text-brand-950 ring-1 ring-brand-500/30"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-slate-50"
                        }`}
                      >
                        Judul Tengah (Surat Tugas)
                      </button>
                    </div>
                  </div>

                  {/* Lampiran */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Lampiran Surat:
                    </label>
                    <input
                      type="text"
                      value={lampiran}
                      onChange={(e) => setLampiran(e.target.value)}
                      placeholder="Contoh: - atau 1 Berkas"
                      className="w-full text-xs rounded-lg border border-gray-300 p-2"
                    />
                  </div>

                  {/* Model Penandatangan */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Penandatangan Surat:
                    </label>
                    <select
                      value={modelTtd}
                      onChange={(e) => setModelTtd(e.target.value as ModelTandaTangan)}
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white"
                    >
                      <option value="1_kepsek">1 Pihak: Kepala SMK Bayt Al-Hikmah (Standar)</option>
                      <option value="2_cabdin">2 Pihak: Mengetahui Cabdin Pasuruan</option>
                      <option value="2_yayasan">2 Pihak: Mengetahui Direktur Yayasan</option>
                      <option value="3_bank_jatim">3 Pihak: Surat Kuasa Bank Jatim BOS</option>
                      <option value="sp_kedisiplinan">3 Pihak: Surat Peringatan (Wadir Pesantren)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 7. Baris Simpan & Pengajuan */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Status:</span>
                <select
                  value={statusTujuan}
                  onChange={(e) => setStatusTujuan(e.target.value as StatusSuratKeluar)}
                  className="text-xs font-semibold rounded-lg border border-gray-300 px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="menunggu_persetujuan">Ajukan ke Kepala Sekolah</option>
                  <option value="draft">Simpan Sebagai Draf</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/surat-keluar"
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-50 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Menyimpan..." : "Simpan Surat"}
                </button>
              </div>
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
            {/* Kop Surat Resmi (Sesuai Pilihan: Tradisional atau Modern TP 2027/2028) */}
            <OfficialKopSurat variant={kopVariant} />

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

            {/* Official Footer Accent Bar (Aktif bila Template Kop Modern TP 2027/2028 dipilih) */}
            <OfficialFooterSurat variant={kopVariant} isPrint={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
