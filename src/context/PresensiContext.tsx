"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  PresensiPeriodReport,
  TeacherAttendanceSummary,
  StatusKehadiran,
} from "@/lib/presensi.types";
import {
  generateOfficialSamplePeriod,
  parseFingerprintFile,
} from "@/lib/presensiParser";

interface PresensiContextType {
  currentReport: PresensiPeriodReport;
  allReports: PresensiPeriodReport[];
  isProcessing: boolean;
  processUpload: (file: File, options?: { bulan?: string; tahun?: number; cutOffStart?: string; cutOffEnd?: string }) => Promise<PresensiPeriodReport>;
  updateTeacherAttendance: (teacherId: string, partial: Partial<TeacherAttendanceSummary>) => void;
  updateDailyStatus: (teacherId: string, tanggal: string, status: StatusKehadiran, keterangan?: string) => void;
  selectReport: (reportId: string) => void;
  resetToSample: () => void;
}

const PresensiContext = createContext<PresensiContextType | undefined>(undefined);

const STORAGE_KEY_PRESENSI = "sigap_smk_presensi_reports";
const STORAGE_KEY_CURRENT_ID = "sigap_smk_presensi_active_id";

export function PresensiProvider({ children }: { children: React.ReactNode }) {
  const [allReports, setAllReports] = useState<PresensiPeriodReport[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PRESENSI);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Failed to parse presensi reports from storage", e);
      }
    }
    return [generateOfficialSamplePeriod()];
  });

  const [currentReportId, setCurrentReportId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem(STORAGE_KEY_CURRENT_ID);
      if (active) return active;
    }
    return "presensi-current-period";
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const currentReport =
    allReports.find((r) => r.id === currentReportId) || allReports[0] || generateOfficialSamplePeriod();

  const saveReportsState = (list: PresensiPeriodReport[], activeId?: string) => {
    setAllReports(list);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_PRESENSI, JSON.stringify(list));
        if (activeId) {
          localStorage.setItem(STORAGE_KEY_CURRENT_ID, activeId);
        }
      } catch (e) {
        console.warn("Failed to save presensi reports to storage", e);
      }
    }
  };

  const processUpload = async (
    file: File,
    options?: { bulan?: string; tahun?: number; cutOffStart?: string; cutOffEnd?: string }
  ): Promise<PresensiPeriodReport> => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const report = await parseFingerprintFile(buffer, file.name, options);
      
      const updatedList = [report, ...allReports.filter((r) => r.id !== report.id)];
      saveReportsState(updatedList, report.id);
      setCurrentReportId(report.id);
      return report;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTeacherAttendance = (teacherId: string, partial: Partial<TeacherAttendanceSummary>) => {
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
    }
  };

  const resetToSample = () => {
    const sample = generateOfficialSamplePeriod();
    saveReportsState([sample], sample.id);
    setCurrentReportId(sample.id);
  };

  return (
    <PresensiContext.Provider
      value={{
        currentReport,
        allReports,
        isProcessing,
        processUpload,
        updateTeacherAttendance,
        updateDailyStatus,
        selectReport,
        resetToSample,
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
