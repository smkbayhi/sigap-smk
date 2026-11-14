// Table HTML generators for official SMK Bayt Al-Hikmah letters

import {
  LOGO_YAYASAN_DATA_URL,
  LOGO_SMK_CIRCULAR_DATA_URL,
  STEMPEL_SEKOLAH_DATA_URL,
  TTD_KEPSEK_DATA_URL,
} from "./seedData";
import { KOP_HEADER_2027_DATA_URL } from "./kopAssets2027";
import { TemplateKopSurat } from "./letterTemplates";

export function cleanSppdHtmlLegacy(html: string, fallbackNomor?: string): string {
  if (!html) return "";

  let cleaned = html;

  // 1. Detect nomor surat if not provided
  let detectedNomor = fallbackNomor || "";
  if (!detectedNomor) {
    const noMatch =
      cleaned.match(/Nomor\s*<\/td>\s*<td[^>]*>:<\/td>\s*<td[^>]*>([^<]+)<\/td>/i) ||
      cleaned.match(/Nomor\s*:\s*([0-9A-Za-z\.\/-]+)/i);
    if (noMatch) detectedNomor = noMatch[1].trim();
  }

  // 2. Remove introductory paragraph for SPPD
  cleaned = cleaned.replace(
    /<p[^>]*>[\s\S]*?Pejabat yang berwenang dengan ini menerbitkan Surat Perintah Perjalanan Dinas[\s\S]*?<\/p>/gi,
    ""
  );

  // 3. Remove "Lembar ke" and "Kode No." top-right table
  cleaned = cleaned.replace(
    /<div[^>]*style="[^"]*display:\s*flex;\s*justify-content:\s*flex-end[^"]*"[^>]*>[\s\S]*?Lembar ke[\s\S]*?Kode No[\s\S]*?<\/div>/gi,
    ""
  );

  // 4. Ensure Nomor Surat is prominently placed right under SURAT PERINTAH PERJALANAN DINAS (SPPD)
  if (detectedNomor) {
    const titleRegex = /(<h2[^>]*>[\s\S]*?SURAT PERINTAH PERJALANAN DINAS \(SPPD\)[\s\S]*?<\/h2>)/i;
    const hasNomorUnderTitle = /SURAT PERINTAH PERJALANAN DINAS \(SPPD\)[\s\S]{0,140}Nomor\s*:/i.test(cleaned);
    if (!hasNomorUnderTitle && titleRegex.test(cleaned)) {
      cleaned = cleaned.replace(
        titleRegex,
        `$1\n    <p style="font-size: 10pt; font-weight: 600; margin: 4px 0 0 0; text-align: center;">Nomor : ${detectedNomor}</p>`
      );
    }
  }

  // 5. Remove "(Halaman 2 / Lembar Belakang)" safely without deleting surrounding elements
  cleaned = cleaned.replace(/<span[^>]*>\s*\(?Halaman 2\s*\/\s*Lembar Belakang\)?\s*<\/span>/gi, "");
  cleaned = cleaned.replace(/\(?Halaman 2\s*\/\s*Lembar Belakang\)?/gi, "");

  // 6. Remove dashed border separator lines
  cleaned = cleaned.replace(/border-top:\s*2px\s*dashed\s*#[0-9a-fA-F]{3,6};?/gi, "");
  cleaned = cleaned.replace(/<hr[^>]*style="[^"]*dashed[^"]*"[^>]*\/?>/gi, "");

  // 7. Ensure sppd-page-2 class is present on Lembar Belakang wrapper
  cleaned = cleaned.replace(
    /<div style="page-break-before:\s*always;/gi,
    '<div class="sppd-page-2" style="page-break-before: always;'
  );

  // 8. Clean up dotted lines in spare signature cells so manual wet signature & stamp can be placed cleanly
  cleaned = cleaned.replace(
    /<strong>III\.<\/strong>\s*Tiba di\s*:\s*\.{5,}/gi,
    "<strong>III.</strong> Tiba di :"
  );
  cleaned = cleaned.replace(/Pada Tanggal\s*:\s*\.{5,}/gi, "Pada Tanggal :");
  cleaned = cleaned.replace(/Berangkat dari\s*:\s*\.{5,}/gi, "Berangkat dari :");
  cleaned = cleaned.replace(/Ke\s*:\s*\.{5,}/gi, "Ke :");
  cleaned = cleaned.replace(
    /\(\s*\.{8,}\s*\)/gi,
    "(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)"
  );
  cleaned = cleaned.replace(
    /NIP\/Jabatan:\s*\.{5,}/gi,
    "NIP/Jabatan: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
  );

  return cleaned;
}

export function alignParagraphsWithKeyValueTables(html: string, fallbackNomor?: string): string {
  if (!html) return "";

  // If SK document, preserve as-is without re-wrapping into tables
  if (
    html.includes("sk-document-container") ||
    html.includes("sk-page-lampiran") ||
    html.includes("sk-lembar-pokok")
  ) {
    return html;
  }

  // Always sanitize legacy SPPD patterns first
  const sanitized = cleanSppdHtmlLegacy(html, fallbackNomor);

  // Replace <p> blocks that contain key-value colon pairs like "Nama : ...<br/>NIY : ...<br/>Jabatan : ..."
  const pRegex = /<p>([\s\S]*?)<\/p>/gi;
  const kvRegex = /^([A-Za-z0-9\s\/\(\)\.,'-]{2,30})\s*:\s*(.+)$/;

  return sanitized.replace(pRegex, (match, inner) => {
    // Split by <br>, <br/>, or newline
    const lines = inner
      .split(/<br\s*\/?>|\r?\n/gi)
      .map((l: string) => l.trim())
      .filter(Boolean);

    // Check if lines have key-value colon patterns
    const kvLines = lines.filter((l: string) => kvRegex.test(l));
    const nonKvLines = lines.filter((l: string) => !kvRegex.test(l));

    if (kvLines.length >= 2 && kvLines.length >= lines.length / 2) {
      let out = "";
      if (nonKvLines.length > 0) {
        out += `<p>${nonKvLines.join("<br/>")}</p>\n`;
      }
      out += `<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11pt;">\n`;
      kvLines.forEach((l: string, idx: number) => {
        const m = l.match(kvRegex);
        if (m) {
          const widthStyle = idx === 0 ? "width: 130px; " : "";
          out += `  <tr><td style="${widthStyle}padding: 3px 0; vertical-align: top;">${m[1].trim()}</td><td style="padding: 3px 0; vertical-align: top;">: ${m[2].trim()}</td></tr>\n`;
        }
      });
      out += `</table>\n`;
      return out;
    }

    return match;
  });
}

export function generateJadwalPelaksanaanHtml(data: {
  hari?: string;
  tanggal?: string;
  waktu?: string;
  tempat?: string;
  agenda?: string;
}): string {
  const { hari, tanggal, waktu, tempat, agenda } = data;
  if (!hari && !tanggal && !waktu && !tempat && !agenda) return "";

  let html = `<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11pt;">\n`;
  if (hari && tanggal) {
    html += `  <tr><td style="width: 130px; padding: 3px 0; vertical-align: top;">Hari / Tanggal</td><td style="padding: 3px 0; vertical-align: top;">: ${hari.trim()}, ${tanggal.trim()}</td></tr>\n`;
  } else if (hari) {
    html += `  <tr><td style="width: 130px; padding: 3px 0; vertical-align: top;">Hari</td><td style="padding: 3px 0; vertical-align: top;">: ${hari.trim()}</td></tr>\n`;
  } else if (tanggal) {
    html += `  <tr><td style="width: 130px; padding: 3px 0; vertical-align: top;">Tanggal</td><td style="padding: 3px 0; vertical-align: top;">: ${tanggal.trim()}</td></tr>\n`;
  }
  if (waktu) {
    html += `  <tr><td style="padding: 3px 0; vertical-align: top;">Pukul / Waktu</td><td style="padding: 3px 0; vertical-align: top;">: ${waktu.trim()}</td></tr>\n`;
  }
  if (tempat) {
    html += `  <tr><td style="padding: 3px 0; vertical-align: top;">Tempat</td><td style="padding: 3px 0; vertical-align: top;">: ${tempat.trim()}</td></tr>\n`;
  }
  if (agenda) {
    html += `  <tr><td style="padding: 3px 0; vertical-align: top;">Agenda / Acara</td><td style="padding: 3px 0; vertical-align: top;">: ${agenda.trim()}</td></tr>\n`;
  }
  html += `</table>\n`;
  return html;
}

export function generateSppdHtml(data: {
  pejabat?: string;
  pegawai?: string;
  niyPegawai?: string;
  pangkat?: string;
  jabatanPegawai?: string;
  tingkatBiaya?: string;
  maksud?: string;
  transportasi?: string;
  tempatBerangkat?: string;
  tempatTujuan?: string;
  durasi?: string;
  tglBerangkat?: string;
  tglKembali?: string;
  pengikut?: string;
  instansiBeban?: string;
  mataAnggaran?: string;
  keterangan?: string;
  catatanLain?: string;
  // Metadata & fallbacks
  hari?: string;
  tanggal?: string;
  waktu?: string;
  tempat?: string;
  acara?: string;
  perjalanan?: string;
  beban?: string;
  nomorSurat?: string;
  tanggalSurat?: string;
  namaKepsek?: string;
  niyKepsek?: string;
  displayStamp?: string | null;
  displayTtd?: string | null;
}): string {
  const pejabat = data.pejabat || "Kepala SMK Bayt Al-Hikmah";
  const pegawai = data.pegawai || "Moh. Nasih Aminulloh, S.Mat, M.Si";
  const niyPegawai = data.niyPegawai || "23060333";
  const pangkat = data.pangkat || "-";
  const jabatan = data.jabatanPegawai || "Guru Produktif SMK Bayt Al-Hikmah";
  const tingkatBiaya = data.tingkatBiaya || "Sesuai Standar Yayasan / BOSP";
  const maksud = data.maksud || data.acara || "Pendampingan Siswa PKL dan Workshop Peningkatan Kompetensi";
  const transportasi = data.transportasi || "Kendaraan Pribadi / Operasional";
  const tempatBerangkat = data.tempatBerangkat || (data.perjalanan && data.perjalanan.includes(" ke ") ? data.perjalanan.split(" ke ")[0]?.replace("Dari: ", "") : "SMK Bayt Al-Hikmah, Kota Pasuruan");
  const tempatTujuan = data.tempatTujuan || (data.perjalanan && data.perjalanan.includes(" ke ") ? data.perjalanan.split(" ke ")[1] : "Cabang Dinas Pendidikan Wilayah Pasuruan");
  const durasi = data.durasi || "1 (satu) hari";
  const tglBerangkat = data.tglBerangkat || data.tanggal || "14 Januari 2026";
  const tglKembali = data.tglKembali || data.tanggal || "14 Januari 2026";
  const pengikut = data.pengikut || "-";
  const instansiBeban = data.instansiBeban || data.beban || "SMK Bayt Al-Hikmah";
  const mataAnggaran = data.mataAnggaran || "Dana BOSP / Anggaran Operasional Rutin";
  const keterangan = data.keterangan || "Surat Tugas Terlampir";
  const catatanLain = data.catatanLain || "-";
  const nomorSurat = data.nomorSurat || ".../SPPD/SMK-BAYHI/XI/2026";
  const tanggalSurat = data.tanggalSurat || data.tanggal || "14 Januari 2026";
  const namaKepsek = data.namaKepsek || "Mokhamat Ekhsan, S.Kom";
  const niyKepsek = data.niyKepsek || "14215094";

  // Parse pengikut rows if multiple lines or format as table rows
  let pengikutContent = "";
  if (!pengikut || pengikut.trim() === "-" || pengikut.trim() === "") {
    pengikutContent = `<tr><td style="padding: 2px 4px; border: none;">1. -</td><td style="padding: 2px 4px; border: none;">-</td></tr>`;
  } else {
    const lines = pengikut.split("\n").filter(Boolean);
    pengikutContent = lines.map((l, idx) => {
      const parts = l.split(" - ");
      const name = parts[0]?.trim() || l.trim();
      const desc = parts[1]?.trim() || "-";
      return `<tr><td style="padding: 2px 4px; border: none;">${idx + 1}. ${name}</td><td style="padding: 2px 4px; border: none;">${desc}</td></tr>`;
    }).join("");
  }

  let html = `
<div style="font-family: 'Times New Roman', Times, serif; color: #000; font-size: 9.5pt; line-height: 1.4;">
  <!-- ================= LEMBAR DEPAN (MUKA) SPPD ================= -->
  <!-- Judul SPPD & Nomor Surat -->
  <div style="text-align: center; margin: 8px 0 14px 0;">
    <h2 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
      SURAT PERINTAH PERJALANAN DINAS (SPPD)
    </h2>
    <p style="font-size: 10pt; font-weight: 600; margin: 4px 0 0 0;">
      Nomor : ${nomorSurat}
    </p>
  </div>

  <!-- Tabel 10 Butir Standar SPPD -->
  <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 9.5pt; margin-bottom: 14px;" border="1">
    <tbody>
      <tr>
        <td style="width: 28px; text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">1.</td>
        <td style="width: 220px; vertical-align: top; padding: 4px 6px; border: 1px solid black;">Pejabat yang memberi perintah</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black; font-weight: 600;">${pejabat}</td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">2.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">Nama / NIY / NUPTK Pegawai yang diperintahkan</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          <strong style="font-size: 10pt;">${pegawai}</strong><br/>
          <span style="font-size: 9pt;">NIY/NUPTK: ${niyPegawai}</span>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">3.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          a. Pangkat dan Golongan<br/>
          b. Jabatan / Instansi<br/>
          c. Tingkat Biaya Perjalanan Dinas
        </td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          a. ${pangkat}<br/>
          b. ${jabatan}<br/>
          c. ${tingkatBiaya}
        </td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">4.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">Maksud Perjalanan Dinas</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">${maksud}</td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">5.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">Alat angkutan yang dipergunakan</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">${transportasi}</td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">6.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          a. Tempat berangkat<br/>
          b. Tempat tujuan
        </td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          a. ${tempatBerangkat}<br/>
          b. ${tempatTujuan}
        </td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">7.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          a. Lamanya Perjalanan Dinas<br/>
          b. Tanggal berangkat<br/>
          c. Tanggal harus kembali
        </td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          a. ${durasi}<br/>
          b. ${tglBerangkat}<br/>
          c. ${tglKembali}
        </td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">8.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">Pengikut: Nama</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
            <thead>
              <tr style="border-bottom: 1px solid #999; font-weight: bold;">
                <td style="padding-bottom: 2px;">Nama</td>
                <td style="padding-bottom: 2px;">Tanggal Lahir / Jabatan / Keterangan</td>
              </tr>
            </thead>
            <tbody>
              ${pengikutContent}
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">9.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          Pembebanan Anggaran:<br/>
          a. Instansi<br/>
          b. Mata Anggaran / Akun
        </td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">
          <br/>
          a. ${instansiBeban}<br/>
          b. ${mataAnggaran}
        </td>
      </tr>
      <tr>
        <td style="text-align: center; vertical-align: top; padding: 4px 6px; border: 1px solid black;">10.</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">Keterangan lain-lain</td>
        <td style="vertical-align: top; padding: 4px 6px; border: 1px solid black;">${keterangan}</td>
      </tr>
    </tbody>
  </table>

  <!-- Tanda Tangan Pejabat Penerbit SPPD (Lembar Muka) -->
  <div style="display: flex; justify-content: flex-end; margin-top: 10px; margin-bottom: 24px;">
    <div style="width: 270px; text-align: left; font-size: 9.5pt;">
      <p style="margin: 0;">Dikeluarkan di : Pasuruan</p>
      <p style="margin: 0 0 4px 0;">Pada tanggal : ${tanggalSurat}</p>
      <p style="margin: 0; font-weight: bold;">Kepala Sekolah,</p>

      <!-- Signature & Stamp container with authentic positioning -->
      <div style="position: relative; height: 75px; margin: 4px 0; display: flex; align-items: center;">
        ${
          data.displayStamp
            ? `<div style="position: absolute; left: -22px; top: -20px; pointer-events: none; opacity: 0.9; z-index: 1;">
                 <img src="${data.displayStamp}" alt="Stempel" style="width: 125px; height: 125px; object-fit: contain; mix-blend-mode: multiply;" />
               </div>`
            : ""
        }
        ${
          data.displayTtd
            ? `<div style="position: relative; z-index: 2; left: 18px; top: -4px;">
                 <img src="${data.displayTtd}" alt="TTD" style="height: 75px; max-width: 160px; object-fit: contain; mix-blend-mode: multiply;" />
               </div>`
            : `<div style="height: 55px;"></div>`
        }
      </div>

      <p style="margin: 0; font-weight: bold; text-decoration: underline; font-size: 10.5pt;">${namaKepsek}</p>
      <p style="margin: 0; font-size: 9pt;">NIY. ${niyKepsek}</p>
    </div>
  </div>

  <!-- ================= LEMBAR BELAKANG (VISUM SPPD) ================= -->
  <div class="sppd-page-2" style="page-break-before: always; break-before: page; margin-top: 24px; padding-top: 8px;">
    <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 8px; font-size: 8.5pt;">
      <span style="font-weight: bold;">SPPD No: ${nomorSurat}</span>
    </div>
    
    <div style="text-align: center; margin-bottom: 10px;">
      <p style="font-size: 10.5pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
        LEMBAR VISUM PERJALANAN DINAS
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 8.5pt;" border="1">
      <tbody>
        <!-- Row I -->
        <tr>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black; background: #ffffff;"></td>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black;">
            <strong>I.</strong> Berangkat dari : ${tempatBerangkat}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;(Tempat Kedudukan)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;Ke : ${tempatTujuan}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : ${tglBerangkat}<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala Sekolah,</p>
              <div style="height: 40px;"></div>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaKepsek}</p>
              <p style="margin: 0; font-size: 8pt;">NIY. ${niyKepsek}</p>
            </div>
          </td>
        </tr>

        <!-- Row II -->
        <tr>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black;">
            <strong>II.</strong> Tiba di : ${tempatTujuan}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : ${tglBerangkat}<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala / Pimpinan Instansi,</p>
              <div style="height: 40px;"></div>
              <p style="margin: 0; font-weight: bold;">( ........................................ )</p>
              <p style="margin: 0; font-size: 8pt;">NIP/Jabatan: ...........................</p>
            </div>
          </td>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black;">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Berangkat dari : ${tempatTujuan}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ke : ${tempatBerangkat}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : ${tglKembali}<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala / Pimpinan Instansi,</p>
              <div style="height: 40px;"></div>
              <p style="margin: 0; font-weight: bold;">( ........................................ )</p>
              <p style="margin: 0; font-size: 8pt;">NIP/Jabatan: ...........................</p>
            </div>
          </td>
        </tr>

        <!-- Row III (Kolom Kosong Putih Bersih untuk Tanda Tangan & Stempel Basah Pejabat Terkait) -->
        <tr>
          <td style="width: 50%; padding: 8px 6px; vertical-align: top; border: 1px solid black; background: #ffffff;">
            <strong>III.</strong> Tiba di :<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal :<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala / Pimpinan Instansi,</p>
              <div style="height: 48px;"></div>
              <p style="margin: 0; font-weight: bold;">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
              <p style="margin: 0; font-size: 8pt;">NIP/Jabatan: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
            </div>
          </td>
          <td style="width: 50%; padding: 8px 6px; vertical-align: top; border: 1px solid black; background: #ffffff;">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Berangkat dari :<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ke :<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal :<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala / Pimpinan Instansi,</p>
              <div style="height: 48px;"></div>
              <p style="margin: 0; font-weight: bold;">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
              <p style="margin: 0; font-size: 8pt;">NIP/Jabatan: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
            </div>
          </td>
        </tr>

        <!-- Row IV -->
        <tr>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black;">
            <strong>IV.</strong> Tiba kembali di : ${tempatBerangkat}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Tempat Kedudukan)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : ${tglKembali}<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala Sekolah,</p>
              <div style="height: 40px;"></div>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaKepsek}</p>
              <p style="margin: 0; font-size: 8pt;">NIY. ${niyKepsek}</p>
            </div>
          </td>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black; font-size: 8pt; line-height: 1.4;">
            Telah diperiksa dengan keterangan bahwa perjalanan tersebut di atas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold; font-size: 8.5pt;">Kepala Sekolah,</p>
              <div style="height: 40px;"></div>
              <p style="margin: 0; font-weight: bold; text-decoration: underline; font-size: 9pt;">${namaKepsek}</p>
              <p style="margin: 0; font-size: 8pt;">NIY. ${niyKepsek}</p>
            </div>
          </td>
        </tr>

        <!-- Row V -->
        <tr>
          <td colspan="2" style="padding: 6px 8px; border: 1px solid black; font-size: 8pt;">
            <strong>V. CATATAN LAIN-LAIN:</strong><br/>
            ${catatanLain}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Row VI -->
    <div style="margin-top: 6px; font-size: 7.5pt; line-height: 1.35; text-align: justify; color: #111;">
      <strong>VI. PERHATIAN:</strong><br/>
      Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan keuangan sekolah/yayasan apabila sekolah menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
    </div>
  </div>
</div>
`;

  return html;
}

export function generateDaftarSiswaHtml(
  rows: Array<{
    no?: number;
    nama: string;
    nisn: string;
    kelas: string;
    keahlian: string;
  }>
): string {
  if (!rows || rows.length === 0) return "";

  let html = `
<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5pt; border: 1px solid black;" border="1">
  <thead>
    <tr style="background-color: #f9fafb; text-align: center; font-weight: bold;">
      <th style="width: 32px; padding: 5px; border: 1px solid black;">No.</th>
      <th style="padding: 5px; border: 1px solid black; text-align: left;">Nama Lengkap Siswa</th>
      <th style="width: 115px; padding: 5px; border: 1px solid black;">NISN</th>
      <th style="width: 85px; padding: 5px; border: 1px solid black;">Kelas</th>
      <th style="padding: 5px; border: 1px solid black; text-align: left;">Konsentrasi Keahlian</th>
    </tr>
  </thead>
  <tbody>
`;

  rows.forEach((r, idx) => {
    html += `    <tr>
      <td style="text-align: center; padding: 4px; border: 1px solid black;">${idx + 1}</td>
      <td style="padding: 4px; border: 1px solid black; font-weight: 500;">${r.nama}</td>
      <td style="text-align: center; padding: 4px; border: 1px solid black;">${r.nisn || "-"}</td>
      <td style="text-align: center; padding: 4px; border: 1px solid black;">${r.kelas || "-"}</td>
      <td style="padding: 4px; border: 1px solid black;">${r.keahlian || "-"}</td>
    </tr>\n`;
  });

  html += `  </tbody>\n</table>\n`;
  return html;
}

export function generatePengantarBerkasHtml(
  rows: Array<{
    no?: number;
    jenisSurat: string;
    banyak: string;
    keterangan: string;
  }>
): string {
  if (!rows || rows.length === 0) return "";

  let html = `
<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5pt; border: 1px solid black;" border="1">
  <thead>
    <tr style="background-color: #f9fafb; text-align: center; font-weight: bold;">
      <th style="width: 35px; padding: 6px; border: 1px solid black;">NO</th>
      <th style="padding: 6px; border: 1px solid black; text-align: left;">JENIS SURAT / BERKAS</th>
      <th style="width: 120px; padding: 6px; border: 1px solid black;">BANYAK</th>
      <th style="width: 220px; padding: 6px; border: 1px solid black; text-align: left;">KETERANGAN</th>
    </tr>
  </thead>
  <tbody>
`;

  rows.forEach((r, idx) => {
    html += `    <tr>
      <td style="text-align: center; padding: 6px; border: 1px solid black; vertical-align: top;">${idx + 1}</td>
      <td style="padding: 6px; border: 1px solid black; vertical-align: top; font-weight: 500;">${r.jenisSurat}</td>
      <td style="text-align: center; padding: 6px; border: 1px solid black; vertical-align: top;">${r.banyak}</td>
      <td style="padding: 6px; border: 1px solid black; vertical-align: top;">${r.keterangan}</td>
    </tr>\n`;
  });

  html += `  </tbody>\n</table>\n`;
  return html;
}

export function generateOutingClassHtml(
  rows: Array<{
    waktu: string;
    pendamping: string;
    tempat: string;
    rundown: string;
  }>
): string {
  if (!rows || rows.length === 0) return "";

  let html = `
<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; border: 1px solid black;" border="1">
  <thead>
    <tr style="background-color: #f9fafb; text-align: center; font-weight: bold;">
      <th style="width: 30px; padding: 5px; border: 1px solid black;">No</th>
      <th style="width: 130px; padding: 5px; border: 1px solid black;">Waktu</th>
      <th style="padding: 5px; border: 1px solid black; text-align: left;">Pendamping</th>
      <th style="padding: 5px; border: 1px solid black; text-align: left;">Tempat Tujuan</th>
      <th style="width: 80px; padding: 5px; border: 1px solid black;">Rundown</th>
    </tr>
  </thead>
  <tbody>
`;

  rows.forEach((r, idx) => {
    html += `    <tr>
      <td style="text-align: center; padding: 5px; border: 1px solid black; vertical-align: top;">${idx + 1}</td>
      <td style="padding: 5px; border: 1px solid black; vertical-align: top;">${r.waktu}</td>
      <td style="padding: 5px; border: 1px solid black; vertical-align: top; white-space: pre-line;">${r.pendamping}</td>
      <td style="padding: 5px; border: 1px solid black; vertical-align: top; white-space: pre-line;">${r.tempat}</td>
      <td style="text-align: center; padding: 5px; border: 1px solid black; vertical-align: top;">${r.rundown}</td>
    </tr>\n`;
  });

  html += `  </tbody>\n</table>\n`;
  return html;
}

export function generateRincianCateringHtml(
  rows: Array<{
    santriJk: string;
    tglPkl: string;
    jmlSantri: string;
    jmlHari: string;
    volume: string;
    nominal: string;
    tglCatering: string;
  }>
): string {
  if (!rows || rows.length === 0) return "";

  let html = `
<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; border: 1px solid black;" border="1">
  <thead>
    <tr style="background-color: #f9fafb; text-align: center; font-weight: bold;">
      <th style="width: 25px; padding: 4px; border: 1px solid black;">No</th>
      <th style="padding: 4px; border: 1px solid black;">Santri (JK)</th>
      <th style="padding: 4px; border: 1px solid black;">Tanggal PKL</th>
      <th style="padding: 4px; border: 1px solid black;">Jml Santri</th>
      <th style="padding: 4px; border: 1px solid black;">Jml Hari</th>
      <th style="padding: 4px; border: 1px solid black;">Volume</th>
      <th style="padding: 4px; border: 1px solid black;">Nominal</th>
      <th style="padding: 4px; border: 1px solid black;">Tgl Pengambilan</th>
    </tr>
  </thead>
  <tbody>
`;

  rows.forEach((r, idx) => {
    html += `    <tr>
      <td style="text-align: center; padding: 4px; border: 1px solid black;">${idx + 1}</td>
      <td style="text-align: center; padding: 4px; border: 1px solid black; font-weight: 500;">${r.santriJk}</td>
      <td style="padding: 4px; border: 1px solid black;">${r.tglPkl}</td>
      <td style="text-align: center; padding: 4px; border: 1px solid black;">${r.jmlSantri}</td>
      <td style="text-align: center; padding: 4px; border: 1px solid black;">${r.jmlHari}</td>
      <td style="text-align: center; padding: 4px; border: 1px solid black;">${r.volume}</td>
      <td style="text-align: right; padding: 4px; border: 1px solid black; font-weight: bold;">${r.nominal}</td>
      <td style="padding: 4px; border: 1px solid black;">${r.tglCatering}</td>
    </tr>\n`;
  });

  html += `  </tbody>\n</table>\n`;
  return html;
}

// ====================================================================
// GENERATOR SURAT KEPUTUSAN (SK) KEPALA SEKOLAH (MULTI-HALAMAN F4)
// Sesuai Berkas Resmi SMK Bayt Al-Hikmah No. 10/SMK-BAYHI/SK/VII/2026
// ====================================================================

export interface SkMemberRow {
  no: number;
  nama: string;
  jabatanDinas: string;
  jabatanTim: string;
}

export interface SkTugasRow {
  no: number;
  jabatan: string;
  uraianTugas: string;
}

export interface SkDiktumRow {
  poin: string; // e.g. "Pertama", "Kedua", "Ketiga", "Keempat"
  teks: string;
}

export interface SkGeneratorData {
  nomorSurat?: string;
  tentang: string;
  tahunAjaran?: string;
  menimbang: string[];
  mengingat: string[];
  memperhatikan: string[];
  diktum: SkDiktumRow[];

  // Lampiran 1: Susunan Tim
  lampiran1Title?: string;
  lampiran1Perihal?: string;
  lampiran1Rows: SkMemberRow[];

  // Lampiran 2: Uraian Tugas
  lampiran2Title?: string;
  lampiran2Perihal?: string;
  lampiran2Rows: SkTugasRow[];

  // Tanggal & Pejabat
  tanggalSurat?: string;
  tempatPenetapan?: string;
  namaKepsek?: string;
  niyKepsek?: string;
  displayStamp?: string | null;
  displayTtd?: string | null;
  isApprovedOrHasTtd?: boolean;
  isApprovedOrHasStempel?: boolean;
  kopVariant?: TemplateKopSurat;
  logoYayasanOverride?: string;
  logoSmkOverride?: string;
}

export function getSkKopSuratHtml(
  variant: TemplateKopSurat = "tradisional",
  logoYayasan?: string,
  logoSmk?: string
): string {
  if (variant === "modern_2027") {
    return `
<div class="sk-kop-surat" style="width: 100%; margin-bottom: 14px; text-align: center;">
  <img src="${KOP_HEADER_2027_DATA_URL}" alt="Kop Surat Modern TP 2027/2028" style="width: 100%; height: auto; object-fit: contain; max-height: 120px;" />
</div>`;
  }

  return `
<div class="sk-kop-surat" style="font-family: 'Times New Roman', Times, serif; text-align: center; margin-bottom: 14px;">
  <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 2px;">
    <tr>
      <td style="width: 82px; text-align: left; vertical-align: middle; border: none; padding: 0;">
        <img data-sk-logo-yayasan="1" src="${logoYayasan || LOGO_YAYASAN_DATA_URL}" alt="Logo Yayasan" style="width: 72px; height: 72px; object-fit: contain;" />
      </td>
      <td style="text-align: center; vertical-align: middle; border: none; padding: 0 8px; line-height: 1.25;">
        <h2 style="font-size: 11pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
          YAYASAN PONDOK PESANTREN BAYT AL-HIKMAH
        </h2>
        <h1 style="font-size: 16pt; font-weight: 900; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
          SMK BAYT AL-HIKMAH
        </h1>
        <p style="font-size: 8pt; margin: 3px 0 0 0; color: #111;">
          Jalan Patiunus No. 25 Krampyangan Bugul Kidul Telp : (0343) 428544, Fax : (0343) 413549
        </p>
        <p style="font-size: 7.5pt; margin: 1px 0 0 0; color: #111;">
          Website : http://smk.baytalhikmah.sch.id, E-mail : smkbayhi@gmail.com Kode Pos. 67127
        </p>
        <p style="font-size: 9.5pt; font-weight: bold; margin: 2px 0 0 0; letter-spacing: 4px; text-transform: uppercase;">
          P A S U R U A N
        </p>
      </td>
      <td style="width: 82px; text-align: right; vertical-align: middle; border: none; padding: 0;">
        <img data-sk-logo-smk="1" src="${logoSmk || LOGO_SMK_CIRCULAR_DATA_URL}" alt="Logo SMK" style="width: 72px; height: 72px; object-fit: contain;" />
      </td>
    </tr>
  </table>
  <div style="border-top: 3px solid black; width: 100%; margin-top: 6px;"></div>
  <div style="border-top: 1px solid black; width: 100%; margin-top: 1.5px;"></div>
</div>`;
}

export function getSkSignatureBlockHtml(options: {
  tempatPenetapan?: string;
  tanggalSurat?: string;
  namaKepsek?: string;
  niyKepsek?: string;
  displayStamp?: string | null;
  displayTtd?: string | null;
  isApprovedOrHasTtd?: boolean;
  isApprovedOrHasStempel?: boolean;
}): string {
  const {
    tempatPenetapan = "Pasuruan",
    tanggalSurat = "20 Juli 2026",
    namaKepsek = "MOKHAMAT EKHSAN, S.Kom",
    niyKepsek = "14215094",
    displayStamp,
    displayTtd,
    isApprovedOrHasTtd = false,
    isApprovedOrHasStempel = false,
  } = options;

  return `
<table data-sk-sig-table="1" class="sk-sig-table" style="width: 100%; border: none; border-collapse: collapse; margin-top: 24px; margin-bottom: 6px; page-break-inside: avoid; break-inside: avoid;" border="0">
  <tbody>
    <tr>
      <td style="border: none; width: 52%; padding: 0;"></td>
      <td style="border: none; width: 48%; padding: 0; text-align: left; vertical-align: top; font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; line-height: 1.35; color: #000;">
        <div style="margin: 0 0 2px 0;">Ditetapkan di : ${tempatPenetapan}</div>
        <div style="margin: 0 0 3px 0;">Tanggal : ${tanggalSurat}</div>
        <div style="margin: 0 0 4px 0; font-weight: bold;">Kepala SMK Bayt Al-Hikmah,</div>
        
        <!-- Area Tanda Tangan & Stempel Resmi -->
        <div style="position: relative; height: 80px; margin: 4px 0; min-width: 200px;">
          <!-- Stempel Container -->
          <div data-sk-stamp-container="1" style="position: absolute; left: -22px; top: -6px; z-index: 1; pointer-events: none;">
            ${
              displayStamp && isApprovedOrHasStempel
                ? `<img src="${displayStamp}" alt="Stempel Resmi" style="height: 85px; width: auto; object-fit: contain; mix-blend-mode: multiply; opacity: 0.92;" />`
                : ""
            }
          </div>
          <!-- TTD Container -->
          <div data-sk-ttd-container="1" style="position: relative; z-index: 2; left: 16px; top: 0px;">
            ${
              displayTtd && isApprovedOrHasTtd
                ? `<img src="${displayTtd}" alt="Tanda Tangan" style="height: 75px; max-width: 170px; object-fit: contain; mix-blend-mode: multiply;" />`
                : `<div style="height: 60px;"></div>`
            }
          </div>
        </div>

        <div data-sk-kepsek-name="1" style="margin: 0; font-weight: bold; text-decoration: underline; font-size: 10.5pt; letter-spacing: 0.3px;">
          ${namaKepsek}
        </div>
        <div data-sk-kepsek-niy="1" style="margin: 2px 0 0 0; font-size: 9.5pt;">
          NIY. ${niyKepsek}
        </div>
      </td>
    </tr>
  </tbody>
</table>`;
}

export function generateSkHtml(data: SkGeneratorData): string {
  const {
    nomorSurat = "10/SMK-BAYHI/SK/VII/2026",
    tentang,
    tahunAjaran = "2026/2027",
    menimbang = [],
    mengingat = [],
    memperhatikan = [],
    diktum = [],
    lampiran1Title = "SUSUNAN TIM PELAKSANAAN SUPERVISI",
    lampiran1Perihal = "Susunan, Tugas dan Tanggungjawab Tim Pelaksana Supervisi",
    lampiran1Rows = [],
    lampiran2Title = "URAIAN TUGAS PANITIA PELAKSANA TIM SUPERVISI",
    lampiran2Perihal = "Uraian Tugas Panitia Pelaksana Supervisi",
    lampiran2Rows = [],
    tanggalSurat = "20 Juli 2026",
    tempatPenetapan = "Pasuruan",
    namaKepsek = "MOKHAMAT EKHSAN, S.Kom",
    niyKepsek = "14215094",
    displayStamp = null,
    displayTtd = null,
    isApprovedOrHasTtd = false,
    isApprovedOrHasStempel = false,
    kopVariant = "tradisional",
    logoYayasanOverride,
    logoSmkOverride,
  } = data;

  // Menimbang rows (a., b., c., ...)
  const menimbangLetters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const menimbangRows = menimbang
    .map((item, idx) => {
      const letter = menimbangLetters[idx] || String(idx + 1);
      const cleanText = item.replace(/^[a-z]\.\s*/i, "").trim();
      return `<tr>
        <td style="width: 24px; vertical-align: top; padding: 2px 0;">${letter}.</td>
        <td style="vertical-align: top; padding: 2px 0; text-align: justify;">${cleanText}</td>
      </tr>`;
    })
    .join("\n");

  // Mengingat rows (1., 2., 3., ...)
  const mengingatRows = mengingat
    .map((item, idx) => {
      const num = idx + 1;
      const cleanText = item.replace(/^\d+\.\s*/, "").trim();
      return `<tr>
        <td style="width: 24px; vertical-align: top; padding: 2px 0;">${num}.</td>
        <td style="vertical-align: top; padding: 2px 0; text-align: justify;">${cleanText}</td>
      </tr>`;
    })
    .join("\n");

  // Memperhatikan rows (1., 2., 3., ...)
  const memperhatikanRows = memperhatikan
    .map((item, idx) => {
      const num = idx + 1;
      const cleanText = item.replace(/^\d+\.\s*/, "").trim();
      return `<tr>
        <td style="width: 24px; vertical-align: top; padding: 2px 0;">${num}.</td>
        <td style="vertical-align: top; padding: 2px 0; text-align: justify;">${cleanText}</td>
      </tr>`;
    })
    .join("\n");

  // Diktum rows (Pertama, Kedua, Ketiga, Keempat, ...)
  const diktumRows = diktum
    .map((item) => {
      return `<tr>
        <td style="width: 95px; vertical-align: top; font-weight: bold; padding: 3px 0;">${item.poin}</td>
        <td style="width: 14px; vertical-align: top; font-weight: bold; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0; text-align: justify;">${item.teks}</td>
      </tr>`;
    })
    .join("\n");

  // Lampiran 1 rows (NO, NAMA, JABATAN DINAS, JABATAN TIM)
  const lampiran1RowsHtml = lampiran1Rows
    .map((r, idx) => {
      return `<tr>
        <td style="text-align: center; vertical-align: middle; padding: 6px 4px; border: 1px solid black;">${r.no || idx + 1}</td>
        <td style="vertical-align: middle; padding: 6px 8px; border: 1px solid black; font-weight: 600;">${r.nama}</td>
        <td style="vertical-align: middle; padding: 6px 8px; border: 1px solid black;">${r.jabatanDinas}</td>
        <td style="vertical-align: middle; padding: 6px 8px; border: 1px solid black; font-weight: 500;">${r.jabatanTim}</td>
      </tr>`;
    })
    .join("\n");

  // Lampiran 2 rows (No, Jabatan dalam Kepanitiaan, Uraian Tugas)
  const lampiran2RowsHtml = lampiran2Rows
    .map((r, idx) => {
      const formattedTugas = r.uraianTugas
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("<br/>");
      return `<tr>
        <td style="text-align: center; vertical-align: top; padding: 6px 4px; border: 1px solid black;">${r.no || idx + 1}</td>
        <td style="vertical-align: top; padding: 6px 8px; border: 1px solid black; font-weight: 600;">${r.jabatan}</td>
        <td style="vertical-align: top; padding: 6px 8px; border: 1px solid black; text-align: justify; line-height: 1.4;">${formattedTugas}</td>
      </tr>`;
    })
    .join("\n");

  const sigBlockLembarPokok = getSkSignatureBlockHtml({
    tempatPenetapan,
    tanggalSurat,
    namaKepsek,
    niyKepsek,
    displayStamp,
    displayTtd,
    isApprovedOrHasTtd,
    isApprovedOrHasStempel,
  });

  const sigBlockLampiran1 = getSkSignatureBlockHtml({
    tempatPenetapan,
    tanggalSurat,
    namaKepsek,
    niyKepsek,
    displayStamp,
    displayTtd,
    isApprovedOrHasTtd,
    isApprovedOrHasStempel,
  });

  const sigBlockLampiran2 = getSkSignatureBlockHtml({
    tempatPenetapan,
    tanggalSurat,
    namaKepsek,
    niyKepsek,
    displayStamp,
    displayTtd,
    isApprovedOrHasTtd,
    isApprovedOrHasStempel,
  });

  const kopHtmlLampiran1 = getSkKopSuratHtml(kopVariant, logoYayasanOverride, logoSmkOverride);
  const kopHtmlLampiran2 = getSkKopSuratHtml(kopVariant, logoYayasanOverride, logoSmkOverride);

  return `
<div class="sk-document-container" style="font-family: 'Times New Roman', Times, serif; color: #000; font-size: 10.5pt; line-height: 1.45;">
  <!-- ================= LEMBAR POKOK SURAT KEPUTUSAN ================= -->
  <div class="sk-lembar-pokok">
    <div style="text-align: center; margin: 6px 0 14px 0;">
      <h2 style="font-size: 13pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3;">
        SURAT KEPUTUSAN<br/>
        KEPALA SMK BAYT AL-HIKMAH
      </h2>
      <p style="font-size: 11pt; font-weight: 600; margin: 4px 0 0 0;">
        Nomor: ${nomorSurat}
      </p>
      <p style="font-size: 11pt; font-weight: bold; margin: 8px 0 3px 0; letter-spacing: 1px;">
        TENTANG
      </p>
      <h3 style="font-size: 11.5pt; font-weight: bold; margin: 0 auto; text-transform: uppercase; line-height: 1.35; max-width: 680px;">
        ${tentang}
      </h3>
      ${tahunAjaran ? `<p style="font-size: 11pt; font-weight: bold; margin: 3px 0 0 0; text-transform: uppercase;">TAHUN PELAJARAN ${tahunAjaran}</p>` : ""}
      <p style="font-size: 11pt; font-weight: bold; margin: 12px 0 0 0; letter-spacing: 0.5px;">
        DENGAN RAHMAT TUHAN YANG MAHA ESA
      </p>
      <p style="font-size: 11pt; font-weight: bold; margin: 3px 0 10px 0; letter-spacing: 0.5px;">
        KEPALA SMK BAYT AL-HIKMAH,
      </p>
    </div>

    <!-- Konsiderans: Menimbang, Mengingat, Memperhatikan -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5pt; line-height: 1.45; text-align: justify;" border="0">
      <tbody>
        <tr>
          <td style="width: 120px; vertical-align: top; font-weight: bold; padding: 3px 0;">Menimbang</td>
          <td style="width: 15px; vertical-align: top; font-weight: bold; padding: 3px 0;">:</td>
          <td style="vertical-align: top; padding: 3px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              ${menimbangRows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; font-weight: bold; padding: 3px 0;">Mengingat</td>
          <td style="vertical-align: top; font-weight: bold; padding: 3px 0;">:</td>
          <td style="vertical-align: top; padding: 3px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              ${mengingatRows}
            </table>
          </td>
        </tr>
        ${
          memperhatikan.length > 0
            ? `<tr>
          <td style="vertical-align: top; font-weight: bold; padding: 3px 0;">Memperhatikan</td>
          <td style="vertical-align: top; font-weight: bold; padding: 3px 0;">:</td>
          <td style="vertical-align: top; padding: 3px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              ${memperhatikanRows}
            </table>
          </td>
        </tr>`
            : ""
        }
      </tbody>
    </table>

    <!-- Diktum: MEMUTUSKAN / Menetapkan -->
    <div style="text-align: center; font-weight: bold; font-size: 11pt; margin: 14px 0 8px 0; letter-spacing: 1px;">
      MEMUTUSKAN
    </div>
    <div style="font-size: 10.5pt; line-height: 1.45; text-align: justify; margin-bottom: 12px;">
      <p style="font-weight: bold; margin: 0 0 4px 0;">Menetapkan :</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${diktumRows}
      </table>
    </div>

    <!-- Tanda Tangan Lembar Pokok -->
    ${sigBlockLembarPokok}
  </div>

  <!-- ================= LAMPIRAN I: SUSUNAN TIM PELAKSANA ================= -->
  <div class="sk-page-lampiran sk-page-lampiran-1" style="page-break-before: always; break-before: page; margin-top: 28px; padding-top: 10px;">
    ${kopHtmlLampiran1}

    <div style="display: flex; justify-content: flex-start; margin-bottom: 14px; font-size: 10pt; line-height: 1.35;">
      <table style="border-collapse: collapse;">
        <tr>
          <td style="width: 90px; vertical-align: top; font-weight: bold; padding: 1px 0;">Lampiran I</td>
          <td style="width: 12px; vertical-align: top; font-weight: bold; padding: 1px 0;">:</td>
          <td style="vertical-align: top; padding: 1px 0;">Keputusan Kepala SMK Bayt Al-Hikmah</td>
        </tr>
        <tr>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">Nomor</td>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">:</td>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">${nomorSurat}</td>
        </tr>
        <tr>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">Perihal</td>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">:</td>
          <td style="vertical-align: top; padding: 1px 0;">${lampiran1Perihal}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 14px;">
      <h3 style="font-size: 11.5pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
        ${lampiran1Title}
      </h3>
      <h4 style="font-size: 11pt; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">
        SMK BAYT AL-HIKMAH
      </h4>
      ${tahunAjaran ? `<p style="font-size: 10.5pt; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">TAHUN PELAJARAN ${tahunAjaran}</p>` : ""}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; border: 1px solid black;" border="1">
      <thead>
        <tr style="background-color: #f8fafc; font-weight: bold; text-align: center;">
          <th style="width: 35px; padding: 6px 4px; border: 1px solid black;">NO</th>
          <th style="padding: 6px 8px; border: 1px solid black; text-align: left;">NAMA</th>
          <th style="width: 180px; padding: 6px 8px; border: 1px solid black; text-align: left;">JABATAN DINAS</th>
          <th style="width: 180px; padding: 6px 8px; border: 1px solid black; text-align: left;">JABATAN TIM</th>
        </tr>
      </thead>
      <tbody>
        ${lampiran1RowsHtml}
      </tbody>
    </table>

    <!-- Tanda Tangan Lampiran I -->
    ${sigBlockLampiran1}
  </div>

  <!-- ================= LAMPIRAN II: URAIAN TUGAS KEPANITIAAN ================= -->
  <div class="sk-page-lampiran sk-page-lampiran-2" style="page-break-before: always; break-before: page; margin-top: 28px; padding-top: 10px;">
    ${kopHtmlLampiran2}

    <div style="display: flex; justify-content: flex-start; margin-bottom: 14px; font-size: 10pt; line-height: 1.35;">
      <table style="border-collapse: collapse;">
        <tr>
          <td style="width: 90px; vertical-align: top; font-weight: bold; padding: 1px 0;">Lampiran II</td>
          <td style="width: 12px; vertical-align: top; font-weight: bold; padding: 1px 0;">:</td>
          <td style="vertical-align: top; padding: 1px 0;">Keputusan Kepala SMK Bayt Al-Hikmah</td>
        </tr>
        <tr>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">Nomor</td>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">:</td>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">${nomorSurat}</td>
        </tr>
        <tr>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">Perihal</td>
          <td style="vertical-align: top; font-weight: bold; padding: 1px 0;">:</td>
          <td style="vertical-align: top; padding: 1px 0;">${lampiran2Perihal}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 14px;">
      <h3 style="font-size: 11.5pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
        ${lampiran2Title}
      </h3>
      <h4 style="font-size: 11pt; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">
        TIM SUPERVISI
      </h4>
      ${tahunAjaran ? `<p style="font-size: 10.5pt; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">TAHUN AJARAN ${tahunAjaran}</p>` : ""}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; border: 1px solid black;" border="1">
      <thead>
        <tr style="background-color: #f8fafc; font-weight: bold; text-align: center;">
          <th style="width: 32px; padding: 6px 4px; border: 1px solid black;">No</th>
          <th style="width: 170px; padding: 6px 8px; border: 1px solid black; text-align: left;">Jabatan dalam Kepanitiaan</th>
          <th style="padding: 6px 8px; border: 1px solid black; text-align: left;">Uraian Tugas</th>
        </tr>
      </thead>
      <tbody>
        ${lampiran2RowsHtml}
      </tbody>
    </table>

    <!-- Tanda Tangan Lampiran II -->
    ${sigBlockLampiran2}
  </div>
</div>`;
}

export function syncSkHtmlContent(
  html: string,
  options: {
    isApprovedOrHasTtd?: boolean;
    isApprovedOrHasStempel?: boolean;
    displayTtd?: string | null;
    displayStamp?: string | null;
    namaKepsek?: string;
    niyKepsek?: string;
    logoYayasan?: string;
    logoSmk?: string;
  }
): string {
  if (
    !html ||
    (!html.includes("sk-page-lampiran") &&
      !html.includes("sk-document-container") &&
      !html.includes("sk-lembar-pokok"))
  ) {
    return html;
  }

  let result = html;
  const {
    isApprovedOrHasTtd,
    isApprovedOrHasStempel,
    displayTtd,
    displayStamp,
    namaKepsek = "Mokhamat Ekhsan, S.Kom",
    niyKepsek = "14215094",
    logoYayasan,
    logoSmk,
  } = options;

  // Extract tempatPenetapan & tanggalSurat from existing document if present
  const tempatMatch = result.match(/Ditetapkan di\s*:\s*([^<\r\n]+)/i);
  const tempatPenetapan = tempatMatch ? tempatMatch[1].trim() : "Pasuruan";

  const tglMatch = result.match(/Tanggal\s*:\s*([^<\r\n]+)/i);
  const tanggalSurat = tglMatch ? tglMatch[1].trim() : "20 Juli 2026";

  const newSigTable = getSkSignatureBlockHtml({
    tempatPenetapan,
    tanggalSurat,
    namaKepsek,
    niyKepsek,
    displayStamp,
    displayTtd,
    isApprovedOrHasTtd,
    isApprovedOrHasStempel,
  });

  // Replace any existing signature block:
  // - New format: <table data-sk-sig-table="1" ...>...</table>
  // - Old format: <div class="sk-sig-block" ...>...</div>
  const sigRegex = /(?:<table data-sk-sig-table="1"[\s\S]*?<\/table>|<div class="sk-sig-block"[\s\S]*?NIY\.[^<]*<\/p>\s*<\/div>\s*<\/div>|<div class="sk-sig-block"[\s\S]*?NIY\.[^<]*<\/div>\s*<\/div>\s*<\/div>|<div class="sk-sig-block"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/gi;

  result = result.replace(sigRegex, newSigTable);

  // Sync Logos if present
  if (logoYayasan) {
    result = result.replace(
      /data-sk-logo-yayasan="1" src="[^"]*"/g,
      `data-sk-logo-yayasan="1" src="${logoYayasan}"`
    );
  }
  if (logoSmk) {
    result = result.replace(
      /data-sk-logo-smk="1" src="[^"]*"/g,
      `data-sk-logo-smk="1" src="${logoSmk}"`
    );
  }

  return result;
}

