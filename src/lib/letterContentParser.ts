import { parseLetterMeta, LetterMetaConfig } from "./letterTemplates";

export interface ParsedLetterContent {
  meta: LetterMetaConfig;
  intiSurat: string;
  jadwalData?: {
    hari: string;
    tanggal: string;
    waktu: string;
    tempat: string;
    agenda: string;
  };
  siswaData?: Array<{
    no: number;
    nama: string;
    nisn: string;
    kelas: string;
    keahlian: string;
  }>;
  pengantarData?: Array<{
    no: number;
    jenisSurat: string;
    banyak: string;
    keterangan: string;
  }>;
  outingData?: Array<{
    waktu: string;
    pendamping: string;
    tempat: string;
    rundown: string;
  }>;
  cateringData?: Array<{
    santriJk: string;
    tglPkl: string;
    jmlSantri: string;
    jmlHari: string;
    volume: string;
    nominal: string;
    tglCatering: string;
  }>;
  sppdData?: any;
  skData?: any;
}

function cleanHtmlText(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseLetterContent(rawHtml: string): ParsedLetterContent {
  const { cleanHtml, meta } = parseLetterMeta(rawHtml || "");

  const result: ParsedLetterContent = {
    meta,
    intiSurat: "",
  };

  if (!cleanHtml) {
    return result;
  }

  // 1. Check for Table based on meta.tipeTabel
  let bodyWithoutTable = cleanHtml;

  if (meta.tipeTabel === "jadwal_pelaksanaan") {
    const tableMatch = cleanHtml.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      const tableHtml = tableMatch[0];
      bodyWithoutTable = cleanHtml.replace(tableHtml, "");

      const getRowVal = (pattern: string): string => {
        const re = new RegExp(`<td[^>]*>${pattern}[\\s\\S]*?<\\/td>\\s*<td[^>]*>(?:&nbsp;|\\s)*:(?:&nbsp;|\\s)*([^<]*)<\\/td>`, "i");
        const m = tableHtml.match(re);
        return m ? cleanHtmlText(m[1]) : "";
      };

      const getAgendaVal = (): string => {
        const re = new RegExp(`<td[^>]*>(?:Agenda\\s*\\/\\s*Acara|Agenda|Acara)[\\s\\S]*?<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i");
        const m = tableHtml.match(re);
        if (!m) return "";
        const cellHtml = m[1];

        // 1. If it has <li>, extract each item
        if (cellHtml.includes("<li")) {
          const liMatches = cellHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
          if (liMatches && liMatches.length > 0) {
            return liMatches
              .map((li, idx) => {
                const cleanTxt = cleanHtmlText(li.replace(/<[^>]+>/g, ""));
                return `${idx + 1}. ${cleanTxt}`;
              })
              .join("\n");
          }
        }

        // 2. If it has <br>, convert to newline
        let clean = cellHtml.replace(/<br\s*\/?>/gi, "\n");
        clean = clean.replace(/<[^>]+>/g, " ");
        clean = clean.replace(/^\s*:\s*/, "");
        return clean
          .split("\n")
          .map((l) => cleanHtmlText(l))
          .filter(Boolean)
          .join("\n");
      };

      const hariTanggal = getRowVal("Hari\\s*\\/\\s*Tanggal");
      let hari = "";
      let tanggal = "";
      if (hariTanggal.includes(",")) {
        const parts = hariTanggal.split(",");
        hari = parts[0].trim();
        tanggal = parts.slice(1).join(",").trim();
      } else {
        hari = getRowVal("Hari");
        tanggal = getRowVal("Tanggal");
      }

      result.jadwalData = {
        hari: hari || "Sabtu",
        tanggal: tanggal || "3 Januari 2026",
        waktu: getRowVal("Pukul\\s*\\/\\s*Waktu") || getRowVal("Waktu") || "09.00 WIB s.d selesai",
        tempat: getRowVal("Tempat") || "Ruang Rapat Pimpinan SMK",
        agenda: getAgendaVal(),
      };
    }
  } else if (meta.tipeTabel === "daftar_siswa") {
    const tableMatch = cleanHtml.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      const tableHtml = tableMatch[0];
      bodyWithoutTable = cleanHtml.replace(tableHtml, "");

      const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      const siswaList: Array<{ no: number; nama: string; nisn: string; kelas: string; keahlian: string }> = [];

      rows.forEach((tr) => {
        // Skip header
        if (tr.includes("<th") || tr.toLowerCase().includes("nama siswa") || tr.toLowerCase().includes("nisn")) return;
        const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (tds.length >= 4) {
          const cleanTds = tds.map((td) => cleanHtmlText(td.replace(/<[^>]+>/g, "")));
          siswaList.push({
            no: siswaList.length + 1,
            nama: cleanTds[1] || "",
            nisn: cleanTds[2] || "",
            kelas: cleanTds[3] || "XII DKV",
            keahlian: cleanTds[4] || "Desain Komunikasi Visual",
          });
        }
      });

      if (siswaList.length > 0) {
        result.siswaData = siswaList;
      }
    }
  } else if (meta.tipeTabel === "pengantar_berkas") {
    const tableMatch = cleanHtml.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      const tableHtml = tableMatch[0];
      bodyWithoutTable = cleanHtml.replace(tableHtml, "");

      const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      const pengantarList: Array<{ no: number; jenisSurat: string; banyak: string; keterangan: string }> = [];

      rows.forEach((tr) => {
        if (tr.includes("<th") || tr.toLowerCase().includes("jenis surat")) return;
        const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (tds.length >= 3) {
          const cleanTds = tds.map((td) => cleanHtmlText(td.replace(/<[^>]+>/g, "")));
          pengantarList.push({
            no: pengantarList.length + 1,
            jenisSurat: cleanTds[1] || "",
            banyak: cleanTds[2] || "1 (satu) Berkas",
            keterangan: cleanTds[3] || "",
          });
        }
      });

      if (pengantarList.length > 0) {
        result.pengantarData = pengantarList;
      }
    }
  } else if (meta.tipeTabel === "outing_class") {
    const tableMatch = cleanHtml.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      const tableHtml = tableMatch[0];
      bodyWithoutTable = cleanHtml.replace(tableHtml, "");

      const getRowVal = (label: string): string => {
        const re = new RegExp(`<td[^>]*>${label}[\\s\\S]*?<\\/td>\\s*<td[^>]*>(?:&nbsp;|\\s)*:(?:&nbsp;|\\s)*([\\s\\S]*?)<\\/td>`, "i");
        const m = tableHtml.match(re);
        if (!m) return "";
        return m[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
      };

      result.outingData = [
        {
          waktu: getRowVal("Waktu"),
          pendamping: getRowVal("Pendamping"),
          tempat: getRowVal("Tempat"),
          rundown: getRowVal("Rundown"),
        },
      ];
    }
  } else if (meta.tipeTabel === "rincian_catering") {
    const tableMatch = cleanHtml.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      const tableHtml = tableMatch[0];
      bodyWithoutTable = cleanHtml.replace(tableHtml, "");

      const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      const cateringList: Array<any> = [];

      rows.forEach((tr) => {
        if (tr.includes("<th") || tr.toLowerCase().includes("santri")) return;
        const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (tds.length >= 7) {
          const cleanTds = tds.map((td) => cleanHtmlText(td.replace(/<[^>]+>/g, "")));
          cateringList.push({
            santriJk: cleanTds[0] || "Putra",
            tglPkl: cleanTds[1] || "",
            jmlSantri: cleanTds[2] || "",
            jmlHari: cleanTds[3] || "",
            volume: cleanTds[4] || "",
            nominal: cleanTds[5] || "",
            tglCatering: cleanTds[6] || "",
          });
        }
      });

      if (cateringList.length > 0) {
        result.cateringData = cateringList;
      }
    }
  } else if (meta.tipeTabel === "sppd_resmi") {
    // SPPD is self-contained formulir
    bodyWithoutTable = "";
  } else if (meta.tipeTabel === "sk_susunan_tim") {
    // SK is multi-page F4
    bodyWithoutTable = "";
  }

  // 2. Extract intiSurat from bodyWithoutTable
  // Filter out Islamic opening and standardized closing
  const pTags = bodyWithoutTable.match(/<(p|ol|table)[\s\S]*?<\/\1>/gi) || [];
  const contentBlocks: string[] = [];

  pTags.forEach((block) => {
    const textLower = block.replace(/<[^>]+>/g, "").toLowerCase().trim();

    // Skip Islamic greeting
    if (textLower.includes("assalamu'alaikum") || textLower.includes("assalamu’alaikum")) {
      return;
    }

    // Skip Islamic closing & standard closing phrases
    if (
      textLower.includes("wassalamu'alaikum") ||
      textLower.includes("wassalamu’alaikum") ||
      (textLower.startsWith("demikian") && (textLower.includes("terima kasih") || textLower.includes("jazaa")))
    ) {
      return;
    }

    // If it's a key-value table inside the paragraph flow (e.g. Nama : ..., NIY : ...)
    if (block.startsWith("<table")) {
      const trs = block.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      const lines: string[] = [];
      trs.forEach((tr) => {
        const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (tds.length >= 2 && tds[0] && tds[1]) {
          const k = cleanHtmlText(tds[0].replace(/<[^>]+>/g, ""));
          const v = cleanHtmlText(tds[1].replace(/<[^>]+>/g, "").replace(/^:\s*/, ""));
          lines.push(`${k} : ${v}`);
        }
      });
      if (lines.length > 0) {
        contentBlocks.push(lines.join("\n"));
        return;
      }
    }

    // If it's an ordered list
    if (block.startsWith("<ol")) {
      const lis = block.match(/<li[\s\S]*?<\/li>/gi) || [];
      const lines = lis.map((li, idx) => {
        const text = cleanHtmlText(li.replace(/<[^>]+>/g, ""));
        return `${idx + 1}. ${text}`;
      });
      if (lines.length > 0) {
        contentBlocks.push(lines.join("\n"));
        return;
      }
    }

    // Standard paragraph: convert <br> to \n and strip tags
    const cleanP = block
      .replace(/^<p[^>]*>/i, "")
      .replace(/<\/p>$/i, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (cleanP) {
      contentBlocks.push(cleanP);
    }
  });

  result.intiSurat = contentBlocks.join("\n\n");
  return result;
}
