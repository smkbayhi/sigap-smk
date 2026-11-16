@echo off
title SIGAP-SMK - Fingerprint Auto-Sync Daemon
color 0a
echo ================================================================
echo    SIGAP-SMK | DAEMON SINKRONISASI FINGERPRINT OTOMATIS
echo    Mesin : InterActive X 1800 (192.168.1.202)
echo ================================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\zklib-js" (
    echo Menginstal modul zklib-js...
    call npm install
)

echo Memulai sinkronisasi otomatis...
echo Biarkan jendela ini tetap terbuka saat jam kerja sekolah.
echo.
node sync-service.js

echo.
pause
