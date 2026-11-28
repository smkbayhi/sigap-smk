"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { User, JenjangKarierItem, KategoriJenjangKarier } from "@/lib/database.types";
import {
  GraduationCap,
  Award,
  Calendar,
  Building,
  FileText,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Printer,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  X,
  Layers,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { LOGO_YAYASAN_DATA_URL, LOGO_SMK_DATA_URL } from "@/lib/seedData";

const KATEGORI_KARIER_MAP: Record<KategoriJenjangKarier, { label: string; badge: string }> = {
  struktural: { label: "Jabatan Struktural", badge: "bg-amber-100 text-amber-900 border-amber-300" },
  fungsional_guru: { label: "Guru Mata Pelajaran", badge: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  wali_kelas: { label: "Wali Kelas", badge: "bg-blue-100 text-blue-900 border-blue-300" },
  tugas_tambahan: { label: "Tugas Tambahan", badge: "bg-purple-100 text-purple-900 border-purple-300" },
  tenaga_kependidikan: { label: "Tenaga Kependidikan (TU)", badge: "bg-teal-100 text-teal-900 border-teal-300" },
  pengabdian: { label: "Pengabdian Santri/Alumni", badge: "bg-indigo-100 text-indigo-900 border-indigo-300" },
  lainnya: { label: "Lainnya", badge: "bg-gray-100 text-gray-800 border-gray-300" },
};

function BiodataContent() {
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get("userId");

  const { users, currentUser, isKepsek, isTU, updateUser, addJenjangKarier, updateJenjangKarier, deleteJenjangKarier } = useAuth();
  const { addToast, schoolSettings } = useAppData();

  // Selected user for viewing/managing
  const [selectedUserId, setSelectedUserId] = useState<string>(queryUserId || currentUser.id);

  // Sync if query param changes
  useEffect(() => {
    if (queryUserId) {
      setSelectedUserId(queryUserId);
    }
  }, [queryUserId]);

  const activeUser = users.find((u) => u.id === selectedUserId) || currentUser;

  // Permissions: Only Kepala TU and Kepala Sekolah can edit / add career path
  const canManageCareer = isKepsek || isTU;

  // Career Modal state
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [formTahunMulai, setFormTahunMulai] = useState("");
  const [formTahunSelesai, setFormTahunSelesai] = useState("");
  const [formIsCurrent, setFormIsCurrent] = useState(false);
  const [formPosisi, setFormPosisi] = useState("");
  const [formUnitKerja, setFormUnitKerja] = useState("SMK Bayt Al-Hikmah");
  const [formKategori, setFormKategori] = useState<KategoriJenjangKarier>("fungsional_guru");
  const [formNomorSk, setFormNomorSk] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");

  // Edit Kepegawaian Modal state
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [bioTahunMasuk, setBioTahunMasuk] = useState(activeUser.tahun_masuk || "");
  const [bioPendidikan, setBioPendidikan] = useState(activeUser.pendidikan_terakhir || "");
  const [bioStatus, setBioStatus] = useState(activeUser.status_kepegawaian || "Guru Tetap Yayasan (GTY)");
  const [bioTtl, setBioTtl] = useState(activeUser.tempat_tanggal_lahir || "");

  // Update bio form whenever activeUser changes
  useEffect(() => {
    setBioTahunMasuk(activeUser.tahun_masuk || "");
    setBioPendidikan(activeUser.pendidikan_terakhir || "");
    setBioStatus(activeUser.status_kepegawaian || "Guru Tetap Yayasan (GTY)");
    setBioTtl(activeUser.tempat_tanggal_lahir || "");
  }, [activeUser]);

  // Calculate Years of Dedication
  const currentYear = new Date().getFullYear();
  const startYearNum = parseInt(activeUser.tahun_masuk || "2020", 10);
  const masaPengabdian = isNaN(startYearNum) ? 0 : Math.max(0, currentYear - startYearNum);

  // Career list sorted chronologically
  const careerList: JenjangKarierItem[] = [...(activeUser.jenjang_karier || [])].sort((a, b) => {
    const yearA = parseInt(a.tahun_mulai, 10) || 0;
    const yearB = parseInt(b.tahun_mulai, 10) || 0;
    return yearA - yearB;
  });

  // Open Career Modal for Add
  const handleOpenAddCareer = () => {
    setEditingMilestoneId(null);
    setFormTahunMulai(currentYear.toString());
    setFormTahunSelesai("");
    setFormIsCurrent(true);
    setFormPosisi("");
    setFormUnitKerja("SMK Bayt Al-Hikmah");
    setFormKategori("fungsional_guru");
    setFormNomorSk("");
    setFormKeterangan("");
    setIsCareerModalOpen(true);
  };

  // Open Career Modal for Edit
  const handleOpenEditCareer = (item: JenjangKarierItem) => {
    setEditingMilestoneId(item.id);
    setFormTahunMulai(item.tahun_mulai);
    const isCurrent = !item.tahun_selesai || item.tahun_selesai.toLowerCase().includes("sekarang") || item.tahun_selesai.toLowerCase().includes("saat ini");
    setFormIsCurrent(isCurrent);
    setFormTahunSelesai(isCurrent ? "" : item.tahun_selesai || "");
    setFormPosisi(item.posisi_jabatan);
    setFormUnitKerja(item.unit_kerja || "SMK Bayt Al-Hikmah");
    setFormKategori(item.kategori || "fungsional_guru");
    setFormNomorSk(item.nomor_sk || "");
    setFormKeterangan(item.keterangan || "");
    setIsCareerModalOpen(true);
  };

  // Save Career Item
  const handleSaveCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPosisi.trim()) {
      addToast("warning", "Posisi Wajib Diisi", "Silakan masukkan nama posisi atau jabatan.");
      return;
    }
    if (!formTahunMulai.trim()) {
      addToast("warning", "Tahun Mulai Wajib Diisi", "Silakan masukkan tahun awal penugasan.");
      return;
    }

    const payload: Omit<JenjangKarierItem, "id"> = {
      tahun_mulai: formTahunMulai.trim(),
      tahun_selesai: formIsCurrent ? "Sekarang" : (formTahunSelesai.trim() || undefined),
      posisi_jabatan: formPosisi.trim(),
      unit_kerja: formUnitKerja.trim() || undefined,
      kategori: formKategori,
      nomor_sk: formNomorSk.trim() || undefined,
      keterangan: formKeterangan.trim() || undefined,
    };

    try {
      if (editingMilestoneId) {
        await updateJenjangKarier(activeUser.id, editingMilestoneId, payload);
        addToast("success", "Jenjang Karier Diperbarui", `Riwayat jabatan "${formPosisi}" berhasil diperbarui.`);
      } else {
        await addJenjangKarier(activeUser.id, payload);
        addToast("success", "Jenjang Karier Ditambahkan", `Riwayat karier baru berhasil ditambahkan untuk ${activeUser.name}.`);
      }
      setIsCareerModalOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast("error", "Gagal Menyimpan", err.message || "Terjadi kesalahan saat menyimpan data.");
    }
  };

  // Delete Career Item
  const handleDeleteCareer = async (item: JenjangKarierItem) => {
    if (confirm(`Yakin ingin menghapus riwayat jabatan "${item.posisi_jabatan}" (${item.tahun_mulai})?`)) {
      try {
        await deleteJenjangKarier(activeUser.id, item.id);
        addToast("info", "Jenjang Karier Dihapus", "Riwayat jabatan telah dihapus.");
      } catch (err: any) {
        addToast("error", "Gagal Menghapus", err.message || "Gagal menghapus.");
      }
    }
  };

  // Save Kepegawaian Bio
  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(activeUser.id, {
        tahun_masuk: bioTahunMasuk.trim() || undefined,
        pendidikan_terakhir: bioPendidikan.trim() || undefined,
        status_kepegawaian: bioStatus.trim() || undefined,
        tempat_tanggal_lahir: bioTtl.trim() || undefined,
      });
      addToast("success", "Biodata Disimpan", `Data kepegawaian ${activeUser.name} berhasil diperbarui.`);
      setIsBioModalOpen(false);
    } catch (err: any) {
      addToast("error", "Gagal Memperbarui", err.message || "Gagal memperbarui data.");
    }
  };

  // Print Biodata
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar Navigation & Teacher Switcher (for Kepala TU & Kepsek) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2.5 text-emerald-800 mb-1">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Biodata & Jenjang Karier Pegawai
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            Rekam jejak riwayat karier dan pengabdian guru & tenaga kependidikan di Yayasan Pondok Pesantren Bayt Al-Hikmah
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Teacher Selector for Kepala TU & Kepsek */}
          {canManageCareer && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
              <UserIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <label className="text-gray-500 font-medium whitespace-nowrap">Pilih Pegawai:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-transparent font-semibold text-gray-900 focus:outline-hidden cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.jabatan})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Cetak Biodata Resmi"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak Biodata</span>
          </button>

          {/* Add Career Button (Kepala TU & Kepsek) */}
          {canManageCareer && (
            <button
              onClick={handleOpenAddCareer}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jenjang Karier</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PRINT-ONLY OFFICIAL LETTERHEAD (KOP YAYASAN & SEKOLAH)              */}
      {/* ==================================================================== */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-3">
        <div className="flex items-center justify-between gap-4">
          <img src={schoolSettings?.logoYayasanUrl || LOGO_YAYASAN_DATA_URL} alt="Logo Yayasan" className="w-16 h-16 object-contain" />
          <div className="text-center flex-1">
            <h2 className="text-sm font-bold tracking-wider text-black uppercase">YAYASAN PONDOK PESANTREN BAYT AL-HIKMAH</h2>
            <h1 className="text-base font-extrabold text-black uppercase tracking-wide">SMK BAYT AL-HIKMAH PASURUAN</h1>
            <p className="text-[10px] text-gray-700 mt-0.5">
              Jalan Patiunus No. 25 Krampyangan, Bugul Kidul, Pasuruan, Jawa Timur | Telp. (0343) 428544
            </p>
            <p className="text-[10px] font-semibold text-gray-800 tracking-widest mt-0.5">
              LEMBAR BIODATA & REKAM JEJAK KARIER PEGAWAI
            </p>
          </div>
          <img src={schoolSettings?.logoSmkUrl || LOGO_SMK_DATA_URL} alt="Logo SMK" className="w-16 h-16 object-contain" />
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 p-6 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-700 border-3 border-gold-400 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-lg shrink-0">
                {activeUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{activeUser.name}</h2>
                  <span className="text-[10px] bg-gold-400/20 text-gold-300 border border-gold-400/40 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    {activeUser.role.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-200 mt-0.5 font-medium">{activeUser.jabatan}</p>
                <div className="flex items-center gap-3 text-[11px] text-emerald-300/90 mt-2 font-mono">
                  <span>NIY: {activeUser.niy || activeUser.nip || "-"}</span>
                  {activeUser.bidang && <span>• Bidang: {activeUser.bidang}</span>}
                </div>
              </div>
            </div>

            {/* Edit Bio Button for Kepala TU & Kepsek */}
            {canManageCareer && (
              <button
                onClick={() => setIsBioModalOpen(true)}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer print:hidden"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Data Kepegawaian</span>
              </button>
            )}
          </div>
        </div>

        {/* Kepegawaian Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/70 p-4 border-b border-slate-200 text-xs">
          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-gray-500 font-medium block">Tahun Masuk Yayasan:</span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block">
              {activeUser.tahun_masuk ? `Tahun ${activeUser.tahun_masuk}` : "Belum diisi"}
            </span>
            {activeUser.tahun_masuk && (
              <span className="text-[10px] text-emerald-700 font-semibold">
                ± {masaPengabdian} Tahun Pengabdian
              </span>
            )}
          </div>

          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-gray-500 font-medium block">Status Kepegawaian:</span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block">
              {activeUser.status_kepegawaian || "Guru Tetap Yayasan (GTY)"}
            </span>
            <span className="text-[10px] text-gray-500">Yayasan PP Bayt Al-Hikmah</span>
          </div>

          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-gray-500 font-medium block">Pendidikan Terakhir:</span>
            <span className="text-xs font-bold text-gray-900 mt-0.5 block truncate" title={activeUser.pendidikan_terakhir || "-"}>
              {activeUser.pendidikan_terakhir || "Belum diisi"}
            </span>
            <span className="text-[10px] text-gray-500">Ijazah Resmi</span>
          </div>

          <div className="p-2 sm:px-4">
            <span className="text-[11px] text-gray-500 font-medium block">Kontak WhatsApp:</span>
            <span className="text-xs font-mono font-bold text-gray-900 mt-0.5 block">
              {activeUser.phone || "-"}
            </span>
            <span className="text-[10px] text-gray-500 truncate block">{activeUser.email}</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TIMELINE JENJANG KARIER (CAREER JOURNEY MILESTONES)                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-gray-900">
                Riwayat & Garis Waktu Jenjang Karier
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Urutan jabatan, penugasan struktural, dan amanah resmi sejak awal bergabung di Yayasan Bayt Al-Hikmah
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Diverifikasi oleh Kepala Tata Usaha</span>
          </div>
        </div>

        {careerList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl p-6">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-800">Belum Ada Rekam Jenjang Karier</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {canManageCareer
                ? "Silakan klik tombol 'Tambah Jenjang Karier' di atas untuk mencatat riwayat penugasan guru ini sejak awal masuk yayasan."
                : "Riwayat jenjang karier Anda belum diinput oleh Kepala Tata Usaha. Hubungi Tata Usaha untuk melengkapi biodata."}
            </p>
            {canManageCareer && (
              <button
                onClick={handleOpenAddCareer}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Penugasan Awal</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-200 space-y-8 my-2">
            {careerList.map((item, index) => {
              const isCurrent =
                !item.tahun_selesai ||
                item.tahun_selesai.toLowerCase().includes("sekarang") ||
                item.tahun_selesai.toLowerCase().includes("saat ini");

              const katInfo = item.kategori ? KATEGORI_KARIER_MAP[item.kategori] : KATEGORI_KARIER_MAP.fungsional_guru;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Bullet Node */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-3 flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-emerald-600 border-white text-white shadow-md ring-4 ring-emerald-100"
                        : "bg-white border-emerald-600 text-emerald-800"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Milestone Card */}
                  <div className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-emerald-50/50 border-emerald-300 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Year Range Badge */}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                          isCurrent
                            ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs"
                            : "bg-slate-100 text-slate-800 border-slate-300"
                        }`}>
                          {item.tahun_mulai} — {item.tahun_selesai || "Sekarang"}
                        </span>

                        {/* Category Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${katInfo.badge}`}>
                          {katInfo.label}
                        </span>

                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Jabatan Aktif Saat Ini
                          </span>
                        )}
                      </div>

                      {/* Edit / Delete Buttons for TU & Kepsek */}
                      {canManageCareer && (
                        <div className="flex items-center gap-1 self-end sm:self-auto print:hidden">
                          <button
                            onClick={() => handleOpenEditCareer(item)}
                            title="Edit Jabatan Ini"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCareer(item)}
                            title="Hapus Jabatan Ini"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Position Name */}
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">
                      {item.posisi_jabatan}
                    </h4>

                    {/* Unit Kerja */}
                    {item.unit_kerja && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1 font-medium">
                        <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{item.unit_kerja}</span>
                      </div>
                    )}

                    {/* Nomor SK */}
                    {item.nomor_sk && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono mt-1.5 bg-slate-100/80 px-2 py-1 rounded-md w-fit">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>No. SK: {item.nomor_sk}</span>
                      </div>
                    )}

                    {/* Keterangan */}
                    {item.keterangan && (
                      <p className="text-xs text-gray-600 mt-2.5 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                        {item.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signature Section for Official Print */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-xs text-black mt-8">
        <div>
          <p>Pegawai yang bersangkutan,</p>
          <div className="h-16" />
          <p className="font-bold underline">{activeUser.name}</p>
          <p>NIY. {activeUser.niy || activeUser.nip || "-"}</p>
        </div>

        <div className="text-right">
          <p>Pasuruan, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p>Mengetahui / Memverifikasi,</p>
          <p className="font-semibold">Kepala Tata Usaha & Kepegawaian,</p>
          <div className="h-14" />
          <p className="font-bold underline">AINIYATUL FITRIYAH, S.S</p>
          <p>NIY. 11861027</p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL TAMBAH / EDIT JENJANG KARIER (INPUT KHUSUS KEPALA TU)         */}
      {/* ==================================================================== */}
      {isCareerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-300" />
                <h2 className="text-sm sm:text-base font-bold">
                  {editingMilestoneId ? "Edit Jenjang Karier" : "Tambah Riwayat Karier Pegawai"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCareerModalOpen(false)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCareer} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-900">
                <p className="font-bold">{activeUser.name}</p>
                <p className="text-[11px] text-emerald-700">NIY: {activeUser.niy || activeUser.nip} • {activeUser.jabatan}</p>
              </div>

              {/* Posisi / Jabatan */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nama Posisi / Jabatan / Tugas Amanah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Guru Produktif DKV / Wali Kelas X / Waka Kurikulum"
                  value={formPosisi}
                  onChange={(e) => setFormPosisi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Tahun Mulai & Tahun Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tahun Mulai Menjabat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2018 atau Juli 2018"
                    value={formTahunMulai}
                    onChange={(e) => setFormTahunMulai(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tahun Selesai
                  </label>
                  <input
                    type="text"
                    disabled={formIsCurrent}
                    placeholder="Contoh: 2021"
                    value={formIsCurrent ? "Sekarang" : formTahunSelesai}
                    onChange={(e) => setFormTahunSelesai(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer text-gray-600 select-none">
                    <input
                      type="checkbox"
                      checked={formIsCurrent}
                      onChange={(e) => setFormIsCurrent(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-medium">Masih menjabat / Aktif saat ini</span>
                  </label>
                </div>
              </div>

              {/* Kategori & Unit Kerja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Kategori Penugasan
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as KategoriJenjangKarier)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    {Object.entries(KATEGORI_KARIER_MAP).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Unit Kerja / Lembaga
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SMK Bayt Al-Hikmah"
                    value={formUnitKerja}
                    onChange={(e) => setFormUnitKerja(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Nomor SK */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nomor SK Pengangkatan / Penugasan <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SK/012/YPP-BAYHI/VII/2019"
                  value={formNomorSk}
                  onChange={(e) => setFormNomorSk(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Keterangan / Catatan Amanah & Prestasi <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan tanggung jawab, prestasi siswa, atau uraian tugas selama menjabat..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCareerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Riwayat Karier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL UBAH DATA KEPEGAWAIAN (TAHUN MASUK, PENDIDIKAN, STATUS)       */}
      {/* ==================================================================== */}
      {isBioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-300" />
                <h2 className="text-sm sm:text-base font-bold">Ubah Data Kepegawaian</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBioModalOpen(false)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBio} className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-900 font-semibold">
                {activeUser.name} (NIY: {activeUser.niy || activeUser.nip})
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tahun Mulai Masuk di Yayasan Bayt Al-Hikmah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2016"
                  value={bioTahunMasuk}
                  onChange={(e) => setBioTahunMasuk(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Digunakan untuk menghitung masa pengabdian guru/pegawai secara otomatis.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Status Kepegawaian
                </label>
                <select
                  value={bioStatus}
                  onChange={(e) => setBioStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="Guru Tetap Yayasan (GTY)">Guru Tetap Yayasan (GTY)</option>
                  <option value="Guru Tidak Tetap (GTT)">Guru Tidak Tetap (GTT)</option>
                  <option value="Tenaga Kependidikan Tetap Yayasan">Tenaga Kependidikan Tetap Yayasan</option>
                  <option value="Tenaga Kependidikan Kontrak">Tenaga Kependidikan Kontrak</option>
                  <option value="Guru Pengabdian / Magang">Guru Pengabdian / Magang</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Pendidikan Terakhir & Jurusan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: S1 Pendidikan Komputer & Informatika"
                  value={bioPendidikan}
                  onChange={(e) => setBioPendidikan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tempat & Tanggal Lahir
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasuruan, 14 Mei 1988"
                  value={bioTtl}
                  onChange={(e) => setBioTtl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBioModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BiodataPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Memuat Biodata Pegawai...</div>}>
      <BiodataContent />
    </Suspense>
  );
}
