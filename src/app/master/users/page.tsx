"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { User, UserRole, BidangStruktural } from "@/lib/database.types";
import {
  Users,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  UserCheck,
  Edit3,
  Plus,
  X,
  Save,
  Trash2,
  Lock,
  Upload,
  PenTool,
  Stamp,
  Search,
  KeyRound,
} from "lucide-react";

export default function MasterUsersPage() {
  const { users, currentUser, setCurrentUserById, updateUser, addUser, deleteUser } = useAuth();
  const { addToast } = useAppData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formNiy, setFormNiy] = useState("");
  const [formJabatan, setFormJabatan] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("guru");
  const [formBidang, setFormBidang] = useState<BidangStruktural | "">("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTtd, setFormTtd] = useState<string | undefined>(undefined);
  const [formStempel, setFormStempel] = useState<string | undefined>(undefined);

  const ttdInputRef = useRef<HTMLInputElement>(null);
  const stempelInputRef = useRef<HTMLInputElement>(null);

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

  const getRoleBadge = (role: string) => {
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

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditUserId(null);
    setFormName("");
    setFormNiy("");
    setFormJabatan("");
    setFormRole("guru");
    setFormBidang("");
    setFormEmail("");
    setFormPassword("123456");
    setFormPhone("628");
    setFormTtd(undefined);
    setFormStempel(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setEditUserId(user.id);
    setFormName(user.name);
    setFormNiy(user.niy || user.nip || "");
    setFormJabatan(user.jabatan);
    setFormRole(user.role);
    setFormBidang(user.bidang || "");
    setFormEmail(user.email);
    setFormPassword(user.password || "123456");
    setFormPhone(user.phone);
    setFormTtd(user.ttd_url);
    setFormStempel(user.stempel_url);
    setIsModalOpen(true);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formNiy.trim() || !formEmail.trim()) {
      addToast("error", "Validasi Gagal", "Nama, NIY, dan Email wajib diisi.");
      return;
    }

    if (isEditing && editUserId) {
      updateUser(editUserId, {
        name: formName,
        niy: formNiy,
        nip: formNiy,
        jabatan: formJabatan,
        role: formRole,
        bidang: formRole === "kasubag" && formBidang ? (formBidang as BidangStruktural) : undefined,
        email: formEmail,
        password: formPassword,
        phone: formPhone.replace(/\D/g, ""),
        ttd_url: formTtd,
        stempel_url: formStempel,
      });
      addToast("success", "Data Pegawai Disimpan", `Data ${formName} (NIY: ${formNiy}) berhasil diperbarui.`);
    } else {
      addUser({
        name: formName,
        niy: formNiy,
        nip: formNiy,
        jabatan: formJabatan,
        role: formRole,
        bidang: formRole === "kasubag" && formBidang ? (formBidang as BidangStruktural) : undefined,
        email: formEmail,
        password: formPassword || "123456",
        phone: formPhone.replace(/\D/g, ""),
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        ttd_url: formTtd,
        stempel_url: formStempel,
      });
      addToast("success", "Pengguna Baru Ditambahkan", `Akun untuk ${formName} siap digunakan login.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus akun ${name}? Tindakan ini akan menghapus akun secara permanen dari sistem dan database cloud.`)) {
      await deleteUser(userId);
      setIsModalOpen(false);
      addToast("info", "Akun Dihapus", `Pengguna ${name} telah dihapus.`);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.niy || u.nip || "").includes(searchQuery) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.jabatan.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Master Pengguna & Hak Akses (Role-Based Access Control)
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Kelola akun 4 level hak akses pengguna, NIY yayasan, jabatan dinas, dan kredensial login.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIY, jabatan..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Filter Role:</span>
          {["all", "kepala_sekolah", "tata_usaha", "kasubag", "guru"].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedRoleFilter === role
                  ? "bg-brand-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {role === "all" ? "Semua" : role.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isCurrentActive = user.id === currentUser.id;
          const userNiy = user.niy || user.nip || "-";

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                isCurrentActive
                  ? "border-2 border-brand-600 ring-2 ring-brand-500/15 shadow-card"
                  : "border-slate-200 hover:border-gray-300"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-800 text-white font-black text-sm flex items-center justify-center border-2 border-gold-400 shadow-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">{user.name}</h3>
                      <p className="text-[11px] text-gray-600">{user.jabatan}</p>
                    </div>
                  </div>

                  {isCurrentActive && (
                    <span className="text-[10px] bg-brand-600 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                      Sedang Aktif
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">Role RBAC:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">NIY (Nomor Induk):</span>
                    <span className="font-mono font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {userNiy}
                    </span>
                  </div>

                  {user.bidang && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[11px]">Bidang:</span>
                      <span className="font-semibold text-gray-800 capitalize">
                        {user.bidang.replace("_", " ")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">WhatsApp:</span>
                    <a
                      href={`https://wa.me/${user.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-emerald-700 font-bold hover:underline"
                    >
                      +{user.phone}
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">Email / Login:</span>
                    <span className="text-gray-700 truncate max-w-[160px] font-mono text-[11px]">
                      {user.email}
                    </span>
                  </div>

                  {user.ttd_url && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-400 text-[10px]">TTD Digital:</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        ✓ Terpasang
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit Data & Switch Profile */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(user)}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-600" />
                  Edit Data
                </button>

                {isCurrentActive ? (
                  <div className="flex-1 py-2 bg-brand-50 text-brand-800 rounded-xl text-center text-xs font-bold border border-brand-200 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                    Aktif
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentUserById(user.id)}
                    className="flex-1 py-2 px-3 bg-brand-50 hover:bg-brand-700 hover:text-white text-brand-900 border border-brand-200 hover:border-brand-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Ganti
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Edit / Tambah Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {isEditing ? "Edit Data Pegawai & Akun Login" : "Tambah Pegawai Baru"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    SMK Bayt Al-Hikmah Pasuruan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row 1: Nama & NIY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Lengkap & Gelar: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Mokhamat Ekhsan, S.Kom"
                    className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    NIY (Nomor Induk Yayasan): <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNiy}
                    onChange={(e) => setFormNiy(e.target.value)}
                    placeholder="Contoh: 14215094"
                    className="w-full text-xs font-mono font-bold rounded-xl border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 text-brand-900"
                  />
                </div>
              </div>

              {/* Row 2: Jabatan & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Jabatan Dinas: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    placeholder="Contoh: Kepala SMK / Kasubag Kurikulum"
                    className="w-full text-xs rounded-xl border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Hak Akses (Role RBAC): <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full text-xs font-semibold rounded-xl border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="kepala_sekolah">Kepala Sekolah (Approver Surat & RKT)</option>
                    <option value="tata_usaha">Tata Usaha (TU - Arsip & Draf Surat)</option>
                    <option value="kasubag">Kasubag / Struktural (Input RKT & Action Plan)</option>
                    <option value="guru">Dewan Guru (Tindak Lanjut Disposisi)</option>
                  </select>
                </div>
              </div>

              {/* Conditional: Bidang Struktural if Kasubag */}
              {formRole === "kasubag" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Bidang Struktural Kasubag:
                  </label>
                  <select
                    value={formBidang}
                    onChange={(e) => setFormBidang(e.target.value as BidangStruktural)}
                    className="w-full text-xs font-semibold rounded-xl border border-blue-300 px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 text-blue-950"
                  >
                    <option value="">Pilih Bidang...</option>
                    <option value="kurikulum">Kurikulum & Akademik</option>
                    <option value="kesiswaan">Kesiswaan & Karakter</option>
                    <option value="sarpras">Sarana, Prasarana & TI</option>
                    <option value="humas_bkk">Humas & Hubungan Industri (BKK)</option>
                  </select>
                </div>
              )}

              {/* Row 3: Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email / ID Login: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="user@smk.baytalhikmah.sch.id"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Password Akun:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Password login (default: 123456)"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-brand-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Phone WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor WhatsApp (Aktif Notifikasi Disposisi):
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 6281234567890 / 081234..."
                    className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Format disarankan diawali 62 atau 0 (otomatis dikonversi ke link WhatsApp resmi).
                </p>
              </div>

              {/* Optional: TTD Digital & Stempel (terutama jika Kepala Sekolah) */}
              <div className="pt-2 border-t border-gray-100">
                <span className="block text-xs font-bold text-gray-700 mb-2">
                  Tanda Tangan Digital & Stempel (Opsional):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* TTD Upload */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">TTD Digital</span>
                        <span className="text-[10px] text-gray-500">
                          {formTtd ? "✓ Ada gambar TTD" : "Belum diupload"}
                        </span>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={ttdInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setFormTtd)}
                    />
                    <button
                      type="button"
                      onClick={() => ttdInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Pilih File
                    </button>
                  </div>

                  {/* Stempel Upload */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stamp className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Stempel Cap</span>
                        <span className="text-[10px] text-gray-500">
                          {formStempel ? "✓ Ada stempel" : "Belum diupload"}
                        </span>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={stempelInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setFormStempel)}
                    />
                    <button
                      type="button"
                      onClick={() => stempelInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Pilih File
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                {isEditing && editUserId ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editUserId, formName)}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Pegawai
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Data
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
