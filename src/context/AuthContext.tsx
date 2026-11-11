"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, BidangStruktural } from "@/lib/database.types";
import { INITIAL_USERS } from "@/lib/seedData";

interface AuthContextType {
  currentUser: User;
  users: User[];
  setCurrentUserById: (userId: string) => void;
  isKepsek: boolean;
  isTU: boolean;
  isKasubag: boolean;
  isGuru: boolean;
  userBidang?: BidangStruktural;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "sigap_smk_current_user_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default to Kepala Sekolah

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUserId) {
        const found = users.find((u) => u.id === savedUserId);
        if (found) setCurrentUser(found);
      }
    }
  }, [users]);

  const setCurrentUserById = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, found.id);
      }
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
