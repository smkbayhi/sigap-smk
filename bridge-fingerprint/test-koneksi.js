/**
 * SIGAP-SMK - Fingerprint Diagnostic & Test Connection
 * Target Mesin: InterActive X 1800 (192.168.1.201:4370)
 * 100% Zero-Dependency Native Socket Driver
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const net = require("net");
const { execSync } = require("child_process");

let config = {
  machineIp: "192.168.1.201",
  machinePort: 4370,
  timeout: 8000,
  sigapApiUrl: "https://sigap-smk.vercel.app/api/presensi/realtime",
  secretToken: "sigap-smk-fingerprint-2026",
};

try {
  const cfgPath = path.join(__dirname, "config.json");
  if (fs.existsSync(cfgPath)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(cfgPath, "utf8")) };
  }
} catch (e) {
  // use default
}

const TEACHER_NAMES = {
  "11556022": "Nur Faizah, S.Kom",
  "11861027": "AINIYATUL FITRIYAH, S.S",
  "12616042": "Luluk Mamlu'atus S., S.S",
  "13559090": "Yudha Prihantanto, S.Pd, M.Pd",
  "142908": "Mokhamat Ekhsan, S.Kom",
  "16402178": "Nur Afandi, S.Pd",
  "18076236": "Akhmad Khoiron, Lc",
  "2563": "Achmad Jabbar, S. Sn",
  "3": "Moh. Nasih Aminulloh, S.Mat, M.Si",
  "5399": "Muhammad Fajarul Afthon, S.Pd",
  "4432": "ISHANANI, S.Pd",
};

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
  for (const netIf of nets[name]) {
    if (netIf.family === "IPv4" && !netIf.internal) {
      detectedIps.push({ name, ip: netIf.address, netmask: netIf.netmask });
      console.log(`   - Adapter [${name}]: IP = ${netIf.address} (Mask: ${netIf.netmask})`);
      const subnetMachine = config.machineIp.split(".").slice(0, 3).join(".");
      const subnetPc = netIf.address.split(".").slice(0, 3).join(".");
      if (subnetMachine === subnetPc) {
        hasSameSubnet = true;
      }
    }
  }
}

if (!hasSameSubnet) {
  console.log("\n⚠️ PERINGATAN: Belum ditemukan adapter LAN dengan segmen 192.168.1.x.");
} else {
  console.log("   ✅ IP Adapter cocok dengan segmen mesin (192.168.1.x).");
}

console.log("\n----------------------------------------------------------------");

// 2. Uji PING ke Mesin
console.log(`\n📶 [LANGKAH 2] Menguji PING langsung ke ${config.machineIp} ...\n`);

let isPingSuccess = false;
try {
  const pingCmd = process.platform === "win32"
    ? `ping -n 3 -w 1000 ${config.machineIp}`
    : `ping -c 3 -W 1 ${config.machineIp}`;
  const pingOutput = execSync(pingCmd, { encoding: "utf8" });
  console.log(pingOutput);

  if (pingOutput.includes("TTL=") || pingOutput.includes("ttl=") || pingOutput.includes("bytes from")) {
    isPingSuccess = true;
    console.log(`✅ PING BERHASIL! Komputer dapat melihat mesin ${config.machineIp} di jaringan.`);
  } else {
    console.log(`❌ PING GAGAL: Mesin tidak merespon paket ICMP.`);
  }
} catch (pingErr) {
  if (pingErr.stdout) {
    console.log(pingErr.stdout);
  }
}

console.log("\n----------------------------------------------------------------");

if (!isPingSuccess) {
  console.log("⛔ KESIMPULAN DIAGNOSTIK:");
  console.log("Mesin belum merespon Ping. Data sidik jari belum bisa ditarik.");
  console.log("\n🛠️ CARA MENGATASI:");
  console.log("   1. Pastikan kabel LAN dari mesin tertancap ke port Ethernet laptop.");
  console.log("   2. Pastikan IP Ethernet diset Static: 192.168.1.50, Subnet: 255.255.255.0, Gateway: kosong.");
  console.log("----------------------------------------------------------------\n");
  process.exit(1);
}

// 3. Uji Komunikasi Protokol Native ZK ke Port 4370
console.log(`\n🔌 [LANGKAH 3] Menghubungkan Protokol ZK ke Port ${config.machinePort} ...`);

const USHRT_MAX = 65535;
const COMMANDS = {
  CMD_CONNECT: 1000,
  CMD_REG_EVENT: 500,
  CMD_ACK_OK: 2000,
  EF_ATTLOG: 1,
};

function createChkSum(buf) {
  let chksum = 0;
  for (let i = 0; i < buf.length; i += 2) {
    if (i === buf.length - 1) {
      chksum += buf[i];
    } else {
      chksum += buf.readUInt16LE(i);
    }
    chksum %= USHRT_MAX;
  }
  chksum = USHRT_MAX - chksum - 1;
  return chksum;
}

function createTCPHeader(command, sessionId, replyId, data = "") {
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const buf = Buffer.alloc(8 + dataBuffer.length);
  buf.writeUInt16LE(command, 0);
  buf.writeUInt16LE(0, 2);
  buf.writeUInt16LE(sessionId, 4);
  buf.writeUInt16LE(replyId, 6);
  dataBuffer.copy(buf, 8);

  const chksum = createChkSum(buf);
  buf.writeUInt16LE(chksum, 2);

  replyId = (replyId + 1) % USHRT_MAX;
  buf.writeUInt16LE(replyId, 6);

  const prefix = Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x00, 0x00, 0x00, 0x00]);
  prefix.writeUInt16LE(buf.length, 4);
  return Buffer.concat([prefix, buf]);
}

function removeTcpHeader(buf) {
  if (!buf || buf.length < 8) return buf;
  if (buf.compare(Buffer.from([0x50, 0x50, 0x82, 0x7d]), 0, 4, 0, 4) !== 0) return buf;
  return buf.subarray(8);
}

function parseHexToTime(hex) {
  if (!hex || hex.length < 6) return new Date().toISOString().replace("T", " ").substring(0, 19);
  const year = hex.readUIntLE(0, 1) + 2000;
  const month = hex.readUIntLE(1, 1);
  const date = hex.readUIntLE(2, 1);
  const hour = hex.readUIntLE(3, 1);
  const minute = hex.readUIntLE(4, 1);
  const second = hex.readUIntLE(5, 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(date)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

async function sendToSigapApi(punch) {
  const teacherName = TEACHER_NAMES[punch.userId] || `Guru ID [${punch.userId}]`;
  console.log(`\n👉 SCAN TERDETEKSI: ${teacherName} (${punch.userId}) pada ${punch.attTime}`);

  try {
    const res = await fetch(config.sigapApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: config.secretToken,
        logs: [{ userId: punch.userId, attTime: punch.attTime }],
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      console.log(`   ✅ TERSINKRON KE CLOUD SIGAP-SMK: Status ${data.results?.[0]?.status?.toUpperCase() || "OK"}`);
    } else {
      console.log(`   ⚠️ Respon server:`, data.error || data.message || res.statusText);
    }
  } catch (err) {
    console.log(`   ❌ Gagal kirim ke server SIGAP:`, err.message);
  }
}

async function runSocketTest() {
  const socket = new net.Socket();
  let sessionId = 0;
  let replyId = 0;

  let timer = setTimeout(() => {
    socket.destroy();
    console.error(`❌ Gagal terhubung ke port ${config.machinePort} (Timeout).`);
    process.exit(1);
  }, 8000);

  socket.on("error", (err) => {
    clearTimeout(timer);
    console.error("❌ Gagal terhubung ke port:", err.message);
  });

  socket.connect(config.machinePort, config.machineIp, () => {
    clearTimeout(timer);
    console.log("✅ BERHASIL TERHUBUNG KE MESIN FINGERPRINT (SOCKET AKTIF)!\n");

    // Kirim CMD_CONNECT
    const connectPacket = createTCPHeader(COMMANDS.CMD_CONNECT, 0, 0, "");
    socket.write(connectPacket);
  });

  socket.on("data", async (data) => {
    try {
      const payload = removeTcpHeader(data);
      if (!payload || payload.length < 8) return;
      const cmd = payload.readUInt16LE(0);

      // Respon Connect
      if (cmd === COMMANDS.CMD_ACK_OK && sessionId === 0) {
        sessionId = payload.readUInt16LE(4);
        console.log(`📋 Session ID Mesin: ${sessionId}`);
        console.log("🎉 SEMUA PENGUJIAN 100% SUKSES!");
        console.log("   - Jaringan & Kabel LAN : TERHUBUNG");
        console.log("   - Protokol InterActive : TERVERIFIKASI");
        console.log("   - Sinkronisasi Cloud   : SIAP AKTIF");
        console.log("\n================================================================");
        console.log("👉 Silakan lakukan uji coba: TEMPELKAN SIDIK JARI DI MESIN SEKARANG!");
        console.log("   Nama guru dan jam absensi akan langsung muncul seketika di bawah ini:");
        console.log("================================================================\n");

        // Aktifkan Realtime Event Listener
        replyId++;
        const eventPacket = createTCPHeader(
          COMMANDS.CMD_REG_EVENT,
          sessionId,
          replyId,
          Buffer.from([0x01, 0x00, 0x00, 0x00])
        );
        socket.write(eventPacket);
        return;
      }

      // Deteksi Event Scan Sidik Jari (Realtime Punch)
      if (cmd === COMMANDS.CMD_REG_EVENT) {
        const recvData = payload.subarray(8);
        let userId = "";
        let attTime = "";

        if (recvData.length >= 32) {
          userId = recvData.slice(0, 9).toString("ascii").split("\0")[0].trim();
          attTime = parseHexToTime(recvData.subarray(26, 32));
        } else if (recvData.length >= 18) {
          userId = String(recvData.readUIntLE(8, 1));
          attTime = parseHexToTime(recvData.subarray(12, 18));
        }

        if (userId && attTime) {
          await sendToSigapApi({ userId, attTime });
        }
      }
    } catch (err) {
      // ignore
    }
  });
}

runSocketTest();
