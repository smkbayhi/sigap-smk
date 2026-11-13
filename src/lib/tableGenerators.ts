// Table HTML generators for official SMK Bayt Al-Hikmah letters

export function cleanSppdHtmlLegacy(html: string): string {
  if (!html) return "";

  let cleaned = html;

  // 1. Remove introductory paragraph for SPPD
  cleaned = cleaned.replace(
    /<p[^>]*>[\s\S]*?Pejabat yang berwenang dengan ini menerbitkan Surat Perintah Perjalanan Dinas[\s\S]*?<\/p>/gi,
    ""
  );

  // 2. Remove "Lembar ke" and "Kode No." top-right table
  cleaned = cleaned.replace(
    /<div[^>]*style="[^"]*display:\s*flex;\s*justify-content:\s*flex-end[^"]*"[^>]*>[\s\S]*?Lembar ke[\s\S]*?Kode No[\s\S]*?<\/div>/gi,
    ""
  );

  // 3. Remove "(Halaman 2 / Lembar Belakang)" and dashed separator
  cleaned = cleaned.replace(
    /<p[^>]*>[\s\S]*?\(Halaman 2\s*\/\s*Lembar Belakang\)[\s\S]*?<\/p>/gi,
    ""
  );
  cleaned = cleaned.replace(/border-top:\s*2px\s*dashed\s*#[0-9a-fA-F]{3,6};?/gi, "");
  cleaned = cleaned.replace(/<hr[^>]*style="[^"]*dashed[^"]*"[^>]*\/?>/gi, "");

  return cleaned;
}

export function alignParagraphsWithKeyValueTables(html: string): string {
  if (!html) return "";

  // Always sanitize legacy SPPD patterns first
  const sanitized = cleanSppdHtmlLegacy(html);

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
  <div style="page-break-before: always; break-before: page; margin-top: 24px; padding-top: 8px;">
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

        <!-- Row III -->
        <tr>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black;">
            <strong>III.</strong> Tiba di : ........................................<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : ........................................<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala / Pimpinan Instansi,</p>
              <div style="height: 40px;"></div>
              <p style="margin: 0; font-weight: bold;">( ........................................ )</p>
              <p style="margin: 0; font-size: 8pt;">NIP/Jabatan: ...........................</p>
            </div>
          </td>
          <td style="width: 50%; padding: 6px; vertical-align: top; border: 1px solid black;">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Berangkat dari : ........................................<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ke : ........................................<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : ........................................<br/>
            <div style="margin-top: 6px; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Kepala / Pimpinan Instansi,</p>
              <div style="height: 40px;"></div>
              <p style="margin: 0; font-weight: bold;">( ........................................ )</p>
              <p style="margin: 0; font-size: 8pt;">NIP/Jabatan: ...........................</p>
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
