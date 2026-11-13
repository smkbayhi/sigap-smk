import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BidangStruktural, TingkatUrgensi, StatusSuratKeluar, StatusDisposisi, StatusRKT, StatusKetercapaian, JenisSuratKeluar } from "./database.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getBulanRomawi(monthIndex1to12: number): string {
  const romanMonths = [
    "I", "II", "III", "IV", "V", "VI",
    "VII", "VIII", "IX", "X", "XI", "XII"
  ];
  return romanMonths[monthIndex1to12 - 1] || "I";
}

export function formatIndonesianDate(dateStr: string | Date, withDay = false): string {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(withDay ? { weekday: "long" } : {}),
    };
    return new Intl.DateTimeFormat("id-ID", options).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatIndonesianDateTime(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function generateNomorSurat(noUrut: number, date: Date = new Date()): string {
  const pad = String(noUrut).padStart(3, "0");
  const romawi = getBulanRomawi(date.getMonth() + 1);
  const tahun = date.getFullYear();
  return `${pad}/SMK-BAYHI/${romawi}/${tahun}`;
}

export function getBidangLabel(bidang?: BidangStruktural | string): string {
  switch (bidang) {
    case "wakasek":
    case "wakil_kepala_sekolah":
      return "Wakil Kepala Sekolah";
    case "kurikulum":
      return "Kurikulum & Akademik";
    case "kesiswaan":
      return "Kesiswaan & Karakter";
    case "sarpras":
      return "Sarana, Prasarana & TI";
    case "humas_bkk":
      return "Humas & Hubungan Industri (BKK)";
    default:
      return bidang ? String(bidang) : "Umum";
  }
}

export function getBidangBadgeColor(bidang?: BidangStruktural | string): string {
  switch (bidang) {
    case "wakasek":
    case "wakil_kepala_sekolah":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "kurikulum":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "kesiswaan":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "sarpras":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "humas_bkk":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export function getUrgensiBadge(urgensi: TingkatUrgensi) {
  switch (urgensi) {
    case "rahasia":
      return { label: "Rahasia", color: "bg-red-100 text-red-800 border-red-200" };
    case "segera":
      return { label: "Segera", color: "bg-amber-100 text-amber-800 border-amber-200" };
    case "penting":
      return { label: "Penting", color: "bg-blue-100 text-blue-800 border-blue-200" };
    case "biasa":
    default:
      return { label: "Biasa", color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

export function getJenisSuratKeluarLabel(jenis: JenisSuratKeluar | string): string {
  switch (jenis) {
    case "surat_tugas": return "Surat Tugas";
    case "surat_undangan": return "Surat Undangan";
    case "surat_keterangan": return "Surat Keterangan";
    case "surat_edaran": return "Surat Edaran";
    case "surat_rekomendasi": return "Surat Rekomendasi";
    case "surat_pengantar": return "Surat Pengantar";
    case "surat_permohonan": return "Surat Permohonan";
    case "surat_kuasa": return "Surat Kuasa";
    case "surat_peringatan": return "Surat Peringatan";
    default: return "Surat Keluar";
  }
}

export function getStatusSuratKeluarBadge(status: StatusSuratKeluar) {
  switch (status) {
    case "disetujui":
      return { label: "Disetujui & Bertanda Tangan", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "menunggu_persetujuan":
      return { label: "Menunggu Persetujuan", color: "bg-amber-100 text-amber-800 border-amber-300" };
    case "ditolak":
      return { label: "Ditolak / Revisi", color: "bg-rose-100 text-rose-800 border-rose-300" };
    case "draft":
    default:
      return { label: "Draf", color: "bg-slate-100 text-slate-700 border-slate-300" };
  }
}

export function getStatusDisposisiBadge(status: StatusDisposisi) {
  switch (status) {
    case "selesai":
      return { label: "Selesai Ditindaklanjuti", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "proses":
      return { label: "Sedang Diproses", color: "bg-sky-100 text-sky-800 border-sky-300" };
    case "menunggu":
    default:
      return { label: "Menunggu Tindak Lanjut", color: "bg-amber-100 text-amber-800 border-amber-300" };
  }
}

export function getStatusRKTBadge(status: StatusRKT) {
  switch (status) {
    case "disetujui":
      return { label: "Disetujui", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "ditolak":
      return { label: "Ditolak (Perlu Revisi)", color: "bg-rose-100 text-rose-800 border-rose-300" };
    case "menunggu_persetujuan":
    default:
      return { label: "Menunggu Review", color: "bg-amber-100 text-amber-800 border-amber-300" };
  }
}

export function getStatusKetercapaianBadge(status: StatusKetercapaian) {
  switch (status) {
    case "selesai":
      return { label: "Selesai 100%", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "dalam_proses":
      return { label: "Dalam Proses", color: "bg-blue-100 text-blue-800 border-blue-300" };
    case "tertunda":
    default:
      return { label: "Tertunda", color: "bg-rose-100 text-rose-800 border-rose-300" };
  }
}

export function createWhatsAppDispositionLink({
  phone,
  penerimaNama,
  nomorSurat,
  pengirim,
  perihal,
  instruksi,
  catatan,
  deadline,
  disposisiId,
  baseUrl,
}: {
  phone?: string;
  penerimaNama?: string;
  nomorSurat?: string;
  pengirim?: string;
  perihal?: string;
  instruksi?: string;
  catatan?: string;
  deadline?: string;
  disposisiId?: string;
  baseUrl?: string;
}): string {
  // Normalize Indonesian phone: 0812... -> 62812...
  let rawPhone = phone || "";
  let cleanPhone = rawPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }
  if (!cleanPhone) {
    cleanPhone = "6285646682246";
  }

  const host = baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const magicLink = `${host}/disposisi/${disposisiId || ""}`;

  const message = `*🔔 NOTIFIKASI DISPOSISI SURAT - SIGAP SMK BAYT AL-HIKMAH*
----------------------------------------
Kepada Yth. *${penerimaNama || "Bapak/Ibu Guru"}*,

Anda telah menerima disposisi surat dinas dengan rincian berikut:

📄 *No. Surat:* ${nomorSurat || "-"}
🏢 *Pengirim:* ${pengirim || "-"}
📌 *Perihal:* ${perihal || "-"}
🎯 *Instruksi Kepala Sekolah:* ${instruksi || "-"}
${catatan ? `📝 *Catatan Khusus:* ${catatan}\n` : ""}⏳ *Batas Waktu (Deadline):* ${deadline ? formatIndonesianDate(deadline) : "-"}

Silakan klik tautan di bawah ini untuk membuka detail surat dan memperbarui status tindak lanjut:
🔗 *Tautan Surat / Disposisi:*
${magicLink}

_Pesan otomatis dikirim melalui Sistem Informasi Gerak Cepat & Administrasi Terpadu (SIGAP-SMK)_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
