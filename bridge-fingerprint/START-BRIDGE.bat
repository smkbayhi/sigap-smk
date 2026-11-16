@echo off
setlocal enabledelayedexpansion
title SIGAP-SMK - Fingerprint Auto-Sync Daemon (192.168.1.201)
color 0a

echo ================================================================
echo    SIGAP-SMK - DAEMON SINKRONISASI FINGERPRINT OTOMATIS
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

if not exist "node_modules\zklib-js" (
    echo Menginstal pustaka zklib-js otomatis...
    call npm install
)

echo Memulai sinkronisasi otomatis ke SIGAP-SMK...
echo Biarkan jendela ini tetap terbuka saat jam kerja sekolah.
echo.
node sync-service.js

echo.
echo ================================================================
echo Daemon terhenti.
pause
