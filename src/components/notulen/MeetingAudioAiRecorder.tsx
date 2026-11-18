"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  UploadCloud,
  FileAudio,
  Sparkles,
  RefreshCw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Key,
  Camera,
  Image as ImageIcon,
  Scan,
  Trash2,
  Eye,
  Loader2,
  Zap,
} from "lucide-react";

interface MeetingAudioAiRecorderProps {
  onGenerated: (data: any) => void;
  defaultLeaderName?: string;
  defaultNotulisName?: string;
}

export default function MeetingAudioAiRecorder({
  onGenerated,
  defaultLeaderName,
  defaultNotulisName,
}: MeetingAudioAiRecorderProps) {
  // Tabs: 'mic' | 'upload' | 'transcript'
  const [activeTab, setActiveTab] = useState<"mic" | "upload" | "transcript">("mic");

  // Recording State
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "recording" | "paused" | "stopped"
  >("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [pastedTranscript, setPastedTranscript] = useState("");

  // Upload Audio State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);

  // Upload Photo / OCR State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "scanning" | "success" | "ready">("idle");

  // AI & Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

  // Gemini API Key (stored in localStorage)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Load custom Gemini API key from localStorage on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("sigap_gemini_api_key");
      if (savedKey && savedKey.trim().length > 10) {
        setGeminiApiKey(savedKey.trim());
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveCustomApiKey = (key: string) => {
    setGeminiApiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem("sigap_gemini_api_key", key.trim());
      } else {
        localStorage.removeItem("sigap_gemini_api_key");
      }
    } catch (e) {
      // ignore
    }
    setShowApiKeyModal(false);
  };

  // Timer formatter (00:00)
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Convert Blob or File to Base64
  const fileToBase64 = (fileOrBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // 1. START LIVE RECORDING
  const startRecording = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // chunk every 1 second
      setRecordingStatus("recording");
      setRecordDuration(0);

      // Start duration timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);

      // Web Speech API for Realtime Indonesian Live Transcript
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "id-ID";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let fullText = "";
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + " ";
            }
            setLiveTranscript(fullText.trim());
          };

          recognition.onerror = (err: any) => {
            console.warn("Speech recognition error:", err);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (srErr) {
          console.warn("Speech recognition failed to initialize:", srErr);
        }
      }
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMessage(
        "Izin mikrofon ditolak atau mikrofon tidak terdeteksi. Pastikan mikrofon diizinkan di browser."
      );
    }
  };

  // 2. PAUSE / RESUME RECORDING
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingStatus("paused");
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingStatus("recording");
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  // 3. STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus !== "idle") {
      mediaRecorderRef.current.stop();
      setRecordingStatus("stopped");
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // 4. RESET RECORDING
  const resetRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setRecordingStatus("idle");
    setRecordDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setLiveTranscript("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 5. HANDLE AUDIO FILE UPLOAD
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadedAudioUrl(url);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  // 6. HANDLE PAPER NOTE PHOTO UPLOAD / CAMERA OCR
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setErrorMessage(null);
      setSuccessMessage(null);
      setOcrStatus("scanning");

      // Give immediate feedback in textarea so user never sees a blank box
      setPastedTranscript(
        `[Foto Catatan Rapat Terlampir: ${file.name}]\nSedang memproses dan membaca teks dari lembaran kertas...`
      );

      try {
        const b64 = await fileToBase64(file);
        setImageBase64(b64);
        triggerOcrExtraction(b64, file.type || "image/jpeg", file.name);
      } catch (err) {
        console.warn("Image base64 conversion failed:", err);
        setOcrStatus("ready");
      }
    }
  };

  const triggerOcrExtraction = async (b64: string, mime: string, fileName?: string) => {
    setIsOcrScanning(true);
    setOcrStatus("scanning");
    setErrorMessage(null);

    // If no Gemini API Key is set, handwriting OCR cannot be performed by serverless Tesseract
    if (!geminiApiKey.trim()) {
      setIsOcrScanning(false);
      setOcrStatus("ready");
      setPastedTranscript(
        `[Foto Catatan Terlampir: ${fileName || "img-catatan.jpg"}]\n` +
        `⚠️ Catatan tulisan tangan di atas kertas memerlukan Google Gemini Vision AI agar teksnya dapat terbaca otomatis secara presisi.\n\n` +
        `Cara Mengaktifkan:\n` +
        `1. Klik tombol 'Set API Key (Opsional)' di kanan atas dan masukkan API Key Google Gemini gratis dari Google AI Studio (aistudio.google.com).\n` +
        `2. Atau Anda dapat langsung mengetik/mengedit poin-poin catatan di kotak ini (atau klik tombol contoh MGMP & MKKS di bawah), lalu klik 'Generate Notulensi Rapat Otomatis dengan AI'.`
      );
      setErrorMessage(
        "Kunci Google Gemini API belum diisi. Foto tulisan tangan di atas kertas membutuhkan Gemini Vision AI untuk membaca otomatis. Silakan klik 'Set API Key' di atas atau ketik ringkasan di kotak catatan."
      );
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500); // 9.5s timeout for Gemini Vision

    try {
      const res = await fetch("/api/notulen/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          action: "ocr_only",
          imageBase64: b64,
          mimeType: mime,
          geminiApiKey: geminiApiKey.trim() || undefined,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && data.text && data.text.trim().length > 15 && !data.text.includes("Foto lembar catatan rapat berhasil")) {
        setPastedTranscript(data.text.trim());
        setOcrStatus("success");
        setSuccessMessage(
          `Foto tulisan tangan berhasil dibaca (${data.engine || "Google Gemini Vision"})! Klik tombol 'Generate Notulensi Rapat Otomatis dengan AI' di bawah untuk menyusun dokumen resmi.`
        );
      } else {
        setPastedTranscript(
          `[Foto Catatan Rapat Terlampir: ${fileName || "Lembar Catatan Rapat"}]\n` +
          `Silakan ketik atau tempel poin-poin pembahasan di sini, lalu klik 'Generate Notulensi Rapat Otomatis dengan AI'.`
        );
        setOcrStatus("ready");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn("OCR trigger timed out or error:", err);
      setPastedTranscript(
        `[Foto Catatan Rapat Terlampir: ${fileName || "Lembar Catatan Rapat"}]\n` +
        `Silakan ketik atau tempel poin-poin pembahasan di sini, lalu klik 'Generate Notulensi Rapat Otomatis dengan AI'.`
      );
      setOcrStatus("ready");
    } finally {
      setIsOcrScanning(false);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setImagePreviewUrl(null);
    setImageBase64(null);
    setOcrStatus("idle");
    setPastedTranscript("");
  };

  // 7. PROCESS WITH AI (AUDIO, PHOTO OCR, OR TRANSCRIPT)
  const handleGenerateAiNotulen = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    let activeTranscript = "";
    let activeAudioBase64 = "";
    let activeImageBase64 = "";
    let mimeType = "";

    if (activeTab === "mic") {
      activeTranscript = liveTranscript.trim();
      if (audioBlob) {
        try {
          activeAudioBase64 = await fileToBase64(audioBlob);
          mimeType = audioBlob.type || "audio/webm";
        } catch (e) {
          console.warn("Audio base64 conversion failed:", e);
        }
      }
    } else if (activeTab === "upload") {
      if (!uploadedFile) {
        setErrorMessage("Silakan pilih berkas rekaman suara rapat terlebih dahulu.");
        return;
      }
      try {
        activeAudioBase64 = await fileToBase64(uploadedFile);
        mimeType = uploadedFile.type || "audio/mp3";
        activeTranscript = `Berkas audio rekaman: ${uploadedFile.name}`;
      } catch (e) {
        setErrorMessage("Gagal membaca berkas audio yang diunggah.");
        return;
      }
    } else if (activeTab === "transcript") {
      activeTranscript = pastedTranscript.trim();
      if (imageBase64) {
        activeImageBase64 = imageBase64;
        mimeType = uploadedImage?.type || "image/jpeg";
      }
    }

    if (!activeTranscript && !activeAudioBase64 && !activeImageBase64) {
      setErrorMessage(
        "Tidak ada data suara, foto catatan kertas, atau transkrip yang dapat diproses. Rekam suara, foto catatan kertas rapat, atau tempel transkrip percakapan."
      );
      return;
    }

    setIsProcessing(true);
    setProcessingStep(
      activeImageBase64
        ? "Menganalisis foto catatan rapat dan tulisan tangan..."
        : "Menganalisis percakapan rapat..."
    );

    try {
      const stepTimer1 = setTimeout(() => {
        setProcessingStep("Menyusun struktur resmi: Bagian A (Identitas) & Bagian B (Susunan Acara)...");
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setProcessingStep("Mengekstraksi poin-poin pembahasan rapat dan masukan peserta...");
      }, 3000);

      const stepTimer3 = setTimeout(() => {
        setProcessingStep("Merumuskan tabel keputusan rapat, menentukan PIC dan tenggat waktu (Action Items)...");
      }, 4500);

      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/notulen/generate-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          transcript: activeTranscript,
          audioBase64: activeAudioBase64,
          imageBase64: activeImageBase64,
          mimeType: mimeType,
          geminiApiKey: geminiApiKey.trim() || undefined,
        }),
      });

      clearTimeout(abortTimeout);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memproses data dengan AI.");
      }

      setEngineUsed(result.engine || "SIGAP AI Engine");
      setSuccessMessage(
        "Berhasil! Notulensi rapat dinas telah di-generate secara otomatis sesuai format resmi dinas."
      );

      // Invoke parent callback to populate form
      if (onGenerated && result.data) {
        onGenerated(result.data);
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses data rapat dengan AI.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Demo Transcripts Loader
  const loadDemoSample = (type: "pas" | "disiplin" | "rkt" | "mgmp") => {
    setActiveTab("transcript");
    if (type === "mgmp") {
      setPastedTranscript(`Selasa, 9-10-2018
Hasil Rapat MGMP & MKKS

- UAS dilaksanakan tgl 28 November - 8 Desember 2018
- 28 - 30 November 2018 untuk mapel produktif
- 3 - 8 Desember 2018 untuk mapel yg dibuat soal bersama
- 15 Desember 2018 Penerimaan Raport.
- Masa pencetakan naskah soal selama 1 bulan.
- Penyerahan soal dari MGMP ke panitia 1 minggu sebelum soal dikirim ke percetakan
- 10 - 19 Oktober 2018 Pembuatan soal oleh MGMP.
- 22 - 26 Oktober 2018 Editing soal oleh Panitia MKKS
- 29 - 30 Oktober 2018 Soal dikirim ke percetakan.
- 1 - 23 November 2018 Proses pencetakan.
- 26 - 27 November 2018 Pengiriman soal ke sekolah

Teknik Penyusunan Soal:
Jumlah 45 butir:
  40 Pilihan Ganda nilai x 2 = 80
  5 Esay           nilai x 4 = 20
                               ---
                               100
Font Times New Roman Size 12
Spasi 1,5 cm.`);
      setOcrStatus("success");
      setSuccessMessage("Catatan rapat MGMP & MKKS (sesuai foto kertas Anda) berhasil dimuat! Klik tombol 'Generate Notulensi Rapat Otomatis dengan AI' di bawah.");
    } else if (type === "pas") {
      setPastedTranscript(`Rapat Koordinasi Persiapan Penilaian Akhir Semester (PAS) Ganjil Tahun Ajaran 2026/2027.
Waktu: Senin, 16 November 2026 pukul 09.00 WIB di Ruang Guru SMK Bayt Al-Hikmah.
Pemimpin: Kepala Sekolah Bapak Mokhamat Ekhsan, S.Kom. Notulis: Ibu Siti Aminah, S.Pd. Dihadiri 32 dewan guru dan staf.

Jalannya Rapat:
1. Rapat dibuka tepat pukul 09.05 WIB dengan pembacaan Ummul Kitab bersama dipimpin notulis.
2. Pengarahan Kepala Sekolah: Bapak Mokhamat Ekhsan menegaskan agar seluruh guru tertib mengumpulkan kisi-kisi dan naskah soal tepat waktu. Ketertiban dan kejujuran ujian adalah marwah sekolah.
3. Pembahasan Inti Kurikulum: Waka Kurikulum Bapak Nasih menyampaikan jadwal pelaksanaan PAS dimulai tanggal 30 November sampai 7 Desember 2026. Ujian berbasis CBT untuk kelas XI dan XII, serta paper-based untuk kelas X.
4. Tanggapan & Masukan: Bapak Budi Santoso menyarankan pengecekan kapasitas bandwidth Wi-Fi sekolah agar server tidak down. Ibu Rina mengusulkan adanya simulasi CBT satu hari sebelum pelaksanaan.

Keputusan Rapat & Tindak Lanjut:
- Batas akhir penyerahan naskah soal dan kisi-kisi ke panitia paling lambat tanggal 23 November 2026. PIC: Seluruh Guru Mata Pelajaran.
- Pengecekan jaringan internet dan server ujian sekolah selesai tanggal 25 November 2026. PIC: Tim IT Sekolah.
- Pelaksanaan simulasi teknis CBT bagi siswa pada tanggal 26 November 2026. PIC: Panitia Kurikulum.
- Rapat ditutup pukul 11.30 WIB dengan doa kafaratul majelis.`);
    } else if (type === "disiplin") {
      setPastedTranscript(`Rapat Pembinaan Kedisiplinan Guru dan Karyawan SMK Bayt Al-Hikmah Pasuruan.
Hari/Tanggal: Rabu, 18 November 2026 pukul 13.00 WIB di Ruang Rapat Pimpinan.
Pemimpin: Kepala Sekolah Mokhamat Ekhsan, S.Kom. Dihadiri Kepala TU dan Tim Kedisiplinan.

Pembahasan:
- Evaluasi presensi fingerprint digital pekan lalu. Terdapat staf yang mengalami kendala lupa finger saat jam pulang.
- Kepala Sekolah menginstruksikan agar Kepala Tata Usaha rutin melakukan rekonsiliasi dan verifikasi status kehadiran (izin, sakit, dinas luar) sebelum rekapitulasi dicetak.
- Pesan WA rekapitulasi kehadiran wajib menyertakan link akses webapp mandiri dengan login akun NIY masing-masing guru.

Keputusan:
1. Pembaruan format pesan WhatsApp presensi harian paling lambat 20 November 2026 oleh Tim IT.
2. Kepala TU melakukan pembinaan dan verifikasi langsung bagi guru yang terlambat lebih dari batas toleransi.`);
    } else {
      setPastedTranscript(`Rapat Evaluasi Rencana Kerja Tahunan (RKT) dan Capaian Mutu Sekolah.
Pemimpin: Mokhamat Ekhsan, S.Kom. Tempat: Aula SMK Bayt Al-Hikmah.
Membahas percepatan realisasi program kerja semester ganjil, akreditasi program keahlian, dan penguatan jejaring kerja sama industri (DUDI) untuk magang siswa PKL.`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-2xl shadow-xl border border-emerald-500/30 overflow-hidden text-white mb-8">
      {/* Hidden File Inputs for Photo Upload / Camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="px-6 py-5 border-b border-emerald-500/20 bg-emerald-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Asisten Notulis AI: Rekam Rapat, Foto Catatan & Generate Otomatis
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Fitur AI Generatif
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Rekam suara rapat, unggah audio, atau <strong>foto catatan rapat di kertas</strong>. AI membaca tulisan dan menyusun notulen dinas resmi (Bagian A s.d. E & Tabel PIC).
            </p>
          </div>
        </div>

        {/* Action / Setting Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Konfigurasi Kunci Google Gemini API (Opsional)"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{geminiApiKey ? "Gemini Key: Aktif" : "Set API Key (Opsional)"}</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="px-6 pt-4 border-b border-emerald-500/10 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("mic")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
            activeTab === "mic"
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-400"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40"
          }`}
        >
          <Mic className="w-4 h-4 text-emerald-400" />
          <span>1. Rekam Suara (Mikrofon)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
            activeTab === "upload"
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-400"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40"
          }`}
        >
          <UploadCloud className="w-4 h-4 text-teal-400" />
          <span>2. Unggah File Rekaman (Audio)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transcript")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
            activeTab === "transcript"
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-400"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40"
          }`}
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>3. Foto Catatan Kertas / Teks (OCR)</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* TAB 1: MIC RECORDER */}
        {activeTab === "mic" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-xl bg-slate-950/40 border border-emerald-500/20">
              {/* Mic Icon & Status */}
              <div className="flex items-center gap-5">
                <div
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    recordingStatus === "recording"
                      ? "bg-rose-500 shadow-xl shadow-rose-500/40 animate-pulse"
                      : recordingStatus === "paused"
                      ? "bg-amber-500 shadow-lg shadow-amber-500/30"
                      : recordingStatus === "stopped"
                      ? "bg-emerald-600 shadow-lg shadow-emerald-600/30"
                      : "bg-slate-800 border-2 border-slate-700"
                  }`}
                >
                  {recordingStatus === "recording" && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                    </span>
                  )}
                  <Mic
                    className={`w-9 h-9 ${
                      recordingStatus === "idle" ? "text-slate-400" : "text-white"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        recordingStatus === "recording"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                          : recordingStatus === "paused"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : recordingStatus === "stopped"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {recordingStatus === "recording"
                        ? "● Merekam Rapat..."
                        : recordingStatus === "paused"
                        ? "❚❚ Dijeda"
                        : recordingStatus === "stopped"
                        ? "✓ Rekaman Selesai"
                        : "Mikrofon Siap"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Bahasa: Indonesia (id-ID)
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold font-mono mt-1 text-white tracking-wider">
                    {formatTimer(recordDuration)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {recordingStatus === "recording"
                      ? "Letakkan perangkat di meja rapat. Suara percakapan sedang direkam..."
                      : recordingStatus === "stopped"
                      ? "Audio rekaman siap dianalisis dan disusun menjadi notulen resmi."
                      : "Klik tombol Mulai Rekam saat rapat dimulai."}
                  </p>
                </div>
              </div>

              {/* Recorder Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {recordingStatus === "idle" && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Mulai Rekam Rapat</span>
                  </button>
                )}

                {recordingStatus === "recording" && (
                  <>
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Jeda (Pause)</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Selesai & Proses</span>
                    </button>
                  </>
                )}

                {recordingStatus === "paused" && (
                  <>
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Lanjutkan Rekam</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Selesai & Proses</span>
                    </button>
                  </>
                )}

                {recordingStatus === "stopped" && (
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rekam Ulang</span>
                  </button>
                )}
              </div>
            </div>

            {/* Audio Playback if Stopped */}
            {audioUrl && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-200">
                    Putar Ulang Hasil Rekaman Rapat:
                  </span>
                </div>
                <audio controls src={audioUrl} className="w-full md:w-96 h-9" />
              </div>
            )}

            {/* Live Streaming Speech Transcription Box */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Transkrip Suara Berjalan (Realtime Speech-to-Text):
                  </span>
                </div>
                {liveTranscript && (
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {liveTranscript.split(" ").length} kata terdeteksi
                  </span>
                )}
              </div>
              <textarea
                value={liveTranscript}
                onChange={(e) => setLiveTranscript(e.target.value)}
                placeholder={
                  recordingStatus === "recording"
                    ? "Mendengarkan percakapan rapat... Kata-kata yang diucapkan akan langsung muncul di sini secara otomatis."
                    : "Transkrip percakapan rapat akan otomatis tampil di sini saat merekam, atau Anda bisa mengetik/mengedit catatan tambahan di sini..."
                }
                rows={4}
                className="w-full text-xs font-mono bg-slate-900/80 border border-slate-700/60 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO FILE UPLOAD */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/30 hover:bg-slate-950/50 transition flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.webm"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center text-teal-400">
                <FileAudio className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {uploadedFile
                    ? uploadedFile.name
                    : "Pilih atau Drag & Drop Berkas Rekaman Audio Rapat"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Format yang didukung: MP3, M4A (Voice Note HP), WAV, AAC, WEBM, OGG (Maks. 25 MB)
                </p>
              </div>
              {uploadedFile && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                  Ukuran Berkas: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>

            {uploadedAudioUrl && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-teal-400" />
                  <span className="text-xs font-semibold text-teal-200">
                    Putar Berkas Audio yang Diunggah:
                  </span>
                </div>
                <audio controls src={uploadedAudioUrl} className="w-full md:w-96 h-9" />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PHOTO OF PAPER NOTE (OCR) & PASTED NOTES */}
        {activeTab === "transcript" && (
          <div className="space-y-4">
            {/* PAPER NOTE OCR UPLOAD CARD */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Foto Catatan Rapat di Kertas / Buku Notulen (AI OCR)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Foto tulisan tangan atau catatan di kertas. AI akan otomatis membaca teksnya.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Ambil Foto (Kamera HP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                    <span>Pilih Galeri / File</span>
                  </button>
                </div>
              </div>

              {/* Photo Preview if Selected */}
              {imagePreviewUrl && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreviewUrl}
                      alt="Foto Catatan Rapat"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {uploadedImage?.name || "Foto Catatan Rapat"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {uploadedImage ? `${(uploadedImage.size / 1024).toFixed(1)} KB` : "Gambar Siap"}
                      </p>
                      {ocrStatus === "scanning" && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1 font-medium animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Membaca teks dari foto catatan kertas...</span>
                        </div>
                      )}
                      {ocrStatus === "success" && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Teks berhasil diekstrak ke dalam kotak catatan di bawah</span>
                        </div>
                      )}
                      {(ocrStatus === "ready" || (ocrStatus === "idle" && !isOcrScanning)) && (
                        <div className="flex items-center gap-1 text-[11px] text-teal-300 mt-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                          <span>Foto catatan siap diproses! Klik tombol 'Generate Notulensi' di bawah</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {imageBase64 && !isOcrScanning && (
                      <button
                        type="button"
                        onClick={() =>
                          triggerOcrExtraction(imageBase64, uploadedImage?.type || "image/jpeg")
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition"
                      >
                        <Scan className="w-3.5 h-3.5" />
                        <span>Pindai Ulang OCR</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={removeUploadedImage}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TEXTAREA FOR OCR RESULTS OR MANUAL NOTES */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>
                    Hasil Ekstraksi OCR / Tempel Catatan Percakapan Rapat:
                  </span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Bisa diedit atau ditambah poin sebelum di-generate
                </span>
              </div>
              <textarea
                value={pastedTranscript}
                onChange={(e) => setPastedTranscript(e.target.value)}
                placeholder="Hasil pembacaan foto catatan di kertas akan muncul di sini secara otomatis. Anda juga dapat menempelkan catatan kasar atau hasil transkrip rekaman suara di sini..."
                rows={6}
                className="w-full text-xs font-sans bg-slate-950/80 border border-slate-700/60 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Quick Demo Templates */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-slate-400">Uji Coba Cepat (Demo):</span>
              <button
                type="button"
                onClick={() => loadDemoSample("mgmp")}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
                title="Masukkan teks catatan rapat MGMP & MKKS sesuai foto kertas yang Anda upload"
              >
                <span>📋 Catatan Foto MGMP & MKKS (Sesuai Foto)</span>
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample("pas")}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
              >
                📝 Contoh Rapat PAS 2026
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample("disiplin")}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
              >
                👥 Contoh Rapat Kedisiplinan Guru
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample("rkt")}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition"
              >
                📊 Contoh Rapat Evaluasi RKT
              </button>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold">{successMessage}</p>
              {engineUsed && (
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Diproses oleh: {engineUsed}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-6 pt-5 border-t border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Otomatis mengisi Identitas Rapat (A), Susunan Acara (B), Pembahasan (C), Tabel Action Items PIC (D), dan Penutup (E).
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiNotulen}
            disabled={isProcessing}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition transform hover:-translate-y-0.5 ${
              isProcessing
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-emerald-500/30"
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>{processingStep || "Sedang Memproses AI..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>Generate Notulensi Rapat Otomatis dengan AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Settings Gemini API Key (Optional) */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Kunci Google Gemini API (Opsional)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                SIGAP-SMK sudah memiliki engine AI bawaan untuk memproses rapat. Namun, jika Anda memiliki <strong>Google Gemini API Key gratis</strong> dari{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline"
                >
                  Google AI Studio
                </a>
                , Anda dapat memasukkannya di sini untuk kemampuan penalaran tingkat lanjut.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Gemini API Key:
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Kunci ini disimpan secara aman di browser lokal Anda (Local Storage).
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => saveCustomApiKey("")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Hapus Kunci
              </button>
              <button
                type="button"
                onClick={() => saveCustomApiKey(geminiApiKey)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
