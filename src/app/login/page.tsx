"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { LOGO_SMK_DATA_URL } from "@/lib/seedData";
import {
  Lock,
  User as UserIcon,
  LogIn,
  KeyRound,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { users, login, setCurrentUserById } = useAuth();
  const { addToast, schoolSettings } = useAppData();

  const schoolLogo = schoolSettings?.logoSmkUrl || LOGO_SMK_DATA_URL;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier.trim()) {
      setErrorMsg("Silakan masukkan NIY atau Email Anda.");
      return;
    }

    setIsLoading(true);
    const result = login(identifier, password);
    setIsLoading(false);

    if (result.success) {
      addToast("success", "Login Berhasil", "Selamat datang di SIGAP-SMK Bayt Al-Hikmah!");
      router.push("/");
    } else {
      setErrorMsg(result.message || "Gagal masuk. Periksa kembali NIY atau Password.");
    }
  };

  const handleQuickLogin = (userId: string, roleName: string) => {
    setCurrentUserById(userId);
    addToast("success", `Login sebagai ${roleName}`, "Anda berhasil masuk ke portal sistem.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#064e3b] via-[#053d2e] to-[#03261c] flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-2.5 mx-auto">
            <img
              src={schoolLogo}
              alt="Logo SMK Bayt Al-Hikmah"
              className="w-full h-full object-contain drop-shadow"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                SIGAP<span className="text-gold-400">-SMK</span>
              </h1>
              <span className="text-[10px] bg-gold-400/20 text-gold-300 border border-gold-400/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                E-OFFICE
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 font-medium mt-1">
              Sistem Informasi Gerak Cepat & Administrasi Terpadu
            </p>
            <p className="text-[11px] text-emerald-300/70">
              SMK Bayt Al-Hikmah Pasuruan
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-900/40 space-y-5">
          <div className="text-center pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Masuk ke Akun Anda</h2>
            <p className="text-xs text-gray-500">
              Gunakan NIY (Nomor Induk Yayasan) atau Email resmi sekolah
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2">
              <span className="font-bold">•</span>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Manual Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                NIY atau Email Pegawai:
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: 14215094 atau email"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  Password:
                </label>
                <span className="text-[10px] text-gray-400">Default: 123456</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider absolute">
              Atau Masuk Cepat 1-Klik
            </span>
          </div>

          {/* Quick 1-Click Role Login */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {users.map((user) => {
              const isKS = user.role === "kepala_sekolah";
              const isTU = user.role === "tata_usaha";
              const isKB = user.role === "kasubag";
              const badgeColor = isKS
                ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950"
                : isTU
                ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-950"
                : isKB
                ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-950"
                : "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-950";
              const avatarBg = isKS
                ? "bg-amber-200 text-amber-900"
                : isTU
                ? "bg-emerald-200 text-emerald-900"
                : isKB
                ? "bg-blue-200 text-blue-900"
                : "bg-purple-200 text-purple-900";
              const shortRole = isKS ? "KS" : isTU ? "TU" : isKB ? "KB" : "GU";

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user.id, user.jabatan || user.name)}
                  className={`p-2.5 border rounded-xl text-left transition-colors flex items-center gap-2.5 ${badgeColor}`}
                >
                  <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${avatarBg}`}>
                    {shortRole}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] opacity-80 block truncate font-mono">
                      NIY. {user.niy || user.nip || "-"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-center text-[11px] text-gray-400">
            <span>Butuh bantuan akses? Hubungi Tata Usaha SMK Bayt Al-Hikmah</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-emerald-300/60">
          SIGAP-SMK © 2026 Yayasan Pondok Pesantren Bayt Al-Hikmah Pasuruan
        </p>
      </div>
    </div>
  );
}
