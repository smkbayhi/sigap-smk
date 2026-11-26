"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  EvaluasiSebatik,
} from "@/lib/database.types";
import {
  SEBATIK_SESI_OPTIONS,
  SOAL_BAGIAN_A_PILIHAN,
  SOAL_7_OPSI,
  SOAL_8_OPSI,
  SOAL_9_OPSI,
  hitungSkorBagianA,
  cekWaktuTuntas,
} from "@/lib/sebatikConstants";
import { saveEvaluasiSebatik, getEvaluasiSebatikList } from "@/lib/sebatikService";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Send,
  RotateCcw,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";

export default function KombelSebatikFormPage() {
  const router = useRouter();
  const { currentUser, isGuru, isKepsek } = useAuth();
  const { schoolSettings } = useAppData();

  // Current Step: 1 = Identitas, 2 = Bagian A, 3 = Bagian B, 4 = Sukses
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State - Step 1: Identitas
  const [namaGuru, setNamaGuru] = useState<string>("");
  const [mataPelajaran, setMataPelajaran] = useState<string>("");
  const [sesiDiikuti, setSesiDiikuti] = useState<string[]>([SEBATIK_SESI_OPTIONS[0]]);

  // Form State - Step 2: Bagian A (Uji Pemahaman)
  const [jawabanSoal1, setJawabanSoal1] = useState<string>("");
  const [jawabanSoal2, setJawabanSoal2] = useState<string>("");
  const [jawabanSoal3, setJawabanSoal3] = useState<string>("");
  const [jawabanSoal4, setJawabanSoal4] = useState<string>("");
  const [jawabanSoal5, setJawabanSoal5] = useState<string>("");
  const [jawabanSoal6, setJawabanSoal6] = useState<string>("");

  // Form State - Step 3: Bagian B (Refleksi Waktu)
  const [jawabanSoal7, setJawabanSoal7] = useState<string>("");
  const [jawabanSoal8, setJawabanSoal8] = useState<string>("");
  const [jawabanSoal9, setJawabanSoal9] = useState<string[]>([]);
  const [jawabanSoal10, setJawabanSoal10] = useState<string>("");
  const [jawabanSoal11, setJawabanSoal11] = useState<string>("");

  // Submitted Result for Step 4
  const [submittedData, setSubmittedData] = useState<EvaluasiSebatik | null>(null);

  // Prefill teacher info from auth context and check existing submission
  useEffect(() => {
    if (currentUser && currentUser.name) {
      setNamaGuru(currentUser.name);
      if (currentUser.jabatan && !currentUser.jabatan.toLowerCase().includes("kepala")) {
        setMataPelajaran(currentUser.jabatan);
      } else if (currentUser.bidang) {
        setMataPelajaran(`Guru Bidang ${currentUser.bidang}`);
      }
    }

    async function checkExistingSubmission() {
      if (!currentUser) return;
      try {
        const list = await getEvaluasiSebatikList();
        const found = list.find((item) => {
          if (item.user_id && item.user_id === currentUser.id) return true;
          const cleanItemName = (item.nama_guru || "").toLowerCase().replace(/[^a-z]/g, "");
          const cleanUserName = (currentUser.name || "").toLowerCase().replace(/[^a-z]/g, "");
          return (
            cleanItemName.length > 3 &&
            cleanUserName.length > 3 &&
            (cleanItemName.includes(cleanUserName) || cleanUserName.includes(cleanItemName))
          );
        });

        if (found) {
          setSubmittedData(found);
          setNamaGuru(found.nama_guru);
          setMataPelajaran(found.mata_pelajaran);
          setSesiDiikuti(found.sesi_diikuti || []);
          setJawabanSoal1(found.jawaban_soal_1 || "");
          setJawabanSoal2(found.jawaban_soal_2 || "");
          setJawabanSoal3(found.jawaban_soal_3 || "");
          setJawabanSoal4(found.jawaban_soal_4 || "");
          setJawabanSoal5(found.jawaban_soal_5 || "");
          setJawabanSoal6(found.jawaban_soal_6 || "");
          setJawabanSoal7(found.jawaban_soal_7 || "");
          setJawabanSoal8(found.jawaban_soal_8 || "");
          setJawabanSoal9(found.jawaban_soal_9 || []);
          setJawabanSoal10(found.jawaban_soal_10 || "");
          setJawabanSoal11(found.jawaban_soal_11 || "");
          setCurrentStep(4);
        }
      } catch (err) {
        console.warn("Failed checking existing submission:", err);
      }
    }

    checkExistingSubmission();
  }, [currentUser]);

  // Toggle Checkbox Helpers
  const toggleSesi = (sesi: string) => {
    if (sesiDiikuti.includes(sesi)) {
      setSesiDiikuti(sesiDiikuti.filter((s) => s !== sesi));
    } else {
      setSesiDiikuti([...sesiDiikuti, sesi]);
    }
  };

  const toggleStrategi9 = (strategi: string) => {
    if (jawabanSoal9.includes(strategi)) {
      setJawabanSoal9(jawabanSoal9.filter((s) => s !== strategi));
    } else {
      setJawabanSoal9([...jawabanSoal9, strategi]);
    }
  };

  // STEP NAVIGATION & VALIDATION
  const handleNextToStep2 = () => {
    setErrorMessage(null);
    if (!namaGuru.trim()) {
      setErrorMessage("Silakan lengkapi Nama Lengkap & Gelar Anda.");
      return;
    }
    if (!mataPelajaran.trim()) {
      setErrorMessage("Silakan isi Mata Pelajaran yang Anda ampu.");
      return;
    }
    if (sesiDiikuti.length === 0) {
      setErrorMessage("Silakan pilih minimal 1 Sesi Berbagi Praktik Baik SEBATIK yang telah diikuti.");
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextToStep3 = () => {
    setErrorMessage(null);
    if (!jawabanSoal1 || !jawabanSoal2 || !jawabanSoal3 || !jawabanSoal4) {
      setErrorMessage("Harap jawab seluruh pertanyaan pilihan ganda pada Soal 1 s.d. 4.");
      return;
    }
    if (!jawabanSoal5.trim()) {
      setErrorMessage("Harap lengkapi jawaban esai pada Soal 5 (Contoh Pertanyaan Pemantik & Asesmen).");
      return;
    }
    if (!jawabanSoal6.trim()) {
      setErrorMessage("Harap lengkapi jawaban esai pada Soal 6 (Strategi Exit Ticket 5–7 menit).");
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SUBMIT FORM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!jawabanSoal7) {
      setErrorMessage("Harap pilih jawaban keterlaksanaan waktu pada Soal 7.");
      return;
    }
    if (!jawabanSoal8) {
      setErrorMessage("Harap pilih faktor penyebab kelebihan waktu pada Soal 8.");
      return;
    }
    if (jawabanSoal9.length === 0) {
      setErrorMessage("Silakan pilih minimal 1 strategi pengendalian waktu pada Soal 9.");
      return;
    }
    if (!jawabanSoal10.trim()) {
      setErrorMessage("Harap tuliskan perubahan nyata atau trik manajemen waktu pada Soal 10.");
      return;
    }
    if (!jawabanSoal11.trim()) {
      setErrorMessage("Harap tuliskan komitmen perbaikan KBM Anda pada Soal 11.");
      return;
    }

    setIsSubmitting(true);
    try {
      const skorA = hitungSkorBagianA(jawabanSoal1, jawabanSoal2, jawabanSoal3, jawabanSoal4);
      const waktuTuntas = cekWaktuTuntas(jawabanSoal7);

      const payload: EvaluasiSebatik = {
        id: "eval-" + Date.now(),
        user_id: currentUser?.id,
        nama_guru: namaGuru.trim(),
        mata_pelajaran: mataPelajaran.trim(),
        sesi_diikuti: sesiDiikuti,
        jawaban_soal_1: jawabanSoal1,
        jawaban_soal_2: jawabanSoal2,
        jawaban_soal_3: jawabanSoal3,
        jawaban_soal_4: jawabanSoal4,
        jawaban_soal_5: jawabanSoal5.trim(),
        jawaban_soal_6: jawabanSoal6.trim(),
        skor_bagian_a: skorA,
        jawaban_soal_7: jawabanSoal7,
        is_waktu_tuntas: waktuTuntas,
        jawaban_soal_8: jawabanSoal8,
        jawaban_soal_9: jawabanSoal9,
        jawaban_soal_10: jawabanSoal10.trim(),
        jawaban_soal_11: jawabanSoal11.trim(),
        created_at: new Date().toISOString(),
      };

      await saveEvaluasiSebatik(payload);
      setSubmittedData(payload);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kendala saat menyimpan evaluasi. Silakan periksa koneksi Anda dan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor SIGAP-SMK</span>
          </Link>

          {isKepsek && (
            <Link
              href="/kombel-sebatik/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all"
              title="Akses Laporan & Analitik Kepala Sekolah"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dasbor Rekap VBPG (Admin)</span>
            </Link>
          )}
        </div>

        {/* Hero Card Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/60">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Komunitas Belajar (Kombel) SEBATIK • SMK Bayt Al-Hikmah</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Evaluasi Pemahaman Konsep & Refleksi Kedisiplinan Waktu Mengajar
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed text-justify">
              Assalamu’alaikum Warahmatullahi Wabarakatuh. Bapak/Ibu Dewan Guru SMK Bayt Al-Hikmah yang dirahmati Allah, instrumen ini disusun sebagai refleksi bersama setelah terlaksananya 3 sesi berbagi praktik baik di Komunitas Belajar SEBATIK (bersama Ustadzah Luluk, Ustadz Khoiron, dan Ustadz Fajar) dalam rangka mengawal Program Prioritas Guru Menyela (Menyenangkan & Mengesankan). Hasil isian ini digunakan untuk memetakan penguatan mutu KBM kita secara kolektif, bukan untuk penilaian individual yang menghakimi.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-emerald-200/80 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Durasi Estimasi: 5–8 Menit
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Bagian A: 100 Poin Otomatis
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> KBM Terpadu 2×30 Menit
              </span>
            </div>
          </div>
        </div>

        {/* Progress Stepper (Only on Steps 1, 2, 3) */}
        {currentStep <= 3 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
              <span className="text-emerald-800">
                Langkah {currentStep} dari 3:{" "}
                {currentStep === 1
                  ? "Identitas Responden"
                  : currentStep === 2
                  ? "Bagian A — Uji Pemahaman Konsep"
                  : "Bagian B — Refleksi Kedisiplinan Waktu"}
              </span>
              <span className="text-slate-400 font-mono">
                {currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%"}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%",
                }}
              />
            </div>

            {/* Stepper Dots */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2 text-center text-[11px] font-semibold">
              <div
                className={`flex items-center justify-center gap-1.5 ${
                  currentStep >= 1 ? "text-emerald-800 font-bold" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep >= 1 ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  1
                </span>
                <span className="hidden sm:inline">Identitas Guru</span>
              </div>

              <div
                className={`flex items-center justify-center gap-1.5 ${
                  currentStep >= 2 ? "text-emerald-800 font-bold" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep >= 2 ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  2
                </span>
                <span className="hidden sm:inline">Pemahaman Konsep</span>
              </div>

              <div
                className={`flex items-center justify-center gap-1.5 ${
                  currentStep >= 3 ? "text-emerald-800 font-bold" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep >= 3 ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  3
                </span>
                <span className="hidden sm:inline">Refleksi Waktu</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Perhatian:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: IDENTITAS RESPONDEN */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                  1
                </span>
                Identitas Responden Dewan Guru
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lengkapi identitas mengajar Anda sebelum memulai instrumen refleksi.
              </p>
            </div>

            <div className="space-y-4">
              {/* Nama Guru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  placeholder="Contoh: Akhmad Khoiron, Lc. / Luluk Mamluatus S., S.S."
                  className="w-full text-xs font-medium px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                />
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Mata Pelajaran yang Diampu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  placeholder="Contoh: Bahasa Inggris / Desain Komunikasi Visual (DKV)"
                  className="w-full text-xs font-medium px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                />
              </div>

              {/* Sesi Praktik Baik SEBATIK yang Diikuti */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Sesi Berbagi Praktik Baik SEBATIK yang Telah Diikuti{" "}
                  <span className="text-rose-500">*</span>
                  <span className="text-slate-400 lowercase font-normal text-[11px] ml-1">
                    (Boleh memilih lebih dari satu)
                  </span>
                </label>
                <div className="space-y-2.5 pt-1">
                  {SEBATIK_SESI_OPTIONS.map((sesi, idx) => {
                    const isChecked = sesiDiikuti.includes(sesi);
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleSesi(sesi)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                            : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by label onClick
                          className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                        />
                        <span className="text-xs leading-relaxed">{sesi}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleNextToStep2}
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Lanjut ke Bagian A (Uji Pemahaman)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: BAGIAN A — UJI PEMAHAMAN KONSEP */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-8 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  Bagian A: Uji Pemahaman Konsep
                </h2>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Total 100 Poin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fokus: Membedakan <em>Pertanyaan Pemantik</em> versus <em>Asesmen Awal & Akhir</em>. Soal nomor 1 s.d. 4 bernilai 25 poin per jawaban benar.
              </p>
            </div>

            {/* SOAL 1-4 (PILIHAN GANDA) */}
            <div className="space-y-6">
              {SOAL_BAGIAN_A_PILIHAN.map((item, idx) => {
                const currentAnswer =
                  item.nomor === 1
                    ? jawabanSoal1
                    : item.nomor === 2
                    ? jawabanSoal2
                    : item.nomor === 3
                    ? jawabanSoal3
                    : jawabanSoal4;

                const setAnswer = (kode: string) => {
                  if (item.nomor === 1) setJawabanSoal1(kode);
                  if (item.nomor === 2) setJawabanSoal2(kode);
                  if (item.nomor === 3) setJawabanSoal3(kode);
                  if (item.nomor === 4) setJawabanSoal4(kode);
                };

                return (
                  <div
                    key={item.nomor}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xs font-bold text-slate-900 leading-relaxed">
                        <span className="text-emerald-800 font-extrabold mr-1">
                          Soal {item.nomor}.
                        </span>
                        {item.pertanyaan}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        25 Poin
                      </span>
                    </div>

                    {/* Radio Options */}
                    <div className="space-y-2 pt-1">
                      {item.opsi.map((opt) => {
                        const isSelected = currentAnswer === opt.kode;
                        return (
                          <label
                            key={opt.kode}
                            onClick={() => setAnswer(opt.kode)}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-2xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                                isSelected
                                  ? "bg-emerald-800 text-white"
                                  : "bg-slate-100 text-slate-600 border border-slate-300"
                              }`}
                            >
                              {opt.kode}
                            </span>
                            <span className="leading-relaxed">{opt.teks}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SOAL 5: ESAI CONTOH PEMANTIK VS ASESMEN */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-800 font-extrabold mr-1">Soal 5.</span>
                Tuliskan 1 contoh konkret <em>Pertanyaan Pemantik</em> dan 1 contoh{" "}
                <em>Pertanyaan/Soal Asesmen Awal atau Akhir</em> yang sesuai dengan salah satu materi pada mata pelajaran yang Anda ampu! <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={jawabanSoal5}
                onChange={(e) => setJawabanSoal5(e.target.value)}
                placeholder="Format jawaban: Pertanyaan Pemantik: ... | Soal Asesmen Awal/Akhir: ..."
                className="w-full text-xs font-medium px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* SOAL 6: ESAI STRATEGI ASESMEN AKHIR 5-7 MENIT */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-800 font-extrabold mr-1">Soal 6.</span>
                Bagaimana strategi Anda merancang <em>Asesmen Akhir (Exit Ticket)</em> agar mampu mengukur pemahaman individu santri hanya dalam waktu 5–7 menit tanpa membebani proses koreksi Anda? <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={jawabanSoal6}
                onChange={(e) => setJawabanSoal6(e.target.value)}
                placeholder="Tuliskan strategi praktis Anda (misal: penggunaan sticky notes, kartu ceklist 2 butir, peer assessment, atau form digital singkat)..."
                className="w-full text-xs font-medium px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Identitas</span>
              </button>

              <button
                type="button"
                onClick={handleNextToStep3}
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Lanjut ke Bagian B (Refleksi Waktu)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: BAGIAN B — REFLEKSI KEDISIPLINAN WAKTU MENGAJAR */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-8 shadow-xs"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                  3
                </span>
                Bagian B: Refleksi Kedisiplinan Waktu Mengajar (2×30 Menit)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Refleksi keterlaksanaan pembagian waktu KBM selama bulan November 2026 demi perbaikan berkelanjutan.
              </p>
            </div>

            {/* SOAL 7: KETERLAKSANAAN WAKTU */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
              <label className="block text-xs font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-800 font-extrabold mr-1">Soal 7.</span>
                Berdasarkan refleksi pelaksanaan KBM Anda selama bulan November 2026 (durasi 2×30 menit), bagaimana keterlaksanaan fase penutup dan asesmen akhir di kelas Anda? <span className="text-rose-500">*</span>
              </label>

              <div className="space-y-2 pt-1">
                {SOAL_7_OPSI.map((opt) => {
                  const isSelected = jawabanSoal7 === opt.kode;
                  return (
                    <label
                      key={opt.kode}
                      onClick={() => setJawabanSoal7(opt.kode)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-emerald-800 text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-300"
                        }`}
                      >
                        {opt.kode}
                      </span>
                      <span className="leading-relaxed">{opt.teks}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SOAL 8: FAKTOR OVERTIME */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
              <label className="block text-xs font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-800 font-extrabold mr-1">Soal 8.</span>
                Jika pernah mengalami kelebihan waktu (<em>overtime</em>) pada kegiatan inti, faktor apa yang paling sering menjadi penyebab utamanya? <span className="text-rose-500">*</span>
              </label>

              <div className="space-y-2 pt-1">
                {SOAL_8_OPSI.map((opt) => {
                  const isSelected = jawabanSoal8 === opt.kode;
                  return (
                    <label
                      key={opt.kode}
                      onClick={() => setJawabanSoal8(opt.kode)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-emerald-800 text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-300"
                        }`}
                      >
                        {opt.kode}
                      </span>
                      <span className="leading-relaxed">{opt.teks}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SOAL 9: CHECKBOX STRATEGI PENGENDALIAN WAKTU */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
              <label className="block text-xs font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-800 font-extrabold mr-1">Soal 9.</span>
                Strategi pengendalian waktu apa yang sudah Anda terapkan di kelas setelah mengikuti sesi berbagi praktik baik SEBATIK? <span className="text-rose-500">*</span>
                <span className="text-slate-400 lowercase font-normal text-[11px] ml-1">
                  (Boleh memilih lebih dari satu)
                </span>
              </label>

              <div className="space-y-2.5 pt-1">
                {SOAL_9_OPSI.map((opt, idx) => {
                  const isChecked = jawabanSoal9.includes(opt);
                  return (
                    <label
                      key={idx}
                      onClick={() => toggleStrategi9(opt)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-medium"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by label onClick
                        className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                      />
                      <span className="leading-relaxed">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SOAL 10: ESAI PERUBAHAN NYATA / TRIK MANAJEMEN WAKTU */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-800 font-extrabold mr-1">Soal 10.</span>
                Ceritakan satu perubahan nyata atau trik manajemen waktu paling efektif yang berhasil Anda terapkan di kelas agar kegiatan inti tidak molor dan evaluasi penutup tetap tuntas! <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={jawabanSoal10}
                onChange={(e) => setJawabanSoal10(e.target.value)}
                placeholder="Contoh: Menggunakan timer visual di proyektor, menyederhanakan jumlah butir LKPD, atau pembagian peran kelompok santri..."
                className="w-full text-xs font-medium px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* SOAL 11: ESAI KOMITMEN PERBAIKAN */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-800 font-extrabold mr-1">Soal 11.</span>
                Apa komitmen perbaikan spesifik yang akan Anda terapkan pada pertemuan KBM berikutnya terkait penyelarasan modul ajar, pengelolaan waktu, dan asesmen? <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={jawabanSoal11}
                onChange={(e) => setJawabanSoal11(e.target.value)}
                placeholder="Tuliskan komitmen perbaikan spesifik Anda untuk pertemuan KBM berikutnya..."
                className="w-full text-xs font-medium px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Bagian A</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Mengirim Jawaban..." : "Kirim Jawaban & Selesaikan"}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: HALAMAN SUKSES & KUNCI JAWABAN */}
        {/* ========================================================================= */}
        {currentStep === 4 && submittedData && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
            {/* Header Sukses */}
            <div className="text-center space-y-3 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Alhamdulillah, Jawaban Anda Telah Tersimpan!
              </h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Terima kasih atas partisipasi aktif Bapak/Ibu <strong>{submittedData.nama_guru}</strong> dalam mengawal mutu KBM Komunitas Belajar (Kombel) SEBATIK SMK Bayt Al-Hikmah Pasuruan.
              </p>
            </div>

            {/* Score Card Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-emerald-700">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                  Hasil Uji Pemahaman Konsep (Bagian A)
                </span>
                <h3 className="text-lg font-bold text-white">
                  Pertanyaan Pemantik vs Asesmen Awal & Akhir
                </h3>
                <p className="text-xs text-emerald-200/80">
                  {submittedData.skor_bagian_a === 100
                    ? "🎉 Luar Biasa! Anda memahami 100% konsep kunci secara tepat."
                    : submittedData.skor_bagian_a === 75
                    ? "👍 Bagus Sekali! 3 dari 4 konsep telah dipahami dengan sangat baik."
                    : "Semangat! Silakan pelajari kunci dan pembahasan singkat di bawah ini."}
                </p>
              </div>

              <div className="text-center bg-white/10 border border-white/20 rounded-2xl px-6 py-4 backdrop-blur-xs shrink-0">
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                  {submittedData.skor_bagian_a}
                </span>
                <span className="text-xs text-emerald-200 block mt-0.5 font-bold">
                  / 100 Poin
                </span>
              </div>
            </div>

            {/* KUNCI JAWABAN & PEMBAHASAN SINGKAT */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Kunci Jawaban & Pembahasan Singkat (Soal 1 s.d. 4)</span>
              </h4>

              <div className="space-y-3">
                {SOAL_BAGIAN_A_PILIHAN.map((item) => {
                  const userAnswer =
                    item.nomor === 1
                      ? submittedData.jawaban_soal_1
                      : item.nomor === 2
                      ? submittedData.jawaban_soal_2
                      : item.nomor === 3
                      ? submittedData.jawaban_soal_3
                      : submittedData.jawaban_soal_4;

                  const isCorrect = userAnswer === item.kunci;
                  const correctOptionText = item.opsi.find((o) => o.kode === item.kunci)?.teks;
                  const userOptionText = item.opsi.find((o) => o.kode === userAnswer)?.teks;

                  return (
                    <div
                      key={item.nomor}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        isCorrect
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-rose-50/40 border-rose-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          Soal {item.nomor}: {item.pertanyaan.substring(0, 80)}...
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCorrect
                              ? "bg-emerald-200 text-emerald-900"
                              : "bg-rose-200 text-rose-900"
                          }`}
                        >
                          {isCorrect ? "✓ Benar (+25 Poin)" : "✗ Kurang Tepat (0 Poin)"}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] pt-1">
                        <p className="text-slate-600">
                          Jawaban Anda:{" "}
                          <strong className={isCorrect ? "text-emerald-800" : "text-rose-700"}>
                            Opsi {userAnswer} – {userOptionText}
                          </strong>
                        </p>
                        {!isCorrect && (
                          <p className="text-emerald-800">
                            Kunci Jawaban Benar:{" "}
                            <strong>
                              Opsi {item.kunci} – {correctOptionText}
                            </strong>
                          </p>
                        )}
                        <p className="text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200/60 mt-1">
                          💡 <strong>Pembahasan:</strong> {item.pembahasan}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ubah / Perbarui Jawaban Saya</span>
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/"
                  className="flex-1 sm:flex-none text-center py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Selesai & Ke Dasbor Utama
                </Link>

                {isKepsek && (
                  <Link
                    href="/kombel-sebatik/admin"
                    className="flex-1 sm:flex-none text-center py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Dasbor Rekap VBPG (Admin)
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
