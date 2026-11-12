"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  PresensiPeriodReport,
  TeacherAttendanceSummary,
  StatusKehadiran,
} from "@/lib/presensi.types";
import {
  generateOfficialSamplePeriod,
  parseFingerprintFile,
} from "@/lib/presensiParser";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface PresensiContextType {
  currentReport: PresensiPeriodReport | null;
  allReports: PresensiPeriodReport[];
  isProcessing: boolean;
  isCloudSynced: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  processUpload: (
    file: File,
    options?: { bulan?: string; tahun?: number; cutOffStart?: string; cutOffEnd?: string }
  ) => Promise<PresensiPeriodReport>;
  updateTeacherAttendance: (teacherId: string, partial: Partial<TeacherAttendanceSummary>) => void;
  updateDailyStatus: (teacherId: string, tanggal: string, status: StatusKehadiran, keterangan?: string) => void;
  selectReport: (reportId: string) => void;
  deleteReport: (reportId: string) => Promise<void>;
  resetToSample: () => void;
  syncFromCloud: () => Promise<void>;
}

const PresensiContext = createContext<PresensiContextType | undefined>(undefined);

const STORAGE_KEY_PRESENSI = "sigap_smk_presensi_reports";
const STORAGE_KEY_CURRENT_ID = "sigap_smk_presensi_active_id";
const PRESENSI_CLOUD_ROW_ID = "presensi-cloud-data";

export function PresensiProvider({ children }: { children: React.ReactNode }) {
  const [allReports, setAllReports] = useState<PresensiPeriodReport[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PRESENSI);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error("Failed to parse presensi reports from storage", e);
      }
    }
    return [];
  });

  const [currentReportId, setCurrentReportId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem(STORAGE_KEY_CURRENT_ID);
      if (active) return active;
    }
    return "";
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const currentReport: PresensiPeriodReport | null =
    allReports.find((r) => r.id === currentReportId) || allReports[0] || null;

  // Save to both LocalStorage and Supabase Cloud
  const saveReportsState = async (list: PresensiPeriodReport[], activeId?: string) => {
    setAllReports(list);
    const targetActiveId = activeId !== undefined ? activeId : (list[0]?.id || "");
    setCurrentReportId(targetActiveId);

    // 1. LocalStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_PRESENSI, JSON.stringify(list));
        if (targetActiveId) {
          localStorage.setItem(STORAGE_KEY_CURRENT_ID, targetActiveId);
        } else {
          localStorage.removeItem(STORAGE_KEY_CURRENT_ID);
        }
      } catch (e) {
        console.warn("Failed to save presensi reports to localStorage", e);
      }
    }

    // 2. Supabase Cloud (Synchronize across all computers & browsers)
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          reports: list,
          activeId: targetActiveId,
          updatedAt: new Date().toISOString(),
        };

        const { error } = await supabase.from("master_perspektif").upsert({
          id: PRESENSI_CLOUD_ROW_ID,
          kode: "PRESENSI_SYNC",
          nama: "Cloud Sync Presensi Guru SMK",
          deskripsi: JSON.stringify(payload),
          is_active: false,
        });

        if (!error) {
          setIsCloudSynced(true);
          setLastSyncedAt(new Date().toISOString());
        } else {
          console.warn("Supabase presensi cloud sync error:", error);
        }
      } catch (cloudErr) {
        console.warn("Exception during presensi cloud sync:", cloudErr);
      }
    }
  };

  // Pull latest data from Supabase Cloud
  const syncFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      setIsSyncing(true);
      const { data, error } = await supabase
        .from("master_perspektif")
        .select("deskripsi, updated_at")
        .eq("id", PRESENSI_CLOUD_ROW_ID)
        .single();

      if (!error && data?.deskripsi) {
        try {
          const parsed = JSON.parse(data.deskripsi);
          if (parsed && Array.isArray(parsed.reports)) {
            setAllReports(parsed.reports);
            const active = parsed.activeId || (parsed.reports[0]?.id || "");
            setCurrentReportId(active);
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY_PRESENSI, JSON.stringify(parsed.reports));
              if (active) {
                localStorage.setItem(STORAGE_KEY_CURRENT_ID, active);
              } else {
                localStorage.removeItem(STORAGE_KEY_CURRENT_ID);
              }
            }
            setIsCloudSynced(true);
            setLastSyncedAt(data.updated_at || parsed.updatedAt || new Date().toISOString());
          }
        } catch (jsonErr) {
          console.warn("Failed to parse cloud presensi JSON:", jsonErr);
        }
      }
    } catch (err) {
      console.warn("Failed to sync presensi from cloud:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync on mount and on window focus
  useEffect(() => {
    syncFromCloud();

    const handleFocus = () => {
      syncFromCloud();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncFromCloud]);

  const processUpload = async (
    file: File,
    options?: { bulan?: string; tahun?: number; cutOffStart?: string; cutOffEnd?: string }
  ): Promise<PresensiPeriodReport> => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const report = await parseFingerprintFile(buffer, file.name, options);

      const updatedList = [report, ...allReports.filter((r) => r.id !== report.id)];
      await saveReportsState(updatedList, report.id);
      return report;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTeacherAttendance = (teacherId: string, partial: Partial<TeacherAttendanceSummary>) => {
    if (!currentReport) return;

    const updatedTeachers = currentReport.teachers.map((t) => {
      if (t.id === teacherId) {
        const merged = { ...t, ...partial };
        // Recalculate KKM if terlambat changed
        if (partial.totalTerlambatHari !== undefined || partial.totalHadir !== undefined) {
          const hadir = merged.totalHadir;
          const telat = merged.totalTerlambatHari;
          merged.persentaseTerlambat = hadir > 0 ? Number(((telat / hadir) * 100).toFixed(1)) : 0;
          merged.statusKkm = merged.persentaseTerlambat >= 50.0 ? "TIDAK KKM" : "KKM";
        }
        return merged;
      }
      return t;
    });

    const tidakKkmCount = updatedTeachers.filter((t) => t.statusKkm === "TIDAK KKM").length;
    const updatedReport: PresensiPeriodReport = {
      ...currentReport,
      teachers: updatedTeachers,
      guruTidakKkmCount: tidakKkmCount,
    };

    const updatedList = allReports.map((r) => (r.id === updatedReport.id ? updatedReport : r));
    saveReportsState(updatedList);
  };

  const updateDailyStatus = (
    teacherId: string,
    tanggal: string,
    status: StatusKehadiran,
    keterangan?: string
  ) => {
    if (!currentReport) return;
    const teacher = currentReport.teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const updatedDaily = teacher.dailyDetails.map((d) => {
      if (d.tanggal === tanggal) {
        return {
          ...d,
          status,
          keterangan: keterangan !== undefined ? keterangan : d.keterangan,
        };
      }
      return d;
    });

    // Recompute totals
    let hadir = 0;
    let telatHari = 0;
    let telatMenit = 0;
    let izin = 0;
    let sakit = 0;
    let alpha = 0;

    updatedDaily.forEach((d) => {
      if (d.status === "hadir" || d.status === "terlambat") hadir++;
      if (d.status === "terlambat" || d.terlambatMenit > 0) {
        telatHari++;
        telatMenit += d.terlambatMenit;
      }
      if (d.status === "izin") izin++;
      if (d.status === "sakit") sakit++;
      if (d.status === "alpha") alpha++;
    });

    const persentase = hadir > 0 ? Number(((telatHari / hadir) * 100).toFixed(1)) : 0;
    const statusKkm = persentase >= 50.0 ? "TIDAK KKM" : "KKM";

    updateTeacherAttendance(teacherId, {
      totalHadir: hadir,
      totalTerlambatHari: telatHari,
      totalMenitTerlambat: telatMenit,
      persentaseTerlambat: persentase,
      statusKkm,
      totalIzin: izin,
      totalSakit: sakit,
      totalAlpha: alpha,
      dailyDetails: updatedDaily,
    });
  };

  const selectReport = (reportId: string) => {
    const found = allReports.find((r) => r.id === reportId);
    if (found) {
      setCurrentReportId(found.id);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CURRENT_ID, found.id);
      }
      saveReportsState(allReports, found.id);
    }
  };

  const deleteReport = async (reportId: string) => {
    const filtered = allReports.filter((r) => r.id !== reportId);
    const nextActive = filtered[0]?.id || "";
    await saveReportsState(filtered, nextActive);
  };

  const resetToSample = () => {
    const sample = generateOfficialSamplePeriod();
    saveReportsState([sample], sample.id);
  };

  return (
    <PresensiContext.Provider
      value={{
        currentReport,
        allReports,
        isProcessing,
        isCloudSynced,
        isSyncing,
        lastSyncedAt,
        processUpload,
        updateTeacherAttendance,
        updateDailyStatus,
        selectReport,
        deleteReport,
        resetToSample,
        syncFromCloud,
      }}
    >
      {children}
    </PresensiContext.Provider>
  );
}

export function usePresensi() {
  const context = useContext(PresensiContext);
  if (!context) {
    throw new Error("usePresensi must be used within a PresensiProvider");
  }
  return context;
}
