"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { usePresensi } from "@/context/PresensiContext";
import { LOGO_SMK_DATA_URL } from "@/lib/seedData";
import {
  LayoutDashboard,
  Send,
  Inbox,
  Share2,
  CalendarDays,
  Target,
  FileSpreadsheet,
  Database,
  Users,
  X,
  Clock,
  Stamp,
  ClipboardList,
  Award,
  Camera,
  GraduationCap,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isKepsek, isTU, isKasubag, isGuru } = useAuth();
  const { suratKeluar, disposisi, rkt, schoolSettings, notulenList, dokumentasiList } = useAppData();
  const { currentReport } = usePresensi();
  const schoolLogo = schoolSettings?.logoSmkUrl || LOGO_SMK_DATA_URL;

  const pendingSK = suratKeluar.filter((s) => s.status === "menunggu_persetujuan").length;
  const pendingRKT = rkt.filter((r) => r.status === "menunggu_persetujuan").length;
  const pendingActionItems = (notulenList || []).reduce(
    (acc, n) => acc + (n.action_items || []).filter((a) => a.status === "pending").length,
    0
  );
  const totalDokumentasi = (dokumentasiList || []).length;
  
  // Pending disposisi for current user or overall
  const myPendingDisp = disposisi.filter((d) => 
    (d.status === "menunggu" || d.status === "proses") && 
    (isKepsek || isTU || d.penerima_id === currentUser.id)
  ).length;

  // Presensi permissions: Kepala Sekolah & Tata Usaha can manage all presensi;
  // teachers and kasubag only monitor their own personal presensi
  const canManageAllPresensi = isKepsek || isTU;

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  /**
   * Resilient navigation handler:
   * 1. Safely closes mobile drawer only when open
   * 2. Prevents redundant navigation when already on the page
   * 3. Provides a 250ms fallback navigation if Next.js App Router RSC cache locks up
   */
  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isOpen) {
      onClose();
    }

    if (pathname === href) {
      e.preventDefault();
      return;
    }

    // Fail-safe: if Next.js client router is stuck/frozen in production cache,
    // guarantee navigation occurs after 250ms
    const targetUrl = href;
    const fallbackTimer = setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
        window.location.href = targetUrl;
      }
    }, 250);

    const cleanup = () => clearTimeout(fallbackTimer);
    window.addEventListener("beforeunload", cleanup, { once: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: z-50 to ensure it is always above backdrops and sticky headers */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#064e3b] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-800/60 bg-[#053d2e]">
          <Link
            href="/"
            prefetch={false}
            onClick={(e) => handleNav(e, "/")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img
              src={schoolLogo}
              alt="Logo SMK Bayt Al-Hikmah"
              className="w-8 h-8 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="pointer-events-none">
              <span className="font-extrabold text-white text-base tracking-wider">
                SIGAP<span className="text-gold-400">-SMK</span>
              </span>
              <p className="text-[10px] text-emerald-300 font-medium leading-none mt-0.5">
                Bayt Al-Hikmah Pasuruan
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-emerald-300 hover:text-white p-1 cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Card */}
        <div className="px-4 py-3 bg-[#043326] border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700 border border-gold-400/60 flex items-center justify-center font-bold text-xs text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] bg-gold-400/20 text-gold-300 border border-gold-400/30 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                  {currentUser.role.replace("_", " ")}
                </span>
                {currentUser.bidang && (
                  <span className="text-[10px] text-emerald-300 capitalize">
                    • {currentUser.bidang}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-emerald-800">
          {/* Main Menu */}
          <div>
            <p className="px-3 text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">
              Utama
            </p>
            <nav className="space-y-1">
              <Link
                href="/"
                prefetch={false}
                onClick={(e) => handleNav(e, "/")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                  <span>
                    {isKepsek
                      ? "Dashboard Eksekutif"
                      : isTU
                      ? "Dashboard Tata Usaha"
                      : isKasubag
                      ? "Dashboard Struktural"
                      : "Dashboard Guru"}
                  </span>
                </div>
              </Link>

              {/* Biodata & Jenjang Karier Pegawai */}
              <Link
                href="/biodata"
                prefetch={false}
                onClick={(e) => handleNav(e, "/biodata")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/biodata")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <GraduationCap className="w-4 h-4 text-emerald-300" />
                  <span>Biodata & Jenjang Karier</span>
                </div>
              </Link>
            </nav>
          </div>

          {/* E-Office & Persuratan */}
          <div>
            <p className="px-3 text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">
              E-Office & Persuratan
            </p>
            <nav className="space-y-1">
              {/* Surat Keluar */}
              <Link
                href="/surat-keluar"
                prefetch={false}
                onClick={(e) => handleNav(e, "/surat-keluar")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/surat-keluar")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Send className="w-4 h-4 text-emerald-300" />
                  <span>Surat Keluar & TTD</span>
                </div>
                {pendingSK > 0 && (
                  <span className="text-[10px] bg-amber-500 text-gray-900 font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                    {pendingSK}
                  </span>
                )}
              </Link>

              {/* Surat Masuk & OCR */}
              <Link
                href="/surat-masuk"
                prefetch={false}
                onClick={(e) => handleNav(e, "/surat-masuk")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/surat-masuk")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Inbox className="w-4 h-4 text-emerald-300" />
                  <span>Surat Masuk & OCR</span>
                </div>
              </Link>

              {/* Disposisi Cerdas */}
              <Link
                href="/disposisi"
                prefetch={false}
                onClick={(e) => handleNav(e, "/disposisi")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/disposisi")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Share2 className="w-4 h-4 text-emerald-300" />
                  <span>Disposisi & WhatsApp</span>
                </div>
                {myPendingDisp > 0 && (
                  <span className="text-[10px] bg-gold-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                    {myPendingDisp}
                  </span>
                )}
              </Link>

              {/* Notulensi & Risalah Rapat */}
              <Link
                href="/notulen"
                prefetch={false}
                onClick={(e) => handleNav(e, "/notulen")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/notulen")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <ClipboardList className="w-4 h-4 text-emerald-300" />
                  <span>Notulensi Rapat</span>
                </div>
                {pendingActionItems > 0 && (
                  <span
                    title={`${pendingActionItems} tindak lanjut aktif`}
                    className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full pointer-events-none"
                  >
                    {pendingActionItems}
                  </span>
                )}
              </Link>

              {/* Dokumentasi & Galeri Kegiatan */}
              <Link
                href="/dokumentasi"
                prefetch={false}
                onClick={(e) => handleNav(e, "/dokumentasi")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/dokumentasi")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Camera className="w-4 h-4 text-emerald-300" />
                  <span>Dokumentasi Kegiatan</span>
                </div>
                {totalDokumentasi > 0 && (
                  <span
                    title={`${totalDokumentasi} album kegiatan`}
                    className="text-[10px] bg-emerald-600/90 text-white font-semibold px-1.5 py-0.5 rounded-full pointer-events-none"
                  >
                    {totalDokumentasi}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* SIMS & Perencanaan Strategis */}
          <div>
            <p className="px-3 text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">
              Perencanaan & Kinerja
            </p>
            <nav className="space-y-1">
              {/* RKT */}
              <Link
                href="/rkt"
                prefetch={false}
                onClick={(e) => handleNav(e, "/rkt")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/rkt")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <CalendarDays className="w-4 h-4 text-emerald-300" />
                  <span>Rencana Kerja (RKT)</span>
                </div>
                {pendingRKT > 0 && (
                  <span className="text-[10px] bg-blue-400 text-blue-950 font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                    {pendingRKT}
                  </span>
                )}
              </Link>

              {/* Action Plan */}
              <Link
                href="/action-plan"
                prefetch={false}
                onClick={(e) => handleNav(e, "/action-plan")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/action-plan")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Action Plan Bulanan</span>
                </div>
              </Link>

              {/* Action Report */}
              <Link
                href="/action-report"
                prefetch={false}
                onClick={(e) => handleNav(e, "/action-report")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/action-report")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Action Report & Evaluasi</span>
                </div>
              </Link>

              {/* Presensi & Rekap Fingerprint / Presensi Pribadi Saya */}
              <Link
                href="/presensi"
                prefetch={false}
                onClick={(e) => handleNav(e, "/presensi")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/presensi")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Clock className="w-4 h-4 text-emerald-300" />
                  <span>
                    {canManageAllPresensi ? "Presensi & Fingerprint" : "Presensi Pribadi Saya"}
                  </span>
                </div>
                {canManageAllPresensi && Boolean(currentReport && currentReport.guruTidakKkmCount > 0) && (
                  <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full shadow-xs pointer-events-none">
                    {currentReport?.guruTidakKkmCount} Alert
                  </span>
                )}
              </Link>

              {/* Kombel SEBATIK */}
              <Link
                href={isKepsek ? "/kombel-sebatik/admin" : "/kombel-sebatik"}
                prefetch={false}
                onClick={(e) => handleNav(e, isKepsek ? "/kombel-sebatik/admin" : "/kombel-sebatik")}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                  isActive("/kombel-sebatik")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Award className="w-4 h-4 text-emerald-300" />
                  <span>{isKepsek ? "Kombel SEBATIK (VBPG)" : "Kombel SEBATIK"}</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold px-1.5 py-0.5 rounded pointer-events-none">
                  {isKepsek ? "Laporan" : "Refleksi KBM"}
                </span>
              </Link>
            </nav>
          </div>

          {/* Master Data (Kepala Sekolah & Kepala TU) */}
          {(isKepsek || isTU) && (
            <div>
              <p className="px-3 text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">
                Master Data
              </p>
              <nav className="space-y-1">
                <Link
                  href="/master/perspektif"
                  prefetch={false}
                  onClick={(e) => handleNav(e, "/master/perspektif")}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                    isActive("/master/perspektif")
                      ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                      : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    <Database className="w-4 h-4 text-emerald-300" />
                    <span>Master Perspektif RKT</span>
                  </div>
                </Link>

                <Link
                  href="/master/kop-surat"
                  prefetch={false}
                  onClick={(e) => handleNav(e, "/master/kop-surat")}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                    isActive("/master/kop-surat")
                      ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                      : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    <Stamp className="w-4 h-4 text-emerald-300" />
                    <span>Kop, Logo & TTD Resmi</span>
                  </div>
                </Link>

                <Link
                  href="/master/users"
                  prefetch={false}
                  onClick={(e) => handleNav(e, "/master/users")}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                    isActive("/master/users")
                      ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                      : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    <Users className="w-4 h-4 text-emerald-300" />
                    <span>Pengguna & Hak Akses</span>
                  </div>
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-emerald-800/60 text-center text-[10px] text-emerald-400/80 bg-[#053d2e]">
          <span>SIGAP-SMK v1.0.0 • 2026</span>
          <p className="text-[9px] text-emerald-500">Kemenag & Kemendikdasmen RI</p>
        </div>
      </aside>
    </>
  );
};
