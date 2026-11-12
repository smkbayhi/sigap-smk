"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { LOGO_SMK_DATA_URL } from "@/lib/seedData";
import {
  ChevronDown,
  RotateCcw,
  Menu,
  Shield,
  FileCheck2,
  Mail,
  Phone,
  CheckCircle,
  LogOut,
  Edit3,
  X,
  Save,
  User as UserIcon,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { currentUser, updateUser, logout } = useAuth();
  const { suratKeluar, rkt, resetAllData, isCloudConnected, schoolSettings, updateSchoolSettings, addToast } = useAppData();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(currentUser.name);
  const [editJabatan, setEditJabatan] = useState(currentUser.jabatan);
  const [editEmail, setEditEmail] = useState(currentUser.email || "");
  const [editPhone, setEditPhone] = useState(currentUser.phone || "");
  const [editPassword, setEditPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const schoolLogo = schoolSettings?.logoSmkUrl || LOGO_SMK_DATA_URL;

  // Counters
  const pendingSK = suratKeluar.filter((s) => s.status === "menunggu_persetujuan").length;
  const pendingRKT = rkt.filter((r) => r.status === "menunggu_persetujuan").length;

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
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "tata_usaha":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "kasubag":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "guru":
        return "bg-purple-100 text-purple-900 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleOpenEditModal = () => {
    setEditName(currentUser.name);
    setEditJabatan(currentUser.jabatan);
    setEditEmail(currentUser.email || "");
    setEditPhone(currentUser.phone || "");
    setEditPassword("");
    setShowProfileModal(false);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      addToast("error", "Nama Tidak Boleh Kosong", "Silakan masukkan nama lengkap.");
      return;
    }

    setIsSaving(true);
    try {
      const newPassword = editPassword.trim();
      updateUser(currentUser.id, {
        name: editName.trim(),
        jabatan: editJabatan.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        ...(newPassword ? { password: newPassword } : {}),
      });

      // If user is kepala sekolah, sync name and password to schoolSettings
      if (currentUser.role === "kepala_sekolah") {
        updateSchoolSettings({
          namaKepsek: editName.trim(),
          ...(newPassword ? { password: newPassword } : {}),
        });
      }

      addToast("success", "Profil Berhasil Diperbarui", "Data akun Anda telah disimpan dan disinkronkan.");
      setShowEditModal(false);
    } catch (err) {
      console.error("Gagal memperbarui profil:", err);
      addToast("error", "Gagal Memperbarui", "Terjadi kesalahan saat menyimpan perubahan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8">
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
                  src={schoolLogo}
                  alt="Logo SMK Bayt Al-Hikmah"
                  className="w-9 h-9 object-contain drop-shadow-sm shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-brand-800 text-base sm:text-lg tracking-tight">
                      SIGAP<span className="text-gold-600">-SMK</span>
                    </span>
                    <span className="text-[10px] bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded border border-brand-200">
                      E-OFFICE & SIMS
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium -mt-0.5">
                    SMK Bayt Al-Hikmah Pasuruan
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Indicators & Active User Profile */}
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
                  if (window.confirm("Kembalikan semua data ke status awal seeder resmi?")) {
                    resetAllData();
                  }
                }}
                title="Reset Data Demo"
                className="p-2 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Active User Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileModal(!showProfileModal)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-700 text-white font-bold text-xs flex items-center justify-center border-2 border-gold-400 overflow-hidden shadow-sm shrink-0">
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

                {/* Active Profile Dropdown Card */}
                {showProfileModal && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
                      onClick={() => setShowProfileModal(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 animate-in fade-in-50 zoom-in-95 overflow-hidden">
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                            Akun Pengguna Aktif
                          </span>
                          <span className="text-[10px] bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
                            Aktif
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold text-base flex items-center justify-center border-2 border-gold-400 shadow-md shrink-0">
                            {currentUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">
                              {currentUser.name}
                            </h3>
                            <p className="text-xs text-emerald-200 truncate">
                              {currentUser.jabatan}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detail Information */}
                      <div className="p-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-500">Peran / Hak Akses:</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getRoleBadgeColor(currentUser.role)}`}>
                            {getRoleLabel(currentUser.role)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-500">NIY / NIP:</span>
                          <span className="font-mono font-bold text-gray-800">
                            {currentUser.niy || currentUser.nip || "-"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-500">Email Resmi:</span>
                          <span className="font-medium text-gray-800 truncate max-w-[170px]" title={currentUser.email}>
                            {currentUser.email || "-"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-500">Nomor WhatsApp:</span>
                          <span className="font-mono font-medium text-gray-800">
                            {currentUser.phone || "-"}
                          </span>
                        </div>

                        {currentUser.bidang && (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-gray-500">Bidang Struktural:</span>
                            <span className="font-semibold text-emerald-800 capitalize">
                              {currentUser.bidang}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions: Edit Profil & Keluar */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          onClick={handleOpenEditModal}
                          className="flex-1 py-2 px-3 bg-white hover:bg-gray-100 text-brand-800 border border-gray-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-brand-700" />
                          <span>Edit Profil</span>
                        </button>

                        <button
                          onClick={() => {
                            logout();
                            setShowProfileModal(false);
                            router.push("/login");
                          }}
                          className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit Profil Akun Saya</h3>
                  <p className="text-[11px] text-emerald-200">Perbarui biodata dan kontak akun aktif</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Nama Lengkap & Gelar: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs font-semibold"
                  placeholder="Contoh: Ainiyatul Fitriyah, S.S"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Jabatan Resmi: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editJabatan}
                  onChange={(e) => setEditJabatan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs font-semibold"
                  placeholder="Contoh: Kepala TU & Bendahara"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Email Resmi:
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs"
                    placeholder="nama@smk.baytalhikmah.sch.id"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Nomor WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs font-mono"
                    placeholder="Contoh: 6281234567890"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-700 font-bold">
                    Ubah Password (Opsional):
                  </label>
                  <span className="text-[10px] text-gray-400">Kosongkan jika tidak diubah</span>
                </div>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs"
                  placeholder="Ketik password baru (min 6 karakter)"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? "Menyimpan..." : "Simpan Profil"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};