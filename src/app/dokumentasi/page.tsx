"use client";

import React, { useState, useRef } from "react";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import {
  Camera,
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Share2,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  UploadCloud,
  FolderHeart,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Eye,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/utils";
import { DokumentasiKegiatan, KategoriDokumentasi } from "@/lib/database.types";

const KATEGORI_OPTIONS: { id: KategoriDokumentasi | "all"; label: string; badgeClass: string }[] = [
  { id: "all", label: "Semua Kategori", badgeClass: "bg-slate-100 text-slate-800 border-slate-300" },
  { id: "akademik_kurikulum", label: "Akademik & KSP", badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "kesiswaan", label: "Kesiswaan", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "keasramaan_pesantren", label: "Pesantren & Santri", badgeClass: "bg-teal-100 text-teal-800 border-teal-200" },
  { id: "humas_dudi", label: "Humas & Mitra DUDI", badgeClass: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "rapat_dinas", label: "Rapat Dinas", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "sarpras", label: "Sarana & Prasarana", badgeClass: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "keagamaan", label: "Keagamaan & PHBI", badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { id: "lainnya", label: "Lainnya", badgeClass: "bg-gray-100 text-gray-800 border-gray-200" },
];

function getCategoryBadge(kategori: KategoriDokumentasi) {
  const item = KATEGORI_OPTIONS.find((k) => k.id === kategori);
  return item || { id: "lainnya", label: "Kegiatan Sekolah", badgeClass: "bg-gray-100 text-gray-800 border-gray-200" };
}

// Client-side lightweight photo compression for fast mobile uploads
async function compressImageFile(file: File, maxDimension = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error("Gagal membaca file gambar"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal memproses file"));
    reader.readAsDataURL(file);
  });
}

export default function DokumentasiKegiatanPage() {
  const { dokumentasiList, addDokumentasi, deleteDokumentasi, addToast } = useAppData();
  const { currentUser, isKepsek, isTU } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<KategoriDokumentasi | "all">("all");

  // Modal Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [newJudul, setNewJudul] = useState("");
  const [newKategori, setNewKategori] = useState<KategoriDokumentasi>("akademik_kurikulum");
  const [newTanggal, setNewTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [newWaktu, setNewWaktu] = useState("08.00 - Selesai WIB");
  const [newLokasi, setNewLokasi] = useState("SMK Bayt Al-Hikmah Pasuruan");
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [newDriveUrl, setNewDriveUrl] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Lightbox Viewer state
  const [viewingAlbum, setViewingAlbum] = useState<DokumentasiKegiatan | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  // Hidden file input references
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Process image files
  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsCompressing(true);
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          const compressed = await compressImageFile(file, 1280, 0.8);
          compressedList.push(compressed);
        }
      }
      setUploadedPhotos((prev) => [...prev, ...compressedList]);
      addToast(
        "info",
        "Foto Siap Diunggah",
        `${compressedList.length} foto berhasil diproses dan dikompresi otomatis.`
      );
    } catch (err) {
      console.error(err);
      addToast("error", "Gagal Membaca Foto", "Terjadi kesalahan saat memproses foto dari perangkat.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhotoFromQueue = (idx: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveDokumentasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim()) {
      addToast("warning", "Judul Wajib Diisi", "Silakan masukkan nama atau judul kegiatan sekolah.");
      return;
    }
    if (uploadedPhotos.length === 0) {
      addToast("warning", "Belum Ada Foto", "Silakan ambil foto dengan kamera atau pilih dari galeri.");
      return;
    }

    addDokumentasi({
      judul_kegiatan: newJudul.trim(),
      kategori: newKategori,
      tanggal_kegiatan: newTanggal,
      waktu_kegiatan: newWaktu.trim() || undefined,
      lokasi: newLokasi.trim() || undefined,
      deskripsi: newDeskripsi.trim() || undefined,
      foto_urls: uploadedPhotos,
      petugas_id: currentUser.id,
      petugas_nama: currentUser.name,
      petugas_jabatan: currentUser.jabatan || currentUser.role,
      drive_url: newDriveUrl.trim() || undefined,
    });

    // Reset Form
    setNewJudul("");
    setNewDeskripsi("");
    setNewDriveUrl("");
    setUploadedPhotos([]);
    setIsUploadOpen(false);
  };

  // Filter Albums
  const filteredAlbums = dokumentasiList.filter((item) => {
    const matchesSearch =
      item.judul_kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi && item.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.petugas_nama.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || item.kategori === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate quick metrics
  const totalAlbums = dokumentasiList.length;
  const totalPhotos = dokumentasiList.reduce((acc, curr) => acc + (curr.foto_urls?.length || 0), 0);
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const thisMonthAlbums = dokumentasiList.filter((d) => d.tanggal_kegiatan.startsWith(currentMonthStr)).length;

  // WhatsApp Share Generator
  const handleShareWA = (album: DokumentasiKegiatan) => {
    const formattedDate = formatIndonesianDate(album.tanggal_kegiatan);
    const text = `📸 *DOKUMENTASI KEGIATAN SMK BAYT AL-HIKMAH*
───────────────────────────
📌 *Kegiatan:* ${album.judul_kegiatan}
📅 *Tanggal:* ${formattedDate} ${album.waktu_kegiatan ? `(${album.waktu_kegiatan})` : ""}
📍 *Lokasi:* ${album.lokasi || "SMK Bayt Al-Hikmah Pasuruan"}
👤 *Didokumentasikan oleh:* ${album.petugas_nama} ${album.petugas_jabatan ? `(${album.petugas_jabatan})` : ""}

📝 *Deskripsi / Ringkasan:*
${album.deskripsi || "Dokumentasi kegiatan resmi lingkungan SMK Bayt Al-Hikmah Pasuruan."}

📷 *Jumlah Foto Tersimpan:* ${album.foto_urls.length} Foto
${album.drive_url ? `📂 *Google Drive Master Cadangan:* ${album.drive_url}\n` : ""}
🌐 *Akses Galeri SIGAP-SMK:*
https://sigap-smk.vercel.app/dokumentasi
───────────────────────────
_Sistem Informasi Generasi Andal & Prestasi (SIGAP-SMK)_`;

    if (navigator.share) {
      navigator.share({
        title: album.judul_kegiatan,
        text: text,
      }).catch(() => {
        // Fallback to WA web link
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // Open Lightbox
  const openLightbox = (album: DokumentasiKegiatan, startIdx = 0) => {
    setViewingAlbum(album);
    setCurrentPhotoIdx(startIdx);
  };

  const nextPhoto = () => {
    if (!viewingAlbum) return;
    setCurrentPhotoIdx((prev) => (prev + 1) % viewingAlbum.foto_urls.length);
  };

  const prevPhoto = () => {
    if (!viewingAlbum) return;
    setCurrentPhotoIdx((prev) => (prev - 1 + viewingAlbum.foto_urls.length) % viewingAlbum.foto_urls.length);
  };

  // Download Photo
  const handleDownloadPhoto = (photoUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = photoUrl;
    a.download = `${filename || "dokumentasi-kegiatan"}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 text-emerald-800 mb-1">
            <Camera className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Dokumentasi & Galeri Kegiatan
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            Arsip digital resmi kegiatan sekolah, praktik santri, kunjungan industri, dan pondok pesantren SMK Bayt Al-Hikmah Pasuruan
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow cursor-pointer select-none"
        >
          <Camera className="w-4 h-4" />
          <span>Unggah Dokumentasi Baru</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Album Kegiatan</p>
            <p className="text-xl font-bold text-gray-900">{totalAlbums} Kegiatan</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Tersimpan rapi & terarsip</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Koleksi Foto</p>
            <p className="text-xl font-bold text-gray-900">{totalPhotos} Foto</p>
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">Kualitas HD & kompresi cepat</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Kegiatan Bulan Ini</p>
            <p className="text-xl font-bold text-gray-900">{thisMonthAlbums} Kegiatan</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Dokumentasi aktif berjalan</p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama kegiatan, lokasi, nama guru/petugas, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Category Pills (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
          {KATEGORI_OPTIONS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Album Grid Cards */}
      {filteredAlbums.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-xs p-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Belum Ada Dokumentasi Kegiatan</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            {searchQuery || selectedCategory !== "all"
              ? "Tidak ditemukan dokumentasi yang cocok dengan kata kunci atau filter yang Anda pilih."
              : "Mulai abadikan momen kegiatan sekolah, santri, dan dewan guru dengan menekan tombol 'Unggah Dokumentasi Baru'."}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah Foto Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlbums.map((album) => {
            const badge = getCategoryBadge(album.kategori);
            const coverPhoto = album.foto_urls[0] || "";
            const isOwnerOrAdmin = isKepsek || isTU || album.petugas_id === currentUser.id;

            return (
              <div
                key={album.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Image Cover Container */}
                <div
                  onClick={() => openLightbox(album, 0)}
                  className="relative aspect-video w-full bg-slate-100 cursor-pointer overflow-hidden"
                >
                  {coverPhoto ? (
                    <img
                      src={coverPhoto}
                      alt={album.judul_kegiatan}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{album.foto_urls.length} Foto</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1 font-medium text-emerald-800">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {formatIndonesianDate(album.tanggal_kegiatan)}
                      </span>
                      {album.lokasi && (
                        <span className="flex items-center gap-1 truncate" title={album.lokasi}>
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{album.lokasi}</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => openLightbox(album, 0)}
                      className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {album.judul_kegiatan}
                    </h3>

                    {album.deskripsi && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {album.deskripsi}
                      </p>
                    )}
                  </div>

                  {/* Contributor Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">
                        Oleh: <strong className="text-gray-700 font-medium">{album.petugas_nama}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* WhatsApp Share */}
                      <button
                        onClick={() => handleShareWA(album)}
                        title="Bagikan ke WhatsApp"
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* View Gallery */}
                      <button
                        onClick={() => openLightbox(album, 0)}
                        title="Lihat Semua Foto"
                        className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus dokumentasi "${album.judul_kegiatan}"?`)) {
                              deleteDokumentasi(album.id);
                            }
                          }}
                          title="Hapus Dokumentasi"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL UNGGAH DOKUMENTASI (MOBILE FIRST CAMERA & GALLERY PICKER)      */}
      {/* ==================================================================== */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-300" />
                <h2 className="text-sm sm:text-base font-bold">Unggah Dokumentasi Kegiatan</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDokumentasi} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Judul Kegiatan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama / Judul Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Kerja Kurikulum / Pembekalan PKL Santri DKV"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Kategori & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategori Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newKategori}
                    onChange={(e) => setNewKategori(e.target.value as KategoriDokumentasi)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    {KATEGORI_OPTIONS.filter((c) => c.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newTanggal}
                    onChange={(e) => setNewTanggal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Waktu & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Waktu / Jam Kegiatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 08.00 - 11.30 WIB"
                    value={newWaktu}
                    onChange={(e) => setNewWaktu(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lokasi / Tempat
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Aula Pondok Bayt Al-Hikmah"
                    value={newLokasi}
                    onChange={(e) => setNewLokasi(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deskripsi / Catatan Kegiatan
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan ringkasan jalannya kegiatan, peserta, atau hasil penting..."
                  value={newDeskripsi}
                  onChange={(e) => setNewDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Foto Upload Buttons (Kamera & Galeri HP) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Foto Dokumentasi <span className="text-rose-500">*</span>
                </label>

                {/* Hidden Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                />
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-dashed border-emerald-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Ambil Kamera HP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 border-2 border-dashed border-blue-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Pilih dari Galeri</span>
                  </button>
                </div>

                {isCompressing && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Sedang memproses dan mengompresi foto otomatis...</span>
                  </div>
                )}

                {/* Thumbnail Preview Grid */}
                {uploadedPhotos.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-medium text-gray-500 mb-1.5">
                      {uploadedPhotos.length} foto siap disimpan (klik tanda X untuk hapus):
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                      {uploadedPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-slate-300 group">
                          <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhotoFromQueue(idx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Drive Backup Link */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tautan Cadangan Google Drive <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newDriveUrl}
                  onChange={(e) => setNewDriveUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Jika sekolah memiliki folder Drive resolusi original, tautkan di sini sebagai cadangan.
                </p>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCompressing || uploadedPhotos.length === 0}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Dokumentasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LIGHTBOX MODAL (FULLSCREEN PHOTO VIEWER WITH PREV/NEXT & DOWNLOAD)   */}
      {/* ==================================================================== */}
      {viewingAlbum && viewingAlbum.foto_urls.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md text-white">
          {/* Lightbox Topbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">
                {currentPhotoIdx + 1} / {viewingAlbum.foto_urls.length}
              </span>
              <h3 className="text-xs sm:text-sm font-semibold truncate text-white/90">
                {viewingAlbum.judul_kegiatan}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* WhatsApp Share */}
              <button
                onClick={() => handleShareWA(viewingAlbum)}
                title="Bagikan ke WhatsApp"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Download Photo */}
              <button
                onClick={() =>
                  handleDownloadPhoto(
                    viewingAlbum.foto_urls[currentPhotoIdx],
                    `${viewingAlbum.judul_kegiatan}-${currentPhotoIdx + 1}`
                  )
                }
                title="Unduh Foto Ini"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Close Lightbox */}
              <button
                onClick={() => setViewingAlbum(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-rose-600/80 rounded-lg transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Photo Display Area */}
          <div className="flex-1 relative flex items-center justify-center p-4 min-h-0 select-none">
            {/* Prev Button */}
            {viewingAlbum.foto_urls.length > 1 && (
              <button
                onClick={prevPhoto}
                className="absolute left-2 sm:left-6 z-10 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-emerald-600 text-white transition-all backdrop-blur-xs cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Photo */}
            <div className="max-w-5xl max-h-full flex items-center justify-center overflow-hidden">
              <img
                src={viewingAlbum.foto_urls[currentPhotoIdx]}
                alt={`Foto ${currentPhotoIdx + 1}`}
                className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
              />
            </div>

            {/* Next Button */}
            {viewingAlbum.foto_urls.length > 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-2 sm:right-6 z-10 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-emerald-600 text-white transition-all backdrop-blur-xs cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer & Thumbnail Strip */}
          <div className="bg-black/60 border-t border-white/10 p-3 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[11px] text-white/70 space-y-0.5">
              <p>
                <strong className="text-white">Kegiatan:</strong> {viewingAlbum.judul_kegiatan} • {formatIndonesianDate(viewingAlbum.tanggal_kegiatan)}
              </p>
              <p>
                <strong className="text-white">Lokasi:</strong> {viewingAlbum.lokasi || "SMK Bayt Al-Hikmah"} • <strong className="text-white">Petugas:</strong> {viewingAlbum.petugas_nama}
              </p>
            </div>

            {/* Thumbnails */}
            {viewingAlbum.foto_urls.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-md">
                {viewingAlbum.foto_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhotoIdx(i)}
                    className={`relative w-11 h-11 shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                      currentPhotoIdx === i
                        ? "border-emerald-500 scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
