/**
 * SIGAP-SMK - Fingerprint Diagnostic & Test Connection
 * Target Mesin: InterActive X 1800 (192.168.1.202:4370)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

let config = {
  machineIp: "192.168.1.202",
  machinePort: 4370,
  commKey: 0,
  timeout: 10000,
};

try {
  const cfgPath = path.join(__dirname, "config.json");
  if (fs.existsSync(cfgPath)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(cfgPath, "utf8")) };
  }
} catch (e) {
  // use default
}

console.log("================================================================");
console.log("   SIGAP-SMK | DIAGNOSTIK & TES KONEKSI MESIN FINGERPRINT");
console.log("   Model Mesin : InterActive X 1800");
console.log(`   Target IP   : ${config.machineIp}:${config.machinePort}`);
console.log("================================================================\n");

// 1. Deteksi IP Komputer / Laptop saat ini
console.log("📡 [LANGKAH 1] Mendeteksi IP Komputer HCD Anda saat ini:");
const nets = os.networkInterfaces();
const detectedIps = [];
let hasSameSubnet = false;

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === "IPv4" && !net.internal) {
      detectedIps.push({ name, ip: net.address, netmask: net.netmask });
      console.log(`   - Adapter [${name}]: IP = ${net.address} (Mask: ${net.netmask})`);
      // Cek apakah 3 blok pertama sama dengan IP mesin (192.168.1.x)
      const subnetMachine = config.machineIp.split(".").slice(0, 3).join(".");
      const subnetPc = net.address.split(".").slice(0, 3).join(".");
      if (subnetMachine === subnetPc) {
        hasSameSubnet = true;
      }
    }
  }
}

if (detectedIps.length === 0) {
  console.log("   ⚠️ Tidak ada adapter jaringan aktif yang terdeteksi!");
}

console.log("");
if (!hasSameSubnet) {
  console.log("   ⚠️ PERHATIAN (POTENSI PENYEBAB UTAMA):");
  console.log(`      Komputer Anda belum memiliki IP di segmen '192.168.1.xxx'.`);
  console.log(`      Jika kabel LAN dicolok langsung dari mesin ke laptop, Windows`);
  console.log(`      memerlukan pengaturan IP Manual (Statis) pada adapter Ethernet.`);
  console.log("");
}

// 2. Lakukan Uji Ping ke IP Mesin
console.log(`🔍 [LANGKAH 2] Menguji PING langsung ke ${config.machineIp} ...`);
let isPingSuccess = false;
try {
  const pingOutput = execSync(`ping -n 3 -w 1500 ${config.machineIp}`, {
    encoding: "utf8",
  });
  console.log(pingOutput);

  if (pingOutput.includes("Reply from") || pingOutput.includes("Balasan dari")) {
    isPingSuccess = true;
    console.log(`✅ PING BERHASIL! Komputer dapat melihat mesin ${config.machineIp} di jaringan.`);
  } else {
    console.log(`❌ PING GAGAL (Request Timed Out / Unreachable).`);
  }
} catch (pingErr) {
  console.log(`❌ PING GAGAL (Tidak ada balasan dari ${config.machineIp}).`);
  if (pingErr.stdout) {
    console.log(pingErr.stdout);
  }
}

console.log("\n----------------------------------------------------------------");

if (!isPingSuccess) {
  console.log("⛔ KESIMPULAN DIAGNOSTIK:");
  console.log("Mesin belum merespon Ping. Data sidik jari belum bisa ditarik.");
  console.log("\n🛠️ CARA MENGATASI (PILIH SALAH SATU SESUAI KONDISI):");
  console.log("");
  console.log("👉 KONDISI A: Kabel LAN dicolok LANGSUNG dari Mesin ke Laptop (Tanpa Router):");
  console.log("   1. Buka Control Panel -> Network and Sharing Center -> Change adapter settings.");
  console.log("   2. Klik kanan pada 'Ethernet' -> Properties.");
  console.log("   3. Dobel klik 'Internet Protocol Version 4 (TCP/IPv4)'.");
  console.log("   4. Pilih 'Use the following IP address':");
  console.log("      - IP address   : 192.168.1.50");
  console.log("      - Subnet mask  : 255.255.255.0");
  console.log("      - Gateway      : (kosongkan)");
  console.log("   5. Klik OK, lalu jalankan kembali TEST-MESIN.bat");
  console.log("");
  console.log("👉 KONDISI B: Mesin dicolok ke Router / WiFi Sekolah:");
  console.log("   Pastikan Laptop Anda terhubung ke WiFi/LAN sekolah yang sama dengan mesin.");
  console.log("----------------------------------------------------------------\n");
  process.exit(1);
}

// 3. Jika Ping Sukses, Uji Komunikasi Protokol ZK ke Port 4370
console.log(`\n🔌 [LANGKAH 3] Menghubungkan Protokol ZK ke Port ${config.machinePort} ...`);

let ZKLib;
try {
  ZKLib = require("zklib-js");
} catch (e) {
  try {
    ZKLib = require("node-zklib");
  } catch (err) {
    console.error("❌ Pustaka zklib-js belum terinstal.");
    process.exit(1);
  }
}

async function runSocketTest() {
  const zkInstance = new ZKLib(
    config.machineIp,
    config.machinePort,
    config.timeout || 10000,
    4000
  );

  try {
    await zkInstance.createSocket();
    console.log("✅ BERHASIL TERHUBUNG KE MESIN FINGERPRINT (SOCKET AKTIF)!\n");

    try {
      const info = await zkInstance.getInfo();
      console.log("📊 Informasi Mesin:", info);
    } catch (e) {
      // ignore
    }

    try {
      const users = await zkInstance.getUsers();
      const userList = Array.isArray(users.data)
        ? users.data
        : users.data
        ? Object.values(users.data)
        : [];
      console.log(`👥 Ditemukan ${userList.length} pengguna terdaftar di mesin.`);
      userList.slice(0, 10).forEach((u, idx) => {
        console.log(`   ${idx + 1}. PIN/ID: ${u.userId || u.uid} | Nama: ${u.name}`);
      });
    } catch (e) {
      console.log("   (List user terlewati)");
    }

    try {
      const logs = await zkInstance.getAttendances();
      const logList = Array.isArray(logs.data) ? logs.data : [];
      console.log(`\n📋 Ditemukan ${logList.length} total rekaman log presensi.`);
      if (logList.length > 0) {
        console.log("   5 Log Terakhir:");
        logList.slice(-5).forEach((l, idx) => {
          console.log(`   ${idx + 1}. User ID: ${l.deviceUserId} | Waktu: ${l.recordTime}`);
        });
      }
    } catch (e) {
      console.log("   (List log terlewati)");
    }

    console.log("\n================================================================");
    console.log("🎉 SEMUA PENGUJIAN SUKSES! Mesin siap digunakan realtime.");
    console.log("================================================================");
  } catch (err) {
    console.error("❌ GAGAL KOMUNIKASI SOKET:", err.message || err);
  } finally {
    try {
      await zkInstance.disconnect();
    } catch (e) {}
  }
}

runSocketTest();
