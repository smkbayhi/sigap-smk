"use client";

import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { SuratKeluar } from "@/lib/database.types";
import { useAppData } from "@/context/AppDataContext";
import { TTD_KEPSEK_DATA_URL, STEMPEL_SEKOLAH_DATA_URL } from "@/lib/seedData";
import { Check, X, ShieldCheck, PenTool, Sparkles, AlertTriangle } from "lucide-react";

interface DigitalSignatureModalProps {
  surat: SuratKeluar;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, options?: { customTtd?: string; includeStamp?: boolean }) => void;
  onReject: (id: string, notes: string) => void;
  kepsekName?: string;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  surat,
  isOpen,
  onClose,
  onApprove,
  onReject,
  kepsekName,
}) => {
  const { schoolSettings } = useAppData();
  const [signatureMode, setSignatureMode] = useState<"preset" | "draw">("preset");
  const [includeStamp, setIncludeStamp] = useState(true);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const activeStamp = schoolSettings?.stempelUrl || STEMPEL_SEKOLAH_DATA_URL;
  const activeTtd = schoolSettings?.ttdKepsekUrl || TTD_KEPSEK_DATA_URL;
  const activeKepsek = schoolSettings?.namaKepsek || kepsekName || "Mokhamat Ekhsan, S.Kom";
  const activeNiy = schoolSettings?.niyKepsek || "14215094";

  useEffect(() => {
    if (signatureMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1e3a8a";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [signatureMode]);

  if (!isOpen) return null;

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirmApproval = () => {
    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#047857", "#10b981", "#fbbf24", "#f59e0b"],
      });
    } catch (e) {
      console.log(e);
    }

    let customTtd: string | undefined = undefined;
    if (signatureMode === "draw" && canvasRef.current) {
      customTtd = canvasRef.current.toDataURL("image/png");
    } else {
      customTtd = activeTtd;
    }

    onApprove(surat.id, { customTtd, includeStamp });
    onClose();
  };

  const handleConfirmReject = () => {
    if (!rejectNotes.trim()) {
      alert("Harap masukkan catatan koreksi/revisi untuk staf Tata Usaha.");
      return;
    }
    onReject(surat.id, rejectNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-900/20 animate-in fade-in-50 zoom-in-95">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400">
              <ShieldCheck className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Otorisasi & Pembubuhan Tanda Tangan Digital
              </h3>
              <p className="text-xs text-emerald-200">
                Verifikasi Dokumen Kedinasan Kepala Sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Metadata Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-gray-500">Nomor Surat:</span>
              <span className="font-mono font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {surat.nomor_surat}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Perihal:</span>
              <span className="font-semibold text-gray-900 text-right max-w-sm">{surat.perihal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Tujuan Surat:</span>
              <span className="text-gray-800 font-medium">{surat.tujuan}</span>
            </div>
          </div>

          {!isRejecting ? (
            <>
              {/* Signature Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Pilihan Tanda Tangan Digital:
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("preset")}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      signatureMode === "preset"
                        ? "bg-brand-50 border-brand-600 text-brand-900 shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-gold-600" />
                    TTD Resmi Terverifikasi (Tersimpan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("draw")}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      signatureMode === "draw"
                        ? "bg-brand-50 border-brand-600 text-brand-900 shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <PenTool className="w-4 h-4 text-brand-700" />
                    Goreskan TTD Langsung (Pad)
                  </button>
                </div>

                {/* Preview Box */}
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white flex flex-col items-center justify-center min-h-[160px] overflow-hidden">
                  <div className="absolute top-2 left-3 text-[10px] uppercase font-bold text-gray-400">
                    Pratinjau Bubuhan di Dokumen
                  </div>

                  <div className="relative flex items-center justify-center w-full max-w-sm h-40">
                    {/* Stamp in background/left (Ukuran proporsional diperbesar) */}
                    {includeStamp && (
                      <div className="absolute -left-6 -top-5 pointer-events-none opacity-90 z-0">
                        <img
                          src={activeStamp}
                          alt="Stempel Resmi"
                          className="w-48 h-48 object-contain mix-blend-multiply"
                        />
                      </div>
                    )}

                    {/* Signature */}
                    {signatureMode === "preset" ? (
                      <div className="relative z-10 left-8 -top-1">
                        <img
                          src={activeTtd}
                          alt={`Tanda Tangan ${activeKepsek}`}
                          className="h-36 max-w-[230px] w-auto object-contain drop-shadow-sm mix-blend-multiply"
                        />
                      </div>
                    ) : (
                      <div className="relative z-10 w-full flex flex-col items-center">
                        <canvas
                          ref={canvasRef}
                          width={320}
                          height={120}
                          className="border border-gray-300 bg-white rounded-lg cursor-crosshair shadow-inner"
                          onMouseDown={handleStartDraw}
                          onMouseMove={handleDraw}
                          onMouseUp={handleEndDraw}
                          onMouseLeave={handleEndDraw}
                          onTouchStart={handleStartDraw}
                          onTouchMove={handleDraw}
                          onTouchEnd={handleEndDraw}
                        />
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="mt-1 text-[11px] text-gray-500 hover:text-red-600 underline"
                        >
                          Hapus & Gores Ulang
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-2 z-10">
                    <p className="font-bold text-xs text-gray-900 underline">{activeKepsek}</p>
                    <p className="text-[10px] text-gray-500">NIY. {activeNiy} • Kepala SMK Bayt Al-Hikmah Pasuruan</p>
                  </div>
                </div>
              </div>

              {/* Stamp Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeStamp"
                  checked={includeStamp}
                  onChange={(e) => setIncludeStamp(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="includeStamp" className="text-xs font-medium text-gray-700 select-none">
                  Bubuhkan juga <strong>Stempel Resmi Sekolah</strong> (Warna Tinta Ungu Lembaga)
                </label>
              </div>
            </>
          ) : (
            /* Rejection Notes View */
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-bold">Penolakan Dokumen Surat</p>
                  <p className="text-[11px] mt-0.5">
                    Surat akan dikembalikan ke Tata Usaha dengan status <strong>Ditolak / Perlu Revisi</strong> beserta catatan koreksi Anda.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan Koreksi / Alasan Revisi <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={4}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Contoh: Mohon perbaiki daftar nama guru penugasan dan periksa kembali format lampiran..."
                  className="w-full text-xs rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {!isRejecting ? (
            <>
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
              >
                Tolak & Minta Revisi
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 border border-brand-800"
                >
                  <Check className="w-4 h-4" />
                  Setujui & Tanda Tangani Dokumen
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Kembali ke Penandatanganan
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm hover:shadow transition-all"
              >
                Konfirmasi Tolak Surat
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
