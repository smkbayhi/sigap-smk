@echo off
setlocal enabledelayedexpansion
title SIGAP-SMK - Tarik Data Presensi Hari Ini (192.168.1.201)
color 0e

echo ================================================================
echo    SIGAP-SMK - PENARIKAN DATA PRESENSI HARI INI DARI MESIN
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

echo [OK] Node.js terdeteksi:
node -v
echo.

echo Memulai penarikan log absensi dari mesin...
echo.
node tarik-log-pagi.js

echo.
echo ================================================================
echo Selesai. Jendela ini tidak akan tertutup otomatis.
echo.
pause
