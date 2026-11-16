import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KNOWN_TEACHERS } from "@/lib/presensiParser";
import { PresensiPeriodReport, DailyAttendanceRecord, StatusKehadiran, TeacherAttendanceSummary } from "@/lib/presensi.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://anmnxwalcohmssaaaocx.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_H0ZBRFQaEk_75NaPtr2PyA_coI5qZlD";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const PRESENSI_CLOUD_ROW_ID = "presensi-cloud-data";
const SECRET_TOKEN = process.env.FINGERPRINT_SECRET_TOKEN || "sigap-smk-fingerprint-2026";

// Jam standar masuk guru SMK Bayt Al-Hikmah (06:50 WIB)
const JAM_MASUK_STANDAR_MENIT = 6 * 60 + 50; // 410 menit (06:50)

// Pemetaan Resmi ID & Nama Panggilan Mesin Fingerprint InterActive X 1800
const MACHINE_PIN_MAPPING: Record<string, string> = {
  "11556022": "11556022", // Nurfaizah
  "nurfaizah": "11556022",
  "11550622": "11556022",
  "16": "11556022",
  "11861027": "11861027", // Ainiyatulfit...
  "ainiyatulfit": "11861027",
  "ainiyatulfitriyah": "11861027",
  "12616042": "12616042", // Lulukms
  "lulukms": "12616042",
  "21610624": "12616042",
  "13559090": "13559090", // Yudha
  "yudha": "13559090",
  "1355099": "13559090",
  "142908": "14215094",   // Ekhsan (Kepala Sekolah)
  "ekhsan": "14215094",
  "142980": "14215094",
  "14215094": "14215094",
  "16402178": "16402178", // Nurafandi
  "nurafandi": "16402178",
  "16041287": "16402178",
  "18076236": "18076236", // Khoiron
  "khoiron": "18076236",
  "8170263": "18076236",
  "2563": "19070265",     // Achmadjab...
  "achmadjab": "19070265",
  "achmadjabbar": "19070265",
  "5236": "19070265",
  "19070265": "19070265",
  "3": "23060333",        // mohnasih
  "mohnasih": "23060333",
  "3239": "23060333",
  "23060333": "23060333",
  "5399": "22060315",     // Fajar
  "fajar": "22060315",
  "5939": "22060315",
  "22060315": "22060315",
  "4432": "4432",         // Ishanani
  "ishanani": "4432",
  "1432": "4432",
};

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  return h * 60 + m;
}

function generateDateRangeDays(startDateStr: string, endDateStr: string): DailyAttendanceRecord[] {
  const days: DailyAttendanceRecord[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const pad = (n: number) => String(n).padStart(2, "0");

  const curr = new Date(start);
  let idx = 1;

  while (curr <= end) {
    // Hari Minggu libur (tidak perlu ditampilkan dalam presensi guru)
    if (curr.getDay() === 0) {
      curr.setDate(curr.getDate() + 1);
      continue;
    }

    const y = curr.getFullYear();
    const m = pad(curr.getMonth() + 1);
    const d = pad(curr.getDate());
    const dateIso = `${y}-${m}-${d}`;
    const hari = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(curr);

    days.push({
      tanggal: dateIso,
      tanggalNum: idx++,
      hari: hari,
      jadwalMasuk: "06:50",
      jadwalPulang: hari === "Jumat" ? "11:30" : "13:30",
      jamMasuk: "-",
      jamPulang: "-",
      terlambatMenit: 0,
      pulangAwalMenit: 0,
      status: "alpha",
      keterangan: "Tidak ada keterangan (Alpha)",
    });

    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

function createTeacherSummary(
  km: (typeof KNOWN_TEACHERS)[0],
  days: DailyAttendanceRecord[]
): TeacherAttendanceSummary {
  const totalHariKerja = days.filter((d) => d.hari !== "Minggu").length;
  return {
    id: km.id,
    pin: km.pin,
    nama: km.nama,
    jabatan: km.jabatan,
    totalHariKerja,
    totalHadir: 0,
    totalTerlambatHari: 0,
    totalMenitTerlambat: 0,
    persentaseTerlambat: 0,
    statusKkm: "KKM",
    totalIzin: 0,
    totalSakit: 0,
    totalAlpha: 0,
    totalLupaFinger: 0,
    totalTugasLuar: 0,
    skorKetaatan: 4.0,
    skorAcara: 4.0,
    nilaiKebiasaanKerja: 4.0,
    totalNilaiKinerja: 4.5,
    dailyDetails: JSON.parse(JSON.stringify(days)),
  };
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "SIGAP-SMK Realtime Fingerprint API Endpoint is active.",
    targetMachine: "192.168.1.201:4370",
    standardCheckInTime: "06:50 WIB",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic token validation
    if (body.secret && body.secret !== SECRET_TOKEN) {
      return NextResponse.json({ error: "Invalid secret token" }, { status: 401 });
    }

    const rawLogs = Array.isArray(body.logs)
      ? body.logs
      : body.userId && body.attTime
      ? [body]
      : [];

    if (rawLogs.length === 0) {
      return NextResponse.json({ error: "No attendance logs provided in payload" }, { status: 400 });
    }

    // 1. Fetch current presensi state from Supabase Cloud
    const { data: cloudRow, error: fetchErr } = await supabase
      .from("master_perspektif")
      .select("deskripsi")
      .eq("id", PRESENSI_CLOUD_ROW_ID)
      .maybeSingle();

    if (fetchErr) {
      console.error("[API Realtime Presensi] Supabase fetch error:", fetchErr);
      return NextResponse.json({ error: "Failed to connect to Supabase Cloud" }, { status: 500 });
    }

    let payloadData: { reports: PresensiPeriodReport[]; activeId?: string } = {
      reports: [],
      activeId: "",
    };

    if (cloudRow?.deskripsi) {
      try {
        payloadData = JSON.parse(cloudRow.deskripsi);
      } catch (parseErr) {
        console.warn("[API Realtime Presensi] Parse error:", parseErr);
      }
    }

    if (!payloadData.reports) {
      payloadData.reports = [];
    }

    // Determine requested date range
    let reqStartDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
    let reqEndDate = typeof body.endDate === "string" ? body.endDate.trim() : "";

    // If not supplied in body, scan rawLogs for min and max date
    if (!reqStartDate || !reqEndDate) {
      for (const log of rawLogs) {
        const rawTime = String(log.attTime || log.recordTime || "").trim();
        const dStr = rawTime.includes("T") ? rawTime.split("T")[0] : rawTime.split(" ")[0];
        if (dStr) {
          if (!reqStartDate || dStr < reqStartDate) reqStartDate = dStr;
          if (!reqEndDate || dStr > reqEndDate) reqEndDate = dStr;
        }
      }
    }

    // Target report: Should we create a separate dedicated period?
    const isCustomDateRange = Boolean(
      body.createSeparatePeriod ||
      body.separatePeriod ||
      (reqStartDate && reqEndDate && (reqStartDate !== reqEndDate || body.createSeparatePeriod !== false))
    );

    let currentReport: PresensiPeriodReport;
    let reportIndex = -1;

    if (isCustomDateRange && reqStartDate && reqEndDate) {
      // Find if an exact period for this date range already exists
      const targetId = `presensi-tarik-${reqStartDate}-${reqEndDate}`;
      reportIndex = payloadData.reports.findIndex(
        (r) =>
          r.id === targetId ||
          (r.cutOffStart === reqStartDate && r.cutOffEnd === reqEndDate) ||
          r.rentangTanggal === `${reqStartDate} s.d ${reqEndDate}`
      );

      if (reportIndex >= 0) {
        currentReport = payloadData.reports[reportIndex];
        const templateDays = generateDateRangeDays(reqStartDate, reqEndDate);
        currentReport.teachers.forEach((t) => {
          const map = new Map(t.dailyDetails.map((d) => [d.tanggal, d]));
          t.dailyDetails = templateDays.map((td) => {
            const existing = map.get(td.tanggal);
            return existing ? { ...existing, hari: td.hari, tanggalNum: td.tanggalNum } : { ...td };
          });
        });
      } else {
        // Create a new dedicated period for this date range!
        const startD = new Date(reqStartDate);
        const endD = new Date(reqEndDate);
        const startDay = String(startD.getDate()).padStart(2, "0");
        const endDay = String(endD.getDate()).padStart(2, "0");
        const startMonth = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(startD);
        const endMonth = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(endD);
        const year = endD.getFullYear() || 2026;

        let bulanLabel = `${startDay} - ${endDay} ${endMonth}`;
        if (startMonth !== endMonth) {
          bulanLabel = `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
        }
        if (reqStartDate === reqEndDate) {
          bulanLabel = `${startDay} ${endMonth}`;
        }

        const days = generateDateRangeDays(reqStartDate, reqEndDate);
        const totalEffective = days.filter((d) => d.hari !== "Minggu").length;

        currentReport = {
          id: targetId,
          judul: `Rekapitulasi Presensi Guru & Karyawan`,
          bulan: bulanLabel,
          tahun: year,
          rentangTanggal: `${reqStartDate} s.d ${reqEndDate}`,
          cutOffStart: reqStartDate,
          cutOffEnd: reqEndDate,
          totalHariEfektif: totalEffective,
          totalGuru: KNOWN_TEACHERS.length,
          guruTidakKkmCount: 0,
          rataRataKehadiran: 100,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "Mesin Fingerprint (Tarik Mandiri)",
          teachers: KNOWN_TEACHERS.map((km) => createTeacherSummary(km, days)),
        };

        // Insert at the front so it appears as the newest period
        payloadData.reports.unshift(currentReport);
        reportIndex = 0;
      }

      // Automatically set this newly created/selected period as the active one
      payloadData.activeId = currentReport.id;
    } else {
      // Normal fallback to active report
      const activeReportIndex = payloadData.reports.findIndex(
        (r) => r.id === payloadData.activeId
      );
      reportIndex = activeReportIndex >= 0 ? activeReportIndex : 0;
      currentReport = payloadData.reports[reportIndex];
    }

    if (!currentReport) {
      return NextResponse.json(
        { error: "Gagal menginisialisasi periode presensi target." },
        { status: 500 }
      );
    }

    const results: Array<{
      userId: string;
      teacherName: string;
      date: string;
      time: string;
      type: "checkIn" | "checkOut";
      status: StatusKehadiran;
      keterlambatan: number;
    }> = [];

    // 2. Process each log record
    for (const log of rawLogs) {
      const rawUserId = String(log.userId || log.deviceUserId || "").trim();
      const rawAttTime = String(log.attTime || log.recordTime || "").trim();

      if (!rawUserId || !rawAttTime) continue;

      let dateStr = "";
      let timeStr = "";

      if (rawAttTime.includes("T")) {
        const d = new Date(rawAttTime);
        const pad = (n: number) => String(n).padStart(2, "0");
        dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else {
        const parts = rawAttTime.split(" ");
        dateStr = parts[0] || "";
        timeStr = (parts[1] || "").substring(0, 5); // HH:mm
      }

      if (!dateStr || !timeStr) continue;

      // Find teacher in currentReport:
      const mappedPin =
        MACHINE_PIN_MAPPING[rawUserId] ||
        MACHINE_PIN_MAPPING[rawUserId.toLowerCase()];

      let teacher = mappedPin
        ? currentReport.teachers.find((t) => String(t.pin).trim() === mappedPin)
        : null;

      if (!teacher) {
        teacher = currentReport.teachers.find(
          (t) =>
            String(t.pin).trim() === rawUserId ||
            t.id.toLowerCase() === rawUserId.toLowerCase()
        );
      }

      if (!teacher) {
        const knownMaster = KNOWN_TEACHERS.find(
          (km) =>
            km.pin === rawUserId ||
            km.aliases.includes(rawUserId.toLowerCase()) ||
            km.aliases.includes(rawUserId)
        );

        if (knownMaster) {
          teacher = currentReport.teachers.find(
            (t) =>
              t.pin === knownMaster.pin ||
              t.nama.toLowerCase().includes(knownMaster.nama.toLowerCase().split(" ")[0])
          );
        }
      }

      if (!teacher) {
        // Not an SMK teacher, safely ignore
        continue;
      }

      const punchMinutes = timeToMinutes(timeStr);
      const isMorning = punchMinutes < 11 * 60 + 30; // before 11:30

      // Match either ISO date (2026-11-16) or slash date (16/11/2026)
      const dayDate = new Date(dateStr);
      if (dayDate.getDay() === 0) {
        // Hari Minggu libur guru, abaikan log scan
        continue;
      }
      const pad = (n: number) => String(n).padStart(2, "0");
      const slashDate = isNaN(dayDate.getTime())
        ? ""
        : `${pad(dayDate.getDate())}/${pad(dayDate.getMonth() + 1)}/${dayDate.getFullYear()}`;

      let daily = teacher.dailyDetails.find(
        (d) => d.tanggal === dateStr || (slashDate && d.tanggal === slashDate)
      );

      const tanggalNum = isNaN(dayDate.getDate()) ? 1 : dayDate.getDate();

      if (!daily) {
        daily = {
          tanggal: dateStr,
          tanggalNum,
          hari: isNaN(dayDate.getTime()) ? "Hari" : new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(dayDate),
          jadwalMasuk: "06:50",
          jadwalPulang: "13:30",
          jamMasuk: "-",
          jamPulang: "-",
          terlambatMenit: 0,
          pulangAwalMenit: 0,
          status: "alpha",
          keterangan: "-",
        };
        teacher.dailyDetails.push(daily);
      }

      let logType: "checkIn" | "checkOut" = "checkIn";
      let statusResult: StatusKehadiran = daily.status;
      let lateMinutes = daily.terlambatMenit;

      if (isMorning) {
        logType = "checkIn";
        if (daily.jamMasuk === "-" || timeToMinutes(timeStr) < timeToMinutes(daily.jamMasuk)) {
          daily.jamMasuk = timeStr;
          lateMinutes = Math.max(0, punchMinutes - JAM_MASUK_STANDAR_MENIT);
          daily.terlambatMenit = lateMinutes;
          statusResult = lateMinutes > 0 ? "terlambat" : "hadir";
          daily.status = statusResult;
          daily.keterangan = lateMinutes > 0 ? `Terlambat ${lateMinutes} menit` : "Tepat waktu";
        }
      } else {
        logType = "checkOut";
        if (daily.jamPulang === "-" || timeToMinutes(timeStr) > timeToMinutes(daily.jamPulang)) {
          daily.jamPulang = timeStr;
          if (daily.status === "alpha" && daily.jamMasuk !== "-") {
            daily.status = daily.terlambatMenit > 0 ? "terlambat" : "hadir";
          }
        }
      }

      // Recalculate teacher summary totals
      const hadirCount = teacher.dailyDetails.filter(
        (d) => d.status === "hadir" || d.status === "terlambat"
      ).length;
      const telatCount = teacher.dailyDetails.filter(
        (d) => d.status === "terlambat"
      ).length;
      const totalLateMins = teacher.dailyDetails.reduce(
        (sum, d) => sum + (d.terlambatMenit || 0),
        0
      );

      teacher.totalHadir = hadirCount;
      teacher.totalTerlambatHari = telatCount;
      teacher.totalMenitTerlambat = totalLateMins;
      teacher.persentaseTerlambat =
        hadirCount > 0 ? Number(((telatCount / hadirCount) * 100).toFixed(1)) : 0;
      teacher.statusKkm = teacher.persentaseTerlambat >= 50.0 ? "TIDAK KKM" : "KKM";

      results.push({
        userId: rawUserId,
        teacherName: teacher.nama,
        date: dateStr,
        time: timeStr,
        type: logType,
        status: daily.status,
        keterlambatan: lateMinutes,
      });
    }

    // 3. Recalculate overall period report statistics
    currentReport.guruTidakKkmCount = currentReport.teachers.filter(
      (t) => t.statusKkm === "TIDAK KKM"
    ).length;
    const totalSemuaHadir = currentReport.teachers.reduce(
      (sum, t) => sum + t.totalHadir,
      0
    );
    const totalPossibleAttendance = currentReport.teachers.length * currentReport.totalHariEfektif;
    currentReport.rataRataKehadiran = totalPossibleAttendance > 0
      ? Number(((totalSemuaHadir / totalPossibleAttendance) * 100).toFixed(1))
      : 100;

    payloadData.reports[reportIndex] = currentReport;

    // Clean up older reports if we just created a separate period:
    // Remove accidentally merged November dates from older reports
    if (isCustomDateRange) {
      payloadData.reports.forEach((rep) => {
        if (rep.id !== currentReport.id && rep.cutOffEnd < reqStartDate) {
          rep.teachers.forEach((t) => {
            t.dailyDetails = t.dailyDetails.filter((d) => {
              const dIso = d.tanggal.includes("/")
                ? d.tanggal.split("/").reverse().join("-")
                : d.tanggal;
              return dIso < reqStartDate;
            });
            // Recount totals for the old report
            const hCount = t.dailyDetails.filter((d) => d.status === "hadir" || d.status === "terlambat").length;
            const tCount = t.dailyDetails.filter((d) => d.status === "terlambat").length;
            const tLate = t.dailyDetails.reduce((sum, d) => sum + (d.terlambatMenit || 0), 0);
            t.totalHadir = hCount;
            t.totalTerlambatHari = tCount;
            t.totalMenitTerlambat = tLate;
            t.persentaseTerlambat = hCount > 0 ? Number(((tCount / hCount) * 100).toFixed(1)) : 0;
            t.statusKkm = t.persentaseTerlambat >= 50.0 ? "TIDAK KKM" : "KKM";
          });
          rep.guruTidakKkmCount = rep.teachers.filter((t) => t.statusKkm === "TIDAK KKM").length;
        }
      });
    }

    // 4. Save updated reports back to Supabase Cloud
    const { error: updateErr } = await supabase.from("master_perspektif").upsert({
      id: PRESENSI_CLOUD_ROW_ID,
      kode: "PRESENSI_SYNC",
      nama: "Cloud Sync Presensi Guru SMK",
      deskripsi: JSON.stringify({
        ...payloadData,
        updatedAt: new Date().toISOString(),
      }),
      is_active: false,
    });

    if (updateErr) {
      console.error("[API Realtime Presensi] Supabase save error:", updateErr);
      return NextResponse.json({ error: "Failed to persist to Supabase", details: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat/memperbarui periode presensi: ${currentReport.bulan} ${currentReport.tahun}`,
      processedCount: results.length,
      results,
      activePeriodId: currentReport.id,
      activePeriod: `${currentReport.bulan} ${currentReport.tahun}`,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API Realtime Presensi] Internal error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
