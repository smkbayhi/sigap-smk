@echo off
setlocal enabledelayedexpansion
title SIGAP-SMK - Tes Mesin Fingerprint (192.168.1.201)
color 0b

echo =======================================================
echo    SIGAP-SMK - TES KONEKSI MESIN FINGERPRINT
echo    Mesin: InterActive X 1800 (192.168.1.201)
echo =======================================================
echo.

cd /d "%~dp0"

:: Cek ketersediaan Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
    ) else (
        echo [ERROR] Node.js belum terdeteksi di sistem PATH!
        echo Jika Anda baru saja menginstal Node.js, silakan restart komputer Anda,
        echo atau pastikan Node.js terpasang di C:\Program Files\nodejs.
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Node.js terdeteksi:
node -v
echo.

echo 1. Memeriksa ketersediaan pustaka ZKLib...
if not exist "node_modules\zklib-js" (
    echo Menginstal pustaka zklib-js otomatis...
    call npm install
)

echo.
echo 2. Menghubungkan ke mesin 192.168.1.202:4370...
echo.
node test-koneksi.js

echo.
echo =======================================================
echo Pengujian selesai. Jendela ini tidak akan tertutup otomatis.
echo.
pause
