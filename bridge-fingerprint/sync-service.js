/**
 * SIGAP-SMK - Fingerprint Auto-Sync Daemon
 * Menghubungkan Mesin InterActive X 1800 (192.168.1.202:4370)
 * ke Webapp SIGAP-SMK Cloud API secara Otomatis & Realtime.
 */

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");
const STATE_PATH = path.join(__dirname, "last-sync.json");

let config = {
  machineIp: "192.168.1.202",
  machinePort: 4370,
  commKey: 0,
  timeout: 8000,
  sigapApiUrl: "http://localhost:3000/api/presensi/realtime",
  secretToken: "sigap-smk-fingerprint-2026",
  syncIntervalSeconds: 15,
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
  } catch (e) {
    console.warn("Gagal membaca config.json, menggunakan konfigurasi default.");
  }
}

// Load or initialize last sync state
let syncState = {
  lastRecordTime: "2000-01-01 00:00:00",
  syncedKeys: {},
};

if (fs.existsSync(STATE_PATH)) {
  try {
    syncState = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    if (!syncState.syncedKeys) syncState.syncedKeys = {};
  } catch (e) {
    // ignore
  }
}

function saveState() {
  try {
    // Limit syncedKeys cache to latest 2000 keys to avoid unlimited growth
    const keys = Object.keys(syncState.syncedKeys);
    if (keys.length > 2000) {
      const trimmed = {};
      keys.slice(-1500).forEach((k) => {
        trimmed[k] = syncState.syncedKeys[k];
      });
      syncState.syncedKeys = trimmed;
    }
    fs.writeFileSync(STATE_PATH, JSON.stringify(syncState, null, 2), "utf8");
  } catch (e) {
    console.warn("Gagal menyimpan last-sync.json:", e.message);
  }
}

let ZKLib;
try {
  ZKLib = require("zklib-js");
} catch (e) {
  try {
    ZKLib = require("node-zklib");
  } catch (err) {
    console.error("❌ Pustaka 'zklib-js' belum terinstal!");
    console.log("👉 Silakan jalankan: npm install");
    process.exit(1);
  }
}

console.log("================================================================");
console.log("   🚀 SIGAP-SMK FINGERPRINT SYNC SERVICE AKTIF");
console.log(`   Mesin IP      : ${config.machineIp}:${config.machinePort}`);
console.log(`   Target Server : ${config.sigapApiUrl}`);
console.log(`   Interval Cek  : Setiap ${config.syncIntervalSeconds} detik`);
console.log("================================================================\n");

async function sendLogsToSigap(logs) {
  if (!logs || logs.length === 0) return true;

  try {
    console.log(`📤 Mengirim ${logs.length} data presensi baru ke SIGAP-SMK API...`);
    const res = await fetch(config.sigapApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: config.secretToken,
        logs: logs.map((l) => ({
          userId: l.deviceUserId,
          attTime: l.recordTime,
          status: l.status,
        })),
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      console.log(`✅ SUKSES TERSINKRON! (${data.processedCount || logs.length} guru/staf berhasil dicatat)`);
      if (Array.isArray(data.results)) {
        data.results.forEach((r) => {
          console.log(`   👤 ${r.teacherName} [${r.userId}] -> ${r.type.toUpperCase()}: ${r.time} WIB (${r.status})`);
        });
      }
      return true;
    } else {
      console.warn("⚠️ Respon Server API:", data.error || data.message || res.statusText);
      return false;
    }
  } catch (err) {
    console.error("❌ Gagal mengirim ke Server SIGAP:", err.message);
    return false;
  }
}

let isSyncRunning = false;

async function doSyncCycle() {
  if (isSyncRunning) return;
  isSyncRunning = true;

  const zkInstance = new ZKLib(
    config.machineIp,
    config.machinePort,
    config.timeout || 8000,
    4000,
    config.commKey || 0,
    config.protocol || "tcp"
  );

  try {
    await zkInstance.createSocket();
    const logsRes = await zkInstance.getAttendances();
    const logList = Array.isArray(logsRes.data) ? logsRes.data : [];

    // Filter only new punches that haven't been synced yet
    const newLogs = [];
    for (const log of logList) {
      const punchKey = `${log.deviceUserId}_${log.recordTime}`;
      if (!syncState.syncedKeys[punchKey]) {
        newLogs.push(log);
      }
    }

    if (newLogs.length > 0) {
      console.log(`\n🔔 Ditemukan ${newLogs.length} rekaman presensi baru di mesin.`);
      const sent = await sendLogsToSigap(newLogs);
      if (sent) {
        newLogs.forEach((l) => {
          const punchKey = `${l.deviceUserId}_${l.recordTime}`;
          syncState.syncedKeys[punchKey] = Date.now();
          if (l.recordTime > syncState.lastRecordTime) {
            syncState.lastRecordTime = l.recordTime;
          }
        });
        saveState();
      }
    } else {
      process.stdout.write(".");
    }
  } catch (err) {
    console.error(`\n⚠️ [${new Date().toLocaleTimeString()}] Gagal kontak mesin (${config.machineIp}):`, err.message);
  } finally {
    try {
      await zkInstance.disconnect();
    } catch (e) {
      // ignore
    }
    isSyncRunning = false;
  }
}

// Initial sync on startup
doSyncCycle();

// Recurring interval sync loop
setInterval(doSyncCycle, (config.syncIntervalSeconds || 15) * 1000);
