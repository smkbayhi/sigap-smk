"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import {
  ArrowLeft,
  Printer,
  Edit,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  MapPin,
  User,
  Users,
  CheckSquare,
  Square,
  Trash2,
  Stamp,
  PenTool,
} from "lucide-react";

export default function NotulenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { notulenList, approveNotulen, deleteNotulen, toggleActionItemStatus, schoolSettings } = useAppData();
  const { currentUser, isKepsek, isTU } = useAuth();

  const notulen = notulenList.find((n) => n.id === id);

  if (!notulen) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-800">Notulensi Rapat Tidak Ditemukan</p>
        <p className="text-xs text-slate-500">
          Dokumen notulen dengan ID tersebut tidak ada atau sudah dihapus.
        </p>
        <Link
          href="/notulen"
          className="inline-flex items-center gap-1.5 py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Notulen</span>
        </Link>
      </div>
    );
  }

  const isApproved = notulen.is_approved_by_kepsek || notulen.status === "disetujui";
  const canEdit = isKepsek || isTU || notulen.created_by === currentUser.id;

  const handleShareWa = () => {
    const itemsText = notulen.action_items && notulen.action_items.length > 0
      ? notulen.action_items.map((a, i) => `  ${i + 1}. *${a.keputusan}*\n     PIC: ${a.pic} | Deadline: ${a.tenggat_waktu} [${a.status === "selesai" ? "✓ SELESAI" : "⏳ PROSES"}]`).join("\n")
      : "  (Tidak ada action items khusus)";

    const text = `*RESUME NOTULENSI RAPAT DINAS SMK BAYT AL-HIKMAH*\n` +
      `----------------------------------------\n` +
      `📋 *Agenda:* ${notulen.jenis_rapat}\n` +
      `📅 *Waktu:* ${notulen.hari_tanggal} (${notulen.waktu})\n` +
      `📍 *Tempat:* ${notulen.tempat}\n` +
      `👤 *Pimpinan Rapat:* ${notulen.pemimpin_rapat}\n` +
      `📝 *Notulis:* ${notulen.notulis}\n\n` +
      `📌 *KEPUTUSAN RAPAT & TINDAK LANJUT (ACTION ITEMS):*\n` +
      `${itemsText}\n\n` +
      `Status: ${isApproved ? "✅ Telah Disahkan Kepala Sekolah" : "⏳ Draft / Menunggu Pengesahan"}\n\n` +
      `_SIGAP-SMK: Sistem Informasi Gerak Cepat & Administrasi Terpadu_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleApprove = () => {
    if (window.confirm("Sahkan notulensi rapat ini dengan Tanda Tangan & Stempel Resmi Kepala Sekolah?")) {
      approveNotulen(notulen.id, currentUser.name);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Yakin ingin menghapus notulensi "${notulen.jenis_rapat}"?`)) {
      deleteNotulen(notulen.id);
      router.push("/notulen");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <Link
          href="/notulen"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Share WA */}
          <button
            type="button"
            onClick={handleShareWa}
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Bagikan Ringkasan ke Grup WhatsApp"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bagikan WA</span>
          </button>

          {/* Cetak PDF Resmi */}
          <a
            href={`/notulen/${notulen.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer select-none"
            title="Cetak Dokumen PDF Resmi Format Dinas (Buka di Tab Baru)"
          >
            <Printer className="w-4 h-4 text-gold-400" />
            <span>Cetak PDF Resmi</span>
          </a>

          {/* Kepsek Approval Button */}
          {isKepsek && !isApproved && (
            <button
              type="button"
              onClick={handleApprove}
              className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5 text-gold-400" />
              <span>Sahkan & Bubuhkan TTD</span>
            </button>
          )}

          {/* Edit */}
          {canEdit && (
            <Link
              href={`/notulen/${notulen.id}/edit`}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              title="Edit Dokumen Notulen"
            >
              <Edit className="w-4 h-4" />
            </Link>
          )}

          {/* Delete */}
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              title="Hapus Notulen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Document Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        {/* Official Kop Surat */}
        <OfficialKopSurat />

        {/* Title */}
        <div className="text-center space-y-1 border-b border-slate-200 pb-5">
          <h1 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase underline decoration-2 underline-offset-4">
            NOTULEN RAPAT
          </h1>
          {notulen.nomor_notulen && (
            <p className="text-xs font-mono font-semibold text-slate-600">
              Nomor: {notulen.nomor_notulen}
            </p>
          )}
          <div className="pt-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-0.5 rounded-full border ${
                isApproved
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : notulen.status === "final"
                  ? "bg-blue-50 text-blue-800 border-blue-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {isApproved ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dokumen Sah & Terverifikasi Kepala Sekolah</span>
                </>
              ) : notulen.status === "final" ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Final (Menunggu Verifikasi & TTD Kepala Sekolah)</span>
                </>
              ) : (
                <span>Draft Notulensi</span>
              )}
            </span>
          </div>
        </div>

        {/* A. IDENTITAS RAPAT */}
        <div className="space-y-3 text-xs sm:text-sm">
          <h2 className="font-bold text-slate-900 uppercase tracking-wide">
            A. IDENTITAS RAPAT
          </h2>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <tbody>
                <tr className="border-b border-slate-200/60">
                  <td className="w-40 sm:w-48 py-1.5 font-semibold text-slate-600">Jenis Rapat</td>
                  <td className="w-4 py-1.5">:</td>
                  <td className="py-1.5 font-bold text-slate-900">{notulen.jenis_rapat}</td>
                </tr>
                <tr className="border-b border-slate-200/60">
                  <td className="py-1.5 font-semibold text-slate-600">Hari / Tanggal</td>
                  <td className="py-1.5">:</td>
                  <td className="py-1.5 font-medium text-slate-800">{notulen.hari_tanggal}</td>
                </tr>
                <tr className="border-b border-slate-200/60">
                  <td className="py-1.5 font-semibold text-slate-600">Waktu</td>
                  <td className="py-1.5">:</td>
                  <td className="py-1.5 font-medium text-slate-800">{notulen.waktu}</td>
                </tr>
                <tr className="border-b border-slate-200/60">
                  <td className="py-1.5 font-semibold text-slate-600">Tempat</td>
                  <td className="py-1.5">:</td>
                  <td className="py-1.5 font-medium text-slate-800">{notulen.tempat}</td>
                </tr>
                <tr className="border-b border-slate-200/60">
                  <td className="py-1.5 font-semibold text-slate-600">Pemimpin Rapat</td>
                  <td className="py-1.5">:</td>
                  <td className="py-1.5 font-bold text-slate-900">
                    {notulen.pemimpin_rapat}
                    {notulen.pemimpin_nip && (
                      <span className="font-normal font-mono text-xs text-slate-500 ml-2">
                        (NIY/NIP: {notulen.pemimpin_nip})
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-200/60">
                  <td className="py-1.5 font-semibold text-slate-600">Notulis</td>
                  <td className="py-1.5">:</td>
                  <td className="py-1.5 font-bold text-slate-900">
                    {notulen.notulis}
                    {notulen.notulis_nip && (
                      <span className="font-normal font-mono text-xs text-slate-500 ml-2">
                        (NIY/NIP: {notulen.notulis_nip})
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold text-slate-600">Peserta Rapat</td>
                  <td className="py-1.5">:</td>
                  <td className="py-1.5 font-medium text-slate-800">{notulen.peserta_rapat}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* B. SUSUNAN ACARA */}
        <div className="space-y-3 text-xs sm:text-sm">
          <h2 className="font-bold text-slate-900 uppercase tracking-wide">
            B. SUSUNAN ACARA
          </h2>

          <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-800">
            {notulen.susunan_acara.map((acara, idx) => (
              <li key={idx} className="font-medium">
                <span>{acara}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* C. JALANNYA RAPAT & PEMBAHASAN */}
        <div className="space-y-4 text-xs sm:text-sm">
          <h2 className="font-bold text-slate-900 uppercase tracking-wide">
            C. JALANNYA RAPAT & PEMBAHASAN
          </h2>

          <div className="space-y-4">
            {notulen.pembahasan.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1.5">
                <p className="font-bold text-slate-900">
                  {secIdx + 1}. {sec.judul}:
                </p>

                {sec.keterangan && (
                  <p className="text-slate-700 leading-relaxed pl-4 font-normal">
                    {sec.keterangan}
                  </p>
                )}

                {sec.poin_poin && sec.poin_poin.length > 0 && (
                  <ul className="space-y-1.5 pl-6 text-slate-800">
                    {sec.poin_poin.map((poin, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>{poin}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* D. KEPUTUSAN RAPAT & TINDAK LANJUT (ACTION ITEMS) */}
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              D. KEPUTUSAN RAPAT & TINDAK LANJUT (ACTION ITEMS)
            </h2>
            <span className="text-[11px] text-slate-500 italic">
              *Klik kotak status untuk menandai penyelesaian
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-300">No</th>
                  <th className="py-2.5 px-4 border-r border-slate-300">Keputusan / Rencana Tindak Lanjut</th>
                  <th className="py-2.5 px-4 border-r border-slate-300 w-48">Penanggung Jawab (PIC)</th>
                  <th className="py-2.5 px-4 w-36 text-center border-r border-slate-300">Tenggat Waktu</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {notulen.action_items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                      Tidak ada action items khusus.
                    </td>
                  </tr>
                ) : (
                  notulen.action_items.map((act, idx) => {
                    const isDone = act.status === "selesai";
                    return (
                      <tr
                        key={act.id || idx}
                        className={`border-b border-slate-200 transition-colors ${
                          isDone ? "bg-emerald-50/40 text-slate-500 line-through" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold border-r border-slate-200 text-slate-900">
                          {act.keputusan}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-200 font-medium">
                          {act.pic}
                        </td>
                        <td className="py-2.5 px-4 text-center border-r border-slate-200 font-medium text-emerald-950">
                          {act.tenggat_waktu}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleActionItemStatus(notulen.id, act.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isDone
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            }`}
                            title="Klik untuk mengubah status penyelesaian"
                          >
                            {isDone ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Selesai</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5 text-amber-700" />
                                <span>Proses</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* E. PENUTUP */}
        <div className="space-y-2 text-xs sm:text-sm">
          <h2 className="font-bold text-slate-900 uppercase tracking-wide">
            E. PENUTUP
          </h2>
          <p className="text-slate-800 leading-relaxed font-normal">
            {notulen.penutup}
          </p>
        </div>

        {/* Tanda Tangan / Pengesahan */}
        <div className="pt-8 border-t border-slate-200">
          <div className="text-right text-xs text-slate-600 mb-2">
            Pasuruan, {notulen.tanggal ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(notulen.tanggal)) : "16 November 2026"}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Kiri: Mengetahui Kepala Sekolah (Sesuai Gambar 2) */}
            <div className="text-left w-64 space-y-0.5">
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala SMK Bayt Al-Hikmah,</p>

              {/* Signature Area */}
              <div className="relative h-24 my-2 flex items-center justify-start">
                {isApproved && (schoolSettings?.stempelUrl || true) && (
                  <div className="absolute -left-6 -top-2 pointer-events-none opacity-85 z-0">
                    <img
                      src={schoolSettings?.stempelUrl || "/stempel.png"}
                      alt="Stempel Sekolah"
                      className="w-24 h-24 object-contain mix-blend-multiply"
                    />
                  </div>
                )}
                {isApproved && (schoolSettings?.ttdKepsekUrl || true) && (
                  <div className="relative z-10 left-6">
                    <img
                      src={schoolSettings?.ttdKepsekUrl || "/ttd.png"}
                      alt="TTD Kepala Sekolah"
                      className="h-20 max-w-[180px] object-contain mix-blend-multiply"
                    />
                  </div>
                )}
                {!isApproved && (
                  <div className="border border-dashed border-slate-300 rounded-lg p-2 text-slate-400 text-xs italic">
                    (Menunggu Pengesahan)
                  </div>
                )}
              </div>

              <p className="font-bold underline text-slate-900">
                {schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom"}
              </p>
              <p className="text-[11px] font-mono text-slate-600">
                NIY. {schoolSettings?.niyKepsek || "14215094"}
              </p>
            </div>

            {/* Kanan: Dicatat oleh Notulis */}
            <div className="text-center">
              <p className="text-slate-600">Dicatat oleh,</p>
              <p className="font-bold text-slate-900">Notulis Rapat</p>

              <div className="h-24 my-2 flex items-center justify-center">
                {/* Space for Notulis */}
              </div>

              <p className="font-bold underline text-slate-900">
                {notulen.notulis}
              </p>
              <p className="text-[11px] font-mono text-slate-600">
                {notulen.notulis_nip ? `NIY/NIP. ${notulen.notulis_nip}` : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
