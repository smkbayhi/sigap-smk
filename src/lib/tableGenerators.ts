// Table HTML generators for official SMK Bayt Al-Hikmah letters

export function alignParagraphsWithKeyValueTables(html: string): string {
  if (!html) return "";

  // Replace <p> blocks that contain key-value colon pairs like "Nama : ...<br/>NIY : ...<br/>Jabatan : ..."
  const pRegex = /<p>([\s\S]*?)<\/p>/gi;
  const kvRegex = /^([A-Za-z0-9\s\/\(\)\.,'-]{2,30})\s*:\s*(.+)$/;

  return html.replace(pRegex, (match, inner) => {
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
  hari?: string;
  tanggal?: string;
  waktu?: string;
  tempat?: string;
  acara?: string;
  pejabat?: string;
  pegawai?: string;
  jabatanPegawai?: string;
  perjalanan?: string;
  transportasi?: string;
  durasi?: string;
  maksud?: string;
  beban?: string;
  keterangan?: string;
}): string {
  // First, if there is a schedule part for Surat Tugas
  let html = "";
  if (data.hari || data.tanggal || data.waktu || data.tempat || data.acara) {
    html += generateJadwalPelaksanaanHtml({
      hari: data.hari,
      tanggal: data.tanggal,
      waktu: data.waktu,
      tempat: data.tempat,
      agenda: data.acara,
    });
  }

  // Then the official 8-point SPPD table
  html += `
<div style="margin-top: 14px; margin-bottom: 10px; page-break-inside: avoid;">
  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 2px; font-size: 11pt;">
    SURAT PERINTAH PERJALANAN DINAS (SPPD)
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt; border: 1px solid black;" border="1">
    <tbody>
      <tr>
        <td style="width: 28px; text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">1.</td>
        <td style="width: 220px; padding: 4px; vertical-align: top; border: 1px solid black;">Pejabat yang berwenang</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.pejabat || "Mokhamat Ekhsan, S.Kom"}</td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">2.</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">Nama / NIY Pegawai yang diperintahkan</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.pegawai || "-"}</td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">3.</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">Jabatan dan Golongan Ruang</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.jabatanPegawai || "Guru SMK Bayt Al-Hikmah"}</td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">4.</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">Perjalanan Dinas yang diperintahkan<br/><span style="font-size: 9pt; color: #333;">Transportasi menggunakan:</span></td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.perjalanan || "SMK Bayt Al-Hikmah"}<br/>&nbsp;&nbsp;${data.transportasi || "Kendaraan Operasional / Mobil"}</td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">5.</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">Perjalanan Dinas direncanakan</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.durasi || "Selama 1 (satu) hari"}</td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">6.</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">Maksud mengadakan Perjalanan Dinas</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.maksud || data.acara || "-"}</td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">7.</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">Perhitungan / Pembebanan Biaya</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.beban || "SMK Bayt Al-Hikmah"}</td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 4px; vertical-align: top; border: 1px solid black;">8.</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">Keterangan lain-lain</td>
        <td style="padding: 4px; vertical-align: top; border: 1px solid black;">: ${data.keterangan || "-"}</td>
      </tr>
    </tbody>
  </table>
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
