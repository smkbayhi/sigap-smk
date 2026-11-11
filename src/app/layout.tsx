import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppDataProvider } from "@/context/AppDataContext";
import { ToastContainer } from "@/components/common/Toast";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SIGAP-SMK | Sistem Informasi Gerak Cepat & Administrasi Terpadu",
  description:
    "Aplikasi E-Office & Sistem Informasi Manajemen Sekolah Terpadu SMK Bayt Al-Hikmah Pasuruan.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <AppDataProvider>
            <AppShell>{children}</AppShell>
            <ToastContainer />
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
