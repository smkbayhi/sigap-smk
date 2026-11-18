"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Sparkles,
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { NotulenPembahasanSection, NotulenActionItem } from "@/lib/database.types";
import MeetingAudioAiRecorder from "@/components/notulen/MeetingAudioAiRecorder";

export default function CreateNotulenPage() {
  const router = useRouter();
  const { addNotulen, schoolSettings } = useAppData();
  const { currentUser, users, isKepsek } = useAuth();

  // Helper date formatter
  const today = new Date();
  const formatDateForDisplay = (d: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const todayIso = today.toISOString().split("T")[0];

  // Form State
  const [jenisRapat, setJenisRapat] = useState("Rapat Koordinasi Persiapan Penilaian Akhir Semester (PAS)");
  const [nomorNotulen, setNomorNotulen] = useState("");
  const [tanggal, setTanggal] = useState(todayIso);
  const [hariTanggal, setHariTanggal] = useState(formatDateForDisplay(today));
  const [waktu, setWaktu] = useState("Pukul 09.00 – 11.30 WIB");
  const [tempat, setTempat] = useState("Ruang Guru SMK Bayt Al-Hikmah");
  const [pemimpinRapat, setPemimpinRapat] = useState(
    schoolSettings?.namaKepsek ? `${schoolSettings.namaKepsek} (Kepala Sekolah)` : "Mokhamat Ekhsan, S.Kom (Kepala Sekolah)"
  );
  const [pemimpinNip, setPemimpinNip] = useState(schoolSettings?.niyKepsek || "14215094");
  const [notulis, setNotulis] = useState(currentUser.name);
  const [notulisNip, setNotulisNip] = useState(currentUser.niy || currentUser.nip || "");
  const [pesertaRapat, setPesertaRapat] = useState("Seluruh Dewan Guru & Staf (32 orang)");

  // Susunan Acara
  const [susunanAcara, setSusunanAcara] = useState<string[]>([
    "Pembukaan",
    "Pengarahan Kepala Sekolah",
    "Pembahasan Teknis Pelaksanaan PAS",
    "Sesi Tanya Jawab dan Masukan",
    "Kesimpulan dan Penutup",
  ]);

  // Pembahasan
  const [pembahasan, setPembahasan] = useState<NotulenPembahasanSection[]>([
    {
      judul: "Pembukaan",
      keterangan: "Rapat dibuka oleh pembawa acara pada pukul 09.05 WIB dengan membaca basmalah bersama.",
      poin_poin: [],
    },
    {
      judul: "Pengarahan Kepala Sekolah",
      keterangan: "",
      poin_poin: [
        "Kepala Sekolah mengingatkan pentingnya kedisiplinan guru dalam mengumpulkan naskah soal tepat waktu.",
        "Pelaksanaan ujian harus berjalan jujur, tertib, dan kondusif.",
      ],
    },
    {
      judul: "Pembahasan Inti",
      keterangan: "",
      poin_poin: [
        "Wakil Kepala Sekolah Bidang Kurikulum memaparkan jadwal pelaksanaan PAS yang akan dimulai pada akhir bulan.",
        "Sistem ujian menggunakan metode berbasis komputer/gawai (CBT) untuk kelas tinggi dan kertas untuk kelas rendah.",
        "Pembagian tugas panitia pelaksana dan jadwal pengawas ruang ujian.",
      ],
    },
    {
      judul: "Tanggapan / Masukan Peserta",
      keterangan: "",
      poin_poin: [
        "Bapak Budi Santoso mengusulkan agar jaringan Wi-Fi sekolah dicek dan ditambah kapasitasnya sebelum ujian dimulai untuk menghindari kendala teknis.",
        "Ibu Rina menyarankan adanya simulasi ujian bagi siswa sehari sebelum pelaksanaan.",
      ],
    },
  ]);

  // Action Items
  const [actionItems, setActionItems] = useState<NotulenActionItem[]>([
    {
      id: "act-1",
      keputusan: "Batas akhir pengumpulan naskah soal dan kisi-kisi ke panitia.",
      pic: "Seluruh Guru Mata Pelajaran",
      tenggat_waktu: "23 November 2026",
      status: "pending",
    },
    {
      id: "act-2",
      keputusan: "Pengecekan jaringan internet dan server ujian sekolah.",
      pic: "Tim IT Sekolah",
      tenggat_waktu: "25 November 2026",
      status: "pending",
    },
    {
      id: "act-3",
      keputusan: "Pelaksanaan simulasi teknis ujian bagi seluruh siswa.",
      pic: "Panitia Kurikulum",
      tenggat_waktu: "27 November 2026",
      status: "pending",
    },
    {
      id: "act-4",
      keputusan: "Penerbitan jadwal resmi pengawas ruang ujian.",
      pic: "Sekretaris Panitia",
      tenggat_waktu: "26 November 2026",
      status: "pending",
    },
  ]);

  // Penutup
  const [penutup, setPenutup] = useState(
    "Rapat ditutup pada pukul 11.30 WIB dengan doa bersama yang dipimpin oleh Bapak Drs. H. Mahmud."
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Template Applicator
  const applyTemplate = (type: string) => {
    if (type === "evaluasi_bulanan") {
      setJenisRapat("Rapat Pleno & Evaluasi Kinerja Bulanan Guru");
      setSusunanAcara([
        "Pembukaan dan Doa",
        "Laporan Evaluasi Presensi & Kedisiplinan Fingerprint",
        "Evaluasi Ketercapaian Target Kurikulum & RKT",
        "Arahan Strategis Kepala Sekolah",
        "Penutup",
      ]);
      setPembahasan([
        {
          judul: "Pembukaan",
          keterangan: "Rapat dibuka pukul 08.30 WIB dengan pembacaan ummul kitab.",
          poin_poin: [],
        },
        {
          judul: "Evaluasi Presensi & Kinerja",
          poin_poin: [
            "Kepala Tata Usaha memaparkan rekapitulasi kehadiran guru bulan berjalan.",
            "Tingkat ketepatan waktu hadir (KKM) mencapai rata-rata 87%.",
            "Guru yang belum mencapai KKM diberikan pendampingan dan jadwal piket terstruktur.",
          ],
        },
        {
          judul: "Arahan Kepala Sekolah",
          poin_poin: [
            "Apresiasi atas ketertiban administrasi mengajar dan modul ajar guru.",
            "Peningkatan pemanfaatan webapp SIGAP-SMK dalam pengajuan disposisi dan presensi.",
          ],
        },
      ]);
      setActionItems([
        {
          id: "act-" + Date.now() + "-1",
          keputusan: "Penerbitan rekap presensi dan surat pembinaan disiplin.",
          pic: "Kepala Tata Usaha",
          tenggat_waktu: "Akhir Pekan Ini",
          status: "pending",
        },
        {
          id: "act-" + Date.now() + "-2",
          keputusan: "Pengunggahan modul ajar semester genap ke cloud sekolah.",
          pic: "Dewan Guru",
          tenggat_waktu: "10 Hari Kerja",
          status: "pending",
        },
      ]);
      setPenutup("Rapat selesai pukul 11.00 WIB dan diakhiri dengan mushafahah dan doa kaffaratul majelis.");
    }
  };

  // AI Meeting Minutes Auto-Fill Handler
  const handleAiGenerated = (data: any) => {
    if (!data) return;
    if (data.jenis_rapat) setJenisRapat(data.jenis_rapat);
    if (data.nomor_notulen) setNomorNotulen(data.nomor_notulen);
    if (data.tanggal) {
      setTanggal(data.tanggal);
      if (data.hari_tanggal) {
        setHariTanggal(data.hari_tanggal);
      } else {
        const d = new Date(data.tanggal + "T00:00:00");
        setHariTanggal(formatDateForDisplay(d));
      }
    } else if (data.hari_tanggal) {
      setHariTanggal(data.hari_tanggal);
    }
    if (data.waktu) setWaktu(data.waktu);
    if (data.tempat) setTempat(data.tempat);
    if (data.pemimpin_rapat) setPemimpinRapat(data.pemimpin_rapat);
    if (data.pemimpin_nip) setPemimpinNip(data.pemimpin_nip);
    if (data.notulis) setNotulis(data.notulis);
    if (data.notulis_nip) setNotulisNip(data.notulis_nip);
    if (data.peserta_rapat) setPesertaRapat(data.peserta_rapat);

    if (Array.isArray(data.susunan_acara) && data.susunan_acara.length > 0) {
      setSusunanAcara(
        data.susunan_acara.map((s: string) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      );
    }

    if (Array.isArray(data.pembahasan) && data.pembahasan.length > 0) {
      setPembahasan(
        data.pembahasan.map((p: any) => ({
          judul: p.judul || "Pembahasan",
          keterangan: p.keterangan || "",
          poin_poin: Array.isArray(p.poin_poin) ? p.poin_poin : [],
        }))
      );
    }

    if (Array.isArray(data.action_items) && data.action_items.length > 0) {
      setActionItems(
        data.action_items.map((item: any, idx: number) => ({
          id: `act-${Date.now()}-${idx + 1}`,
          keputusan: item.keputusan || "",
          pic: item.pic || "Seluruh Guru / Staf",
          tenggat_waktu: item.tenggat_waktu || "Sesuai Jadwal",
          status: item.status || "pending",
        }))
      );
    }

    if (data.penutup) setPenutup(data.penutup);

    // Smooth scroll to form container
    setTimeout(() => {
      const formElement = document.getElementById("notulen-form-content");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const handleDateChange = (val: string) => {
    setTanggal(val);
    if (val) {
      const d = new Date(val + "T00:00:00");
      setHariTanggal(formatDateForDisplay(d));
    }
  };

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

  const handleSubmit = (status: "draft" | "final") => {
    if (!jenisRapat.trim()) {
      alert("Silakan isi Jenis/Nama Rapat terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isApprovedByKepsek = isKepsek && status === "final";
      const created = addNotulen({
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
        notulis_id: currentUser.id,
        peserta_rapat: pesertaRapat.trim(),
        susunan_acara: susunanAcara.filter((s) => s.trim().length > 0),
        pembahasan: pembahasan.filter((p) => p.judul.trim().length > 0),
        action_items: actionItems.filter((a) => a.keputusan.trim().length > 0),
        penutup: penutup.trim(),
        status: status,
        is_approved_by_kepsek: isApprovedByKepsek,
        approved_at: isApprovedByKepsek ? new Date().toISOString() : undefined,
        approved_by_name: isApprovedByKepsek ? currentUser.name : undefined,
        has_ttd_kepsek: isApprovedByKepsek,
        has_stempel: isApprovedByKepsek,
        created_by: currentUser.id,
        creator_name: currentUser.name,
      });

      router.push(`/notulen/${created.id}`);
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menyimpan notulen.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/notulen"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Notulen</span>
        </Link>

        {/* Quick Templates */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Contoh Template:</span>
          <button
            type="button"
            onClick={() => applyTemplate("evaluasi_bulanan")}
            className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Rapat Evaluasi Bulanan</span>
          </button>
        </div>
      </div>

      {/* AI Audio Recorder & Intelligent Notulen Generator */}
      <MeetingAudioAiRecorder
        onGenerated={handleAiGenerated}
        defaultLeaderName={schoolSettings?.namaKepsek}
        defaultNotulisName={currentUser.name}
      />

      {/* Main Form Container */}
      <div id="notulen-form-content" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Title Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Format Resmi Dokumen Dinas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Formulir Notulensi Rapat Dinas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Isi identitas rapat, susunan acara, jalannya pembahasan, serta daftar keputusan & tindak lanjut (action items).
          </p>
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
            {/* Jenis Rapat */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis / Agenda Rapat: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={jenisRapat}
                onChange={(e) => setJenisRapat(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi Persiapan Penilaian Akhir Semester (PAS)"
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Nomor Notulen (Opsional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Notulen (Opsional):
              </label>
              <input
                type="text"
                value={nomorNotulen}
                onChange={(e) => setNomorNotulen(e.target.value)}
                placeholder="Contoh: 012/SMK-BH/NOTULEN/XI/2026"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Tanggal Picker & Hari/Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Rapat: <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-36 text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <input
                  type="text"
                  value={hariTanggal}
                  onChange={(e) => setHariTanggal(e.target.value)}
                  placeholder="Hari, DD Bulan YYYY"
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                />
              </div>
            </div>

            {/* Waktu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Waktu Pelaksanaan: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                placeholder="Contoh: Pukul 09.00 – 11.30 WIB"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Tempat */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tempat / Ruangan: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                placeholder="Contoh: Ruang Guru SMK Bayt Al-Hikmah"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Pemimpin Rapat */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pemimpin Rapat: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={pemimpinRapat}
                onChange={(e) => setPemimpinRapat(e.target.value)}
                placeholder="Nama & Jabatan Pemimpin Rapat"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
              />
            </div>

            {/* NIP/NIY Pemimpin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIY / NIP Pemimpin Rapat:
              </label>
              <input
                type="text"
                value={pemimpinNip}
                onChange={(e) => setPemimpinNip(e.target.value)}
                placeholder="Contoh: 14215094"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Notulis */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notulis (Pencatat): <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={notulis}
                onChange={(e) => setNotulis(e.target.value)}
                placeholder="Nama Notulis"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
              />
            </div>

            {/* NIP/NIY Notulis */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIY / NIP Notulis:
              </label>
              <input
                type="text"
                value={notulisNip}
                onChange={(e) => setNotulisNip(e.target.value)}
                placeholder="Contoh: 19900815 201504 2 001"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Peserta Rapat */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Peserta Rapat: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={pesertaRapat}
                onChange={(e) => setPesertaRapat(e.target.value)}
                placeholder="Contoh: 32 orang (Daftar hadir terlampir)"
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
                  placeholder="Nama sesi / acara"
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                {susunanAcara.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSusunanAcara(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus sesi"
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
              <span>Tambah Bagian Pembahasan</span>
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
                      placeholder="Judul Pembahasan (Contoh: Pengarahan Kepala Sekolah)"
                      className="flex-1 text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  {pembahasan.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(secIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus bagian ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Keterangan Pembuka (opsional) */}
                <div>
                  <textarea
                    rows={2}
                    value={sec.keterangan || ""}
                    onChange={(e) => updateSectionKet(secIdx, e.target.value)}
                    placeholder="Keterangan pengantar / deskripsi umum jalannya sesi ini (opsional)..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {/* Poin-Poin Detail */}
                <div className="space-y-2 pl-4 border-l-2 border-emerald-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">Poin Pembahasan / Pernyataan:</span>
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
                        placeholder="Rincian poin arahan / pembahasan..."
                        className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removePoin(secIdx, poinIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors mt-1 cursor-pointer"
                        title="Hapus poin"
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

        {/* D. KEPUTUSAN RAPAT & TINDAK LANJUT (ACTION ITEMS) */}
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
              <span>Tambah Keputusan (Action Item)</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Daftar tugas, penanggung jawab, dan batas akhir penyelesaian hasil rapat. Tabel ini akan tercetak rapi di halaman resmi.
          </p>

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
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-emerald-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeActionItem(actIdx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer self-end sm:self-center"
                  title="Hapus baris keputusan"
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
            placeholder="Contoh: Rapat ditutup pada pukul 11.30 WIB dengan doa bersama yang dipimpin oleh Bapak Drs. H. Mahmud."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/notulen"
            className="w-full sm:w-auto py-2.5 px-5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-center"
          >
            Batal
          </Link>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("draft")}
              className="flex-1 sm:flex-none py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              Simpan Sebagai Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("final")}
              className="flex-1 sm:flex-none py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terbitkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
