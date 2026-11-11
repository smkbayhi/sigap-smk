"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Users, Shield, Phone, Mail, CheckCircle2, UserCheck } from "lucide-react";

export default function MasterUsersPage() {
  const { users, currentUser, setCurrentUserById } = useAuth();

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Master Pengguna & Hak Akses (Role-Based Access Control)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Daftar akun 4 level pengguna: Kepala Sekolah, Tata Usaha, Kasubag Struktural, dan Guru.
          </p>
        </div>

        <div className="text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 font-medium">
          Total Akun Aktif: <strong className="text-brand-900">{users.length} Pegawai</strong>
        </div>
      </div>

      {/* Grid of Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const isCurrentActive = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                isCurrentActive
                  ? "border-2 border-brand-600 ring-2 ring-brand-500/20 shadow-card"
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
                    <span className="text-[10px] bg-brand-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Akun Aktif
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
                    <span className="text-gray-400 text-[11px]">NIP:</span>
                    <span className="font-mono text-gray-900">{user.nip}</span>
                  </div>

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
                    <span className="text-gray-400 text-[11px]">Email:</span>
                    <span className="text-gray-700 truncate max-w-[150px]">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Switch into this account */}
              <div className="pt-3 border-t border-gray-100">
                {isCurrentActive ? (
                  <div className="w-full py-2 bg-brand-50 text-brand-800 rounded-xl text-center text-xs font-bold border border-brand-200 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" />
                    Sedang Digunakan
                  </div>
                ) : (
                  <button
                    onClick={() => setCurrentUserById(user.id)}
                    className="w-full py-2 bg-gray-100 hover:bg-brand-700 hover:text-white text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    Ganti ke Akun Ini
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
