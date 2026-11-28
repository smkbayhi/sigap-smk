import { EvaluasiSebatik } from "./database.types";
import { SEED_EVALUASI_SEBATIK } from "./sebatikConstants";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const SEBATIK_CLOUD_ROW_ID = "sebatik-evaluasi-cloud-data";
export const SEBATIK_CLOUD_KODE = "SEBATIK_SYNC";

const LOCAL_STORAGE_KEY = "sigap_evaluasi_sebatik_list";

// Daftar ID data demo/uji coba bawaan yang harus diabaikan/dibersihkan
const DUMMY_SEED_IDS = new Set([
  "seb-1",
  "seb-2",
  "seb-3",
  "seb-4",
  "seb-5",
  "seb-6",
  "seb-7",
  "seb-8",
  "seb-9",
]);

/**
 * Mendapatkan semua data respon evaluasi Kombel SEBATIK.
 * Mengambil respon riil dari guru yang tersinkronisasi lintas perangkat melalui Supabase Cloud
 * dan tersimpan di cache lokal peramban (localStorage).
 */
export async function getEvaluasiSebatikList(): Promise<EvaluasiSebatik[]> {
  let localData: EvaluasiSebatik[] = [];

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: EvaluasiSebatik[] = JSON.parse(stored);
        localData = parsed.filter((item) => !DUMMY_SEED_IDS.has(item.id));
      }
    } catch (e) {
      console.warn("Failed to read SEBATIK from localStorage:", e);
      localData = [];
    }
  }

  // 1. Ambil data dari Supabase Cloud (master_perspektif channel yang handal dan stabil)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudRow, error: cloudErr } = await supabase
        .from("master_perspektif")
        .select("deskripsi")
        .eq("id", SEBATIK_CLOUD_ROW_ID)
        .maybeSingle();

      if (!cloudErr) {
        let cloudList: EvaluasiSebatik[] = [];
        if (cloudRow?.deskripsi) {
          try {
            const parsedCloud = JSON.parse(cloudRow.deskripsi);
            if (Array.isArray(parsedCloud?.list)) {
              cloudList = parsedCloud.list.filter((item: EvaluasiSebatik) => !DUMMY_SEED_IDS.has(item.id));
            }
          } catch (parseErr) {
            console.warn("Failed parsing SEBATIK cloud JSON:", parseErr);
          }
        }

        if (cloudList.length > 0 || localData.length > 0) {
          // Gabungkan respon Cloud & Lokal berdasarkan kemiripan nama / user_id
          const mergedMap = new Map<string, EvaluasiSebatik>();

          // Masukkan data cloud terlebih dahulu
          cloudList.forEach((c) => {
            const key = c.user_id || (c.nama_guru || "").toLowerCase().trim();
            if (key) mergedMap.set(key, c);
          });

          let hasNewLocalToUpload = false;

          // Masukkan data lokal jika ada yang belum terunggah ke cloud (misal hasil submit sebelum sinkronisasi aktif)
          localData.forEach((l) => {
            const key = l.user_id || (l.nama_guru || "").toLowerCase().trim();
            if (key && !mergedMap.has(key)) {
              mergedMap.set(key, l);
              hasNewLocalToUpload = true;
            }
          });

          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedList));
          }

          // OTOMATIS UNGGAH KE CLOUD: Jika di HP guru tersimpan respon yang belum masuk ke database Supabase
          if (hasNewLocalToUpload) {
            try {
              await supabase.from("master_perspektif").upsert({
                id: SEBATIK_CLOUD_ROW_ID,
                kode: SEBATIK_CLOUD_KODE,
                nama: "Cloud Sync Evaluasi Kombel SEBATIK Guru",
                deskripsi: JSON.stringify({ list: mergedList, updated_at: new Date().toISOString() }),
                is_active: false,
              });
            } catch (upErr) {
              console.warn("Auto-upload local SEBATIK submission to cloud failed:", upErr);
            }
          }

          return mergedList;
        }
      }
    } catch (err) {
      console.warn("Supabase master_perspektif SEBATIK fetch failed, using local:", err);
    }

    // 2. Fallback tabel mandiri jika ada
    try {
      const { data, error } = await supabase
        .from("evaluasi_sebatik_guru")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mappedFromDb: EvaluasiSebatik[] = data
          .filter((row: any) => !DUMMY_SEED_IDS.has(row.id))
          .map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            nama_guru: row.nama_guru,
            mata_pelajaran: row.mata_pelajaran,
            sesi_diikuti: Array.isArray(row.sesi_diikuti) ? row.sesi_diikuti : [],
            jawaban_soal_1: row.jawaban_soal_1 || "",
            jawaban_soal_2: row.jawaban_soal_2 || "",
            jawaban_soal_3: row.jawaban_soal_3 || "",
            jawaban_soal_4: row.jawaban_soal_4 || "",
            jawaban_soal_5: row.jawaban_soal_5 || "",
            jawaban_soal_6: row.jawaban_soal_6 || "",
            skor_bagian_a: Number(row.skor_bagian_a) || 0,
            jawaban_soal_7: row.jawaban_soal_7 || "",
            is_waktu_tuntas: Boolean(row.is_waktu_tuntas),
            jawaban_soal_8: row.jawaban_soal_8 || "",
            jawaban_soal_9: Array.isArray(row.jawaban_soal_9) ? row.jawaban_soal_9 : [],
            jawaban_soal_10: row.jawaban_soal_10 || "",
            jawaban_soal_11: row.jawaban_soal_11 || "",
            created_at: row.created_at || new Date().toISOString(),
          }));

        if (mappedFromDb.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mappedFromDb));
          }
          return mappedFromDb;
        }
      }
    } catch {
      // ignore
    }
  }

  return localData;
}

/**
 * Mereset seluruh data respon evaluasi ke nol (membersihkan data uji coba).
 */
export async function resetEvaluasiSebatik(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("master_perspektif").upsert({
        id: SEBATIK_CLOUD_ROW_ID,
        kode: SEBATIK_CLOUD_KODE,
        nama: "Cloud Sync Evaluasi Kombel SEBATIK Guru",
        deskripsi: JSON.stringify({ list: [], updated_at: new Date().toISOString() }),
        is_active: false,
      });
      await supabase.from("evaluasi_sebatik_guru").delete().neq("id", "none");
    } catch (err) {
      console.warn("Failed to reset SEBATIK cloud data:", err);
    }
  }
}

/**
 * Menyimpan respon baru dari guru ke localStorage dan menyinkronkan langsung ke Supabase Cloud.
 */
export async function saveEvaluasiSebatik(evaluasi: EvaluasiSebatik): Promise<EvaluasiSebatik> {
  let existingList: EvaluasiSebatik[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      existingList = stored ? JSON.parse(stored) : [];
      existingList = existingList.filter((item) => !DUMMY_SEED_IDS.has(item.id));
    } catch {
      existingList = [];
    }

    // Jika guru yang sama sudah pernah mengisi, perbarui data sebelumnya
    const index = existingList.findIndex(
      (e) =>
        (e.user_id && evaluasi.user_id && e.user_id === evaluasi.user_id) ||
        e.nama_guru.toLowerCase().trim() === evaluasi.nama_guru.toLowerCase().trim()
    );

    if (index >= 0) {
      existingList[index] = evaluasi;
    } else {
      existingList.unshift(evaluasi);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingList));
  }

  // Sinkronisasi ke Supabase Cloud (master_perspektif channel)
  if (isSupabaseConfigured && supabase) {
    try {
      // Ambil list cloud saat ini agar respon guru lain dari HP berbeda tidak tertimpa
      let cloudList: EvaluasiSebatik[] = [];
      const { data: cloudRow } = await supabase
        .from("master_perspektif")
        .select("deskripsi")
        .eq("id", SEBATIK_CLOUD_ROW_ID)
        .maybeSingle();

      if (cloudRow?.deskripsi) {
        try {
          const parsed = JSON.parse(cloudRow.deskripsi);
          if (Array.isArray(parsed?.list)) {
            cloudList = parsed.list.filter((item: EvaluasiSebatik) => !DUMMY_SEED_IDS.has(item.id));
          }
        } catch {
          // ignore
        }
      }

      // Gabungkan data baru ke cloud list
      const idx = cloudList.findIndex(
        (c) =>
          (c.user_id && evaluasi.user_id && c.user_id === evaluasi.user_id) ||
          c.nama_guru.toLowerCase().trim() === evaluasi.nama_guru.toLowerCase().trim()
      );

      if (idx >= 0) {
        cloudList[idx] = evaluasi;
      } else {
        cloudList.unshift(evaluasi);
      }

      await supabase.from("master_perspektif").upsert({
        id: SEBATIK_CLOUD_ROW_ID,
        kode: SEBATIK_CLOUD_KODE,
        nama: "Cloud Sync Evaluasi Kombel SEBATIK Guru",
        deskripsi: JSON.stringify({ list: cloudList, updated_at: new Date().toISOString() }),
        is_active: false,
      });
    } catch (err) {
      console.warn("Failed to sync SEBATIK evaluation to master_perspektif:", err);
    }

    // Coba juga upsert ke tabel evaluasi_sebatik_guru jika ada
    try {
      await supabase.from("evaluasi_sebatik_guru").upsert({
        id: evaluasi.id,
        user_id: evaluasi.user_id || null,
        nama_guru: evaluasi.nama_guru,
        mata_pelajaran: evaluasi.mata_pelajaran,
        sesi_diikuti: evaluasi.sesi_diikuti,
        jawaban_soal_1: evaluasi.jawaban_soal_1,
        jawaban_soal_2: evaluasi.jawaban_soal_2,
        jawaban_soal_3: evaluasi.jawaban_soal_3,
        jawaban_soal_4: evaluasi.jawaban_soal_4,
        jawaban_soal_5: evaluasi.jawaban_soal_5,
        jawaban_soal_6: evaluasi.jawaban_soal_6,
        skor_bagian_a: evaluasi.skor_bagian_a,
        jawaban_soal_7: evaluasi.jawaban_soal_7,
        is_waktu_tuntas: evaluasi.is_waktu_tuntas,
        jawaban_soal_8: evaluasi.jawaban_soal_8,
        jawaban_soal_9: evaluasi.jawaban_soal_9,
        jawaban_soal_10: evaluasi.jawaban_soal_10,
        jawaban_soal_11: evaluasi.jawaban_soal_11,
        created_at: evaluasi.created_at,
      });
    } catch {
      // ignore
    }
  }

  return evaluasi;
}

/**
 * Menghitung ringkasan statistik dan metrik analitik Kombel SEBATIK.
 */
export function calculateSebatikMetrics(list: EvaluasiSebatik[]) {
  const totalRespon = list.length;
  if (totalRespon === 0) {
    return {
      totalRespon: 0,
      rataRataSkorA: 0,
      persenWaktuTuntas: 0,
      distribusiSkor: { skor100: 0, skor75: 0, skor50kebawah: 0 },
      distribusiWaktu: { tuntas: 0, sebagian: 0, seringMolor: 0, kesulitan: 0 },
      faktorOvertime: { pengantarPanjang: 0, praktikLambat: 0, tanpaTimer: 0, kendalaTeknis: 0, tepatWaktu: 0 },
    };
  }

  const totalSkor = list.reduce((sum, item) => sum + (item.skor_bagian_a || 0), 0);
  const rataRataSkorA = Math.round((totalSkor / totalRespon) * 10) / 10;

  const totalTuntas = list.filter((item) => item.is_waktu_tuntas).length;
  const persenWaktuTuntas = Math.round((totalTuntas / totalRespon) * 100);

  // Distribusi Skor Pemahaman (Bagian A)
  const skor100 = list.filter((i) => i.skor_bagian_a === 100).length;
  const skor75 = list.filter((i) => i.skor_bagian_a === 75).length;
  const skor50kebawah = list.filter((i) => i.skor_bagian_a <= 50).length;

  // Distribusi Keterlaksanaan Waktu (Soal 7)
  const tuntas = list.filter((i) => i.jawaban_soal_7 === "A").length;
  const sebagian = list.filter((i) => i.jawaban_soal_7 === "B").length;
  const seringMolor = list.filter((i) => i.jawaban_soal_7 === "C").length;
  const kesulitan = list.filter((i) => i.jawaban_soal_7 === "D").length;

  // Faktor Overtime (Soal 8)
  const pengantarPanjang = list.filter((i) => i.jawaban_soal_8 === "A").length;
  const praktikLambat = list.filter((i) => i.jawaban_soal_8 === "B").length;
  const tanpaTimer = list.filter((i) => i.jawaban_soal_8 === "C").length;
  const kendalaTeknis = list.filter((i) => i.jawaban_soal_8 === "D").length;
  const tepatWaktu = list.filter((i) => i.jawaban_soal_8 === "E").length;

  return {
    totalRespon,
    rataRataSkorA,
    persenWaktuTuntas,
    distribusiSkor: { skor100, skor75, skor50kebawah },
    distribusiWaktu: { tuntas, sebagian, seringMolor, kesulitan },
    faktorOvertime: { pengantarPanjang, praktikLambat, tanpaTimer, kendalaTeknis, tepatWaktu },
  };
}

/**
 * Menghasilkan file CSV dari seluruh respon evaluasi untuk diekspor ke Excel / Spreadsheet.
 */
export function exportSebatikToCsv(list: EvaluasiSebatik[]): void {
  const headers = [
    "No",
    "Tanggal Pengisian",
    "Nama Lengkap & Gelar",
    "Mata Pelajaran",
    "Sesi Praktik Baik Diikuti",
    "Soal 1 (Jawaban)",
    "Soal 2 (Jawaban)",
    "Soal 3 (Jawaban)",
    "Soal 4 (Jawaban)",
    "Skor Bagian A (0-100)",
    "Soal 5 (Contoh Pemantik & Asesmen)",
    "Soal 6 (Strategi Exit Ticket 5-7 Mnt)",
    "Soal 7 (Keterlaksanaan Waktu)",
    "Status Ketuntasan Waktu",
    "Soal 8 (Faktor Overtime)",
    "Soal 9 (Strategi Pengendalian Waktu)",
    "Soal 10 (Perubahan Nyata/Trik Efektif)",
    "Soal 11 (Komitmen Perbaikan)",
  ];

  const rows = list.map((item, idx) => {
    const sesiStr = (item.sesi_diikuti || []).join(" | ");
    const strategiStr = (item.jawaban_soal_9 || []).join(" | ");
    return [
      idx + 1,
      new Date(item.created_at).toLocaleDateString("id-ID"),
      `"${(item.nama_guru || "").replace(/"/g, '""')}"`,
      `"${(item.mata_pelajaran || "").replace(/"/g, '""')}"`,
      `"${sesiStr.replace(/"/g, '""')}"`,
      item.jawaban_soal_1,
      item.jawaban_soal_2,
      item.jawaban_soal_3,
      item.jawaban_soal_4,
      item.skor_bagian_a,
      `"${(item.jawaban_soal_5 || "").replace(/"/g, '""')}"`,
      `"${(item.jawaban_soal_6 || "").replace(/"/g, '""')}"`,
      `"${(item.jawaban_soal_7 || "").replace(/"/g, '""')}"`,
      item.is_waktu_tuntas ? "Tuntas" : "Belum Tuntas",
      `"${(item.jawaban_soal_8 || "").replace(/"/g, '""')}"`,
      `"${strategiStr.replace(/"/g, '""')}"`,
      `"${(item.jawaban_soal_10 || "").replace(/"/g, '""')}"`,
      `"${(item.jawaban_soal_11 || "").replace(/"/g, '""')}"`,
    ];
  });

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `Evaluasi_Kombel_SEBATIK_SMK_Bayt_Al_Hikmah_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
