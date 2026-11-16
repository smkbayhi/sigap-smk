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
        echo Silakan pastikan Node.js terinstal di laptop Anda.
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Node.js terdeteksi:
node -v
echo.

echo Menjalankan diagnostik dan tes koneksi mesin...
echo.
node test-koneksi.js

echo.
echo =======================================================
echo Pengujian selesai. Jendela ini tidak akan tertutup otomatis.
echo.
pause
