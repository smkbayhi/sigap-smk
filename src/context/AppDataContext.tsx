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
} from "@/lib/database.types";
import {
  INITIAL_PERSPEKTIF,
  INITIAL_SURAT_KELUAR,
  INITIAL_SURAT_MASUK,
  INITIAL_DISPOSISI,
  INITIAL_RKT,
  INITIAL_ACTION_PLANS,
  INITIAL_ACTION_REPORTS,
  DEFAULT_SCHOOL_SETTINGS,
  TTD_KEPSEK_DATA_URL,
  STEMPEL_SEKOLAH_DATA_URL,
} from "@/lib/seedData";
import { generateNomorSurat } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { cloudSync } from "@/lib/supabaseSync";

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
  toasts: ToastMessage[];

  // School & Letter Settings (Logo, Stempel, TTD)
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (settings: Partial<SchoolSettings>) => void;
  resetSchoolSettings: () => void;

  // Actions: Surat Keluar
  addSuratKeluar: (data: Omit<SuratKeluar, "id" | "no_urut" | "nomor_surat" | "bulan_romawi" | "tahun" | "created_at">) => SuratKeluar;
  updateSuratKeluar: (id: string, partial: Partial<SuratKeluar>) => void;
  approveSuratKeluar: (
    id: string,
    kepsekName: string,
    options?: { customTtd?: string; includeStamp?: boolean }
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
  SCHOOL_SETTINGS: "sigap_smk_school_settings",
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>(INITIAL_SURAT_KELUAR);
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>(INITIAL_SURAT_MASUK);
  const [disposisi, setDisposisi] = useState<Disposisi[]>(INITIAL_DISPOSISI);
  const [perspektif, setPerspektif] = useState<MasterPerspektif[]>(INITIAL_PERSPEKTIF);
  const [rkt, setRkt] = useState<RKT[]>(INITIAL_RKT);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>(INITIAL_ACTION_PLANS);
  const [actionReports, setActionReports] = useState<ActionReport[]>(INITIAL_ACTION_REPORTS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(isSupabaseConfigured);

  // Helper save to localStorage
  const saveToStorage = (key: string, data: unknown) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error("Storage save failed", e);
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
    if (!isSupabaseConfigured) return;
    try {
      const cloudData = await cloudSync.fetchAll();
      if (cloudData) {
        setIsCloudConnected(true);
        if (cloudData.suratKeluar && cloudData.suratKeluar.length > 0) {
          setSuratKeluar(cloudData.suratKeluar);
          saveToStorage(STORAGE_KEYS.SURAT_KELUAR, cloudData.suratKeluar);
        }
        if (cloudData.suratMasuk && cloudData.suratMasuk.length > 0) {
          setSuratMasuk(cloudData.suratMasuk);
          saveToStorage(STORAGE_KEYS.SURAT_MASUK, cloudData.suratMasuk);
        }
        if (cloudData.disposisi && cloudData.disposisi.length > 0) {
          setDisposisi(cloudData.disposisi);
          saveToStorage(STORAGE_KEYS.DISPOSISI, cloudData.disposisi);
        }
        if (cloudData.perspektif && cloudData.perspektif.length > 0) {
          setPerspektif(cloudData.perspektif);
          saveToStorage(STORAGE_KEYS.PERSPEKTIF, cloudData.perspektif);
        }
        if (cloudData.rkt && cloudData.rkt.length > 0) {
          setRkt(cloudData.rkt);
          saveToStorage(STORAGE_KEYS.RKT, cloudData.rkt);
        }
        if (cloudData.actionPlans && cloudData.actionPlans.length > 0) {
          setActionPlans(cloudData.actionPlans);
          saveToStorage(STORAGE_KEYS.ACTION_PLANS, cloudData.actionPlans);
        }
        if (cloudData.actionReports && cloudData.actionReports.length > 0) {
          setActionReports(cloudData.actionReports);
          saveToStorage(STORAGE_KEYS.ACTION_REPORTS, cloudData.actionReports);
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
        const storedSK = localStorage.getItem(STORAGE_KEYS.SURAT_KELUAR);
        if (storedSK) setSuratKeluar(JSON.parse(storedSK));

        const storedSM = localStorage.getItem(STORAGE_KEYS.SURAT_MASUK);
        if (storedSM) {
          const parsed = JSON.parse(storedSM);
          const sanitized = parsed.map((item: any) => {
            if (item.file_url && item.file_url.includes("unsplash.com")) {
              return { ...item, file_url: "" };
            }
            return item;
          });
          setSuratMasuk(sanitized);
        }

        const storedDisp = localStorage.getItem(STORAGE_KEYS.DISPOSISI);
        if (storedDisp) setDisposisi(JSON.parse(storedDisp));

        const storedPers = localStorage.getItem(STORAGE_KEYS.PERSPEKTIF);
        if (storedPers) setPerspektif(JSON.parse(storedPers));

        const storedRkt = localStorage.getItem(STORAGE_KEYS.RKT);
        if (storedRkt) setRkt(JSON.parse(storedRkt));

        const storedAP = localStorage.getItem(STORAGE_KEYS.ACTION_PLANS);
        if (storedAP) setActionPlans(JSON.parse(storedAP));

        const storedAR = localStorage.getItem(STORAGE_KEYS.ACTION_REPORTS);
        if (storedAR) setActionReports(JSON.parse(storedAR));

        const storedSettings = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
        if (storedSettings) setSchoolSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Failed to load initial data from storage", e);
      }
    }

    // Try cloud sync if configured
    if (isSupabaseConfigured) {
      syncWithCloud();
    }
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
    const nomor = generateNomorSurat(nextNoUrut, now);

    const newItem: SuratKeluar = {
      ...data,
      id: "sk-" + Date.now(),
      no_urut: nextNoUrut,
      nomor_surat: nomor,
      bulan_romawi: "XI",
      tahun: currentYear,
      created_at: new Date().toISOString(),
    };

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
    options?: { customTtd?: string; includeStamp?: boolean }
  ) => {
    const activeTtd = options?.customTtd || schoolSettings.ttdKepsekUrl || TTD_KEPSEK_DATA_URL;
    const activeStempel = schoolSettings.stempelUrl || STEMPEL_SEKOLAH_DATA_URL;
    const shouldIncludeStamp = options?.includeStamp !== undefined ? options.includeStamp : true;
    const activeKepsekName = schoolSettings.namaKepsek || kepsekName;

    const updated = suratKeluar.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: "disetujui" as StatusSuratKeluar,
          approved_by: "user-kepsek",
          approver_name: activeKepsekName,
          approved_at: new Date().toISOString(),
          has_ttd: true,
          has_stempel: shouldIncludeStamp,
          ttd_image_url: activeTtd,
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
      "Surat Telah Disetujui & Diberi TTD Digital",
      "Tanda Tangan dan Stempel resmi sekolah telah tersemat secara sah."
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
    const updated = suratMasuk.filter((item) => item.id !== id);
    setSuratMasuk(updated);
    saveToStorage(STORAGE_KEYS.SURAT_MASUK, updated);
    cloudSync.deleteSuratMasuk(id);
    addToast("info", "Surat Dihapus", "Surat masuk telah dihapus dari arsip.");
  };

  // Disposisi Actions
  const createDisposisi = (data: Omit<Disposisi, "id" | "created_at">) => {
    const newItem: Disposisi = {
      ...data,
      id: "disp-" + Date.now(),
      created_at: new Date().toISOString(),
    };
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
    const updated = [newItem, ...actionPlans];
    setActionPlans(updated);
    saveToStorage(STORAGE_KEYS.ACTION_PLANS, updated);
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

  // School Settings Actions (Logo, Stempel, TTD)
  const updateSchoolSettings = (partial: Partial<SchoolSettings>) => {
    const updated = { ...schoolSettings, ...partial };
    setSchoolSettings(updated);
    saveToStorage(STORAGE_KEYS.SCHOOL_SETTINGS, updated);

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

    addToast("success", "Pengaturan Surat Disimpan", "Logo, stempel, dan tanda tangan berhasil diperbarui.");
  };

  const resetSchoolSettings = () => {
    setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    saveToStorage(STORAGE_KEYS.SCHOOL_SETTINGS, DEFAULT_SCHOOL_SETTINGS);

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
    }
    setSuratKeluar(INITIAL_SURAT_KELUAR);
    setSuratMasuk(INITIAL_SURAT_MASUK);
    setDisposisi(INITIAL_DISPOSISI);
    setPerspektif(INITIAL_PERSPEKTIF);
    setRkt(INITIAL_RKT);
    setActionPlans(INITIAL_ACTION_PLANS);
    setActionReports(INITIAL_ACTION_REPORTS);
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
