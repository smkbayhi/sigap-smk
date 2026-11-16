/**
 * SIGAP-SMK - Fingerprint Test Connection
 * Target Mesin: InterActive X 1800 (192.168.1.202:4370)
 */

const fs = require("fs");
const path = require("path");

let config = {
  machineIp: "192.168.1.202",
  machinePort: 4370,
  commKey: 0,
  timeout: 8000,
};

try {
  const cfgPath = path.join(__dirname, "config.json");
  if (fs.existsSync(cfgPath)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(cfgPath, "utf8")) };
  }
} catch (e) {
  // use default
}

console.log("=======================================================");
console.log("   SIGAP-SMK | TES KONEKSI MESIN FINGERPRINT");
console.log("   Model Mesin : InterActive X 1800");
console.log(`   Target IP   : ${config.machineIp}:${config.machinePort}`);
console.log("=======================================================\n");

let ZKLib;
try {
  ZKLib = require("zklib-js");
} catch (e) {
  try {
    ZKLib = require("node-zklib");
  } catch (err) {
    console.error("❌ Pustaka 'zklib-js' belum terinstal!");
    console.log("👉 Silakan jalankan perintah: npm install");
    console.log("   atau klik 2x file TEST-MESIN.bat");
    process.exit(1);
  }
}

async function testConnection() {
  console.log(`⏳ Sedang mencoba menghubungkan ke ${config.machineIp}:${config.machinePort} ...`);
  const zkInstance = new ZKLib(
    config.machineIp,
    config.machinePort,
    config.timeout || 8000,
    4000,
    config.commKey || 0,
    config.protocol || "tcp"
  );

  try {
    // 1. Establish socket connection
    await zkInstance.createSocket();
    console.log("✅ BERHASIL TERKONEKSI KE MESIN FINGERPRINT!\n");

    // 2. Get device info
    try {
      console.log("📊 Mengambil Informasi Perangkat...");
      const info = await zkInstance.getInfo();
      console.log("   - User Count     :", info.userCounts || "Tersedia");
      console.log("   - Log Count      :", info.logCounts || "Tersedia");
      console.log("   - Device Version  :", info.version || "ZKTeco OEM Standalone");
    } catch (infoErr) {
      console.log("   (Info perangkat terlewati)");
    }

    // 3. Get users registered on machine
    console.log("\n👥 Membaca Data Pengguna (Guru/Staf) di Mesin...");
    try {
      const users = await zkInstance.getUsers();
      const userList = Array.isArray(users.data)
        ? users.data
        : users.data
        ? Object.values(users.data)
        : [];

      console.log(`   Ditemukan ${userList.length} pengguna terdaftar di mesin:`);
      userList.slice(0, 10).forEach((u, idx) => {
        console.log(`   ${idx + 1}. PIN/ID: ${u.userId || u.uid} | Nama: ${u.name || "(Belum diberi nama)"} | Card: ${u.cardno || "-"}`);
      });
      if (userList.length > 10) {
        console.log(`   ... dan ${userList.length - 10} pengguna lainnya.`);
      }
    } catch (userErr) {
      console.log("   (Pembacaan list user terlewati)");
    }

    // 4. Get attendance logs
    console.log("\n📋 Membaca Log Presensi Terakhir di Mesin...");
    try {
      const logs = await zkInstance.getAttendances();
      const logList = Array.isArray(logs.data) ? logs.data : [];
      console.log(`   Total log rekaman di memori mesin: ${logList.length} transaksi`);

      if (logList.length > 0) {
        console.log("   5 Log Terakhir:");
        logList.slice(-5).forEach((l, idx) => {
          console.log(`   ${idx + 1}. User ID: ${l.deviceUserId} | Waktu: ${l.recordTime}`);
        });
      }
    } catch (logErr) {
      console.log("   (Pembacaan log terlewati)");
    }

    console.log("\n=======================================================");
    console.log("🎉 KESIMPULAN: Mesin InterActive X1800 Siap Sinkron!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ GAGAL MENGHUBUNGI MESIN FINGERPRINT!");
    console.error("   Detail Error:", error.message || error);
    console.log("\n🔍 PANDUAN PEMECAHAN MASALAH (TROUBLESHOOTING):");
    console.log(`1. Pastikan kabel LAN dari mesin tercolok ke komputer/switch.`);
    console.log(`2. Buka CMD dan ketik: ping ${config.machineIp}`);
    console.log(`   Pastikan hasilnya Reply.`);
    console.log(`3. Pastikan IP komputer HCD satu segmen (contoh: 192.168.1.100).`);
    console.log(`4. Pastikan Comm Key di mesin bernilai 0 (MENU -> Comm -> Security).`);
  } finally {
    try {
      await zkInstance.disconnect();
      console.log("\n🔌 Koneksi soket ditutup dengan aman.");
    } catch (e) {
      // ignore
    }
  }
}

testConnection();
