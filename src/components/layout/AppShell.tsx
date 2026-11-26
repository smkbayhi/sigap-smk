"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAuthLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If path is a pure print view or login view, hide navbar and sidebar completely
  const isPrintView = pathname?.includes("/print");
  const isAuthView = pathname === "/login";

  // Auth Guard: If not logged in and trying to access protected pages, redirect to /login immediately
  useEffect(() => {
    if (isAuthLoaded && !isAuthenticated && !isAuthView && !isPrintView) {
      router.replace("/login");
    }
  }, [isAuthLoaded, isAuthenticated, isAuthView, isPrintView, router]);

  // If already logged in and at /login, redirect to dashboard
  useEffect(() => {
    if (isAuthLoaded && isAuthenticated && isAuthView) {
      router.replace("/");
    }
  }, [isAuthLoaded, isAuthenticated, isAuthView, router]);

  // While checking auth status
  if (!isAuthLoaded) {
    return (
      <div className="h-screen w-full bg-[#064e3b] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-emerald-100 font-medium">Memuat SIGAP-SMK...</p>
      </div>
    );
  }

  // Not authenticated on protected route: show transition screen while redirecting
  if (!isAuthenticated && !isAuthView && !isPrintView) {
    return (
      <div className="h-screen w-full bg-[#064e3b] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-emerald-100 font-medium">Mengarahkan ke halaman login...</p>
      </div>
    );
  }

  if (isPrintView || isAuthView) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex print:bg-white">
      {/* Fixed Sidebar on the Left - Hidden completely when printing */}
      <div className="print:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main Content Area (Offset by sidebar width 256px on desktop, reset on print) */}
      <div className="flex-1 lg:pl-64 print:pl-0 flex flex-col min-w-0 min-h-screen print:min-h-0">
        <div className="print:hidden">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
};