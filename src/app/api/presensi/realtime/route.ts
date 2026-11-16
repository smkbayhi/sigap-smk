import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KNOWN_TEACHERS } from "@/lib/presensiParser";
import { PresensiPeriodReport, TeacherAttendanceSummary, DailyAttendanceRecord, StatusKehadiran } from "@/lib/presensi.types";

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
export const MACHINE_PIN_MAPPING: Record<string, string> = {
  // Sesuai data mesin absensi resmi SMK Bayt Al-Hikmah:
  "11556022": "11556022", // Nurfaizah
  "nurfaizah": "11556022",
  "11861027": "11861027", // Ainiyatulfit...
  "ainiyatulfit": "11861027",
  "ainiyatulfitriyah": "11861027",
  "12616042": "12616042", // Lulukms
  "lulukms": "12616042",
  "13559090": "13559090", // Yudha
  "yudha": "13559090",
  "142908": "14215094",   // Ekhsan (Kepala Sekolah)
  "ekhsan": "14215094",
  "14215094": "14215094",
  "16402178": "16402178", // Nurafandi
  "nurafandi": "16402178",
  "18076236": "18076236", // Khoiron
  "khoiron": "18076236",
  "2563": "19070265",     // Achmadjab...
  "achmadjab": "19070265",
  "achmadjabbar": "19070265",
  "19070265": "19070265",
  "3": "23060333",        // mohnasih
  "mohnasih": "23060333",
  "23060333": "23060333",
  "5399": "22060315",     // Fajar
  "fajar": "22060315",
  "22060315": "22060315",
  "4432": "4432",         // Ishanani
  "ishanani": "4432",
};

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  return h * 60 + m;
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "SIGAP-SMK Realtime Fingerprint API Endpoint is active.",
    targetMachine: "192.168.1.202:4370",
    standardCheckInTime: "06:50 WIB",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic token validation (optional safety)
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

    if (!payloadData.reports || payloadData.reports.length === 0) {
      return NextResponse.json(
        { error: "No active presensi report found in Supabase. Please generate/upload period first." },
        { status: 404 }
      );
    }

    const activeReportIndex = payloadData.reports.findIndex(
      (r) => r.id === payloadData.activeId
    );
    const reportIndex = activeReportIndex >= 0 ? activeReportIndex : 0;
    const currentReport = payloadData.reports[reportIndex];

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

      // Parse Date & Time: format can be "YYYY-MM-DD HH:mm:ss" or ISO string
      let dateStr = "";
      let timeStr = "";

      if (rawAttTime.includes("T")) {
        const d = new Date(rawAttTime);
        dateStr = d.toISOString().split("T")[0];
        timeStr = d.toTimeString().substring(0, 5); // HH:mm
      } else {
        const parts = rawAttTime.split(" ");
        dateStr = parts[0] || "";
        timeStr = (parts[1] || "").substring(0, 5); // HH:mm
      }

      if (!dateStr || !timeStr) continue;

      // Find teacher in currentReport:
      // Priority 1: Check MACHINE_PIN_MAPPING (accurate mapping from official machine)
      const mappedPin =
        MACHINE_PIN_MAPPING[rawUserId] ||
        MACHINE_PIN_MAPPING[rawUserId.toLowerCase()];

      let teacher = mappedPin
        ? currentReport.teachers.find((t) => String(t.pin).trim() === mappedPin)
        : null;

      // Priority 2: Direct match by PIN or User ID
      if (!teacher) {
        teacher = currentReport.teachers.find(
          (t) =>
            String(t.pin).trim() === rawUserId ||
            t.id.toLowerCase() === rawUserId.toLowerCase()
        );
      }

      // Priority 3: Check KNOWN_TEACHERS aliases
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

      // If still not matched, log warning
      if (!teacher) {
        console.warn(`[API Realtime Presensi] Unknown machine User ID: "${rawUserId}" at ${rawAttTime}`);
        continue;
      }

      // Determine Check-in vs Check-out
      // Morning punch (< 11:30 WIB) -> Check-In
      // Afternoon punch (>= 11:30 WIB) -> Check-Out
      const punchMinutes = timeToMinutes(timeStr);
      const isMorning = punchMinutes < 11 * 60 + 30; // before 11:30

      // Find or create daily detail for this date
      let daily = teacher.dailyDetails.find((d) => d.tanggal === dateStr);
      if (!daily) {
        daily = {
          tanggal: dateStr,
          hari: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date(dateStr)),
          checkIn: "-",
          checkOut: "-",
          menitKeterlambatan: 0,
          status: "alpha",
          keterangan: "-",
        };
        teacher.dailyDetails.push(daily);
      }

      let logType: "checkIn" | "checkOut" = "checkIn";
      let statusResult: StatusKehadiran = daily.status;
      let lateMinutes = daily.menitKeterlambatan;

      if (isMorning) {
        logType = "checkIn";
        // If checkIn was "-" or new punch is earlier, update checkIn
        if (daily.checkIn === "-" || timeToMinutes(timeStr) < timeToMinutes(daily.checkIn)) {
          daily.checkIn = timeStr;
          lateMinutes = Math.max(0, punchMinutes - JAM_MASUK_STANDAR_MENIT);
          daily.menitKeterlambatan = lateMinutes;
          statusResult = lateMinutes > 0 ? "terlambat" : "hadir";
          daily.status = statusResult;
          daily.keterangan = lateMinutes > 0 ? `Terlambat ${lateMinutes} menit` : "Tepat waktu";
        }
      } else {
        logType = "checkOut";
        // Afternoon punch: check-out
        if (daily.checkOut === "-" || timeToMinutes(timeStr) > timeToMinutes(daily.checkOut)) {
          daily.checkOut = timeStr;
          if (daily.status === "alpha" && daily.checkIn !== "-") {
            daily.status = daily.menitKeterlambatan > 0 ? "terlambat" : "hadir";
          }
        }
      }

      // Recalculate teacher summary totals
      const validDaily = teacher.dailyDetails.filter((d) => d.checkIn !== "-" || d.status !== "alpha");
      const hadirCount = teacher.dailyDetails.filter((d) => d.status === "hadir" || d.status === "terlambat").length;
      const telatCount = teacher.dailyDetails.filter((d) => d.status === "terlambat").length;
      const totalLateMins = teacher.dailyDetails.reduce((sum, d) => sum + (d.menitKeterlambatan || 0), 0);

      teacher.totalHadir = hadirCount;
      teacher.totalTerlambatHari = telatCount;
      teacher.totalMenitTerlambat = totalLateMins;
      teacher.persentaseTerlambat = hadirCount > 0 ? Number(((telatCount / hadirCount) * 100).toFixed(1)) : 0;
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
    currentReport.totalHadir = currentReport.teachers.reduce((sum, t) => sum + t.totalHadir, 0);
    currentReport.guruTidakKkmCount = currentReport.teachers.filter((t) => t.statusKkm === "TIDAK KKM").length;

    payloadData.reports[reportIndex] = currentReport;

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
      message: `Successfully processed ${results.length} punch log(s)`,
      processedCount: results.length,
      results,
      activePeriod: currentReport.namaPeriode || currentReport.bulan,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API Realtime Presensi] Internal error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
