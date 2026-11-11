"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import {
  formatIndonesianDate,
  getUrgensiBadge,
  createWhatsAppDispositionLink,
  getBidangLabel,
} from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  Share2,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  FileText,
  User,
  ExternalLink,
  AlertCircle,
  PlusCircle,
  UploadCloud,
} from "lucide-react";
import { TingkatUrgensi, UserRole } from "@/lib/database.types";

export default function SuratMasukDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { users, currentUser, isKepsek, isTU } = useAuth();
  const { suratMasuk, disposisi, createDisposisi, updateSuratMasuk } = useAppData();

  const surat = suratMasuk.find((s) => s.id === id);

  // New disposition form state
  const [selectedPenerimaId, setSelectedPenerimaId] = useState(
    users.find((u) => u.role === "kasubag")?.id || users[0].id
  );
  const [sifatDisposisi, setSifatDisposisi] = useState<TingkatUrgensi>("biasa");
  const [instruksi, setInstruksi] = useState("Tindak lanjuti segera dan laporkan perkembangannya.");
  const [catatan, setCatatan] = useState("");
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [showAddDispForm, setShowAddDispForm] = useState(false);
  const [showInlineViewer, setShowInlineViewer] = useState(true);
  const [isUploadingReplacement, setIsUploadingReplacement] = useState(false);

  const handleUploadReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!surat || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploadingReplacement(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (data.success && data.url) {
        updateSuratMasuk(surat.id, {
          file_url: data.url,
          file_name: file.name,
          file_size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        });
      }
    } catch (err) {
      console.error("Gagal mengunggah berkas pengganti:", err);
      // Fallback object url
      updateSuratMasuk(surat.id, {
        file_url: URL.createObjectURL(file),
        file_name: file.name,
        file_size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      });
    } finally {
      setIsUploadingReplacement(false);
    }
  };

  if (!surat) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Surat Masuk Tidak Ditemukan</h2>
        <Link
          href="/surat-masuk"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Arsip Surat Masuk
        </Link>
      </div>
    );
  }

  const urgensiBadge = getUrgensiBadge(surat.tingkat_urgensi);
  const existingDisposisi = disposisi.filter((d) => d.surat_masuk_id === surat.id);

  const handleCreateDisposisi = (e: React.FormEvent) => {
    e.preventDefault();
    const penerimaUser = users.find((u) => u.id === selectedPenerimaId);
    if (!penerimaUser) return;

    const newDisp = createDisposisi({
      surat_masuk_id: surat.id,
      pemberi_disposisi_id: currentUser.id,
      pemberi_nama: `${currentUser.name} (${currentUser.jabatan})`,
      penerima_id: penerimaUser.id,
      penerima_nama: penerimaUser.name,
      penerima_role: penerimaUser.role,
      penerima_bidang: penerimaUser.bidang,
      sifat: sifatDisposisi,
      instruksi: instruksi.trim(),
      catatan: catatan.trim() || undefined,
      deadline: deadline,
      status: "menunggu",
      whatsapp_sent: true,
    });

    setShowAddDispForm(false);

    // Optional direct trigger WhatsApp URL
    const waUrl = createWhatsAppDispositionLink({
      phone: penerimaUser.phone,
      penerimaNama: penerimaUser.name,
      nomorSurat: surat.nomor_surat,
      pengirim: surat.pengirim,
      perihal: surat.perihal,
      instruksi: instruksi.trim(),
      catatan: catatan.trim(),
      deadline: deadline,
      disposisiId: newDisp.id,
    });

    // Open WA in new tab for instant convenience
    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/surat-masuk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Arsip Surat Masuk
        </Link>

        {(isKepsek || isTU) && (
          <button
            onClick={() => setShowAddDispForm(!showAddDispForm)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Beri Lembar Disposisi Baru
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Surat Masuk Detail & Scan Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-900 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md">
                  {surat.nomor_surat}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${urgensiBadge.color}`}
                >
                  {urgensiBadge.label}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Diterima: <strong>{formatIndonesianDate(surat.tanggal_diterima)}</strong>
              </span>
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-snug">
                {surat.perihal}
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Instansi Pengirim: <strong className="text-gray-900">{surat.pengirim}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tanggal Dokumen Surat: {formatIndonesianDate(surat.tanggal_surat)}
              </p>
            </div>

            {/* AI Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-relaxed">
              <span className="font-bold text-gray-800 block uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5 text-brand-800">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                Ekstraksi Ringkasan Dokumen (AI Vision OCR):
              </span>
              <p className="text-gray-700 text-justify">{surat.ringkasan}</p>
            </div>

            {/* Attachment Bar & Preview Options */}
            <div className="space-y-3 pt-1">
              <input
                type="file"
                id="replacement-file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleUploadReplacement}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-gray-200 text-xs gap-3 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{surat.file_name}</p>
                    <p className="text-[10px] text-gray-500">{surat.file_size} • Berkas Asli Surat Masuk</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Upload / Ganti file PDF button */}
                  <label
                    htmlFor="replacement-file"
                    className="cursor-pointer px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-gray-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {isUploadingReplacement
                      ? "Menyimpan..."
                      : surat.file_url && !surat.file_url.includes("unsplash.com")
                      ? "Ganti Berkas PDF"
                      : "Pilih File PDF Asli"}
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowInlineViewer(!showInlineViewer)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold border border-gray-300 rounded-lg text-xs transition-colors"
                  >
                    {showInlineViewer ? "Sembunyikan Viewer" : "Tampilkan Viewer"}
                  </button>

                  {surat.file_url && !surat.file_url.includes("unsplash.com") && (
                    <a
                      href={surat.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5"
                    >
                      Buka di Tab Baru
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Embedded PDF/Document Inline Viewer */}
              {showInlineViewer && (
                <div className="border border-gray-300 rounded-xl overflow-hidden shadow-inner bg-slate-100">
                  <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between text-[11px]">
                    <span className="font-medium flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-gold-400" />
                      Pratinjau Dokumen: {surat.file_name}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      PDF / Digital Document View
                    </span>
                  </div>

                  {surat.file_url && !surat.file_url.includes("unsplash.com") && surat.file_url !== "#" ? (
                    surat.file_url.endsWith(".pdf") ||
                    surat.file_name.endsWith(".pdf") ||
                    surat.file_url.includes("/uploads/") ||
                    surat.file_url.includes("/print") ? (
                      <iframe
                        src={surat.file_url}
                        className="w-full h-[600px] bg-white border-0"
                        title="Pratinjau Dokumen Masuk"
                      />
                    ) : (
                      <div className="p-4 flex items-center justify-center bg-white min-h-[350px]">
                        <img
                          src={surat.file_url}
                          alt="Scan Surat Masuk"
                          className="max-h-[500px] object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    )
                  ) : (
                    <div className="p-8 text-center bg-white space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <h4 className="font-bold text-sm text-gray-900">
                          Berkas PDF Belum Terhubung
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Data registrasi surat ini telah tersimpan rapi. Klik tombol di bawah untuk memilih file PDF dokumen Anda agar langsung tampil di viewer ini.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="replacement-file"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                        >
                          <UploadCloud className="w-4 h-4" />
                          Pilih Berkas PDF Dokumen Ini ({surat.file_name})
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* New Disposition Form Card (if toggled) */}
          {showAddDispForm && (
            <div className="bg-white rounded-2xl border-2 border-brand-500 p-6 shadow-lg space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-brand-700" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Delegasikan Lembar Disposisi Kepala Sekolah
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddDispForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleCreateDisposisi} className="space-y-4 text-xs">
                {/* Penerima Disposisi */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tujukan Disposisi Kepada (Penerima Tugas) <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    value={selectedPenerimaId}
                    onChange={(e) => setSelectedPenerimaId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    {users
                      .filter((u) => u.role !== "kepala_sekolah")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.jabatan} ({u.phone})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Sifat Disposisi:
                    </label>
                    <select
                      value={sifatDisposisi}
                      onChange={(e) => setSifatDisposisi(e.target.value as TingkatUrgensi)}
                      className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="biasa">Biasa</option>
                      <option value="penting">Penting</option>
                      <option value="segera">Segera (Mendesak)</option>
                      <option value="rahasia">Rahasia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Batas Waktu (Deadline) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Instruksi Kepala Sekolah */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Instruksi Kepala Sekolah <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={instruksi}
                    onChange={(e) => setInstruksi(e.target.value)}
                    placeholder="Contoh: Hadir mewakili sekolah / Siapkan berkas MoU..."
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
                  />
                  {/* Preset quick pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "Tindak lanjuti segera dan laporkan perkembangannya.",
                      "Hadir mewakili Kepala Sekolah pada agenda di atas.",
                      "Koordinasikan dengan seluruh tim terkait.",
                      "Siapkan sarana & dokumen pendukung.",
                    ].map((pill, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInstruksi(pill)}
                        className="text-[10px] bg-slate-100 hover:bg-brand-50 hover:text-brand-800 text-gray-600 px-2 py-0.5 rounded border border-gray-200 transition-colors"
                      >
                        + {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan Tambahan */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Catatan Tambahan (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Catatan teknis khusus bagi staf..."
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDispForm(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim Disposisi & Notifikasi WhatsApp
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Existing Dispositions for this Letter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">
                Riwayat Lembar Disposisi ({existingDisposisi.length})
              </h3>
              <span className="text-[11px] text-gray-400">
                Pelacakan tindak lanjut staf
              </span>
            </div>

            {existingDisposisi.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Belum ada disposisi yang diterbitkan untuk surat masuk ini.
              </p>
            ) : (
              <div className="space-y-3">
                {existingDisposisi.map((disp) => {
                  const targetUser = users.find((u) => u.id === disp.penerima_id);
                  const waUrl = createWhatsAppDispositionLink({
                    phone: targetUser?.phone || "6281234567890",
                    penerimaNama: disp.penerima_nama,
                    nomorSurat: surat.nomor_surat,
                    pengirim: surat.pengirim,
                    perihal: surat.perihal,
                    instruksi: disp.instruksi,
                    catatan: disp.catatan,
                    deadline: disp.deadline,
                    disposisiId: disp.id,
                  });

                  return (
                    <div
                      key={disp.id}
                      className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 bg-slate-50/50 space-y-2.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-gray-500">Penerima Disposisi:</span>{" "}
                          <strong className="text-gray-900">{disp.penerima_nama}</strong>
                          {disp.penerima_bidang && (
                            <span className="ml-1 text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded capitalize">
                              {disp.penerima_bidang}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            disp.status === "selesai"
                              ? "bg-emerald-100 text-emerald-800"
                              : disp.status === "proses"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {disp.status === "selesai"
                            ? "Selesai"
                            : disp.status === "proses"
                            ? "Sedang Diproses"
                            : "Menunggu"}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">
                          Instruksi: "{disp.instruksi}"
                        </p>
                        {disp.catatan && (
                          <p className="text-gray-600 mt-1 italic">
                            Catatan: {disp.catatan}
                          </p>
                        )}
                        <p className="text-[11px] text-rose-700 font-bold mt-1">
                          Deadline: {formatIndonesianDate(disp.deadline)}
                        </p>
                      </div>

                      {disp.tanggapan && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
                          <strong>Tanggapan Penerima:</strong> {disp.tanggapan}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-gray-400">
                          Diberikan oleh: {disp.pemberi_nama}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* WhatsApp Trigger Button */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            Kirim ke WhatsApp
                          </a>

                          <Link
                            href={`/disposisi/${disp.id}`}
                            className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-[11px] font-semibold border border-brand-200"
                          >
                            Detail & Tindak Lanjut
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Insights & Recommendation Widget */}
        <div className="space-y-6">
          {/* AI Analysis Card */}
          <div className="bg-gradient-to-br from-[#064e3b] via-[#055a43] to-brand-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/60">
            <div className="flex items-center gap-2 text-gold-400 mb-3">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Analisis & Rekomendasi Cerdas AI
              </h3>
            </div>

            {surat.ai_analysis ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-emerald-200 block text-[11px]">
                    Rekomendasi Delegasi Bidang:
                  </span>
                  <p className="font-bold text-gold-300 text-sm mt-0.5">
                    Bidang {getBidangLabel(surat.ai_analysis.saran_bidang)}
                  </p>
                  <p className="text-[11px] text-emerald-100/80">
                    PIC yang disarankan: {surat.ai_analysis.saran_penerima}
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-700/50">
                  <span className="text-emerald-200 block text-[11px] mb-1">
                    Poin Kunci Dokumen:
                  </span>
                  <ul className="space-y-1">
                    {surat.ai_analysis.key_points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-emerald-50 text-[11px]">
                        <span className="text-gold-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-emerald-700/50 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-200">Akurasi Ekstraksi:</span>
                  <strong className="text-gold-300 font-mono">
                    {surat.ai_analysis.confidence_score}%
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-200">
                Surat ini belum melalui pipeline ekstraksi otomatis AI.
              </p>
            )}
          </div>

          {/* Quick WhatsApp Share Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Integrasi Magic Link WhatsApp</span>
            </div>
            <p className="text-gray-600 leading-relaxed text-[11px]">
              Setiap kali lembar disposisi dibuat, sistem secara otomatis men-generate teks pesan WhatsApp resmi sekolah beserta <em>magic link</em> ke halaman disposisi penerima tugas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
