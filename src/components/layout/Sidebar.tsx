"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { usePresensi } from "@/context/PresensiContext";
import { LOGO_SMK_DATA_URL } from "@/lib/seedData";
import { findTeacherRecordForUser } from "@/lib/presensiParser";
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
  ShieldCheck,
  X,
  PlusCircle,
  FileCheck2,
  Clock,
  Sparkles,
  Stamp,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { currentUser, isKepsek, isTU, isKasubag, isGuru } = useAuth();
  const { suratKeluar, disposisi, rkt, schoolSettings } = useAppData();
  const { currentReport } = usePresensi();
  const schoolLogo = schoolSettings?.logoSmkUrl || LOGO_SMK_DATA_URL;

  const pendingSK = suratKeluar.filter((s) => s.status === "menunggu_persetujuan").length;
  const pendingRKT = rkt.filter((r) => r.status === "menunggu_persetujuan").length;
  
  // Pending disposisi for current user or overall
  const myPendingDisp = disposisi.filter((d) => 
    (d.status === "menunggu" || d.status === "proses") && 
    (isKepsek || isTU || d.penerima_id === currentUser.id)
  ).length;

  // Presensi permissions: Kepala Sekolah & Tata Usaha can manage all presensi;
  // teachers and kasubag only monitor their own personal presensi
  const canManageAllPresensi = isKepsek || isTU;
  const myTeacherRecord = !canManageAllPresensi
    ? findTeacherRecordForUser(currentReport?.teachers, currentUser)
    : undefined;
  const isMyPresensiTidakKkm = myTeacherRecord?.statusKkm === "TIDAK KKM";

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
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

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#064e3b] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-800/60 bg-[#053d2e]">
          <div className="flex items-center gap-2.5">
            <img
              src={schoolLogo}
              alt="Logo SMK Bayt Al-Hikmah"
              className="w-8 h-8 object-contain drop-shadow-sm"
            />
            <div>
              <span className="font-extrabold text-white text-base tracking-wider">
                SIGAP<span className="text-gold-400">-SMK</span>
              </span>
              <p className="text-[10px] text-emerald-300 font-medium leading-none mt-0.5">
                Bayt Al-Hikmah Pasuruan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-emerald-300 hover:text-white p-1"
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
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
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
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/surat-keluar")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-emerald-300" />
                  <span>Surat Keluar & TTD</span>
                </div>
                {pendingSK > 0 && (
                  <span className="text-[10px] bg-amber-500 text-gray-900 font-bold px-1.5 py-0.5 rounded-full">
                    {pendingSK}
                  </span>
                )}
              </Link>

              {/* Surat Masuk & OCR */}
              <Link
                href="/surat-masuk"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/surat-masuk")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 text-emerald-300" />
                  <span>Surat Masuk & OCR</span>
                </div>
              </Link>

              {/* Disposisi Cerdas */}
              <Link
                href="/disposisi"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/disposisi")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-emerald-300" />
                  <span>Disposisi & WhatsApp</span>
                </div>
                {myPendingDisp > 0 && (
                  <span className="text-[10px] bg-gold-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded-full">
                    {myPendingDisp}
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
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/rkt")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-emerald-300" />
                  <span>Rencana Kerja (RKT)</span>
                </div>
                {pendingRKT > 0 && (
                  <span className="text-[10px] bg-blue-400 text-blue-950 font-bold px-1.5 py-0.5 rounded-full">
                    {pendingRKT}
                  </span>
                )}
              </Link>

              {/* Action Plan */}
              <Link
                href="/action-plan"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/action-plan")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-emerald-300" />
                  <span>Action Plan Bulanan</span>
                </div>
              </Link>

              {/* Action Report */}
              <Link
                href="/action-report"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/action-report")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Action Report & Evaluasi</span>
                </div>
              </Link>

              {/* Presensi & Rekap Fingerprint / Presensi Pribadi Saya */}
              <Link
                href="/presensi"
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive("/presensi")
                    ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-emerald-300" />
                  <span>
                    {canManageAllPresensi ? "Presensi & Fingerprint" : "Presensi Pribadi Saya"}
                  </span>
                </div>
                {canManageAllPresensi && Boolean(currentReport && currentReport.guruTidakKkmCount > 0) && (
                  <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full shadow-xs">
                    {currentReport?.guruTidakKkmCount} Alert
                  </span>
                )}
                {!canManageAllPresensi && isMyPresensiTidakKkm && (
                  <span
                    className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full shadow-xs"
                    title="Keterlambatan ≥ 50% (Perlu Evaluasi Diri)"
                  >
                    Perlu Evaluasi
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Master Data (Khusus Kepala Sekolah / Admin) */}
          {isKepsek && (
            <div>
              <p className="px-3 text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">
                Master Data
              </p>
              <nav className="space-y-1">
                <Link
                  href="/master/perspektif"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive("/master/perspektif")
                      ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                      : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-emerald-300" />
                    <span>Master Perspektif RKT</span>
                  </div>
                </Link>

                <Link
                  href="/master/kop-surat"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive("/master/kop-surat")
                      ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                      : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Stamp className="w-4 h-4 text-emerald-300" />
                    <span>Kop, Logo & TTD Resmi</span>
                  </div>
                </Link>

                <Link
                  href="/master/users"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive("/master/users")
                      ? "bg-emerald-700/80 text-white font-semibold shadow-inner border-l-4 border-gold-400"
                      : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
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
