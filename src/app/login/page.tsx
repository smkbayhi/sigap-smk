"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { LOGO_SMK_DATA_URL } from "@/lib/seedData";
import {
  User as UserIcon,
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addToast, schoolSettings } = useAppData();

  const schoolLogo = schoolSettings?.logoSmkUrl || LOGO_SMK_DATA_URL;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier.trim()) {
      setErrorMsg("Silakan masukkan NIY atau Email resmi Anda.");
      return;
    }

    setIsLoading(true);
    const result = login(identifier, password);
    setIsLoading(false);

    if (result.success) {
      addToast("success", "Login Berhasil", "Selamat datang di Portal E-Office SIGAP-SMK!");
      router.push("/");
    } else {
      setErrorMsg(result.message || "Gagal masuk. Periksa kembali NIY atau Password Anda.");
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#053d2e] to-[#022c22] flex flex-col justify-between items-center px-4 py-5 sm:py-7">
      {/* Decorative Top Accent */}
      <div className="hidden sm:block" />

      {/* Main Login Card */}
      <div className="w-full max-w-[410px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-900/20 my-auto">
        {/* Brand & Logo Header */}
        <div className="text-center pb-4 mb-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 p-2 mx-auto mb-2.5 flex items-center justify-center shadow-xs">
            <img
              src={schoolLogo}
              alt="Logo SMK Bayt Al-Hikmah"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">
              SIGAP<span className="text-emerald-700">-SMK</span>
            </h1>
            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
              E-Office
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-700 mt-0.5">
            SMK Bayt Al-Hikmah Pasuruan
          </p>
          <p className="text-[10.5px] text-gray-400 mt-0.5">
            Sistem Informasi Gerak Cepat & Administrasi Terpadu
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-2.5 flex items-start gap-2 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleManualLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              NIY atau Email Pegawai:
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: 14215094 atau email resmi"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/70 font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Password Akun:
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Bawaan: 123456</span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/70 font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Autentikasi Terenkripsi & Terintegrasi Cloud</span>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-[11px] text-emerald-200/70">
        <p>SIGAP-SMK © 2026 Yayasan Pondok Pesantren Bayt Al-Hikmah Pasuruan</p>
      </footer>
    </div>
  );
}