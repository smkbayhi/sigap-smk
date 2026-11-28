"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { ArrowLeft, Printer } from "lucide-react";
import { TTD_KEPSEK_DATA_URL, STEMPEL_SEKOLAH_DATA_URL, TTD_NOTULIS_DATA_URL } from "@/lib/seedData";

export default function PrintNotulenPage() {
  const params = useParams();
  const id = params?.id as string;

  const { notulenList, schoolSettings } = useAppData();
  const notulen = notulenList.find((n) => n.id === id);

  useEffect(() => {
    // Automatically trigger print dialog once document is mounted
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!notulen) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <p className="text-sm font-bold text-gray-700 mb-4">Dokumen Notulensi Tidak Ditemukan</p>
          <Link
            href="/notulen"
            className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all inline-block"
          >
            Kembali ke Daftar Notulen
          </Link>
        </div>
      </div>
    );
  }

  const { users } = useAuth();

  const isApproved = notulen.is_approved_by_kepsek || notulen.status === "disetujui";
  const rawStempel = schoolSettings?.stempelUrl || STEMPEL_SEKOLAH_DATA_URL;
  const stempel = rawStempel.startsWith("data:image/svg+xml;utf8,")
    ? rawStempel.replace(";utf8,", ";charset=utf-8,")
    : rawStempel;

  const rawTtd = schoolSettings?.ttdKepsekUrl;
  const ttdKepsek = (!rawTtd || rawTtd.startsWith("data:image/svg+xml"))
    ? TTD_KEPSEK_DATA_URL
    : rawTtd;

  const namaKepsek = notulen.approved_by_name || schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom";
  const niyKepsek = notulen.pemimpin_nip || schoolSettings?.niyKepsek || "14215094";

  // Find Notulis user from user list or match by name / NIY
  const notulisUser = users.find(
    (u) =>
      (notulen.notulis_id && u.id === notulen.notulis_id) ||
      (notulen.notulis_nip && (u.niy === notulen.notulis_nip || u.nip === notulen.notulis_nip)) ||
      (notulen.notulis && u.name && (u.name.toLowerCase().includes(notulen.notulis.toLowerCase()) || notulen.notulis.toLowerCase().includes(u.name.toLowerCase())))
  );
  const isAiniyatul =
    notulen.notulis?.toLowerCase().includes("ainiyatul") ||
    notulen.notulis?.toLowerCase().includes("aniyatul") ||
    notulen.notulis_nip === "11861027";

  const ttdNotulis = notulisUser?.ttd_url || (isAiniyatul ? TTD_NOTULIS_DATA_URL : undefined);

  // Date formatted
  let formattedTanggal = notulen.hari_tanggal;
  if (notulen.tanggal) {
    try {
      const d = new Date(notulen.tanggal + "T00:00:00");
      formattedTanggal = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-black">
      {/* Top Floating Print Bar (Hidden during printing) */}
      <div className="max-w-[215mm] mx-auto mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              if (window.opener && window.history.length <= 1) {
                window.close();
              } else {
                window.location.href = `/notulen/${notulen.id}`;
              }
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Notulensi</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Sekarang</span>
        </button>
      </div>

      {/* Official Folio / F4 Paper Document Container */}
      <div
        className="max-w-[215mm] mx-auto bg-white p-8 sm:p-14 shadow-lg print:shadow-none print:p-0 rounded-xl print:rounded-none text-black leading-relaxed"
        style={{ fontFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", Georgia, serif' }}
      >
        {/* Official Kop Surat */}
        <OfficialKopSurat />

        {/* Document Title */}
        <div className="text-center my-6">
          <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider underline decoration-1 underline-offset-2">
            NOTULEN RAPAT
          </h1>
          {notulen.nomor_notulen && (
            <p className="text-xs mt-1 font-semibold">
              Nomor: {notulen.nomor_notulen}
            </p>
          )}
        </div>

        {/* A. IDENTITAS RAPAT */}
        <div className="mb-5 text-[11pt]">
          <h2 className="font-bold mb-2">A. IDENTITAS RAPAT</h2>
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr>
                <td className="w-40 py-0.5 font-bold align-top">Jenis Rapat</td>
                <td className="w-4 py-0.5 align-top">:</td>
                <td className="py-0.5 align-top">{notulen.jenis_rapat}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold align-top">Hari / Tanggal</td>
                <td className="py-0.5 align-top">:</td>
                <td className="py-0.5 align-top">{notulen.hari_tanggal}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold align-top">Waktu</td>
                <td className="py-0.5 align-top">:</td>
                <td className="py-0.5 align-top">{notulen.waktu}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold align-top">Tempat</td>
                <td className="py-0.5 align-top">:</td>
                <td className="py-0.5 align-top">{notulen.tempat}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold align-top">Pemimpin Rapat</td>
                <td className="py-0.5 align-top">:</td>
                <td className="py-0.5 align-top">{notulen.pemimpin_rapat}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold align-top">Notulis</td>
                <td className="py-0.5 align-top">:</td>
                <td className="py-0.5 align-top">{notulen.notulis}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold align-top">Peserta Rapat</td>
                <td className="py-0.5 align-top">:</td>
                <td className="py-0.5 align-top">{notulen.peserta_rapat}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* B. SUSUNAN ACARA */}
        <div className="mb-5 text-[11pt]">
          <h2 className="font-bold mb-2">B. SUSUNAN ACARA</h2>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            {notulen.susunan_acara.map((acara, idx) => (
              <li key={idx} className="leading-normal">
                <span>{acara}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* C. JALANNYA RAPAT & PEMBAHASAN */}
        <div className="mb-5 text-[11pt]">
          <h2 className="font-bold mb-2">C. JALANNYA RAPAT & PEMBAHASAN</h2>
          <div className="space-y-3">
            {notulen.pembahasan.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1">
                <p className="leading-normal">
                  <strong>{secIdx + 1}. {sec.judul}:</strong>
                  {sec.keterangan ? ` ${sec.keterangan}` : ""}
                </p>

                {sec.poin_poin && sec.poin_poin.length > 0 && (
                  <ul className="space-y-1 pl-6">
                    {sec.poin_poin.map((poin, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-base leading-none mt-1">◦</span>
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
        <div className="mb-5 text-[11pt] break-inside-avoid">
          <h2 className="font-bold mb-2">
            D. KEPUTUSAN RAPAT & TINDAK LANJUT (ACTION ITEMS)
          </h2>
          <table className="w-full text-left text-[10pt] border border-black border-collapse">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-black text-center">
                <th className="border border-black p-2 w-10">No</th>
                <th className="border border-black p-2 text-left">
                  Keputusan / Rencana Tindak Lanjut
                </th>
                <th className="border border-black p-2 w-44">
                  Penanggung Jawab<br />(PIC)
                </th>
                <th className="border border-black p-2 w-36">
                  Tenggat Waktu
                </th>
              </tr>
            </thead>
            <tbody>
              {notulen.action_items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-black p-2 text-center italic">
                    Tidak ada action items.
                  </td>
                </tr>
              ) : (
                notulen.action_items.map((act, idx) => (
                  <tr key={act.id || idx} className="border-b border-black">
                    <td className="border border-black p-2 text-center align-top">
                      {idx + 1}
                    </td>
                    <td className="border border-black p-2 align-top">
                      {act.keputusan}
                    </td>
                    <td className="border border-black p-2 align-top text-center">
                      {act.pic}
                    </td>
                    <td className="border border-black p-2 align-top text-center">
                      {act.tenggat_waktu}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* E. PENUTUP */}
        <div className="mb-6 text-[11pt]">
          <h2 className="font-bold mb-1">E. PENUTUP</h2>
          <p className="leading-relaxed text-justify">
            {notulen.penutup}
          </p>
        </div>

        {/* TANDA TANGAN / PENGESAHAN */}
        <div className="pt-4 text-[11pt] break-inside-avoid">
          <div className="flex items-start justify-between">
            {/* Kiri: Mengetahui Kepala Sekolah (Sesuai Gambar 2) */}
            <div className="text-left w-64 space-y-0.5 break-inside-avoid">
              <p className="invisible select-none leading-tight">Pasuruan, {formattedTanggal}</p>
              <p className="leading-tight">Mengetahui,</p>
              <p className="font-bold leading-tight">Kepala SMK Bayt Al-Hikmah,</p>

              {/* Signature & Stamp Overlay Proporsional (Overlap kedua tulisan) */}
              <div className="relative h-[44px] my-1 flex items-center justify-start">
                {isApproved && stempel && (
                  <div className="absolute -left-6 -top-[42px] pointer-events-none opacity-85 z-0">
                    <img
                      src={stempel}
                      alt="Stempel Sekolah"
                      className="w-[130px] h-[130px] object-contain mix-blend-multiply"
                    />
                  </div>
                )}
                {isApproved && ttdKepsek && (
                  <div className="absolute left-4 -top-[28px] z-10 pointer-events-none">
                    <img
                      src={ttdKepsek}
                      alt={`Tanda Tangan ${namaKepsek}`}
                      className="w-[115px] h-[115px] object-contain mix-blend-multiply"
                    />
                  </div>
                )}
              </div>

              <p className="font-bold underline tracking-wide leading-tight">
                {namaKepsek}
              </p>
              <p className="text-[10pt] font-mono text-gray-800 leading-tight">
                NIY. {niyKepsek}
              </p>
            </div>

            {/* Kanan: Dicatat oleh Notulis (Lurus dan Rapi dengan Tulisan Pasuruan) */}
            <div className="text-left w-64 space-y-0.5 break-inside-avoid">
              <p className="leading-tight">Pasuruan, {formattedTanggal}</p>
              <p className="leading-tight">Dicatat oleh,</p>
              <p className="font-bold leading-tight">Notulis Rapat,</p>

              {/* Signature Notulis: Proporsional persis sama tingginya h-[44px] */}
              <div className="relative h-[44px] my-1 flex items-center justify-start">
                {ttdNotulis ? (
                  <div className="absolute left-4 -top-[28px] z-10 pointer-events-none">
                    <img
                      src={ttdNotulis}
                      alt={`Tanda Tangan ${notulen.notulis}`}
                      className="w-[115px] h-[115px] object-contain mix-blend-multiply"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-[44px]" />
                )}
              </div>

              <p className="font-bold underline tracking-wide leading-tight">
                {notulen.notulis}
              </p>
              <p className="text-[10pt] font-mono text-gray-800 leading-tight">
                {notulen.notulis_nip ? `NIY. ${notulen.notulis_nip}` : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
