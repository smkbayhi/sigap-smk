"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserRole, BidangStruktural } from "@/lib/database.types";
import { INITIAL_USERS } from "@/lib/seedData";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface AuthContextType {
  currentUser: User;
  users: User[];
  setCurrentUserById: (userId: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  addUser: (data: Omit<User, "id">) => User;
  deleteUser: (userId: string) => Promise<void> | void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoaded: boolean;
  isKepsek: boolean;
  isTU: boolean;
  isKasubag: boolean;
  isGuru: boolean;
  userBidang?: BidangStruktural;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = "sigap_smk_current_user_id";
const USERS_STORAGE_KEY = "sigap_smk_users";
const AUTH_STATUS_KEY = "sigap_smk_is_authenticated";
const DELETED_USERS_STORAGE_KEY = "sigap_smk_deleted_user_ids";

// Legacy deleted demo users that must never reappear on any browser
const LEGACY_DELETED_USER_IDS = new Set([
  "user-tu",
  "user-kasubag-kurikulum",
  "user-kasubag-kesiswaan",
  "user-kasubag-sarpras",
  "user-kasubag-humas",
  "user-guru-1",
]);

// Helper to track and persist deleted users to prevent unwanted resurrecting on reload
const getDeletedUserIds = (): string[] => {
  if (typeof window === "undefined") return Array.from(LEGACY_DELETED_USER_IDS);
  try {
    const raw = localStorage.getItem(DELETED_USERS_STORAGE_KEY);
    const stored: string[] = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...stored, ...Array.from(LEGACY_DELETED_USER_IDS)]));
  } catch {
    return Array.from(LEGACY_DELETED_USER_IDS);
  }
};

const markUserAsDeleted = (userId: string) => {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedUserIds();
    if (!current.includes(userId)) {
      const updated = [...current, userId];
      localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to mark user as deleted in storage:", e);
  }
};

const unmarkUserAsDeleted = (userId: string) => {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedUserIds();
    const updated = current.filter((id) => id !== userId);
    localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to unmark user in storage:", e);
  }
};

const mapDbRowToUser = (row: any): User => {
  let userPassword = row.id === "user-kepsek" ? "14215094" : "123456";
  let userAvatar = row.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

  if (row.avatar && typeof row.avatar === "string" && row.avatar.startsWith("{")) {
    try {
      const parsed = JSON.parse(row.avatar);
      if (parsed.password) {
        userPassword = parsed.password;
      }
      if (parsed.url) {
        userAvatar = parsed.url;
      } else if (parsed.logoSmkUrl) {
        userAvatar = parsed.logoSmkUrl;
      }
    } catch {
      // fallback
    }
  } else if (row.password) {
    userPassword = row.password;
  }

  return {
    id: row.id,
    niy: row.nip || row.niy || "",
    nip: row.nip || "",
    name: row.name,
    email: row.email,
    password: userPassword,
    role: row.role,
    jabatan: row.jabatan,
    bidang: row.bidang,
    phone: row.phone,
    avatar: userAvatar,
    ttd_url: row.ttd_url,
    stempel_url: row.stempel_url,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);

  // Sync users to Supabase in background
  const syncUserToCloud = async (user: User) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      let avatarPayload = "";
      if (user.id === "user-kepsek") {
        try {
          const { data: existing } = await supabase
            .from("users")
            .select("avatar")
            .eq("id", user.id)
            .single();
          let obj: any = {};
          if (existing?.avatar && existing.avatar.startsWith("{")) {
            obj = JSON.parse(existing.avatar);
          }
          obj.password = user.password || obj.password || "14215094";
          if (user.avatar && !user.avatar.startsWith("{")) {
            obj.url = user.avatar;
          }
          avatarPayload = JSON.stringify(obj);
        } catch {
          avatarPayload = JSON.stringify({ url: user.avatar, password: user.password || "14215094" });
        }
      } else {
        avatarPayload = JSON.stringify({
          url: user.avatar && !user.avatar.startsWith("{") ? user.avatar : "",
          password: user.password || "123456",
        });
      }

      await supabase.from("users").upsert({
        id: user.id,
        nip: user.niy || user.nip || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
        bidang: user.bidang || null,
        phone: user.phone,
        avatar: avatarPayload,
        ttd_url: user.ttd_url || null,
        stempel_url: user.stempel_url || null,
      });
    } catch (e) {
      console.warn("Failed to sync user to Supabase:", e);
    }
  };

  // Load from local storage & Supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const deletedIds = getDeletedUserIds();
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        let parsedUsers: User[] = INITIAL_USERS.filter((u) => !deletedIds.includes(u.id));
        if (storedUsers) {
          parsedUsers = JSON.parse(storedUsers);
          // Ensure NIY is mapped & deleted IDs are excluded
          parsedUsers = parsedUsers
            .filter((u) => !deletedIds.includes(u.id))
            .map((u) => ({
              ...u,
              niy: u.niy || u.nip || "",
            }));
          setUsers(parsedUsers);
        } else {
          setUsers(parsedUsers);
        }

        const storedAuthStatus = localStorage.getItem(AUTH_STATUS_KEY);
        const savedUserId = localStorage.getItem(AUTH_USER_KEY);
        const isAuth = storedAuthStatus === "true" && Boolean(savedUserId);
        setIsAuthenticated(isAuth);

        if (savedUserId && !deletedIds.includes(savedUserId)) {
          const found = parsedUsers.find((u) => u.id === savedUserId);
          if (found) setCurrentUser(found);
        } else if (parsedUsers.length > 0) {
          setCurrentUser(parsedUsers[0]);
        }
      } catch (e) {
        console.error("Failed to load users from localStorage", e);
      } finally {
        setIsAuthLoaded(true);
      }
    } else {
      setIsAuthLoaded(true);
    }

    // Try fetching users from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("users")
        .select("*")
        .then(async ({ data, error }) => {
          if (!error && data) {
            const deletedIds = getDeletedUserIds();

            // Background clean-up of any previously deleted users that still linger in Supabase cloud
            const leftoverIds = data.map((r: any) => r.id).filter((id: string) => deletedIds.includes(id));
            if (leftoverIds.length > 0 && supabase) {
              try {
                await supabase.from("users").delete().in("id", leftoverIds);
              } catch (delErr) {
                console.warn("Failed to cleanup deleted users from Supabase:", delErr);
              }
            }

            const activeRows = data.filter((row: any) => !deletedIds.includes(row.id));
            if (activeRows.length > 0) {
              const mapped: User[] = activeRows.map(mapDbRowToUser);
              setUsers(mapped);
              if (typeof window !== "undefined") {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mapped));
              }
            }
          }
        });
    }
  }, []);

  const saveUsersState = (updatedList: User[]) => {
    setUsers(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));
    }
  };

  const setCurrentUserById = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_USER_KEY, found.id);
        localStorage.setItem(AUTH_STATUS_KEY, "true");
      }
    }
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    unmarkUserAsDeleted(userId);
    const updated = users.map((u) => {
      if (u.id === userId) {
        const merged = { ...u, ...data };
        if (data.niy) merged.nip = data.niy; // keep nip in sync
        return merged;
      }
      return u;
    });
    saveUsersState(updated);

    const updatedCurrent = updated.find((u) => u.id === userId);
    if (updatedCurrent) {
      syncUserToCloud(updatedCurrent);
      if (currentUser.id === userId) {
        setCurrentUser(updatedCurrent);
      }
    }
  };

  const addUser = (data: Omit<User, "id">): User => {
    const newId = "user-" + Date.now();
    unmarkUserAsDeleted(newId);
    const newUser: User = {
      ...data,
      id: newId,
      niy: data.niy || data.nip || "",
      nip: data.niy || data.nip || "",
      password: data.password || "password123",
    };
    const updated = [...users, newUser];
    saveUsersState(updated);
    syncUserToCloud(newUser);
    return newUser;
  };

  const deleteUser = async (userId: string) => {
    markUserAsDeleted(userId);
    const updated = users.filter((u) => u.id !== userId);
    saveUsersState(updated);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("users").delete().eq("id", userId);
        if (error) {
          console.error("Failed to delete user in Supabase:", error);
        }
      } catch (err) {
        console.error("Error executing user delete in Supabase:", err);
      }
    }
    if (currentUser.id === userId && updated.length > 0) {
      setCurrentUser(updated[0]);
    }
  };

  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password?.trim();

    const findMatch = (list: User[]) => {
      return list.find((u) => {
        const matchId = (u.id || "").toLowerCase() === cleanId;
        const matchNiy = (u.niy || "").toLowerCase() === cleanId;
        const matchNip = (u.nip || "").toLowerCase() === cleanId;
        const matchEmail = (u.email || "").toLowerCase() === cleanId;
        const matchName = (u.name || "").toLowerCase().includes(cleanId);
        return matchId || matchNiy || matchNip || matchEmail || matchName;
      });
    };

    let found = findMatch(users);

    const isPasswordValid = (user: User, passToCheck: string) => {
      if (!passToCheck) return true;
      const validPasswords = [
        user.password,
        user.niy,
        user.nip,
        "123456",
        "password123",
        "admin",
      ].filter(Boolean);
      return validPasswords.includes(passToCheck);
    };

    // If user is not found locally, or password does not match local cached state:
    // Fetch live user credentials from Supabase cloud directly
    if (isSupabaseConfigured && supabase) {
      if (!found || (cleanPass && !isPasswordValid(found, cleanPass))) {
        try {
          const { data: cloudUsers, error } = await supabase.from("users").select("*");
          if (!error && cloudUsers && cloudUsers.length > 0) {
            const deletedIds = getDeletedUserIds();
            const freshMapped = cloudUsers
              .filter((r: any) => !deletedIds.includes(r.id))
              .map(mapDbRowToUser);

            const cloudFound = findMatch(freshMapped);
            if (cloudFound) {
              found = cloudFound;
              setUsers(freshMapped);
              if (typeof window !== "undefined") {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(freshMapped));
              }
            }
          }
        } catch (fetchErr) {
          console.warn("Failed to check Supabase directly during login:", fetchErr);
        }
      }
    }

    if (!found) {
      return { success: false, message: "Pengguna dengan NIY/Email tersebut tidak ditemukan." };
    }

    // Verify password against user password, NIY, NIP, or default
    if (cleanPass && !isPasswordValid(found, cleanPass)) {
      return { success: false, message: "Password yang Anda masukkan salah. (Default: 123456)" };
    }

    setCurrentUser(found);
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_USER_KEY, found.id);
      localStorage.setItem(AUTH_STATUS_KEY, "true");
    }

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STATUS_KEY, "false");
      localStorage.removeItem(AUTH_USER_KEY);
    }
  };

  const isKepsek = currentUser.role === "kepala_sekolah";
  const isTU = currentUser.role === "tata_usaha";
  const isKasubag = currentUser.role === "kasubag";
  const isGuru = currentUser.role === "guru";
  const userBidang = currentUser.bidang;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUserById,
        updateUser,
        addUser,
        deleteUser,
        login,
        logout,
        isAuthenticated,
        isAuthLoaded,
        isKepsek,
        isTU,
        isKasubag,
        isGuru,
        userBidang,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
