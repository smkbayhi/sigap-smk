"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { formatIndonesianDate, getStatusSuratKeluarBadge } from "@/lib/utils";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { OfficialFooterSurat } from "@/components/kop-surat/OfficialFooterSurat";
import { DigitalSignatureModal } from "@/components/signature/DigitalSignatureModal";
import { SuratSignatureBlock } from "@/components/surat/SuratSignatureBlock";
import { parseLetterMeta } from "@/lib/letterTemplates";
import { alignParagraphsWithKeyValueTables } from "@/lib/tableGenerators";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mapDbToSuratKeluar } from "@/lib/supabaseSync";
import { SuratKeluar } from "@/lib/database.types";
import {
  ArrowLeft,
  Printer,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Send,
  X,
  Copy,
  ExternalLink,
  Edit3,
  Save,
} from "lucide-react";
import {
  LOGO_YAYASAN_DATA_URL,
  LOGO_SMK_CIRCULAR_DATA_URL,
  STEMPEL_SEKOLAH_DATA_URL,
  TTD_KEPSEK_DATA_URL,
} from "@/lib/seedData";

export default function SuratKeluarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { currentUser, isKepsek, isTU } = useAuth();
  const {
    suratKeluar,
    updateSuratKeluar,
    approveSuratKeluar,
    rejectSuratKeluar,
    deleteSuratKeluar,
    schoolSettings,
  } = useAppData();

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waTargetPhone, setWaTargetPhone] = useState("628");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNomor, setEditNomor] = useState("");
  const [editPerihal, setEditPerihal] = useState("");
  const [editTujuan, setEditTujuan] = useState("");
  const [editLampiran, setEditLampiran] = useState("");
  const [editTanggal, setEditTanggal] = useState("");
  const [editIsiSurat, setEditIsiSurat] = useState("");

  const handleOpenEditModal = () => {
    if (!surat) return;
    setEditNomor(surat.nomor_surat);
    setEditPerihal(surat.perihal);
    setEditTujuan(surat.tujuan);
    setEditLampiran(surat.lampiran || "-");
    setEditTanggal(surat.tanggal_surat);
    setEditIsiSurat(surat.isi_surat);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!surat) return;
    const partial = {
      nomor_surat: editNomor,
      perihal: editPerihal,
      tujuan: editTujuan,
      lampiran: editLampiran,
      tanggal_surat: editTanggal,
      isi_surat: editIsiSurat,
    };
    updateSuratKeluar(surat.id, partial);
    setSurat((prev) => (prev ? { ...prev, ...partial } : null));
    setShowEditModal(false);
  };

  const [surat, setSurat] = useState<SuratKeluar | null>(() => {
    return suratKeluar.find((s) => s.id === id) || null;
  });
  const [isLoading, setIsLoading] = useState(!surat);

  useEffect(() => {
    const foundInContext = suratKeluar.find((s) => s.id === id);
    if (foundInContext) {
      setSurat(foundInContext);
      setIsLoading(false);
      return;
    }

    async function fetchDirect() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from("surat_keluar")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (data && !error) {
            setSurat(mapDbToSuratKeluar(data));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Direct fetch from Supabase failed:", err);
        }
      }

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("sigap_smk_surat_keluar");
          if (raw) {
            const list: SuratKeluar[] = JSON.parse(raw);
            const foundInStorage = list.find((s) => s.id === id);
            if (foundInStorage) {
              setSurat(foundInStorage);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Storage fetch failed", e);
        }
      }

      setIsLoading(false);
    }

    fetchDirect();
  }, [id, suratKeluar]);

  if (isLoading) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-sm font-bold text-gray-800">Memuat Dokumen Surat Keluar...</h3>
      </div>
    );
  }

  if (!surat) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Surat Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500">
          Dokumen surat keluar dengan ID "{id}" tidak ditemukan dalam sistem.
        </p>
        <Link
          href="/surat-keluar"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Surat Keluar
        </Link>
      </div>
    );
  }

  const badge = getStatusSuratKeluarBadge(surat.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/surat-keluar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Surat Keluar
        </Link>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit / Koreksi Surat Button */}
          <button
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-bold rounded-xl shadow-xs transition-all"
            title="Edit nomor, tujuan, perihal, atau isi surat"
          >
            <Edit3 className="w-4 h-4 text-amber-600" />
            Edit / Koreksi Surat
          </button>

          {/* Kirim via WhatsApp Button */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            title="Kirim dokumen surat ini ke WhatsApp tujuan"
          >
            <Send className="w-4 h-4" />
            Kirim ke WhatsApp
          </button>

          {/* Print / Download Button */}
          <Link
            href={`/surat-keluar/${surat.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-brand-700" />
            Cetak / Download PDF Resmi
          </Link>

          {/* Kepala Sekolah Approval & Signature Trigger */}
          {isKepsek && surat.status === "menunggu_persetujuan" && (
            <button
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
            >
              <PenTool className="w-4 h-4" />
              Setujui & Tanda Tangani Dokumen
            </button>
          )}

          {/* Delete Button */}
          {(isTU || isKepsek) && (
            <button
              onClick={() => {
                if (window.confirm("Hapus dokumen surat keluar ini?")) {
                  deleteSuratKeluar(surat.id);
                  router.push("/surat-keluar");
                }
              }}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Hapus Surat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold border ${badge.color}`}
          >
            {badge.label}
          </span>
          <span className="font-mono text-xs font-bold text-brand-900 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded">
            {surat.nomor_surat}
          </span>
        </div>

        <div className="text-xs text-gray-500">
          Dibuat pada:{" "}
          <strong className="text-gray-800">
            {formatIndonesianDate(surat.created_at)}
          </strong>{" "}
          oleh {surat.creator_name || "Tata Usaha"}
        </div>
      </div>

      {/* Rejection Alert if applicable */}
      {surat.status === "ditolak" && surat.catatan_revisi && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Catatan Revisi dari Kepala Sekolah:</h4>
            <p className="mt-1 leading-relaxed">{surat.catatan_revisi}</p>
          </div>
        </div>
      )}

      {/* Document Sheet (Visual Paper Simulation matching official PDF) */}
      <div 
        className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-2xl shadow-xl p-8 sm:p-14 surat-resmi text-gray-900 text-sm leading-relaxed"
        style={{ fontFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", Georgia, serif' }}
      >
        {(() => {
          const { cleanHtml, meta } = parseLetterMeta(surat.isi_surat);
          const isJudulTengah = meta.layout === "judul_tengah";

          const isApproved = surat.status === "disetujui";
          const isApprovedOrHasTtd = surat.has_ttd || isApproved;
          const isApprovedOrHasStempel = (surat.has_stempel || isApproved) && surat.has_stempel !== false;

          const displayStamp =
            surat.stempel_image_url && surat.stempel_image_url !== STEMPEL_SEKOLAH_DATA_URL
              ? surat.stempel_image_url
              : (schoolSettings?.stempelUrl || surat.stempel_image_url || STEMPEL_SEKOLAH_DATA_URL);

          const displayTtd =
            surat.ttd_image_url && surat.ttd_image_url !== TTD_KEPSEK_DATA_URL
              ? surat.ttd_image_url
              : (schoolSettings?.ttdKepsekUrl || surat.ttd_image_url || TTD_KEPSEK_DATA_URL);

          const displayKepsek =
            surat.approver_name && surat.approver_name !== "Mokhamat Ekhsan, S.Kom"
              ? surat.approver_name
              : (schoolSettings?.namaKepsek || surat.approver_name || "Mokhamat Ekhsan, S.Kom");

          const displayNiy = schoolSettings?.niyKepsek || "14215094";

          return (
            <>
              {/* Kop Surat Resmi (Sesuai Pilihan Template: Tradisional vs Modern TP 2027/2028) */}
              <OfficialKopSurat
                variant={meta.kopVariant}
                logoYayasanOverride={surat.logo_yayasan_url || schoolSettings?.logoYayasanUrl || LOGO_YAYASAN_DATA_URL}
                logoSmkOverride={surat.logo_smk_url || schoolSettings?.logoSmkUrl || LOGO_SMK_CIRCULAR_DATA_URL}
              />

              {/* FORMAT B: JUDUL TENGAH (Surat Tugas, Surat Rekomendasi, Surat Kuasa, dll.) */}
              {isJudulTengah ? (
                <div className="text-center my-4 font-serif">
                  <h2 className="text-base sm:text-lg font-bold uppercase underline tracking-wider text-gray-950">
                    {meta.judul || surat.perihal}
                  </h2>
                  <p className="text-xs sm:text-[13px] font-semibold text-gray-950 mt-1">
                    Nomor: {surat.nomor_surat}
                  </p>
                </div>
              ) : (
                /* FORMAT A: KORESPONDENSI DINAS (Nomor/Lampiran/Perihal di kiri, Kepada Yth.) */
                <>
                  <div className="mb-6 font-serif text-xs sm:text-[13px]">
                    <table className="border-collapse">
                      <tbody>
                        <tr>
                          <td className="w-24 py-0.5 text-gray-700">Nomor</td>
                          <td className="w-4 py-0.5">:</td>
                          <td className="py-0.5 font-semibold text-gray-950">{surat.nomor_surat}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 text-gray-700">Lampiran</td>
                          <td className="py-0.5">:</td>
                          <td className="py-0.5">{surat.lampiran || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 text-gray-700 align-top">Perihal</td>
                          <td className="py-0.5 align-top">:</td>
                          <td className="py-0.5 font-bold text-gray-950">{surat.perihal}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-6 font-serif text-xs sm:text-[13px] leading-snug">
                    <p>Kepada Yth.</p>
                    <p className="font-bold text-gray-950">{surat.tujuan}</p>
                    <p>Di tempat</p>
                  </div>
                </>
              )}

              {/* Letter Body (Clean HTML without metadata comment, aligned key-value tables) */}
              <div
                className="prose prose-sm max-w-none text-gray-900 mb-8 leading-relaxed font-serif text-xs sm:text-[13px] text-justify space-y-2.5"
                dangerouslySetInnerHTML={{ __html: alignParagraphsWithKeyValueTables(cleanHtml) }}
              />

              {/* Signature & Official Seal Block (1 Pihak, 2 Pihak Cabdin/Yayasan, 3 Pihak Bank Jatim/SP) */}
              <SuratSignatureBlock
                modelTtd={meta.modelTtd}
                tanggalSurat={surat.tanggal_surat}
                namaKepsek={displayKepsek}
                niyKepsek={displayNiy}
                displayStamp={displayStamp}
                displayTtd={displayTtd}
                isApprovedOrHasTtd={isApprovedOrHasTtd}
                isApprovedOrHasStempel={isApprovedOrHasStempel}
                namaPenerima={surat.tujuan}
                tembusan={meta.tembusan}
                isPrint={false}
              />

              {/* Official Footer Accent Bar (Aktif bila Template Kop Modern TP 2027/2028 dipilih) */}
              <OfficialFooterSurat variant={meta.kopVariant} isPrint={false} />
            </>
          );
        })()}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <DigitalSignatureModal
          surat={surat}
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onApprove={(id, opts) => approveSuratKeluar(id, schoolSettings?.namaKepsek || currentUser.name, opts)}
          onReject={(id, notes) => rejectSuratKeluar(id, notes)}
          kepsekName={schoolSettings?.namaKepsek || currentUser.name}
        />
      )}

      {/* WhatsApp Modal Pengiriman Surat Resmi */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Send className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Kirim Dokumen via WhatsApp</h3>
                  <p className="text-[11px] text-emerald-200">Kirim surat keluar resmi ke penerima atau pihak terkait</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Recipient & Status Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[10.5px]">Tujuan / Penerima:</span>
                  <span className="font-bold text-gray-900">{surat.tujuan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[10.5px]">Perihal:</span>
                  <span className="font-medium text-gray-800 truncate max-w-[200px]" title={surat.perihal}>
                    {surat.perihal}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="text-gray-500 text-[10.5px]">Status Dokumen:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      surat.status === "disetujui"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {surat.status === "disetujui" ? "✓ Sah & Bertanda Tangan Digital" : "Draf / Menunggu TTD"}
                  </span>
                </div>
              </div>

              {/* Status Warning if draft */}
              {surat.status !== "disetujui" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Catatan:</strong> Surat ini masih berstatus <em>Draf</em> dan belum ditandatangani oleh Kepala Sekolah. Anda dapat mengirimkan notifikasi ke WhatsApp Kepala Sekolah agar ditinjau terlebih dahulu.
                  </p>
                </div>
              )}

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor WhatsApp Penerima (Contoh: 6281234567890):
                </label>
                <input
                  type="text"
                  value={waTargetPhone}
                  onChange={(e) => setWaTargetPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="6281234567890"
                  className="w-full text-xs font-mono rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Message Preview */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Pratinjau Format Pesan WhatsApp:
                </label>
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-gray-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {(() => {
                    const host = typeof window !== "undefined" ? window.location.origin : "https://sigap-smk.vercel.app";
                    const printLink = `${host}/surat-keluar/${surat.id}/print`;
                    const kepsek = schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom";

                    if (surat.status === "disetujui") {
                      return `Kepada Yth.\n${surat.tujuan}\nDi tempat\n\nAssalamu’alaikum wr. wb.\nBerikut kami sampaikan Surat Resmi dari SMK Bayt Al-Hikmah Pasuruan:\n\n• Nomor Surat: ${surat.nomor_surat}\n• Perihal: ${surat.perihal}\n• Tanggal: ${formatIndonesianDate(surat.tanggal_surat)}\n\nDokumen resmi ini telah disahkan & ditandatangani secara digital oleh Kepala Sekolah (${kepsek}) serta dibubuhi stempel resmi lembaga.\n\nSilakan unduh atau cetak dokumen PDF resmi melalui tautan berikut:\n${printLink}\n\nDemikian kami sampaikan, terima kasih.\nWassalamu’alaikum wr. wb.`;
                    } else {
                      return `Assalamu’alaikum wr. wb.\nYth. Bapak Kepala Sekolah (${kepsek})\n\nPemberitahuan Draf Pengajuan Surat Keluar:\n• Nomor: ${surat.nomor_surat}\n• Perihal: ${surat.perihal}\n• Tujuan: ${surat.tujuan}\n\nDokumen membutuhkan otorisasi tanda tangan digital Anda:\n${host}/surat-keluar/${surat.id}\n\nTerima kasih.`;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <Link
                href={`/surat-keluar/${surat.id}/print`}
                target="_blank"
                className="px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-gray-600" />
                <span>Unduh / Cetak PDF</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = waTargetPhone.replace(/\D/g, "");
                    if (!cleanPhone || cleanPhone.length < 8) {
                      alert("Masukkan nomor WhatsApp yang valid (awali dengan kode negara 62).");
                      return;
                    }
                    const host = typeof window !== "undefined" ? window.location.origin : "https://sigap-smk.vercel.app";
                    const printLink = `${host}/surat-keluar/${surat.id}/print`;
                    const kepsek = schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom";

                    let msg = "";
                    if (surat.status === "disetujui") {
                      msg = `Kepada Yth.\n${surat.tujuan}\nDi tempat\n\nAssalamu’alaikum wr. wb.\nBerikut kami sampaikan Surat Resmi dari SMK Bayt Al-Hikmah Pasuruan:\n\n• Nomor Surat: ${surat.nomor_surat}\n• Perihal: ${surat.perihal}\n• Tanggal: ${formatIndonesianDate(surat.tanggal_surat)}\n\nDokumen resmi ini telah disahkan & ditandatangani secara digital oleh Kepala Sekolah (${kepsek}) serta dibubuhi stempel resmi lembaga.\n\nSilakan unduh atau cetak dokumen PDF resmi melalui tautan berikut:\n${printLink}\n\nDemikian kami sampaikan, terima kasih.\nWassalamu’alaikum wr. wb.`;
                    } else {
                      msg = `Assalamu’alaikum wr. wb.\nYth. Bapak Kepala Sekolah (${kepsek})\n\nPemberitahuan Draf Pengajuan Surat Keluar:\n• Nomor: ${surat.nomor_surat}\n• Perihal: ${surat.perihal}\n• Tujuan: ${surat.tujuan}\n\nDokumen membutuhkan otorisasi tanda tangan digital Anda:\n${host}/surat-keluar/${surat.id}\n\nTerima kasih.`;
                    }

                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
                    window.open(waUrl, "_blank");
                    setShowWhatsAppModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Buka WhatsApp & Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit / Koreksi Surat Keluar */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit / Koreksi Surat Keluar</h3>
                  <p className="text-[11px] text-amber-100">
                    Perbaiki nomor, tujuan, perihal, atau isi badan surat dinas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Nomor Surat:
                  </label>
                  <input
                    type="text"
                    value={editNomor}
                    onChange={(e) => setEditNomor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Lampiran:
                  </label>
                  <input
                    type="text"
                    value={editLampiran}
                    onChange={(e) => setEditLampiran(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Perihal Surat:
                </label>
                <input
                  type="text"
                  value={editPerihal}
                  onChange={(e) => setEditPerihal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Tujuan Surat (Kepada Yth):
                  </label>
                  <input
                    type="text"
                    value={editTujuan}
                    onChange={(e) => setEditTujuan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Tanggal Surat:
                  </label>
                  <input
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Isi Surat (HTML / Teks Paragraf):
                </label>
                <textarea
                  rows={8}
                  value={editIsiSurat}
                  onChange={(e) => setEditIsiSurat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono text-[11px]"
                  placeholder="Masukkan isi lengkap surat..."
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Tips: Anda dapat memasukkan teks langsung atau tag HTML &lt;p&gt;, &lt;table&gt;, &lt;b&gt; untuk pemformatan rapi.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
