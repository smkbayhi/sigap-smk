"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { LOGO_SMK_DATA_URL } from "@/lib/seedData";
import {
  UserCheck,
  ChevronDown,
  RotateCcw,
  Menu,
  Shield,
  FileCheck2,
  Mail,
  CheckCircle,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentUser, users, setCurrentUserById } = useAuth();
  const { suratKeluar, disposisi, rkt, resetAllData, isCloudConnected } = useAppData();
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Counters
  const pendingSK = suratKeluar.filter((s) => s.status === "menunggu_persetujuan").length;
  const pendingRKT = rkt.filter((r) => r.status === "menunggu_persetujuan").length;
  const pendingDisp = disposisi.filter((d) => d.status === "menunggu" || d.status === "proses").length;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "kepala_sekolah":
        return "Kepala Sekolah (Approver)";
      case "tata_usaha":
        return "Tata Usaha (TU)";
      case "kasubag":
        return "Kasubag / Struktural";
      case "guru":
        return "Dewan Guru";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "kepala_sekolah":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "tata_usaha":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "kasubag":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "guru":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-brand-800 hover:bg-gray-100 focus:outline-none"
              aria-label="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={LOGO_SMK_DATA_URL}
                alt="Logo SMK Bayt Al-Hikmah"
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-brand-800 text-lg tracking-tight">
                    SIGAP<span className="text-gold-600">-SMK</span>
                  </span>
                  <span className="text-[10px] bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded border border-brand-200">
                    E-OFFICE & SIMS
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium -mt-1">
                  SMK Bayt Al-Hikmah Pasuruan
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Role Switcher & Action Pills */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Status indicators for Kepsek */}
            {currentUser.role === "kepala_sekolah" && (pendingSK > 0 || pendingRKT > 0) && (
              <div className="hidden md:flex items-center gap-2 mr-2">
                {pendingSK > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse font-medium">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                    {pendingSK} SK Menunggu TTD
                  </span>
                )}
                {pendingRKT > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    {pendingRKT} RKT Menunggu Review
                  </span>
                )}
              </div>
            )}

            {/* Supabase Cloud Indicator */}
            {isCloudConnected ? (
              <div 
                title="Terhubung ke Database Cloud Supabase" 
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Supabase Cloud</span>
              </div>
            ) : (
              <div 
                title="Berjalan dalam Mode Penyimpanan Lokal" 
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
              >
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Lokal Mode</span>
              </div>
            )}

            {/* Reset Demo button */}
            <button
              onClick={() => {
                if (window.confirm("Kembalikan semua data ke status awal dummy/seeder?")) {
                  resetAllData();
                }
              }}
              title="Reset Data Demo"
              className="p-2 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleModal(!showRoleModal)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-700 text-white font-bold text-xs flex items-center justify-center border-2 border-gold-400 overflow-hidden shadow-sm">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-gray-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    {currentUser.jabatan}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Role Dropdown Modal */}
              {showRoleModal && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setShowRoleModal(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 pb-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                          Ganti Peran Pengguna (Role Demo)
                        </span>
                        <span className="text-[10px] bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full font-bold">
                          4 Role RBAC
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Pilih akun di bawah untuk menguji hak akses & workflow yang berbeda:
                      </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto py-2 divide-y divide-gray-50">
                      {users.map((u) => {
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setCurrentUserById(u.id);
                              setShowRoleModal(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-brand-50/60 transition-colors ${
                              isSelected ? "bg-brand-50" : ""
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-brand-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {u.name}
                                </p>
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0 ml-1" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600 truncate">{u.jabatan}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${getRoleBadgeColor(
                                    u.role
                                  )}`}
                                >
                                  {getRoleLabel(u.role)}
                                </span>
                                {u.bidang && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                                    {u.bidang}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-4 pt-2 border-t border-gray-100 bg-gray-50/80 -mb-1 text-[11px] text-gray-500">
                      💡 Tip: Anda dapat langsung berpindah antar role untuk menguji proses approval TTD, OCR, dan RKT secara nyata.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
