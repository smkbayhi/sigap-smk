@echo off
setlocal enabledelayedexpansion
title SIGAP-SMK - Tarik Presensi Berdasarkan Rentang Tanggal
color 0e

echo ================================================================
echo    SIGAP-SMK - PENARIKAN DATA PRESENSI BERDASARKAN RENTANG TANGGAL
echo    Mesin : InterActive X 1800 (192.168.1.201)
echo ================================================================
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
        echo Pastikan Node.js terpasang di C:\Program Files\nodejs.
        echo.
        pause
        exit /b 1
    )
)

echo Format tanggal: TAHUN-BULAN-HARI (Contoh: 2026-11-01)
echo.
set /p START_DATE="1. Masukkan Tanggal Mulai   (contoh: 2026-11-01) : "
set /p END_DATE="2. Masukkan Tanggal Selesai (contoh: 2026-11-16) : "

if "%START_DATE%"=="" (
    echo [ERROR] Tanggal mulai tidak boleh kosong!
    pause
    exit /b 1
)

if "%END_DATE%"=="" (
    set "END_DATE=%START_DATE%"
)

echo.
echo Menarik data dari mesin untuk rentang %START_DATE% s/d %END_DATE% ...
echo.
node tarik-log-pagi.js %START_DATE% %END_DATE%

echo.
echo ================================================================
echo Selesai. Jendela ini tidak akan tertutup otomatis.
echo.
pause
