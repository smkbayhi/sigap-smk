"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  SuratKeluar,
  SuratMasuk,
  Disposisi,
  MasterPerspektif,
  RKT,
  ActionPlan,
  ActionReport,
  StatusSuratKeluar,
  StatusDisposisi,
  StatusRKT,
  SchoolSettings,
  NotulenRapat,
  DokumentasiKegiatan,
} from "@/lib/database.types";
import {
  INITIAL_PERSPEKTIF,
  INITIAL_SURAT_KELUAR,
  INITIAL_SURAT_MASUK,
  INITIAL_DISPOSISI,
  INITIAL_RKT,
  INITIAL_ACTION_PLANS,
  INITIAL_ACTION_REPORTS,
  INITIAL_NOTULEN_RAPAT,
  INITIAL_DOKUMENTASI,
  DEFAULT_SCHOOL_SETTINGS,
  TTD_KEPSEK_DATA_URL,
  STEMPEL_SEKOLAH_DATA_URL,
} from "@/lib/seedData";
import { generateNomorSurat, getBulanRomawi } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { cloudSync } from "@/lib/supabaseSync";
import {
  getIndexedDBSettings,
  saveIndexedDBSettings,
  getIndexedDBDokumentasi,
  saveIndexedDBDokumentasi,
  getIndexedDBNotulen,
  saveIndexedDBNotulen,
} from "@/lib/indexedDb";

export const DOKUMENTASI_CLOUD_ROW_ID = "dokumentasi-cloud-data";
export const DOKUMENTASI_CLOUD_KODE = "DOKUMENTASI_SYNC";
export const NOTULEN_CLOUD_ROW_ID = "notulen-cloud-data";
export const NOTULEN_CLOUD_KODE = "NOTULEN_SYNC";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

interface AppDataContextType {
  // Cloud status
  isCloudConnected: boolean;
  syncWithCloud: () => Promise<void>;

  // Data
  suratKeluar: SuratKeluar[];
  suratMasuk: SuratMasuk[];
  disposisi: Disposisi[];
  perspektif: MasterPerspektif[];
  rkt: RKT[];
  actionPlans: ActionPlan[];
  actionReports: ActionReport[];
  notulenList: NotulenRapat[];
  dokumentasiList: DokumentasiKegiatan[];
  toasts: ToastMessage[];

  // School & Letter Settings (Logo, Stempel, TTD)
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (settings: Partial<SchoolSettings>) => Promise<void> | void;
  resetSchoolSettings: () => Promise<void> | void;

  // Actions: Surat Keluar
  addSuratKeluar: (data: Omit<SuratKeluar, "id" | "no_urut" | "nomor_surat" | "bulan_romawi" | "tahun" | "created_at">) => SuratKeluar;
  updateSuratKeluar: (id: string, partial: Partial<SuratKeluar>) => void;
  approveSuratKeluar: (
    id: string,
    kepsekName: string,
    options?: { customTtd?: string; includeStamp?: boolean; includeTtd?: boolean }
  ) => void;
  rejectSuratKeluar: (id: string, catatanRevisi: string) => void;
  deleteSuratKeluar: (id: string) => void;

  // Actions: Surat Masuk
  addSuratMasuk: (data: Omit<SuratMasuk, "id" | "created_at">) => SuratMasuk;
  updateSuratMasuk: (id: string, partial: Partial<SuratMasuk>) => void;
  deleteSuratMasuk: (id: string) => void;

  // Actions: Disposisi
  createDisposisi: (data: Omit<Disposisi, "id" | "created_at">) => Disposisi;
  updateDisposisi: (id: string, partial: Partial<Disposisi>) => void;
  updateDisposisiStatus: (id: string, status: StatusDisposisi, tanggapan?: string) => void;
  deleteDisposisi: (id: string) => void;

  // Actions: Master Perspektif
  addPerspektif: (data: Omit<MasterPerspektif, "id" | "created_at">) => void;
  updatePerspektif: (id: string, partial: Partial<MasterPerspektif>) => void;
  deletePerspektif: (id: string) => void;

  // Actions: RKT
  addRKT: (data: Omit<RKT, "id" | "status" | "created_at">) => void;
  approveRKT: (id: string) => void;
  rejectRKT: (id: string, catatanRevisi: string) => void;
  updateRKT: (id: string, partial: Partial<RKT>) => void;
  deleteRKT: (id: string) => void;

  // Actions: Action Plans
  addActionPlan: (data: Omit<ActionPlan, "id" | "created_at">) => void;
  updateActionPlan: (id: string, partial: Partial<ActionPlan>) => void;
  deleteActionPlan: (id: string) => void;

  // Actions: Action Reports
  addActionReport: (data: Omit<ActionReport, "id" | "created_at">) => void;
  updateActionReport: (id: string, partial: Partial<ActionReport>) => void;

  // Actions: Notulen Rapat
  addNotulen: (data: Omit<NotulenRapat, "id" | "created_at">) => NotulenRapat;
  updateNotulen: (id: string, partial: Partial<NotulenRapat>) => void;
  deleteNotulen: (id: string) => void;
  approveNotulen: (id: string, kepsekName: string) => void;
  toggleActionItemStatus: (notulenId: string, actionItemId: string) => void;

  // Actions: Dokumentasi Kegiatan
  addDokumentasi: (data: Omit<DokumentasiKegiatan, "id" | "created_at">) => DokumentasiKegiatan;
  updateDokumentasi: (id: string, partial: Partial<DokumentasiKegiatan>) => void;
  deleteDokumentasi: (id: string) => void;

  // System
  addToast: (type: ToastMessage["type"], title: string, message: string) => void;
  removeToast: (id: string) => void;
  resetAllData: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SURAT_KELUAR: "sigap_smk_surat_keluar",
  SURAT_MASUK: "sigap_smk_surat_masuk",
  DISPOSISI: "sigap_smk_disposisi",
  PERSPEKTIF: "sigap_smk_perspektif",
  RKT: "sigap_smk_rkt",
  ACTION_PLANS: "sigap_smk_action_plans",
  ACTION_REPORTS: "sigap_smk_action_reports",
  NOTULEN: "sigap_smk_notulen",
  DOKUMENTASI: "sigap_smk_dokumentasi",
  SCHOOL_SETTINGS: "sigap_smk_school_settings",
};

const DELETED_KEYS = {
  SURAT_KELUAR: "sigap_smk_deleted_sk_ids",
  SURAT_MASUK: "sigap_smk_deleted_sm_ids",
  DISPOSISI: "sigap_smk_deleted_disp_ids",
  PERSPEKTIF: "sigap_smk_deleted_perspektif_ids",
  RKT: "sigap_smk_deleted_rkt_ids",
  ACTION_PLANS: "sigap_smk_deleted_ap_ids",
  ACTION_REPORTS: "sigap_smk_deleted_ar_ids",
  NOTULEN: "sigap_smk_deleted_notulen_ids",
  DOKUMENTASI: "sigap_smk_deleted_dok_ids",
};

// Legacy dummy seed IDs that must never be resurrected on any browser/device
const LEGACY_DUMMY_IDS = new Set([
  "sk-146",
  "sk-147",
  "sm-001",
  "sm-002",
  "disp-001",
  "rkt-001",
  "rkt-002",
  "rkt-003",
  "ap-001",
  "ap-002",
  "ar-001",
]);

function getDeletedIds(key: string): string[] {
  const legacyForThisKey: string[] = [];
  if (key === DELETED_KEYS.SURAT_KELUAR) legacyForThisKey.push("sk-146", "sk-147");
  if (key === DELETED_KEYS.SURAT_MASUK) legacyForThisKey.push("sm-001", "sm-002");
  if (key === DELETED_KEYS.DISPOSISI) legacyForThisKey.push("disp-001");
  if (key === DELETED_KEYS.RKT) legacyForThisKey.push("rkt-001", "rkt-002", "rkt-003");
  if (key === DELETED_KEYS.ACTION_PLANS) legacyForThisKey.push("ap-001", "ap-002");
  if (key === DELETED_KEYS.ACTION_REPORTS) legacyForThisKey.push("ar-001");

  if (typeof window === "undefined") return legacyForThisKey;
  try {
    const raw = localStorage.getItem(key);
    const stored: string[] = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...stored, ...legacyForThisKey]));
  } catch {
    return legacyForThisKey;
  }
}

function markDeletedId(key: string, id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getDeletedIds(key);
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(key, JSON.stringify(ids));
    }
  } catch (e) {
    console.error("Failed to mark deleted id", e);
  }
}

function unmarkDeletedId(key: string, id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getDeletedIds(key);
    const updated = ids.filter((item) => item !== id);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to unmark deleted id", e);
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed.ttdKepsekUrl || parsed.ttdKepsekUrl.startsWith("data:image/svg+xml")) {
            parsed.ttdKepsekUrl = TTD_KEPSEK_DATA_URL;
          }
          if (parsed.stempelUrl && parsed.stempelUrl.startsWith("data:image/svg+xml;utf8,")) {
            parsed.stempelUrl = parsed.stempelUrl.replace(";utf8,", ";charset=utf-8,");
          }
          return parsed;
        }
      } catch {
        return DEFAULT_SCHOOL_SETTINGS;
      }
    }
    return DEFAULT_SCHOOL_SETTINGS;
  });

  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.SURAT_KELUAR);
        const stored = localStorage.getItem(STORAGE_KEYS.SURAT_KELUAR);
        if (stored) {
          const parsed: SuratKeluar[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (s) => !deleted.includes(s.id) && !LEGACY_DUMMY_IDS.has(s.id)
          );
        }
        return INITIAL_SURAT_KELUAR;
      } catch {
        return INITIAL_SURAT_KELUAR;
      }
    }
    return INITIAL_SURAT_KELUAR;
  });

  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.SURAT_MASUK);
        const stored = localStorage.getItem(STORAGE_KEYS.SURAT_MASUK);
        if (stored) {
          const parsed: SuratMasuk[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (s) => !deleted.includes(s.id) && !LEGACY_DUMMY_IDS.has(s.id)
          );
        }
        return INITIAL_SURAT_MASUK;
      } catch {
        return INITIAL_SURAT_MASUK;
      }
    }
    return INITIAL_SURAT_MASUK;
  });

  const [disposisi, setDisposisi] = useState<Disposisi[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.DISPOSISI);
        const stored = localStorage.getItem(STORAGE_KEYS.DISPOSISI);
        if (stored) {
          const parsed: Disposisi[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (d) => !deleted.includes(d.id) && !LEGACY_DUMMY_IDS.has(d.id)
          );
        }
        return INITIAL_DISPOSISI;
      } catch {
        return INITIAL_DISPOSISI;
      }
    }
    return INITIAL_DISPOSISI;
  });

  const [perspektif, setPerspektif] = useState<MasterPerspektif[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.PERSPEKTIF);
        const stored = localStorage.getItem(STORAGE_KEYS.PERSPEKTIF);
        if (stored) {
          const parsed: MasterPerspektif[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter((p) => !deleted.includes(p.id));
        }
        return INITIAL_PERSPEKTIF;
      } catch {
        return INITIAL_PERSPEKTIF;
      }
    }
    return INITIAL_PERSPEKTIF;
  });

  const [rkt, setRkt] = useState<RKT[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.RKT);
        const stored = localStorage.getItem(STORAGE_KEYS.RKT);
        if (stored) {
          const parsed: RKT[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (r) => !deleted.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
          );
        }
        return INITIAL_RKT;
      } catch {
        return INITIAL_RKT;
      }
    }
    return INITIAL_RKT;
  });

  const [actionPlans, setActionPlans] = useState<ActionPlan[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.ACTION_PLANS);
        const stored = localStorage.getItem(STORAGE_KEYS.ACTION_PLANS);
        if (stored) {
          const parsed: ActionPlan[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (a) => !deleted.includes(a.id) && !LEGACY_DUMMY_IDS.has(a.id)
          );
        }
        return INITIAL_ACTION_PLANS;
      } catch {
        return INITIAL_ACTION_PLANS;
      }
    }
    return INITIAL_ACTION_PLANS;
  });

  const [actionReports, setActionReports] = useState<ActionReport[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.ACTION_REPORTS);
        const stored = localStorage.getItem(STORAGE_KEYS.ACTION_REPORTS);
        if (stored) {
          const parsed: ActionReport[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (r) => !deleted.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
          );
        }
        return INITIAL_ACTION_REPORTS;
      } catch {
        return INITIAL_ACTION_REPORTS;
      }
    }
    return INITIAL_ACTION_REPORTS;
  });

  const [notulenList, setNotulenList] = useState<NotulenRapat[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.NOTULEN);
        const stored = localStorage.getItem(STORAGE_KEYS.NOTULEN);
        if (stored) {
          const parsed: NotulenRapat[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (n) => !deleted.includes(n.id)
          );
        }
        return INITIAL_NOTULEN_RAPAT;
      } catch {
        return INITIAL_NOTULEN_RAPAT;
      }
    }
    return INITIAL_NOTULEN_RAPAT;
  });

  const [dokumentasiList, setDokumentasiList] = useState<DokumentasiKegiatan[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deleted = getDeletedIds(DELETED_KEYS.DOKUMENTASI);
        const stored = localStorage.getItem(STORAGE_KEYS.DOKUMENTASI);
        if (stored) {
          const parsed: DokumentasiKegiatan[] = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).filter(
            (d) => !deleted.includes(d.id)
          );
        }
        return INITIAL_DOKUMENTASI;
      } catch {
        return INITIAL_DOKUMENTASI;
      }
    }
    return INITIAL_DOKUMENTASI;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(isSupabaseConfigured);

  // Helper save to localStorage
  const saveToStorage = (key: string, data: unknown) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn("Storage save quota warning:", e);
        try {
          if (key === STORAGE_KEYS.SCHOOL_SETTINGS) {
            // Priority save for school settings
            localStorage.removeItem(STORAGE_KEYS.ACTION_REPORTS);
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch {
          // IndexedDB and Supabase will remain the primary sources of truth
        }
      }
    }
  };

  const addToast = (type: ToastMessage["type"], title: string, message: string) => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync with Supabase Cloud
  const syncWithCloud = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const cloudData = await cloudSync.fetchAll();
      if (!cloudData) return;

      setIsCloudConnected(true);

      // 1. Surat Keluar
      const deletedSK = getDeletedIds(DELETED_KEYS.SURAT_KELUAR);
      if (cloudData.suratKeluar) {
        const lingeringSK = cloudData.suratKeluar
          .filter((s) => deletedSK.includes(s.id) || LEGACY_DUMMY_IDS.has(s.id))
          .map((s) => s.id);
        if (lingeringSK.length > 0 && supabase) {
          supabase.from("surat_keluar").delete().in("id", lingeringSK).then();
        }

        const activeCloudSK = cloudData.suratKeluar.filter(
          (s) => !deletedSK.includes(s.id) && !LEGACY_DUMMY_IDS.has(s.id)
        );
        setSuratKeluar((prev) => {
          const cloudIds = new Set(activeCloudSK.map((s) => s.id));
          const localOnly = prev.filter(
            (s) => !cloudIds.has(s.id) && !deletedSK.includes(s.id) && !LEGACY_DUMMY_IDS.has(s.id)
          );
          const merged = [...activeCloudSK, ...localOnly];
          saveToStorage(STORAGE_KEYS.SURAT_KELUAR, merged);
          return merged;
        });
      }

      // 2. Surat Masuk
      const deletedSM = getDeletedIds(DELETED_KEYS.SURAT_MASUK);
      if (cloudData.suratMasuk) {
        const lingeringSM = cloudData.suratMasuk
          .filter((s) => deletedSM.includes(s.id) || LEGACY_DUMMY_IDS.has(s.id))
          .map((s) => s.id);
        if (lingeringSM.length > 0 && supabase) {
          supabase.from("surat_masuk").delete().in("id", lingeringSM).then();
        }

        const activeCloudSM = cloudData.suratMasuk.filter(
          (s) => !deletedSM.includes(s.id) && !LEGACY_DUMMY_IDS.has(s.id)
        );
        setSuratMasuk((prev) => {
          const cloudIds = new Set(activeCloudSM.map((s) => s.id));
          const localOnly = prev.filter(
            (s) => !cloudIds.has(s.id) && !deletedSM.includes(s.id) && !LEGACY_DUMMY_IDS.has(s.id)
          );
          const merged = [...activeCloudSM, ...localOnly];
          saveToStorage(STORAGE_KEYS.SURAT_MASUK, merged);
          return merged;
        });
      }

      // 3. Disposisi
      const deletedDisp = getDeletedIds(DELETED_KEYS.DISPOSISI);
      if (cloudData.disposisi) {
        const lingeringDisp = cloudData.disposisi
          .filter((d) => deletedDisp.includes(d.id) || LEGACY_DUMMY_IDS.has(d.id))
          .map((d) => d.id);
        if (lingeringDisp.length > 0 && supabase) {
          supabase.from("disposisi").delete().in("id", lingeringDisp).then();
        }

        const activeCloudDisp = cloudData.disposisi.filter(
          (d) => !deletedDisp.includes(d.id) && !LEGACY_DUMMY_IDS.has(d.id)
        );
        setDisposisi((prev) => {
          const cloudIds = new Set(activeCloudDisp.map((d) => d.id));
          const localOnly = prev.filter(
            (d) => !cloudIds.has(d.id) && !deletedDisp.includes(d.id) && !LEGACY_DUMMY_IDS.has(d.id)
          );
          const merged = [...activeCloudDisp, ...localOnly];
          saveToStorage(STORAGE_KEYS.DISPOSISI, merged);
          return merged;
        });
      }

      // 4. Perspektif
      const deletedPers = getDeletedIds(DELETED_KEYS.PERSPEKTIF);
      if (cloudData.perspektif) {
        const lingeringPers = cloudData.perspektif
          .filter((p) => deletedPers.includes(p.id))
          .map((p) => p.id);
        if (lingeringPers.length > 0 && supabase) {
          supabase.from("master_perspektif").delete().in("id", lingeringPers).then();
        }

        const activeCloudPers = cloudData.perspektif.filter(
          (p) =>
            !deletedPers.includes(p.id) &&
            p.id !== "presensi-cloud-data" &&
            p.kode !== "PRESENSI_SYNC" &&
            p.id !== DOKUMENTASI_CLOUD_ROW_ID &&
            p.kode !== DOKUMENTASI_CLOUD_KODE &&
            p.id !== NOTULEN_CLOUD_ROW_ID &&
            p.kode !== NOTULEN_CLOUD_KODE &&
            p.id !== "user-presence-tracker" &&
            p.id !== "sebatik-evaluasi-cloud-data" &&
            p.kode !== "SEBATIK_SYNC"
        );
        setPerspektif((prev) => {
          const cloudIds = new Set(activeCloudPers.map((p) => p.id));
          const localOnly = prev.filter((p) => !cloudIds.has(p.id) && !deletedPers.includes(p.id));
          const merged = [...activeCloudPers, ...localOnly];
          saveToStorage(STORAGE_KEYS.PERSPEKTIF, merged);
          return merged;
        });
      }

      // 5. RKT
      const deletedRkt = getDeletedIds(DELETED_KEYS.RKT);
      if (cloudData.rkt) {
        const lingeringRkt = cloudData.rkt
          .filter((r) => deletedRkt.includes(r.id) || LEGACY_DUMMY_IDS.has(r.id))
          .map((r) => r.id);
        if (lingeringRkt.length > 0 && supabase) {
          supabase.from("rkt").delete().in("id", lingeringRkt).then();
        }

        const activeCloudRkt = cloudData.rkt.filter(
          (r) => !deletedRkt.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
        );
        setRkt((prev) => {
          const cloudIds = new Set(activeCloudRkt.map((r) => r.id));
          const localOnly = prev.filter(
            (r) => !cloudIds.has(r.id) && !deletedRkt.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
          );
          const merged = [...activeCloudRkt, ...localOnly];
          saveToStorage(STORAGE_KEYS.RKT, merged);
          return merged;
        });
      }

      // 6. Action Plans
      const deletedAP = getDeletedIds(DELETED_KEYS.ACTION_PLANS);
      if (cloudData.actionPlans) {
        const lingeringAP = cloudData.actionPlans
          .filter((a) => deletedAP.includes(a.id) || LEGACY_DUMMY_IDS.has(a.id))
          .map((a) => a.id);
        if (lingeringAP.length > 0 && supabase) {
          supabase.from("action_plans").delete().in("id", lingeringAP).then();
        }

        const activeCloudAP = cloudData.actionPlans.filter(
          (a) => !deletedAP.includes(a.id) && !LEGACY_DUMMY_IDS.has(a.id)
        );
        setActionPlans((prev) => {
          const cloudIds = new Set(activeCloudAP.map((a) => a.id));
          const localOnly = prev.filter(
            (a) => !cloudIds.has(a.id) && !deletedAP.includes(a.id) && !LEGACY_DUMMY_IDS.has(a.id)
          );
          const merged = [...activeCloudAP, ...localOnly];
          saveToStorage(STORAGE_KEYS.ACTION_PLANS, merged);
          return merged;
        });
      }

      // 7. Action Reports
      const deletedAR = getDeletedIds(DELETED_KEYS.ACTION_REPORTS);
      if (cloudData.actionReports) {
        const lingeringAR = cloudData.actionReports
          .filter((r) => deletedAR.includes(r.id) || LEGACY_DUMMY_IDS.has(r.id))
          .map((r) => r.id);
        if (lingeringAR.length > 0 && supabase) {
          supabase.from("action_reports").delete().in("id", lingeringAR).then();
        }

        const activeCloudAR = cloudData.actionReports.filter(
          (r) => !deletedAR.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
        );
        setActionReports((prev) => {
          const cloudIds = new Set(activeCloudAR.map((r) => r.id));
          const localOnly = prev.filter(
            (r) => !cloudIds.has(r.id) && !deletedAR.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
          );
          const merged = [...activeCloudAR, ...localOnly];
          saveToStorage(STORAGE_KEYS.ACTION_REPORTS, merged);
          return merged;
        });
      }

      // 8. School Settings from Supabase (user-kepsek)
      if (supabase) {
        try {
          const { data: kepsekUser } = await supabase
            .from("users")
            .select("name, nip, avatar, ttd_url, stempel_url")
            .eq("id", "user-kepsek")
            .single();

          if (kepsekUser) {
            let cloudSettings: Partial<SchoolSettings> = {};
            if (kepsekUser.avatar && kepsekUser.avatar.startsWith("{")) {
              try {
                cloudSettings = JSON.parse(kepsekUser.avatar);
              } catch {
                // ignore
              }
            }
            if (kepsekUser.ttd_url) cloudSettings.ttdKepsekUrl = kepsekUser.ttd_url;
            if (kepsekUser.stempel_url) cloudSettings.stempelUrl = kepsekUser.stempel_url;
            if (kepsekUser.name) cloudSettings.namaKepsek = kepsekUser.name;
            if (kepsekUser.nip) cloudSettings.niyKepsek = kepsekUser.nip;

            if (
              cloudSettings.logoYayasanUrl ||
              cloudSettings.logoSmkUrl ||
              cloudSettings.ttdKepsekUrl ||
              cloudSettings.stempelUrl
            ) {
              setSchoolSettings((prev) => {
                const merged = { ...prev, ...cloudSettings };
                saveToStorage(STORAGE_KEYS.SCHOOL_SETTINGS, merged);
                saveIndexedDBSettings(merged);
                return merged;
              });
            }
          }
        } catch (err) {
          console.warn("Sync schoolSettings from cloud failed:", err);
        }

        // 9. Sync Dokumentasi Kegiatan from Supabase Cloud
        try {
          const { data: dokRow } = await supabase
            .from("master_perspektif")
            .select("deskripsi")
            .eq("id", DOKUMENTASI_CLOUD_ROW_ID)
            .single();

          if (dokRow?.deskripsi) {
            const parsed = JSON.parse(dokRow.deskripsi);
            if (parsed && Array.isArray(parsed.albums) && parsed.albums.length > 0) {
              const deletedDok = getDeletedIds(DELETED_KEYS.DOKUMENTASI);
              const cloudAlbums: DokumentasiKegiatan[] = parsed.albums.filter(
                (a: DokumentasiKegiatan) => !deletedDok.includes(a.id)
              );
              setDokumentasiList((prev) => {
                const cloudIds = new Set(cloudAlbums.map((a) => a.id));
                const localOnly = prev.filter((a) => !cloudIds.has(a.id) && !deletedDok.includes(a.id));
                const merged = [...cloudAlbums, ...localOnly];
                saveToStorage(STORAGE_KEYS.DOKUMENTASI, merged);
                saveIndexedDBDokumentasi(merged);
                return merged;
              });
            }
          }
        } catch (err) {
          console.warn("Sync dokumentasi from cloud failed:", err);
        }

        // 10. Sync Notulen Rapat from Supabase Cloud
        try {
          const { data: notulenRow } = await supabase
            .from("master_perspektif")
            .select("deskripsi")
            .eq("id", NOTULEN_CLOUD_ROW_ID)
            .single();

          if (notulenRow?.deskripsi) {
            const parsed = JSON.parse(notulenRow.deskripsi);
            if (parsed && Array.isArray(parsed.notulen) && parsed.notulen.length > 0) {
              const deletedNotulen = getDeletedIds(DELETED_KEYS.NOTULEN);
              const cloudNotulen: NotulenRapat[] = parsed.notulen.filter(
                (n: NotulenRapat) => !deletedNotulen.includes(n.id)
              );
              setNotulenList((prev) => {
                const cloudIds = new Set(cloudNotulen.map((n) => n.id));
                const localOnly = prev.filter((n) => !cloudIds.has(n.id) && !deletedNotulen.includes(n.id));
                const merged = [...cloudNotulen, ...localOnly];
                saveToStorage(STORAGE_KEYS.NOTULEN, merged);
                saveIndexedDBNotulen(merged);
                return merged;
              });
            }
          }
        } catch (err) {
          console.warn("Sync notulen from cloud failed:", err);
        }
      }
    } catch (e) {
      console.warn("Failed to sync with Supabase cloud:", e);
    }
  }, []);

  // Initial load from local storage & cloud
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const deletedSK = getDeletedIds(DELETED_KEYS.SURAT_KELUAR);
        const storedSK = localStorage.getItem(STORAGE_KEYS.SURAT_KELUAR);
        if (storedSK) {
          const parsedSK = JSON.parse(storedSK);
          const filteredSK = (Array.isArray(parsedSK) ? parsedSK : []).filter(
            (s: SuratKeluar) => !deletedSK.includes(s.id) && !LEGACY_DUMMY_IDS.has(s.id)
          );
          setSuratKeluar(filteredSK);
          saveToStorage(STORAGE_KEYS.SURAT_KELUAR, filteredSK);
        }

        const deletedSM = getDeletedIds(DELETED_KEYS.SURAT_MASUK);
        const storedSM = localStorage.getItem(STORAGE_KEYS.SURAT_MASUK);
        if (storedSM) {
          const parsed = JSON.parse(storedSM);
          const sanitized = (Array.isArray(parsed) ? parsed : [])
            .filter((item: any) => !deletedSM.includes(item.id) && !LEGACY_DUMMY_IDS.has(item.id))
            .map((item: any) => {
              if (item.file_url && item.file_url.includes("unsplash.com")) {
                return { ...item, file_url: "" };
              }
              return item;
            });
          setSuratMasuk(sanitized);
          saveToStorage(STORAGE_KEYS.SURAT_MASUK, sanitized);
        }

        const deletedDisp = getDeletedIds(DELETED_KEYS.DISPOSISI);
        const storedDisp = localStorage.getItem(STORAGE_KEYS.DISPOSISI);
        if (storedDisp) {
          const parsedDisp = JSON.parse(storedDisp);
          const filteredDisp = (Array.isArray(parsedDisp) ? parsedDisp : []).filter(
            (d: Disposisi) => !deletedDisp.includes(d.id) && !LEGACY_DUMMY_IDS.has(d.id)
          );
          setDisposisi(filteredDisp);
          saveToStorage(STORAGE_KEYS.DISPOSISI, filteredDisp);
        }

        const deletedPers = getDeletedIds(DELETED_KEYS.PERSPEKTIF);
        const storedPers = localStorage.getItem(STORAGE_KEYS.PERSPEKTIF);
        if (storedPers) {
          const parsedPers = JSON.parse(storedPers);
          const filteredPers = (Array.isArray(parsedPers) ? parsedPers : []).filter(
            (p: MasterPerspektif) => !deletedPers.includes(p.id)
          );
          setPerspektif(filteredPers);
          saveToStorage(STORAGE_KEYS.PERSPEKTIF, filteredPers);
        }

        const deletedRkt = getDeletedIds(DELETED_KEYS.RKT);
        const storedRkt = localStorage.getItem(STORAGE_KEYS.RKT);
        if (storedRkt) {
          const parsedRkt = JSON.parse(storedRkt);
          const filteredRkt = (Array.isArray(parsedRkt) ? parsedRkt : []).filter(
            (r: RKT) => !deletedRkt.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
          );
          setRkt(filteredRkt);
          saveToStorage(STORAGE_KEYS.RKT, filteredRkt);
        }

        const deletedAP = getDeletedIds(DELETED_KEYS.ACTION_PLANS);
        const storedAP = localStorage.getItem(STORAGE_KEYS.ACTION_PLANS);
        if (storedAP) {
          const parsedAP = JSON.parse(storedAP);
          const filteredAP = (Array.isArray(parsedAP) ? parsedAP : []).filter(
            (a: ActionPlan) => !deletedAP.includes(a.id) && !LEGACY_DUMMY_IDS.has(a.id)
          );
          setActionPlans(filteredAP);
          saveToStorage(STORAGE_KEYS.ACTION_PLANS, filteredAP);
        }

        const deletedAR = getDeletedIds(DELETED_KEYS.ACTION_REPORTS);
        const storedAR = localStorage.getItem(STORAGE_KEYS.ACTION_REPORTS);
        if (storedAR) {
          const parsedAR = JSON.parse(storedAR);
          const filteredAR = (Array.isArray(parsedAR) ? parsedAR : []).filter(
            (r: ActionReport) => !deletedAR.includes(r.id) && !LEGACY_DUMMY_IDS.has(r.id)
          );
          setActionReports(filteredAR);
          saveToStorage(STORAGE_KEYS.ACTION_REPORTS, filteredAR);
        }

        const storedSettings = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
        if (storedSettings) {
          try {
            const parsed = JSON.parse(storedSettings);
            if (!parsed.ttdKepsekUrl || parsed.ttdKepsekUrl.startsWith("data:image/svg+xml")) {
              parsed.ttdKepsekUrl = TTD_KEPSEK_DATA_URL;
            }
            if (parsed.stempelUrl && parsed.stempelUrl.startsWith("data:image/svg+xml;utf8,")) {
              parsed.stempelUrl = parsed.stempelUrl.replace(";utf8,", ";charset=utf-8,");
            }
            setSchoolSettings(parsed);
          } catch (e) {
            console.error("Failed to parse storedSettings", e);
          }
        }

        // Also query IndexedDB as persistent secondary layer
        getIndexedDBSettings().then((idbSettings) => {
          if (
            idbSettings &&
            (idbSettings.logoYayasanUrl ||
              idbSettings.logoSmkUrl ||
              idbSettings.ttdKepsekUrl ||
              idbSettings.stempelUrl)
          ) {
            setSchoolSettings((prev) => {
              const merged = { ...prev, ...idbSettings };
              saveToStorage(STORAGE_KEYS.SCHOOL_SETTINGS, merged);
              return merged;
            });
          }
        });

        // Query IndexedDB for persistent Dokumentasi (immune to localStorage quota)
        getIndexedDBDokumentasi().then((idbAlbums) => {
          if (idbAlbums && Array.isArray(idbAlbums) && idbAlbums.length > 0) {
            const deletedDok = getDeletedIds(DELETED_KEYS.DOKUMENTASI);
            const filtered = idbAlbums.filter((a) => !deletedDok.includes(a.id));
            if (filtered.length > 0) {
              setDokumentasiList(filtered);
            }
          }
        });

        // Query IndexedDB for persistent Notulen Rapat
        getIndexedDBNotulen().then((idbNotulen) => {
          if (idbNotulen && Array.isArray(idbNotulen) && idbNotulen.length > 0) {
            const deletedNotulen = getDeletedIds(DELETED_KEYS.NOTULEN);
            const filtered = idbNotulen.filter((n) => !deletedNotulen.includes(n.id));
            if (filtered.length > 0) {
              setNotulenList(filtered);
            }
          }
        });
      } catch (e) {
        console.error("Failed to load initial data from storage", e);
      }
    }

    // Try cloud sync if configured
    if (isSupabaseConfigured) {
      syncWithCloud();
    }

    // Auto-sync on window focus to ensure cross-device consistency
    const handleFocus = () => {
      if (isSupabaseConfigured) {
        syncWithCloud();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncWithCloud]);

  // Surat Keluar Actions
  const addSuratKeluar = (
    data: Omit<SuratKeluar, "id" | "no_urut" | "nomor_surat" | "bulan_romawi" | "tahun" | "created_at">
  ) => {
    const currentYear = new Date().getFullYear();
    const highestNoUrut = suratKeluar
      .filter((s) => s.tahun === currentYear)
      .reduce((max, s) => Math.max(max, s.no_urut || 0), 0);
    const nextNoUrut = highestNoUrut + 1;
    const now = new Date();
    const romawi = getBulanRomawi(now.getMonth() + 1);
    const nomor = generateNomorSurat(nextNoUrut, now, data.jenis_surat);

    const newItem: SuratKeluar = {
      ...data,
      id: "sk-" + Date.now(),
      no_urut: nextNoUrut,
      nomor_surat: nomor,
      bulan_romawi: romawi,
      tahun: currentYear,
      created_at: new Date().toISOString(),
    };

    unmarkDeletedId(DELETED_KEYS.SURAT_KELUAR, newItem.id);

    const updated = [newItem, ...suratKeluar];
    setSuratKeluar(updated);
    saveToStorage(STORAGE_KEYS.SURAT_KELUAR, updated);
    cloudSync.saveSuratKeluar(newItem);
    addToast("success", "Surat Keluar Berhasil Dibuat", `Nomor surat otomatis: ${nomor}`);
    return newItem;
  };

  const updateSuratKeluar = (id: string, partial: Partial<SuratKeluar>) => {
    const updated = suratKeluar.map((item) => (item.id === id ? { ...item, ...partial } : item));
    setSuratKeluar(updated);
    saveToStorage(STORAGE_KEYS.SURAT_KELUAR, updated);
    const target = updated.find((s) => s.id === id);
    if (target) cloudSync.saveSuratKeluar(target);
    addToast("info", "Surat Diperbarui", "Data surat keluar telah disimpan.");
  };

  const approveSuratKeluar = (
    id: string,
    kepsekName: string,
    options?: { customTtd?: string; includeStamp?: boolean; includeTtd?: boolean }
  ) => {
    const activeTtd = options?.customTtd || schoolSettings.ttdKepsekUrl || TTD_KEPSEK_DATA_URL;
    const activeStempel = schoolSettings.stempelUrl || STEMPEL_SEKOLAH_DATA_URL;
    const shouldIncludeStamp = options?.includeStamp !== undefined ? options.includeStamp : true;
    const shouldIncludeTtd = options?.includeTtd !== undefined ? options.includeTtd : true;
    const activeKepsekName = schoolSettings.namaKepsek || kepsekName;

    const updated = suratKeluar.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: "disetujui" as StatusSuratKeluar,
          approved_by: "user-kepsek",
          approver_name: activeKepsekName,
          approved_at: new Date().toISOString(),
          has_ttd: shouldIncludeTtd,
          has_stempel: shouldIncludeStamp,
          ttd_image_url: shouldIncludeTtd ? activeTtd : undefined,
          stempel_image_url: shouldIncludeStamp ? activeStempel : undefined,
          catatan_revisi: undefined,
        };
      }
      return item;
    });
    setSuratKeluar(updated);
    saveToStorage(STORAGE_KEYS.SURAT_KELUAR, updated);
    const target = updated.find((s) => s.id === id);
    if (target) cloudSync.saveSuratKeluar(target);
    addToast(
      "success",
      "Surat Telah Disetujui",
      shouldIncludeTtd && shouldIncludeStamp
        ? "Tanda Tangan dan Stempel resmi sekolah telah tersemat secara sah."
        : shouldIncludeTtd
        ? "Tanda Tangan digital resmi sekolah telah tersemat."
        : shouldIncludeStamp
        ? "Stempel resmi sekolah telah tersemat."
        : "Surat telah disetujui (ruang tanda tangan & cap basah fisik siap digunakan)."
    );
  };

  const rejectSuratKeluar = (id: string, catatanRevisi: string) => {
    const updated = suratKeluar.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: "ditolak" as StatusSuratKeluar,
          catatan_revisi: catatanRevisi,
        };
      }
      return item;
    });
    setSuratKeluar(updated);
    saveToStorage(STORAGE_KEYS.SURAT_KELUAR, updated);
    const target = updated.find((s) => s.id === id);
    if (target) cloudSync.saveSuratKeluar(target);
    addToast("warning", "Surat Ditolak / Perlu Revisi", "Catatan koreksi telah dikirimkan ke Tata Usaha.");
  };

  const deleteSuratKeluar = (id: string) => {
    markDeletedId(DELETED_KEYS.SURAT_KELUAR, id);
    const updated = suratKeluar.filter((item) => item.id !== id);
    setSuratKeluar(updated);
    saveToStorage(STORAGE_KEYS.SURAT_KELUAR, updated);
    cloudSync.deleteSuratKeluar(id);
    addToast("info", "Surat Dihapus", "Surat keluar telah dihapus.");
  };

  // Surat Masuk Actions
  const addSuratMasuk = (data: Omit<SuratMasuk, "id" | "created_at">) => {
    const newItem: SuratMasuk = {
      ...data,
      id: "sm-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    unmarkDeletedId(DELETED_KEYS.SURAT_MASUK, newItem.id);
    const updated = [newItem, ...suratMasuk];
    setSuratMasuk(updated);
    saveToStorage(STORAGE_KEYS.SURAT_MASUK, updated);
    cloudSync.saveSuratMasuk(newItem);
    addToast("success", "Surat Masuk Diarsipkan", `Surat No. ${data.nomor_surat} berhasil disimpan.`);
    return newItem;
  };

  const updateSuratMasuk = (id: string, partial: Partial<SuratMasuk>) => {
    const updated = suratMasuk.map((item) => (item.id === id ? { ...item, ...partial } : item));
    setSuratMasuk(updated);
    saveToStorage(STORAGE_KEYS.SURAT_MASUK, updated);
    const target = updated.find((s) => s.id === id);
    if (target) cloudSync.saveSuratMasuk(target);
    addToast("info", "Surat Masuk Diperbarui", "Data surat masuk telah diupdate.");
  };

  const deleteSuratMasuk = (id: string) => {
    markDeletedId(DELETED_KEYS.SURAT_MASUK, id);
    const updated = suratMasuk.filter((item) => item.id !== id);
    setSuratMasuk(updated);
    saveToStorage(STORAGE_KEYS.SURAT_MASUK, updated);
    cloudSync.deleteSuratMasuk(id);

    // Also cascade delete related disposisi locally
    const relatedDisp = disposisi.filter((d) => d.surat_masuk_id === id);
    if (relatedDisp.length > 0) {
      relatedDisp.forEach((d) => markDeletedId(DELETED_KEYS.DISPOSISI, d.id));
      const remainingDisp = disposisi.filter((d) => d.surat_masuk_id !== id);
      setDisposisi(remainingDisp);
      saveToStorage(STORAGE_KEYS.DISPOSISI, remainingDisp);
    }

    addToast("info", "Surat Dihapus", "Surat masuk telah dihapus dari arsip.");
  };

  // Disposisi Actions
  const createDisposisi = (data: Omit<Disposisi, "id" | "created_at">) => {
    const newItem: Disposisi = {
      ...data,
      id: "disp-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    unmarkDeletedId(DELETED_KEYS.DISPOSISI, newItem.id);
    const updated = [newItem, ...disposisi];
    setDisposisi(updated);
    saveToStorage(STORAGE_KEYS.DISPOSISI, updated);
    cloudSync.saveDisposisi(newItem);

    // Update parent surat masuk status
    updateSuratMasuk(data.surat_masuk_id, { status_disposisi: "sudah_disposisi" });

    addToast(
      "success",
      "Disposisi Berhasil Dibuat",
      `Disposisi ditujukan kepada ${data.penerima_nama}.`
    );
    return newItem;
  };

  const updateDisposisi = (id: string, partial: Partial<Disposisi>) => {
    const updated = disposisi.map((d) => (d.id === id ? { ...d, ...partial } : d));
    setDisposisi(updated);
    saveToStorage(STORAGE_KEYS.DISPOSISI, updated);
    const target = updated.find((d) => d.id === id);
    if (target) cloudSync.saveDisposisi(target);
    addToast("info", "Disposisi Diperbarui", "Perubahan data disposisi telah disimpan.");
  };

  const updateDisposisiStatus = (id: string, status: StatusDisposisi, tanggapan?: string) => {
    const updated = disposisi.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          status,
          tanggapan: tanggapan !== undefined ? tanggapan : d.tanggapan,
          tanggal_selesai: status === "selesai" ? new Date().toISOString() : d.tanggal_selesai,
        };
      }
      return d;
    });
    setDisposisi(updated);
    saveToStorage(STORAGE_KEYS.DISPOSISI, updated);
    const target = updated.find((d) => d.id === id);
    if (target) cloudSync.saveDisposisi(target);
    addToast(
      "success",
      "Status Disposisi Diperbarui",
      `Disposisi kini berstatus: ${status === "selesai" ? "Selesai" : status === "proses" ? "Sedang Diproses" : "Menunggu"}`
    );
  };

  const deleteDisposisi = (id: string) => {
    markDeletedId(DELETED_KEYS.DISPOSISI, id);
    const updated = disposisi.filter((d) => d.id !== id);
    setDisposisi(updated);
    saveToStorage(STORAGE_KEYS.DISPOSISI, updated);
    cloudSync.deleteDisposisi(id);
    addToast("info", "Disposisi Dihapus", "Data disposisi telah dihapus.");
  };

  // Master Perspektif Actions
  const addPerspektif = (data: Omit<MasterPerspektif, "id" | "created_at">) => {
    const newItem: MasterPerspektif = {
      ...data,
      id: "perspektif-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    unmarkDeletedId(DELETED_KEYS.PERSPEKTIF, newItem.id);
    const updated = [...perspektif, newItem];
    setPerspektif(updated);
    saveToStorage(STORAGE_KEYS.PERSPEKTIF, updated);
    cloudSync.savePerspektif(newItem);
    addToast("success", "Perspektif Ditambahkan", `Perspektif ${data.kode} berhasil dibuat.`);
  };

  const updatePerspektif = (id: string, partial: Partial<MasterPerspektif>) => {
    const updated = perspektif.map((p) => (p.id === id ? { ...p, ...partial } : p));
    setPerspektif(updated);
    saveToStorage(STORAGE_KEYS.PERSPEKTIF, updated);
    const target = updated.find((p) => p.id === id);
    if (target) cloudSync.savePerspektif(target);
    addToast("info", "Perspektif Diperbarui", "Data perspektif RKT berhasil diubah.");
  };

  const deletePerspektif = (id: string) => {
    markDeletedId(DELETED_KEYS.PERSPEKTIF, id);
    const updated = perspektif.filter((p) => p.id !== id);
    setPerspektif(updated);
    saveToStorage(STORAGE_KEYS.PERSPEKTIF, updated);
    cloudSync.deletePerspektif(id);
    addToast("info", "Perspektif Dihapus", "Data perspektif telah dihapus.");
  };

  // RKT Actions
  const addRKT = (data: Omit<RKT, "id" | "status" | "created_at">) => {
    const newItem: RKT = {
      ...data,
      id: "rkt-" + Date.now(),
      status: "menunggu_persetujuan",
      created_at: new Date().toISOString(),
    };
    unmarkDeletedId(DELETED_KEYS.RKT, newItem.id);
    const updated = [newItem, ...rkt];
    setRkt(updated);
    saveToStorage(STORAGE_KEYS.RKT, updated);
    cloudSync.saveRKT(newItem);
    addToast(
      "success",
      "RKT Diajukan",
      "Rencana kerja tahunan berhasil disimpan dengan status Menunggu Persetujuan."
    );
  };

  const approveRKT = (id: string) => {
    const updated = rkt.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: "disetujui" as StatusRKT,
          approved_at: new Date().toISOString(),
          catatan_revisi: undefined,
        };
      }
      return item;
    });
    setRkt(updated);
    saveToStorage(STORAGE_KEYS.RKT, updated);
    const target = updated.find((r) => r.id === id);
    if (target) cloudSync.saveRKT(target);
    addToast("success", "RKT Disetujui", "Rencana kegiatan disetujui dan siap dibuatkan Action Plan.");
  };

  const rejectRKT = (id: string, catatanRevisi: string) => {
    const updated = rkt.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: "ditolak" as StatusRKT,
          catatan_revisi: catatanRevisi,
        };
      }
      return item;
    });
    setRkt(updated);
    saveToStorage(STORAGE_KEYS.RKT, updated);
    const target = updated.find((r) => r.id === id);
    if (target) cloudSync.saveRKT(target);
    addToast("warning", "RKT Ditolak / Perlu Revisi", "Catatan telah dikirimkan ke Kasubag pengusul.");
  };

  const updateRKT = (id: string, partial: Partial<RKT>) => {
    const updated = rkt.map((item) => (item.id === id ? { ...item, ...partial } : item));
    setRkt(updated);
    saveToStorage(STORAGE_KEYS.RKT, updated);
    const target = updated.find((r) => r.id === id);
    if (target) cloudSync.saveRKT(target);
    addToast("info", "RKT Diperbarui", "Rencana kerja tahunan telah disimpan kembali.");
  };

  const deleteRKT = (id: string) => {
    markDeletedId(DELETED_KEYS.RKT, id);
    const updated = rkt.filter((item) => item.id !== id);
    setRkt(updated);
    saveToStorage(STORAGE_KEYS.RKT, updated);
    cloudSync.deleteRKT(id);
    addToast("info", "RKT Dihapus", "Rencana kerja tahunan telah dihapus.");
  };

  // Action Plans
  const addActionPlan = (data: Omit<ActionPlan, "id" | "created_at">) => {
    const newItem: ActionPlan = {
      ...data,
      id: "ap-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    unmarkDeletedId(DELETED_KEYS.ACTION_PLANS, newItem.id);
    const updated = [newItem, ...actionPlans];
    setActionPlans(updated);
    saveToStorage(STORAGE_KEYS.ACTION_PLANS, updated);
    cloudSync.deleteActionPlan(newItem.id);
    cloudSync.saveActionPlan(newItem);
    addToast("success", "Action Plan Dibuat", `Kegiatan "${data.nama_kegiatan}" berhasil ditambahkan.`);
  };

  const updateActionPlan = (id: string, partial: Partial<ActionPlan>) => {
    const updated = actionPlans.map((ap) => (ap.id === id ? { ...ap, ...partial } : ap));
    setActionPlans(updated);
    saveToStorage(STORAGE_KEYS.ACTION_PLANS, updated);
    const target = updated.find((a) => a.id === id);
    if (target) cloudSync.saveActionPlan(target);
    addToast("info", "Action Plan Diperbarui", "Data kegiatan bulanan telah disimpan.");
  };

  const deleteActionPlan = (id: string) => {
    markDeletedId(DELETED_KEYS.ACTION_PLANS, id);
    const updated = actionPlans.filter((ap) => ap.id !== id);
    setActionPlans(updated);
    saveToStorage(STORAGE_KEYS.ACTION_PLANS, updated);
    cloudSync.deleteActionPlan(id);
    addToast("info", "Action Plan Dihapus", "Kegiatan rencana aksi telah dihapus.");
  };

  // Action Reports
  const addActionReport = (data: Omit<ActionReport, "id" | "created_at">) => {
    const existingIndex = actionReports.findIndex((r) => r.action_plan_id === data.action_plan_id);
    let updated: ActionReport[];
    let targetItem: ActionReport;

    if (existingIndex >= 0) {
      updated = [...actionReports];
      targetItem = {
        ...data,
        id: actionReports[existingIndex].id,
        created_at: new Date().toISOString(),
      };
      updated[existingIndex] = targetItem;
    } else {
      targetItem = {
        ...data,
        id: "ar-" + Date.now(),
        created_at: new Date().toISOString(),
      };
      updated = [targetItem, ...actionReports];
    }
    setActionReports(updated);
    saveToStorage(STORAGE_KEYS.ACTION_REPORTS, updated);
    cloudSync.saveActionReport(targetItem);
    addToast("success", "Laporan Kegiatan Disimpan", "Ketercapaian action report berhasil diperbarui.");
  };

  const updateActionReport = (id: string, partial: Partial<ActionReport>) => {
    const updated = actionReports.map((ar) => (ar.id === id ? { ...ar, ...partial } : ar));
    setActionReports(updated);
    saveToStorage(STORAGE_KEYS.ACTION_REPORTS, updated);
    const target = updated.find((r) => r.id === id);
    if (target) cloudSync.saveActionReport(target);
    addToast("info", "Laporan Diperbarui", "Data laporan berhasil diubah.");
  };

  // Safe background cloud sync for notulen rapat (using master_perspektif sync row)
  const syncNotulenToCloud = async (list: NotulenRapat[]) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const payload = {
        notulen: list,
        updatedAt: new Date().toISOString(),
      };
      await supabase.from("master_perspektif").upsert({
        id: NOTULEN_CLOUD_ROW_ID,
        kode: NOTULEN_CLOUD_KODE,
        nama: "Cloud Sync Notulen Rapat Dinas",
        deskripsi: JSON.stringify(payload),
        is_active: false,
      });
    } catch (err) {
      console.warn("Failed to sync notulen to cloud:", err);
    }
  };

  // Notulen Rapat Actions
  const addNotulen = (data: Omit<NotulenRapat, "id" | "created_at">): NotulenRapat => {
    const newItem: NotulenRapat = {
      ...data,
      id: "notulen-" + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    unmarkDeletedId(DELETED_KEYS.NOTULEN, newItem.id);
    const updated = [newItem, ...notulenList];
    setNotulenList(updated);
    saveToStorage(STORAGE_KEYS.NOTULEN, updated);
    saveIndexedDBNotulen(updated);
    syncNotulenToCloud(updated);
    addToast(
      "success",
      "Notulen Rapat Dibuat",
      `Notulen "${data.jenis_rapat}" berhasil disimpan.`
    );
    return newItem;
  };

  const updateNotulen = (id: string, partial: Partial<NotulenRapat>) => {
    const updated = notulenList.map((n) =>
      n.id === id ? { ...n, ...partial, updated_at: new Date().toISOString() } : n
    );
    setNotulenList(updated);
    saveToStorage(STORAGE_KEYS.NOTULEN, updated);
    saveIndexedDBNotulen(updated);
    syncNotulenToCloud(updated);
    addToast("info", "Notulen Diperbarui", "Perubahan data notulen rapat telah disimpan.");
  };

  const deleteNotulen = (id: string) => {
    markDeletedId(DELETED_KEYS.NOTULEN, id);
    const updated = notulenList.filter((n) => n.id !== id);
    setNotulenList(updated);
    saveToStorage(STORAGE_KEYS.NOTULEN, updated);
    saveIndexedDBNotulen(updated);
    syncNotulenToCloud(updated);
    addToast("info", "Notulen Dihapus", "Data notulen rapat telah dihapus.");
  };

  const approveNotulen = (id: string, kepsekName: string) => {
    const updated = notulenList.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          status: "disetujui" as const,
          is_approved_by_kepsek: true,
          approved_at: new Date().toISOString(),
          approved_by_name: kepsekName,
          has_ttd_kepsek: true,
          has_stempel: true,
          updated_at: new Date().toISOString(),
        };
      }
      return n;
    });
    setNotulenList(updated);
    saveToStorage(STORAGE_KEYS.NOTULEN, updated);
    saveIndexedDBNotulen(updated);
    syncNotulenToCloud(updated);
    addToast(
      "success",
      "Notulen Disetujui & Disahkan",
      "Notulen rapat telah diverifikasi dan disahkan oleh Kepala Sekolah."
    );
  };

  const toggleActionItemStatus = (notulenId: string, actionItemId: string) => {
    const updated = notulenList.map((n) => {
      if (n.id === notulenId) {
        const updatedItems = n.action_items.map((item) => {
          if (item.id === actionItemId) {
            return {
              ...item,
              status: (item.status === "selesai" ? "pending" : "selesai") as "pending" | "selesai",
            };
          }
          return item;
        });
        return { ...n, action_items: updatedItems, updated_at: new Date().toISOString() };
      }
      return n;
    });
    setNotulenList(updated);
    saveToStorage(STORAGE_KEYS.NOTULEN, updated);
    saveIndexedDBNotulen(updated);
    syncNotulenToCloud(updated);
  };

  // Safe background cloud sync for dokumentasi kegiatan (using master_perspektif sync row)
  const syncDokumentasiToCloud = async (list: DokumentasiKegiatan[]) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const payload = {
        albums: list,
        updatedAt: new Date().toISOString(),
      };
      await supabase.from("master_perspektif").upsert({
        id: DOKUMENTASI_CLOUD_ROW_ID,
        kode: DOKUMENTASI_CLOUD_KODE,
        nama: "Cloud Sync Dokumentasi Kegiatan Sekolah",
        deskripsi: JSON.stringify(payload),
        is_active: false,
      });
    } catch (err) {
      console.warn("Failed to sync dokumentasi to cloud:", err);
    }
  };

  // Dokumentasi Kegiatan Actions
  const addDokumentasi = (data: Omit<DokumentasiKegiatan, "id" | "created_at">): DokumentasiKegiatan => {
    const newItem: DokumentasiKegiatan = {
      ...data,
      id: "dok-" + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    unmarkDeletedId(DELETED_KEYS.DOKUMENTASI, newItem.id);
    const updated = [newItem, ...dokumentasiList];
    setDokumentasiList(updated);
    saveToStorage(STORAGE_KEYS.DOKUMENTASI, updated);
    saveIndexedDBDokumentasi(updated);
    syncDokumentasiToCloud(updated);
    addToast(
      "success",
      "Dokumentasi Berhasil Diunggah",
      `Dokumentasi "${data.judul_kegiatan}" berhasil disimpan.`
    );
    return newItem;
  };

  const updateDokumentasi = (id: string, partial: Partial<DokumentasiKegiatan>) => {
    const updated = dokumentasiList.map((d) =>
      d.id === id ? { ...d, ...partial, updated_at: new Date().toISOString() } : d
    );
    setDokumentasiList(updated);
    saveToStorage(STORAGE_KEYS.DOKUMENTASI, updated);
    saveIndexedDBDokumentasi(updated);
    syncDokumentasiToCloud(updated);
    addToast("info", "Dokumentasi Diperbarui", "Perubahan album dokumentasi telah disimpan.");
  };

  const deleteDokumentasi = (id: string) => {
    markDeletedId(DELETED_KEYS.DOKUMENTASI, id);
    const updated = dokumentasiList.filter((d) => d.id !== id);
    setDokumentasiList(updated);
    saveToStorage(STORAGE_KEYS.DOKUMENTASI, updated);
    saveIndexedDBDokumentasi(updated);
    syncDokumentasiToCloud(updated);
    addToast("info", "Dokumentasi Dihapus", "Album dokumentasi kegiatan telah dihapus.");
  };

  // School Settings Actions (Logo, Stempel, TTD)
  const updateSchoolSettings = async (partial: Partial<SchoolSettings>) => {
    const updated: SchoolSettings = { ...schoolSettings, ...partial };
    setSchoolSettings(updated);
    saveToStorage(STORAGE_KEYS.SCHOOL_SETTINGS, updated);

    // Save to unlimited IndexedDB layer
    await saveIndexedDBSettings(updated);

    // Sync to Supabase Cloud (user-kepsek row stores settings JSON and native urls)
    if (isSupabaseConfigured && supabase) {
      try {
        let kepsekPass = partial.password;
        if (!kepsekPass) {
          try {
            const { data: existingKepsek } = await supabase
              .from("users")
              .select("avatar")
              .eq("id", "user-kepsek")
              .single();
            if (existingKepsek?.avatar && existingKepsek.avatar.startsWith("{")) {
              const parsed = JSON.parse(existingKepsek.avatar);
              if (parsed.password) kepsekPass = parsed.password;
            }
          } catch {}
        }
        if (!kepsekPass) kepsekPass = "14215094";

        const kepsekPayload = {
          name: updated.namaKepsek || "Mokhamat Ekhsan, S.Kom",
          nip: updated.niyKepsek || "14215094",
          email: "ekhsan.design@gmail.com",
          phone: "6281333400702",
          role: "kepala_sekolah" as const,
          jabatan: "Kepala SMK Bayt Al-Hikmah",
          ttd_url: updated.ttdKepsekUrl || null,
          stempel_url: updated.stempelUrl || null,
          avatar: JSON.stringify({ ...updated, password: kepsekPass, url: updated.logoSmkUrl }),
        };

        const { error: updateErr } = await supabase
          .from("users")
          .update(kepsekPayload)
          .eq("id", "user-kepsek");

        if (updateErr) {
          console.warn("Update user-kepsek failed, trying upsert:", updateErr);
          await supabase.from("users").upsert({
            id: "user-kepsek",
            ...kepsekPayload,
          });
        }
      } catch (e) {
        console.warn("Failed to sync school settings to Supabase:", e);
      }
    }

    // Also update all approved letters in state & storage so any existing surat immediately reflects new signature & stamp
    setSuratKeluar((prev) => {
      const updatedSK = prev.map((s) => {
        if (s.status === "disetujui" || s.has_ttd || s.has_stempel) {
          return {
            ...s,
            ttd_image_url: partial.ttdKepsekUrl || s.ttd_image_url || updated.ttdKepsekUrl,
            stempel_image_url: partial.stempelUrl || s.stempel_image_url || updated.stempelUrl,
            approver_name: partial.namaKepsek || s.approver_name || updated.namaKepsek,
          };
        }
        return s;
      });
      saveToStorage(STORAGE_KEYS.SURAT_KELUAR, updatedSK);
      return updatedSK;
    });

    addToast("success", "Pengaturan Surat Disimpan", "Logo, stempel, dan tanda tangan berhasil diperbarui dan tersimpan permanen.");
  };

  const resetSchoolSettings = async () => {
    setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    saveToStorage(STORAGE_KEYS.SCHOOL_SETTINGS, DEFAULT_SCHOOL_SETTINGS);

    // Reset IndexedDB
    await saveIndexedDBSettings(DEFAULT_SCHOOL_SETTINGS);

    // Reset Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("users")
          .update({
            avatar: JSON.stringify(DEFAULT_SCHOOL_SETTINGS),
            ttd_url: null,
            stempel_url: null,
            name: DEFAULT_SCHOOL_SETTINGS.namaKepsek,
            nip: DEFAULT_SCHOOL_SETTINGS.niyKepsek,
          })
          .eq("id", "user-kepsek");
      } catch (e) {
        console.warn("Failed to reset settings in Supabase:", e);
      }
    }

    // Revert approved letters' stamp and signature to default seed values
    setSuratKeluar((prev) => {
      const updatedSK = prev.map((s) => {
        if (s.status === "disetujui" || s.has_ttd || s.has_stempel) {
          return {
            ...s,
            ttd_image_url: DEFAULT_SCHOOL_SETTINGS.ttdKepsekUrl,
            stempel_image_url: DEFAULT_SCHOOL_SETTINGS.stempelUrl,
            approver_name: DEFAULT_SCHOOL_SETTINGS.namaKepsek,
          };
        }
        return s;
      });
      saveToStorage(STORAGE_KEYS.SURAT_KELUAR, updatedSK);
      return updatedSK;
    });

    addToast("info", "Pengaturan Direset", "Logo, stempel, dan tanda tangan resmi bawaan sekolah telah dipulihkan.");
  };

  // Reset to default seeders
  const resetAllData = () => {
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      Object.values(DELETED_KEYS).forEach((k) => localStorage.removeItem(k));
    }
    setSuratKeluar(INITIAL_SURAT_KELUAR);
    setSuratMasuk(INITIAL_SURAT_MASUK);
    setDisposisi(INITIAL_DISPOSISI);
    setPerspektif(INITIAL_PERSPEKTIF);
    setRkt(INITIAL_RKT);
    setActionPlans(INITIAL_ACTION_PLANS);
    setActionReports(INITIAL_ACTION_REPORTS);
    setNotulenList(INITIAL_NOTULEN_RAPAT);
    setDokumentasiList(INITIAL_DOKUMENTASI);
    saveIndexedDBDokumentasi(INITIAL_DOKUMENTASI);
    saveIndexedDBNotulen(INITIAL_NOTULEN_RAPAT);
    addToast("info", "Data Demo Direset", "Semua data telah dikembalikan ke kondisi awal seeder.");
  };

  return (
    <AppDataContext.Provider
      value={{
        isCloudConnected,
        syncWithCloud,
        schoolSettings,
        updateSchoolSettings,
        resetSchoolSettings,
        suratKeluar,
        suratMasuk,
        disposisi,
        perspektif,
        rkt,
        actionPlans,
        actionReports,
        notulenList,
        dokumentasiList,
        toasts,
        addSuratKeluar,
        updateSuratKeluar,
        approveSuratKeluar,
        rejectSuratKeluar,
        deleteSuratKeluar,
        addSuratMasuk,
        updateSuratMasuk,
        deleteSuratMasuk,
        createDisposisi,
        updateDisposisi,
        updateDisposisiStatus,
        deleteDisposisi,
        addPerspektif,
        updatePerspektif,
        deletePerspektif,
        addRKT,
        approveRKT,
        rejectRKT,
        updateRKT,
        deleteRKT,
        addActionPlan,
        updateActionPlan,
        deleteActionPlan,
        addActionReport,
        updateActionReport,
        addNotulen,
        updateNotulen,
        deleteNotulen,
        approveNotulen,
        toggleActionItemStatus,
        addDokumentasi,
        updateDokumentasi,
        deleteDokumentasi,
        addToast,
        removeToast,
        resetAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
