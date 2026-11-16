@echo off
title SIGAP-SMK - Tes Mesin Fingerprint (192.168.1.202)
color 0b
echo =======================================================
echo    SIGAP-SMK | TES KONEKSI MESIN FINGERPRINT
echo    Mesin: InterActive X 1800 (192.168.1.202)
echo =======================================================
echo.

cd /d "%~dp0"

echo 1. Memeriksa ketersediaan modul ZKLib...
if not exist "node_modules\zklib-js" (
    echo Menginstal modul zklib-js (hanya 1x saat pertama kali)...
    call npm install
)

echo.
echo 2. Menjalankan tes koneksi ke mesin 192.168.1.202:4370...
echo.
node test-koneksi.js

echo.
echo =======================================================
echo Tekan tombol apa saja untuk menutup jendela ini...
pause >nul
