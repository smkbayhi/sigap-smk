"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { UserPresenceRecord, PresencePayload, PRESENCE_CLOUD_ROW_ID } from "@/lib/presence.types";

interface PresenceContextType {
  sessions: Record<string, UserPresenceRecord>;
  isLoading: boolean;
  onlineCount: number;
  todayCount: number;
  neverOpenedCount: number;
  everOpenedCount: number;
  getUserPresence: (userIdOrPin: string) => UserPresenceRecord | null;
  isUserOnline: (userIdOrPin: string) => boolean;
  hasUserEverOpened: (userIdOrPin: string) => boolean;
  hasUserOpenedDisposisi: (userIdOrPin: string, disposisiId: string) => boolean;
  recordDisposisiOpened: (disposisiId: string) => Promise<void>;
  recordPresensiOpened: (reportId: string) => Promise<void>;
  refreshPresence: () => Promise<void>;
  onlineUsers: UserPresenceRecord[];
  todayUsers: UserPresenceRecord[];
  neverOpenedUsers: Array<{ id: string; name: string; niy: string; jabatan: string; phone?: string; role: string }>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes for live "Online" status
const HEARTBEAT_INTERVAL_MS = 45 * 1000; // 45 seconds heartbeat interval
const THROTTLE_WRITE_MS = 25 * 1000; // minimum gap between Supabase cloud writes

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard Eksekutif";
  if (pathname.startsWith("/presensi/print")) return "Cetak Slip Presensi";
  if (pathname.startsWith("/presensi")) return "Monitoring Presensi Mandiri";
  if (pathname.startsWith("/disposisi/")) return "Membaca Lembar Disposisi";
  if (pathname.startsWith("/disposisi")) return "Daftar Disposisi Tugas";
  if (pathname.startsWith("/surat-masuk/")) return "Membaca Surat Masuk";
  if (pathname.startsWith("/surat-masuk")) return "Arsip Surat Masuk";
  if (pathname.startsWith("/surat-keluar")) return "Surat Keluar & TTD";
  if (pathname.startsWith("/rkt")) return "Rencana Kerja Tahunan (RKT)";
  if (pathname.startsWith("/master")) return "Master Data & Pengaturan";
  return pathname;
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated, users } = useAuth();
  const pathname = usePathname();
  const [sessions, setSessions] = useState<Record<string, UserPresenceRecord>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const sessionsRef = useRef<Record<string, UserPresenceRecord>>({});
  const lastWriteTimeRef = useRef<number>(0);

  // Sync latest presence state from Supabase Cloud
  const fetchPresenceFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from("master_perspektif")
        .select("deskripsi")
        .eq("id", PRESENCE_CLOUD_ROW_ID)
        .single();

      if (!error && data?.deskripsi) {
        try {
          const parsed: PresencePayload = JSON.parse(data.deskripsi);
          if (parsed && parsed.sessions) {
            sessionsRef.current = parsed.sessions;
            setSessions(parsed.sessions);
          }
        } catch (jsonErr) {
          console.warn("Gagal parse data presence JSON:", jsonErr);
        }
      }
    } catch (err) {
      console.warn("Gagal sync user presence dari cloud:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save presence state to Supabase Cloud
  const savePresenceToCloud = async (newSessions: Record<string, UserPresenceRecord>) => {
    sessionsRef.current = newSessions;
    setSessions(newSessions);

    const now = Date.now();
    if (now - lastWriteTimeRef.current < THROTTLE_WRITE_MS) {
      return; // throttled, local state is already updated
    }
    lastWriteTimeRef.current = now;

    if (!isSupabaseConfigured || !supabase) return;

    try {
      const payload: PresencePayload = {
        sessions: newSessions,
        updatedAt: new Date().toISOString(),
      };

      await supabase.from("master_perspektif").upsert({
        id: PRESENCE_CLOUD_ROW_ID,
        kode: "PRESENCE_SYNC",
        nama: "Live Digital Presence & Tracer Guru SMK",
        deskripsi: JSON.stringify(payload),
        is_active: false,
      });
    } catch (err) {
      console.warn("Exception saat menyimpan presence ke Supabase:", err);
    }
  };

  // Record user heartbeat on active session
  const sendHeartbeat = useCallback(
    async (overrideAction?: string) => {
      if (!isAuthenticated || !currentUser || !currentUser.id) return;

      const nowIso = new Date().toISOString();
      const currentSessions = { ...sessionsRef.current };
      const existing = currentSessions[currentUser.id];

      const pageTitle = overrideAction || getPageTitle(pathname || "");
      const niyOfficial = currentUser.niy || currentUser.nip || "";

      const updatedRecord: UserPresenceRecord = {
        userId: currentUser.id,
        name: currentUser.name,
        niy: niyOfficial,
        role: currentUser.role,
        jabatan: currentUser.jabatan,
        avatar: currentUser.avatar,
        phone: currentUser.phone,
        firstAccessAt: existing?.firstAccessAt || nowIso,
        lastActiveAt: nowIso,
        lastPage: pathname || "/",
        lastPageTitle: pageTitle,
        totalVisits: (existing?.totalVisits || 0) + 1,
        hasEverOpened: true,
        openedDisposisiIds: existing?.openedDisposisiIds || [],
        openedPresensiReportIds: existing?.openedPresensiReportIds || [],
      };

      currentSessions[currentUser.id] = updatedRecord;
      await savePresenceToCloud(currentSessions);
    },
    [isAuthenticated, currentUser, pathname]
  );

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchPresenceFromCloud();

    const interval = setInterval(() => {
      fetchPresenceFromCloud();
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchPresenceFromCloud]);

  // Send heartbeat on mount, login, and pathname changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      sendHeartbeat();
    }
  }, [isAuthenticated, currentUser?.id, pathname, sendHeartbeat]);

  // Periodic heartbeat while tab is active
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const interval = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const handleFocus = () => {
      sendHeartbeat("Kembali aktif di tab webapp");
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, currentUser, sendHeartbeat]);

  // Helper: Match record by either ID or NIY/PIN
  const getUserPresence = useCallback(
    (userIdOrPin: string): UserPresenceRecord | null => {
      if (!userIdOrPin) return null;
      const target = String(userIdOrPin).trim().toLowerCase();

      // 1. Direct ID match
      if (sessions[target]) return sessions[target];

      // 2. Search values by ID or NIY
      for (const rec of Object.values(sessions)) {
        if (rec.userId.toLowerCase() === target) return rec;
        if (rec.niy && rec.niy.toLowerCase() === target) return rec;
        if (rec.name && rec.name.toLowerCase().includes(target)) return rec;
      }
      return null;
    },
    [sessions]
  );

  const isUserOnline = useCallback(
    (userIdOrPin: string): boolean => {
      const rec = getUserPresence(userIdOrPin);
      if (!rec || !rec.lastActiveAt) return false;
      const diff = Date.now() - new Date(rec.lastActiveAt).getTime();
      return diff >= 0 && diff < ONLINE_THRESHOLD_MS;
    },
    [getUserPresence]
  );

  const hasUserEverOpened = useCallback(
    (userIdOrPin: string): boolean => {
      const rec = getUserPresence(userIdOrPin);
      return Boolean(rec && rec.hasEverOpened);
    },
    [getUserPresence]
  );

  const hasUserOpenedDisposisi = useCallback(
    (userIdOrPin: string, disposisiId: string): boolean => {
      const rec = getUserPresence(userIdOrPin);
      return Boolean(rec && rec.openedDisposisiIds?.includes(disposisiId));
    },
    [getUserPresence]
  );

  const recordDisposisiOpened = async (disposisiId: string) => {
    if (!currentUser) return;
    const currentSessions = { ...sessionsRef.current };
    const existing = currentSessions[currentUser.id] || {
      userId: currentUser.id,
      name: currentUser.name,
      niy: currentUser.niy || "",
      role: currentUser.role,
      jabatan: currentUser.jabatan,
      avatar: currentUser.avatar,
      phone: currentUser.phone,
      firstAccessAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      lastPage: `/disposisi/${disposisiId}`,
      lastPageTitle: "Membuka Lembar Disposisi",
      totalVisits: 1,
      hasEverOpened: true,
      openedDisposisiIds: [],
      openedPresensiReportIds: [],
    };

    const existingIds = existing.openedDisposisiIds || [];
    if (!existingIds.includes(disposisiId)) {
      existing.openedDisposisiIds = [...existingIds, disposisiId];
      existing.lastActiveAt = new Date().toISOString();
      existing.lastAction = "Membuka lembar disposisi tugas";
      currentSessions[currentUser.id] = existing;
      await savePresenceToCloud(currentSessions);
    }
  };

  const recordPresensiOpened = async (reportId: string) => {
    if (!currentUser) return;
    const currentSessions = { ...sessionsRef.current };
    const existing = currentSessions[currentUser.id] || {
      userId: currentUser.id,
      name: currentUser.name,
      niy: currentUser.niy || "",
      role: currentUser.role,
      jabatan: currentUser.jabatan,
      avatar: currentUser.avatar,
      phone: currentUser.phone,
      firstAccessAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      lastPage: `/presensi`,
      lastPageTitle: "Melihat Rekap Presensi Mandiri",
      totalVisits: 1,
      hasEverOpened: true,
      openedDisposisiIds: [],
      openedPresensiReportIds: [],
    };

    const existingReports = existing.openedPresensiReportIds || [];
    if (!existingReports.includes(reportId)) {
      existing.openedPresensiReportIds = [...existingReports, reportId];
    }
    existing.lastActiveAt = new Date().toISOString();
    existing.lastAction = "Melihat rekap presensi mandiri";
    currentSessions[currentUser.id] = existing;
    await savePresenceToCloud(currentSessions);
  };

  // Computed summary lists
  const now = Date.now();
  const allList = Object.values(sessions);

  const onlineUsers = allList.filter((s) => {
    if (!s.lastActiveAt) return false;
    const diff = now - new Date(s.lastActiveAt).getTime();
    return diff >= 0 && diff < ONLINE_THRESHOLD_MS;
  });

  const todayUsers = allList.filter((s) => {
    if (!s.lastActiveAt) return false;
    const diff = now - new Date(s.lastActiveAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });

  const everOpenedUsers = allList.filter((s) => s.hasEverOpened);

  // List of registered users who NEVER opened webapp
  const registeredUserList = users || [];
  const neverOpenedUsers = registeredUserList
    .filter((u) => {
      const rec = getUserPresence(u.id) || (u.niy ? getUserPresence(u.niy) : null);
      return !rec || !rec.hasEverOpened;
    })
    .map((u) => ({
      id: u.id,
      name: u.name,
      niy: u.niy || u.nip || "-",
      jabatan: u.jabatan,
      phone: u.phone,
      role: u.role,
    }));

  return (
    <PresenceContext.Provider
      value={{
        sessions,
        isLoading,
        onlineCount: onlineUsers.length,
        todayCount: todayUsers.length,
        neverOpenedCount: neverOpenedUsers.length,
        everOpenedCount: everOpenedUsers.length,
        getUserPresence,
        isUserOnline,
        hasUserEverOpened,
        hasUserOpenedDisposisi,
        recordDisposisiOpened,
        recordPresensiOpened,
        refreshPresence: fetchPresenceFromCloud,
        onlineUsers,
        todayUsers,
        neverOpenedUsers,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
}
