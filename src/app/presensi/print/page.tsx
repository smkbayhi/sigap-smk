"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePresensi } from "@/context/PresensiContext";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { matchUserWithTeacher, findTeacherRecordForUser } from "@/lib/presensiParser";
import { getBidangLabel } from "@/lib/utils";
import { OfficialKopSurat } from "@/components/kop-surat/OfficialKopSurat";
import { Printer, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TTD_KEPSEK_DATA_URL, STEMPEL_SEKOLAH_DATA_URL } from "@/lib/seedData";

export default function PrintPresensiPage() {
  const { currentReport } = usePresensi();
  const { users, currentUser, isKepsek, isTU } = useAuth();
  const { schoolSettings } = useAppData();

  const canManageAllPresensi = isKepsek || isTU;
  const myTeacherRecord = !canManageAllPresensi
    ? findTeacherRecordForUser(currentReport?.teachers, currentUser)
    : null;

  useEffect(() => {
    // Automatically trigger print dialog after page renders
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const namaKepsek = schoolSettings?.namaKepsek || "Mokhamat Ekhsan, S.Kom";
  const niyKepsek = schoolSettings?.niyKepsek || "14215094";
  const ttdKepsek = schoolSettings?.ttdKepsekUrl || TTD_KEPSEK_DATA_URL;
  const stempel = schoolSettings?.stempelUrl || STEMPEL_SEKOLAH_DATA_URL;

  const tuUser = users.find((u) => u.role === "tata_usaha");
  const namaTu = tuUser?.name || "AINIYATUL FITRIYAH, S.S";
  const niyTu = tuUser?.niy || tuUser?.nip || "11861027";
  const ttdTu = tuUser?.ttd_url;

  if (!currentReport) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <p className="text-sm font-bold text-gray-700 mb-4">Tidak ada data presensi aktif untuk dicetak.</p>
          <Link
            href="/presensi"
            className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all inline-block"
          >
            Kembali ke Halaman Presensi
          </Link>
        </div>
      </div>
    );
  }

  if (!canManageAllPresensi && !myTeacherRecord) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <p className="text-sm font-bold text-gray-700 mb-2">Data Presensi Akun Tidak Ditemukan</p>
          <p className="text-xs text-gray-500 mb-4">
            Akun Anda ({currentUser?.name}) belum terhubung dengan data fingerprint periode {currentReport.rentangTanggal}.
          </p>
          <Link
            href="/presensi"
            className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all inline-block"
          >
            Kembali ke Halaman Presensi
          </Link>
        </div>
      </div>
    );
  }

  // Personal slip data resolution
  const myMatched = myTeacherRecord ? matchUserWithTeacher(myTeacherRecord, users) : null;
  const myDisplayName = myMatched ? myMatched.name : (myTeacherRecord?.nama || currentUser?.name || "");
  const myDisplayPin = myMatched ? (myMatched.niy || myMatched.nip || myTeacherRecord?.pin) : (myTeacherRecord?.pin || currentUser?.niy || "-");
  const myDisplayJabatan = myMatched ? myMatched.jabatan : (myTeacherRecord?.jabatan || currentUser?.jabatan || "Pendidik");
  const myDisplayBidang = myMatched?.bidang ? getBidangLabel(myMatched.bidang) : (currentUser?.bidang ? getBidangLabel(currentUser.bidang) : "Pendidik");

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-gray-900">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm 6mm 8mm !important;
          }
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-doc-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
      {/* Top Floating Print Bar (Hidden on print) */}
      <div className="max-w-[215mm] mx-auto mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              if (window.opener && window.history.length <= 1) {
                window.close();
              } else {
                window.location.href = "/presensi";
              }
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Presensi</span>
        </button>

        <button
          onClick={() => window.print()}
          className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Sekarang</span>
        </button>
      </div>

      {/* F4 / Folio / A4 Paper Document Container */}
      <div className="print-doc-container max-w-[215mm] mx-auto bg-white p-6 sm:p-10 shadow-lg print:shadow-none print:p-0 rounded-xl print:rounded-none">
        {/* Official Kop Surat */}
        <OfficialKopSurat className="!mb-1.5" />

        {!canManageAllPresensi && myTeacherRecord ? (
          /* ============================================================== */
          /* SLIP REKAPITULASI PRESENSI & EVALUASI KEHADIRAN PRIBADI GURU   */
          /* ============================================================== */
          <div>
            {/* Slip Title */}
            <div className="text-center my-5">
              <h2 className="text-sm font-black uppercase tracking-wider underline">
                SLIP REKAPITULASI PRESENSI & MONITORING DISIPLIN PRIBADI
              </h2>
              <p className="text-xs font-bold text-gray-700 mt-1">
                PERIODE: {currentReport.rentangTanggal.toUpperCase()}
              </p>
            </div>

            {/* Biodata Box */}
            <div className="mb-4 border border-black p-3 text-xs leading-relaxed">
              <table className="w-full text-left">
                <tbody>
                  <tr>
                    <td className="w-36 font-semibold py-0.5">Nama Pendidik / Staf</td>
                    <td className="w-3">:</td>
                    <td className="font-bold">{myDisplayName}</td>
                    <td className="w-32 font-semibold py-0.5">Unit / Bidang</td>
                    <td className="w-3">:</td>
                    <td>{myDisplayBidang}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold py-0.5">NIY / PIN Presensi</td>
                    <td>:</td>
                    <td className="font-mono">{myDisplayPin}</td>
                    <td className="font-semibold py-0.5">Status Disiplin KKM</td>
                    <td>:</td>
                    <td className="font-bold">
                      <span className={myTeacherRecord.statusKkm === "TIDAK KKM" ? "text-red-700 font-black underline" : "text-emerald-800"}>
                        {myTeacherRecord.statusKkm} ({myTeacherRecord.persentaseTerlambat}% Terlambat)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold py-0.5">Jabatan / Amanah</td>
                    <td>:</td>
                    <td>{myDisplayJabatan}</td>
                    <td className="font-semibold py-0.5">Nilai Kebiasaan Kerja</td>
                    <td>:</td>
                    <td className="font-bold">{myTeacherRecord.nilaiKebiasaanKerja || "4.10"} (Bobot 0.40)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* KPI Summary Table */}
            <div className="mb-4">
              <table className="w-full text-center text-xs border border-black border-collapse">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5">Hari Kerja</th>
                    <th className="border border-black p-1.5">Hadir</th>
                    <th className="border border-black p-1.5">Terlambat</th>
                    <th className="border border-black p-1.5">Total Telat</th>
                    <th className="border border-black p-1.5">% Telat</th>
                    <th className="border border-black p-1.5">Izin</th>
                    <th className="border border-black p-1.5">Sakit</th>
                    <th className="border border-black p-1.5">Alpha</th>
                    <th className="border border-black p-1.5">Lupa Finger</th>
                    <th className="border border-black p-1.5">Status KKM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-semibold">
                    <td className="border border-black p-1.5">{myTeacherRecord.totalHariKerja} Hari</td>
                    <td className="border border-black p-1.5 font-bold text-emerald-800">{myTeacherRecord.totalHadir} Hari</td>
                    <td className="border border-black p-1.5">{myTeacherRecord.totalTerlambatHari} Hari</td>
                    <td className="border border-black p-1.5 font-mono">{myTeacherRecord.totalMenitTerlambat} mnt</td>
                    <td className="border border-black p-1.5 font-bold">{myTeacherRecord.persentaseTerlambat}%</td>
                    <td className="border border-black p-1.5">{myTeacherRecord.totalIzin || 0}</td>
                    <td className="border border-black p-1.5">{myTeacherRecord.totalSakit || 0}</td>
                    <td className="border border-black p-1.5">{myTeacherRecord.totalAlpha || 0}</td>
                    <td className="border border-black p-1.5 font-bold text-orange-950">{myTeacherRecord.totalLupaFinger || 0}</td>
                    <td className={`border border-black p-1.5 font-black ${myTeacherRecord.statusKkm === "TIDAK KKM" ? "text-red-700" : "text-emerald-800"}`}>
                      {myTeacherRecord.statusKkm}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Daily Fingerprint Log Table */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-gray-800 mb-1">Rincian Kehadiran Harian Mesin Fingerprint:</p>
              <table className="w-full text-left text-[10px] border border-black border-collapse">
                <thead>
                  <tr className="bg-gray-100 font-bold text-center border-b border-black">
                    <th className="border border-black p-1 w-7">NO</th>
                    <th className="border border-black p-1 text-left">HARI & TANGGAL</th>
                    <th className="border border-black p-1 w-16">JADWAL</th>
                    <th className="border border-black p-1 w-16">JAM MASUK</th>
                    <th className="border border-black p-1 w-16">JAM PULANG</th>
                    <th className="border border-black p-1 w-16">TELAT</th>
                    <th className="border border-black p-1 w-16">STATUS</th>
                    <th className="border border-black p-1 text-left">KETERANGAN / ALASAN</th>
                  </tr>
                </thead>
                <tbody>
                  {myTeacherRecord.dailyDetails
                    .filter((day) => day.hari !== "Minggu")
                    .map((day, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1 font-semibold">{day.hari}, {day.tanggal}</td>
                      <td className="border border-black p-1 text-center">{day.jadwalMasuk}</td>
                      <td className="border border-black p-1 text-center font-mono font-bold">{day.jamMasuk}</td>
                      <td className="border border-black p-1 text-center font-mono">{day.jamPulang}</td>
                      <td className="border border-black p-1 text-center">
                        {day.terlambatMenit > 0 ? `+${day.terlambatMenit} mnt` : "-"}
                      </td>
                      <td className="border border-black p-1 text-center font-semibold">
                        {day.status === "lupa_finger" ? "Lupa Finger" : day.status === "tugas_luar" ? "Tugas Luar" : day.status}
                      </td>
                      <td className="border border-black p-1">{day.keterangan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Catatan / Keterangan Evaluasi Diri */}
            <div className="mb-6 p-3 border border-gray-300 rounded-lg text-[10px] space-y-1">
              <p className="font-bold text-gray-800">Catatan Refleksi & Komitmen Disiplin Guru / Karyawan:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                <li>
                  Ambang Batas KKM (Kriteria Ketuntasan Minimal): Persentase keterlambatan jam kerja{" "}
                  <strong>&lt; 50%</strong>.
                </li>
                {myTeacherRecord.totalLupaFinger && myTeacherRecord.totalLupaFinger > 0 ? (
                  <li>
                    <span className="text-orange-950 font-medium">
                      Tercatat <strong>{myTeacherRecord.totalLupaFinger} hari Lupa Finger</strong> (tidak checklock masuk/pulang namun diakui hadir). Mohon evaluasi mandiri agar lebih tertib melakukan checklock fingerprint saat datang dan pulang.
                    </span>
                  </li>
                ) : null}
                <li>
                  {myTeacherRecord.statusKkm === "TIDAK KKM" ? (
                    <span className="text-red-700 font-semibold">
                      Keterlambatan Anda ({myTeacherRecord.persentaseTerlambat}%) melebihi standar KKM. Mohon untuk memprioritaskan ketepatan waktu hadir (06:50 WIB) pada periode berikutnya demi perbaikan rekam jejak kinerja.
                    </span>
                  ) : (
                    <span className="text-emerald-800 font-semibold">
                      Alhamdulillah, kehadiran Anda telah memenuhi standar KKM. Terima kasih atas kedisiplinan dan dedikasi Anda.
                    </span>
                  )}
                </li>
              </ul>
            </div>

            {/* Signatures for Personal Slip */}
            <div className="flex items-start justify-between text-xs pt-2 mt-1 break-inside-avoid page-break-avoid">
              {/* Left: Kepala Tata Usaha */}
              <div className="text-left w-64 space-y-0.5 break-inside-avoid">
                <p className="font-normal text-xs leading-tight">Pasuruan, {todayStr}</p>
                <p className="font-bold text-xs leading-tight">Mengetahui,</p>
                <p className="font-bold text-xs leading-tight">Kepala Tata Usaha,</p>

                <div className="relative h-[68px] flex items-center justify-start">
                  {ttdTu ? (
                    <div className="relative z-10 left-7 flex items-center h-full">
                      <img
                        src={ttdTu}
                        alt={`Tanda Tangan ${namaTu}`}
                        className="h-[68px] max-w-[180px] object-contain mix-blend-multiply"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-[68px]" />
                  )}
                </div>

                <p className="font-bold underline text-xs tracking-wide">{namaTu}</p>
                <p className="text-[10px] font-mono text-gray-800">NIY. {niyTu}</p>
              </div>

              {/* Right: Guru / Pegawai yang bersangkutan */}
              <div className="text-left w-64 space-y-0.5 break-inside-avoid">
                <p className="font-normal text-xs leading-tight">&nbsp;</p>
                <p className="font-bold text-xs leading-tight">Pendidik / Tenaga Kependidikan,</p>
                <p className="text-[10px] text-gray-500 leading-tight">(Yang Bersangkutan)</p>

                <div className="relative h-[68px] flex items-center justify-start">
                  <div className="w-48 h-[68px]" />
                </div>

                <p className="font-bold underline text-xs tracking-wide">{myDisplayName}</p>
                <p className="text-[10px] font-mono text-gray-800">NIY / PIN. {myDisplayPin}</p>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* REKAPITULASI PRESENSI SEKOLAH (ADMINISTRATIF / KEPSEK & TU)     */
          /* ============================================================== */
          <div>
            {/* Document Title */}
            <div className="text-center my-1.5">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider underline">
                REKAPITULASI PRESENSI & EVALUASI KEDISIPLINAN GURU
              </h2>
              <p className="text-[10.5px] font-bold text-gray-700 mt-0.5">
                PERIODE: {currentReport.rentangTanggal.toUpperCase()}
              </p>
            </div>

            {/* Main Table */}
            <div className="mb-1.5">
              <table className="w-full text-left text-[9.5px] border border-black border-collapse">
                <thead>
                  <tr className="bg-gray-100 font-bold text-center border-b border-black">
                    <th className="border border-black py-1 px-1 w-7">NO</th>
                    <th className="border border-black py-1 px-1 text-left">NAMA GURU & PEGAWAI</th>
                    <th className="border border-black py-1 px-1 w-12">HARI KERJA</th>
                    <th className="border border-black py-1 px-1 w-10">HADIR</th>
                    <th className="border border-black py-1 px-1 w-14">TERLAMBAT (HARI)</th>
                    <th className="border border-black py-1 px-1 w-14">TOTAL TELAT</th>
                    <th className="border border-black py-1 px-1 w-14">% TELAT</th>
                    <th className="border border-black py-1 px-1 w-16">STATUS KKM</th>
                    <th className="border border-black py-1 px-1 w-8">IZIN</th>
                    <th className="border border-black py-1 px-1 w-8">SAKIT</th>
                    <th className="border border-black py-1 px-1 w-8">ALPHA</th>
                    <th className="border border-black py-1 px-1 w-10">LUPA FINGER</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.teachers.map((t, idx) => {
                    const matched = matchUserWithTeacher(t, users);
                    const displayName = matched ? matched.name : t.nama;
                    const isTidakKkm = t.statusKkm === "TIDAK KKM";
                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-black ${
                          isTidakKkm ? "bg-red-50/50 font-bold" : ""
                        }`}
                      >
                        <td className="border border-black py-0.5 px-1 text-center">{idx + 1}</td>
                        <td className="border border-black py-0.5 px-1 font-semibold">{displayName}</td>
                        <td className="border border-black py-0.5 px-1 text-center">{t.totalHariKerja}</td>
                        <td className="border border-black py-0.5 px-1 text-center font-bold">{t.totalHadir}</td>
                        <td className="border border-black py-0.5 px-1 text-center">{t.totalTerlambatHari}</td>
                        <td className="border border-black py-0.5 px-1 text-center font-mono">
                          {t.totalMenitTerlambat > 0 ? `${t.totalMenitTerlambat} m` : "-"}
                        </td>
                        <td className="border border-black py-0.5 px-1 text-center font-bold">
                          {t.persentaseTerlambat}%
                        </td>
                        <td
                          className={`border border-black py-0.5 px-1 text-center font-black ${
                            isTidakKkm ? "text-red-700" : ""
                          }`}
                        >
                          {t.statusKkm}
                        </td>
                        <td className="border border-black py-0.5 px-1 text-center">{t.totalIzin || "-"}</td>
                        <td className="border border-black py-0.5 px-1 text-center">{t.totalSakit || "-"}</td>
                        <td className="border border-black py-0.5 px-1 text-center">{t.totalAlpha || "-"}</td>
                        <td className="border border-black py-0.5 px-1 text-center font-bold text-orange-950">{t.totalLupaFinger || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Catatan / Keterangan KKM */}
            <div className="mb-2 p-1.5 px-2.5 border border-gray-400 rounded-lg text-[9px] leading-snug space-y-0.5 bg-gray-50/50 print:bg-white break-inside-avoid">
              <p className="font-bold text-gray-900">Keterangan Standar Kedisiplinan Yayasan & Sekolah:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                <li>
                  <strong>Ambang Batas KKM (Kriteria Ketuntasan Minimal):</strong> Persentase keterlambatan jam kerja{" "}
                  <strong>kurang dari 50% (&lt; 50%)</strong> dari total hari kerja aktif.
                </li>
                <li>
                  <strong>Tindak Lanjut Pembinaan:</strong> Guru dengan persentase keterlambatan{" "}
                  <strong>mencapai 50% atau lebih (≥ 50.0% / TIDAK KKM)</strong> diberikan surat pembinaan ketaatan jam kerja oleh pihak manajemen sekolah dan Kepala Tata Usaha.
                </li>
              </ul>
            </div>

            {/* Signature Area (Tanda Tangan & Stempel Proporsional Mengena Kedua Tulisan) */}
            <div className="flex items-start justify-between text-xs pt-1.5 mt-1 break-inside-avoid page-break-avoid">
              {/* Left: Kepala Sekolah */}
              <div className="text-left w-64 space-y-0.5 break-inside-avoid">
                <p className="font-normal text-xs leading-tight">Mengetahui,</p>
                <p className="font-bold text-xs leading-tight">Kepala SMK Bayt Al-Hikmah,</p>

                {/* Stempel & Signature overlay resmi persis Gambar 2 (Proporsional & overlap kedua tulisan) */}
                <div className="relative h-[68px] flex items-center justify-start">
                  {/* Stempel Sekolah Proporsional (w-[108px] h-[108px], overlap teks Kepala Sekolah di atas dan Nama di bawah) */}
                  {stempel && (
                    <div className="absolute -left-6 -top-5 pointer-events-none opacity-85 z-0">
                      <img
                        src={stempel}
                        alt="Stempel Sekolah"
                        className="w-[108px] h-[108px] object-contain mix-blend-multiply"
                      />
                    </div>
                  )}

                  {/* Tanda Tangan Digital Kepala Sekolah (h-[68px] max-w-[185px]) */}
                  {ttdKepsek && (
                    <div className="relative z-10 left-7 flex items-center h-full">
                      <img
                        src={ttdKepsek}
                        alt={`Tanda Tangan ${namaKepsek}`}
                        className="h-[68px] max-w-[185px] object-contain mix-blend-multiply"
                      />
                    </div>
                  )}
                </div>

                <p className="font-bold underline tracking-wide text-xs relative z-20">
                  {namaKepsek}
                </p>
                <p className="text-[10px] font-mono text-gray-800 relative z-20">
                  NIY. {niyKepsek}
                </p>
              </div>

              {/* Right: Kepala Tata Usaha */}
              <div className="text-left w-64 space-y-0.5 break-inside-avoid">
                <p className="font-normal text-xs leading-tight">Pasuruan, {todayStr}</p>
                <p className="font-bold text-xs leading-tight">Kepala Tata Usaha,</p>

                <div className="relative h-[68px] flex items-center justify-start">
                  {ttdTu ? (
                    <div className="relative z-10 left-7 flex items-center h-full">
                      <img
                        src={ttdTu}
                        alt={`Tanda Tangan ${namaTu}`}
                        className="h-[68px] max-w-[180px] object-contain mix-blend-multiply"
                      />
                    </div>
                  ) : (
                    /* Ruang tanda tangan manual */
                    <div className="w-48 h-[68px]" />
                  )}
                </div>

                <p className="font-bold underline tracking-wide text-xs relative z-20">
                  {namaTu}
                </p>
                <p className="text-[10px] font-mono text-gray-800 relative z-20">
                  NIY. {niyTu}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
