import { supabase, isSupabaseConfigured } from "./supabaseClient";
import {
  SuratKeluar,
  SuratMasuk,
  Disposisi,
  MasterPerspektif,
  RKT,
  ActionPlan,
  ActionReport,
} from "./database.types";

// ====================================================================
// MAPPER UTILITIES: Frontend Types <-> Supabase DB Columns
// ====================================================================

const VALID_JENIS_SURAT = [
  "surat_tugas",
  "surat_undangan",
  "surat_keterangan",
  "surat_edaran",
  "surat_rekomendasi",
  "surat_pengantar",
];

export function mapSuratKeluarToDb(item: SuratKeluar) {
  const safeJenis = VALID_JENIS_SURAT.includes(item.jenis_surat)
    ? item.jenis_surat
    : "surat_pengantar";

  return {
    id: item.id,
    no_urut: item.no_urut,
    nomor_surat: item.nomor_surat,
    jenis_surat: safeJenis,
    bulan_romawi: item.bulan_romawi,
    tahun: item.tahun,
    tanggal_surat: item.tanggal_surat,
    perihal: item.perihal,
    lampiran: item.lampiran || "-",
    tujuan: item.tujuan,
    isi_surat: item.isi_surat,
    status: item.status,
    created_by: item.created_by === "user-kepsek" ? "user-kepsek" : null,
    approved_by: item.approved_by === "user-kepsek" ? "user-kepsek" : null,
    approved_at: item.approved_at || null,
    catatan_revisi: item.catatan_revisi || null,
    has_ttd: Boolean(item.has_ttd),
    has_stempel: Boolean(item.has_stempel),
    ttd_image_url: item.ttd_image_url || null,
    stempel_image_url: item.stempel_image_url || null,
    created_at: item.created_at || new Date().toISOString(),
  };
}

export function mapDbToSuratKeluar(row: any): SuratKeluar {
  return {
    id: row.id,
    no_urut: row.no_urut,
    nomor_surat: row.nomor_surat,
    jenis_surat: row.jenis_surat,
    bulan_romawi: row.bulan_romawi,
    tahun: row.tahun,
    tanggal_surat: row.tanggal_surat,
    perihal: row.perihal,
    lampiran: row.lampiran,
    tujuan: row.tujuan || row.tujuan_surat || "",
    isi_surat: row.isi_surat,
    status: row.status,
    created_by: row.created_by || "user-tu-1",
    creator_name: row.creator_name || "Staf Tata Usaha",
    approved_by: row.approved_by || (row.status === "disetujui" ? "user-kepsek" : undefined),
    approver_name: row.approver_name || (row.status === "disetujui" ? "Mokhamat Ekhsan, S.Kom" : undefined),
    approved_at: row.approved_at,
    catatan_revisi: row.catatan_revisi,
    has_ttd: Boolean(row.has_ttd),
    has_stempel: Boolean(row.has_stempel),
    ttd_image_url: row.ttd_image_url,
    stempel_image_url: row.stempel_image_url,
    created_at: row.created_at,
  };
}

export function mapSuratMasukToDb(item: SuratMasuk) {
  return {
    id: item.id,
    nomor_surat: item.nomor_surat,
    tanggal_surat: item.tanggal_surat,
    tanggal_diterima: item.tanggal_diterima,
    pengirim: item.pengirim,
    perihal: item.perihal,
    ringkasan: item.ringkasan,
    file_url: item.file_url,
    file_name: item.file_name,
    file_size: item.file_size || null,
    tingkat_urgensi: item.tingkat_urgensi || "biasa",
    ai_analysis: item.ai_analysis || null,
    status_disposisi: item.status_disposisi || "belum_disposisi",
    created_at: item.created_at || new Date().toISOString(),
  };
}

export function mapDbToSuratMasuk(row: any): SuratMasuk {
  return {
    id: row.id,
    nomor_surat: row.nomor_surat,
    tanggal_surat: row.tanggal_surat,
    tanggal_diterima: row.tanggal_diterima || row.tanggal_terima,
    pengirim: row.pengirim,
    perihal: row.perihal,
    ringkasan: row.ringkasan || row.ringkasan_ai || "",
    file_url: row.file_url || "",
    file_name: row.file_name || "",
    file_size: row.file_size || "",
    tingkat_urgensi: row.tingkat_urgensi || row.urgensi || "biasa",
    ai_analysis: row.ai_analysis || row.saran_disposisi_ai,
    status_disposisi: row.status_disposisi || "belum_disposisi",
    created_at: row.created_at,
  };
}

export function mapDisposisiToDb(item: Disposisi) {
  return {
    id: item.id,
    surat_masuk_id: item.surat_masuk_id,
    pemberi_disposisi_id: item.pemberi_disposisi_id === "user-kepsek" ? "user-kepsek" : null,
    penerima_id: item.penerima_id === "user-kepsek" ? "user-kepsek" : null,
    sifat: item.sifat || "biasa",
    instruksi: item.instruksi,
    catatan: item.catatan || null,
    deadline: item.deadline,
    status: item.status,
    tanggapan: item.tanggapan || null,
    tanggal_selesai: item.tanggal_selesai || null,
    created_at: item.created_at || new Date().toISOString(),
  };
}

export function mapDbToDisposisi(row: any): Disposisi {
  return {
    id: row.id,
    surat_masuk_id: row.surat_masuk_id,
    pemberi_disposisi_id: row.pemberi_id || row.pemberi_disposisi_id || "",
    pemberi_nama: row.pemberi_nama || "",
    penerima_id: row.penerima_id,
    penerima_nama: row.penerima_nama,
    penerima_role: row.penerima_role || "guru",
    penerima_bidang: row.penerima_bidang,
    sifat: row.sifat || "biasa",
    instruksi: row.instruksi,
    catatan: row.catatan,
    deadline: row.deadline,
    status: row.status || "menunggu",
    tanggapan: row.tanggapan,
    tanggal_selesai: row.tanggal_selesai,
    whatsapp_sent: Boolean(row.whatsapp_sent),
    created_at: row.created_at,
  };
}

export function mapRktToDb(item: RKT) {
  return {
    id: item.id,
    tahun_anggaran: parseInt(item.tahun_anggaran) || new Date().getFullYear(),
    bidang: item.bidang,
    user_id: item.user_id,
    pic: item.pic,
    perspektif_id: item.perspektif_id || null,
    nama_kegiatan: item.nama_kegiatan,
    waktu_pelaksanaan: item.waktu_pelaksanaan,
    keterangan_target: item.target_capaian,
    status: item.status,
    catatan_revisi: item.catatan_revisi || null,
    approved_at: item.approved_at || null,
    created_at: item.created_at || new Date().toISOString(),
  };
}

export function mapDbToRkt(row: any): RKT {
  return {
    id: row.id,
    tahun_anggaran: String(row.tahun_anggaran),
    bidang: row.bidang,
    user_id: row.user_id,
    pic: row.pic,
    perspektif_id: row.perspektif_id,
    nama_kegiatan: row.nama_kegiatan,
    waktu_pelaksanaan: row.waktu_pelaksanaan,
    target_capaian: row.keterangan_target || row.target_capaian || "",
    status: row.status,
    catatan_revisi: row.catatan_revisi,
    approved_at: row.approved_at,
    created_at: row.created_at,
  };
}

// ====================================================================
// CLOUD SYNC SERVICES
// ====================================================================

export const cloudSync = {
  // Fetch All Initial Data from Supabase
  async fetchAll() {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const [skRes, smRes, dispRes, persRes, rktRes, apRes, arRes] = await Promise.all([
        supabase.from("surat_keluar").select("*").order("created_at", { ascending: false }),
        supabase.from("surat_masuk").select("*").order("created_at", { ascending: false }),
        supabase.from("disposisi").select("*").order("created_at", { ascending: false }),
        supabase.from("master_perspektif").select("*").order("kode", { ascending: true }),
        supabase.from("rkt").select("*").order("created_at", { ascending: false }),
        supabase.from("action_plans").select("*").order("created_at", { ascending: false }),
        supabase.from("action_reports").select("*").order("created_at", { ascending: false }),
      ]);

      return {
        suratKeluar: skRes.data ? skRes.data.map(mapDbToSuratKeluar) : null,
        suratMasuk: smRes.data ? smRes.data.map(mapDbToSuratMasuk) : null,
        disposisi: dispRes.data ? dispRes.data.map(mapDbToDisposisi) : null,
        perspektif: persRes.data ? (persRes.data as MasterPerspektif[]) : null,
        rkt: rktRes.data ? rktRes.data.map(mapDbToRkt) : null,
        actionPlans: apRes.data ? (apRes.data as ActionPlan[]) : null,
        actionReports: arRes.data ? (arRes.data as ActionReport[]) : null,
      };
    } catch (err) {
      console.warn("Supabase fetchAll failed, falling back to local:", err);
      return null;
    }
  },

  // Surat Keluar
  async saveSuratKeluar(item: SuratKeluar) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("surat_keluar").upsert(mapSuratKeluarToDb(item));
    } catch (e) {
      console.warn("Sync surat_keluar failed:", e);
    }
  },

  async deleteSuratKeluar(id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("surat_keluar").delete().eq("id", id);
    } catch (e) {
      console.warn("Delete surat_keluar failed:", e);
    }
  },

  // Surat Masuk
  async saveSuratMasuk(item: SuratMasuk) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("surat_masuk").upsert(mapSuratMasukToDb(item));
    } catch (e) {
      console.warn("Sync surat_masuk failed:", e);
    }
  },

  async deleteSuratMasuk(id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("surat_masuk").delete().eq("id", id);
    } catch (e) {
      console.warn("Delete surat_masuk failed:", e);
    }
  },

  // Disposisi
  async saveDisposisi(item: Disposisi) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("disposisi").upsert(mapDisposisiToDb(item));
    } catch (e) {
      console.warn("Sync disposisi failed:", e);
    }
  },

  async deleteDisposisi(id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("disposisi").delete().eq("id", id);
    } catch (e) {
      console.warn("Delete disposisi failed:", e);
    }
  },

  // Perspektif
  async savePerspektif(item: MasterPerspektif) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("master_perspektif").upsert(item);
    } catch (e) {
      console.warn("Sync master_perspektif failed:", e);
    }
  },

  async deletePerspektif(id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("master_perspektif").delete().eq("id", id);
    } catch (e) {
      console.warn("Delete master_perspektif failed:", e);
    }
  },

  // RKT
  async saveRKT(item: RKT) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("rkt").upsert(mapRktToDb(item));
    } catch (e) {
      console.warn("Sync rkt failed:", e);
    }
  },

  async deleteRKT(id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("rkt").delete().eq("id", id);
    } catch (e) {
      console.warn("Delete rkt failed:", e);
    }
  },

  // Action Plans
  async saveActionPlan(item: ActionPlan) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("action_plans").upsert(item);
    } catch (e) {
      console.warn("Sync action_plans failed:", e);
    }
  },

  async deleteActionPlan(id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("action_plans").delete().eq("id", id);
    } catch (e) {
      console.warn("Delete action_plans failed:", e);
    }
  },

  // Action Reports
  async saveActionReport(item: ActionReport) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("action_reports").upsert(item);
    } catch (e) {
      console.warn("Sync action_reports failed:", e);
    }
  },

  async deleteActionReport(id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("action_reports").delete().eq("id", id);
    } catch (e) {
      console.warn("Delete action_reports failed:", e);
    }
  },
};
