"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/context/PresenceContext";
import { useAppData } from "@/context/AppDataContext";
import { formatIndonesianDate } from "@/lib/utils";
import {
  Radio,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  ExternalLink,
  Users,
  Search,
} from "lucide-react";

export function PresenceTrackerCard() {
  const { users, isKepsek, isTU } = useAuth();
  const {
    sessions,
    onlineCount,
    todayCount,
    neverOpenedCount,
    everOpenedCount,
    getUserPresence,
    isUserOnline,
    refreshPresence,
    isLoading,
  } = usePresence();
  const { disposisi } = useAppData();

  const [activeFilter, setActiveFilter] = useState<"all" | "online" | "ever" | "never">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Khusus Kepala Sekolah (Executive Live Tracer)
  if (!isKepsek) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPresence();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Helper format relative time
  const formatTimeAgo = (isoDate?: string) => {
    if (!isoDate) return "-";
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Baru saja (< 1 mnt lalu)";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} hari yang lalu (${formatIndonesianDate(isoDate.split("T")[0])})`;
  };

  const handleSendWaReminder = (userName: string, userPhone?: string, userNiy?: string) => {
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, "") : "";
    const waBase = cleanPhone ? `https://wa.me/${cleanPhone}` : `https://wa.me/`;
    const niyText = userNiy || "NIY Anda";

    const text = `Assalamu’alaikum Wr. Wb.
Yth. Ust/Ustzh ${userName},

Mengingatkan kembali perihal pemantauan kedinasan dan tindak lanjut disposisi/presensi mandiri melalui aplikasi SIGAP SMK Bayt Al-Hikmah.

Mohon kesediaan Bapak/Ibu untuk mengakses webapp melalui tautan resmi berikut:
🔗 Link: https://sigap-smk.vercel.app
🔑 Kredensial Login:
• Username : ${niyText}
• Password : ${niyText}

Terima kasih atas kerja sama dan kedisiplinan Bapak/Ibu.
Wassalamu’alaikum Wr. Wb.
- Kepala SMK Bayt Al-Hikmah Pasuruan`;

    window.open(`${waBase}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const allTeachers = users || [];

  const filteredTeachers = allTeachers.filter((t) => {
    const presence = getUserPresence(t.id) || (t.niy ? getUserPresence(t.niy) : null);
    const online = isUserOnline(t.id) || (t.niy ? isUserOnline(t.niy) : false);
    const hasEver = Boolean(presence && presence.hasEverOpened);

    // Search query filter
    const q = searchQuery.toLowerCase();
    const matchSearch =
      t.name.toLowerCase().includes(q) ||
      (t.niy && t.niy.toLowerCase().includes(q)) ||
      (t.jabatan && t.jabatan.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (activeFilter === "online") return online;
    if (activeFilter === "ever") return hasEver;
    if (activeFilter === "never") return !hasEver;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10.5px] font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Radio className="w-3.5 h-3.5" />
            <span>Radar Kehadiran Digital Staf & Guru (Live Tracer)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
            Pantauan Akses & Status Online Webapp
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Ketahui secara waktu-nyata guru yang sedang membuka webapp, riwayat jam akses terakhir, dan pantau apakah guru yang Anda beri disposisi/presensi sudah membuka webapp atau belum sama sekali.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start md:self-center px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 4 Realtime KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 border-b border-slate-200 bg-slate-50/50">
        <div className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1 right-1 animate-ping"></span>
            <Radio className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Sedang Online
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700">{onlineCount}</span>
              <span className="text-xs text-slate-400 font-semibold">Guru / Staf</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Aktif Hari Ini
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-sky-700">{todayCount}</span>
              <span className="text-xs text-slate-400 font-semibold">Guru / Staf</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pernah Mengakses
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-700">{everOpenedCount}</span>
              <span className="text-xs text-slate-400 font-semibold">Guru / Staf</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Belum Pernah Buka
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-700">{neverOpenedCount}</span>
              <span className="text-xs text-slate-400 font-semibold">Guru / Staf</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Civitas ({allTeachers.length})
          </button>
          <button
            onClick={() => setActiveFilter("online")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "online"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sedang Online ({onlineCount})
          </button>
          <button
            onClick={() => setActiveFilter("ever")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeFilter === "ever"
                ? "bg-indigo-700 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200"
            }`}
          >
            Sudah Pernah Buka ({everOpenedCount})
          </button>
          <button
            onClick={() => setActiveFilter("never")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeFilter === "never"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            Belum Pernah Buka ({neverOpenedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru atau NIY..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Teachers Access Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-gray-600 font-bold border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Guru / Tenaga Pendidik</th>
              <th className="py-3 px-4 text-center">Status Akses Webapp</th>
              <th className="py-3 px-4">Aktivitas & Halaman Terakhir</th>
              <th className="py-3 px-4 text-center">Tindak Lanjut Disposisi</th>
              <th className="py-3 px-4 text-center">Aksi / Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Tidak ada data guru yang sesuai dengan filter atau kata kunci pencarian.
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher, idx) => {
                const presence = getUserPresence(teacher.id) || (teacher.niy ? getUserPresence(teacher.niy) : null);
                const online = isUserOnline(teacher.id) || (teacher.niy ? isUserOnline(teacher.niy) : false);
                const hasEver = Boolean(presence && presence.hasEverOpened);

                // Check assigned disposisi for this teacher
                const myAssignedDisps = disposisi.filter(
                  (d) =>
                    d.penerima_id === teacher.id ||
                    (teacher.niy && d.penerima_id === teacher.niy) ||
                    d.penerima_nama.toLowerCase().includes(teacher.name.toLowerCase().split(" ")[0])
                );
                const openedDispsCount = myAssignedDisps.filter(
                  (d) => presence?.openedDisposisiIds?.includes(d.id)
                ).length;

                return (
                  <tr
                    key={teacher.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      online
                        ? "bg-emerald-50/20"
                        : !hasEver
                        ? "bg-rose-50/15"
                        : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-center text-gray-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Guru Biodata */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 relative ${
                            online
                              ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                              : hasEver
                              ? "bg-brand-700 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {online && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white absolute -top-1 -right-1 animate-pulse"></span>
                          )}
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xs leading-snug">
                            {teacher.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            NIY: <span className="font-mono font-medium">{teacher.niy || teacher.nip || "-"}</span> • {teacher.jabatan}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status Akses */}
                    <td className="py-3 px-4 text-center">
                      {online ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>ONLINE SEKARANG</span>
                        </span>
                      ) : hasEver ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>Pernah Akses ({presence?.totalVisits || 1}x)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Belum Pernah Buka</span>
                        </span>
                      )}
                    </td>

                    {/* Aktivitas & Waktu Terakhir */}
                    <td className="py-3 px-4">
                      {hasEver && presence?.lastActiveAt ? (
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-semibold text-gray-800 flex items-center gap-1.5">
                            <span className="text-brand-700">
                              {presence.lastPageTitle || presence.lastPage || "/"}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-gray-500">
                            Terakhir aktif: {formatTimeAgo(presence.lastActiveAt)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Belum ada catatan aktivitas login
                        </span>
                      )}
                    </td>

                    {/* Status Disposisi */}
                    <td className="py-3 px-4 text-center">
                      {myAssignedDisps.length > 0 ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              openedDispsCount === myAssignedDisps.length
                                ? "bg-emerald-100 text-emerald-800"
                                : openedDispsCount > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {openedDispsCount} / {myAssignedDisps.length} Dibuka
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {openedDispsCount === myAssignedDisps.length
                              ? "Sudah membaca semua"
                              : openedDispsCount === 0
                              ? "Belum membaca disposisi"
                              : "Sebagian telah dibaca"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          handleSendWaReminder(
                            teacher.name,
                            teacher.phone,
                            teacher.niy || teacher.nip
                          )
                        }
                        title="Kirim pengingat WhatsApp ke guru ini"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
