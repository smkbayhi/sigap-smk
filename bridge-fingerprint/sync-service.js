/**
 * SIGAP-SMK - Fingerprint Auto-Sync Daemon (Native Zero-Dependency)
 * Terhubung langsung ke InterActive X 1800 (192.168.1.201:4370)
 * Mengalirkan data absensi sidik jari secara Real-Time ke Cloud SIGAP-SMK.
 */

const net = require("net");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");
const STATE_PATH = path.join(__dirname, "last-sync.json");

let config = {
  machineIp: "192.168.1.201",
  machinePort: 4370,
  timeout: 8000,
  sigapApiUrl: "https://sigap-smk.vercel.app/api/presensi/realtime",
  secretToken: "sigap-smk-fingerprint-2026",
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
  } catch (e) {}
}

const TEACHER_NAMES = {
  "11556022": "Nur Faizah, S.Kom",
  "11861027": "AINIYATUL FITRIYAH, S.S",
  "12616042": "Luluk Mamlu'atus S., S.S",
  "13559090": "Yudha Prihantanto, S.Pd, M.Pd",
  "142908": "Mokhamat Ekhsan, S.Kom",
  "14215094": "Mokhamat Ekhsan, S.Kom",
  "16402178": "Nur Afandi, S.Pd",
  "18076236": "Akhmad Khoiron, Lc",
  "2563": "Achmad Jabbar, S. Sn",
  "19070265": "Achmad Jabbar, S. Sn",
  "3": "Moh. Nasih Aminulloh, S.Mat, M.Si",
  "23060333": "Moh. Nasih Aminulloh, S.Mat, M.Si",
  "5399": "Muhammad Fajarul Afthon, S.Pd",
  "22060315": "Muhammad Fajarul Afthon, S.Pd",
  "4432": "ISHANANI, S.Pd",
};

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

let lastPunches = {};

async function sendToSigapApi(punch) {
  // Filter strictly for SMK teachers (ignore other school units: SMP, SMA, Pondok)
  if (!TEACHER_NAMES[punch.userId]) {
    return;
  }

  // Deduplicate identical punch in 30 seconds
  const punchKey = `${punch.userId}_${punch.attTime}`;
  if (lastPunches[punchKey] && Date.now() - lastPunches[punchKey] < 30000) {
    return;
  }
  lastPunches[punchKey] = Date.now();

  const teacherName = TEACHER_NAMES[punch.userId] || `Guru ID [${punch.userId}]`;
  console.log(`\n🔔 [${new Date().toLocaleTimeString()}] SCAN TERDETEKSI: ${teacherName} (${punch.userId})`);
  console.log(`   Waktu Mesin: ${punch.attTime}`);

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
      const resItem = data.results?.[0];
      const statusLabel = resItem?.status ? resItem.status.toUpperCase() : "BERHASIL";
      const typeLabel = resItem?.type ? resItem.type.toUpperCase() : "CHECK-IN";
      console.log(`   ✅ TERSINKRON KE CLOUD SIGAP-SMK: [${typeLabel}] Status ${statusLabel}`);
    } else {
      console.log(`   ⚠️ Server Response:`, data.error || data.message || res.statusText);
    }
  } catch (err) {
    console.log(`   ❌ Gagal sinkron ke SIGAP Cloud:`, err.message);
  }
}

let socket = null;
let sessionId = 0;
let replyId = 0;
let isConnected = false;
let reconnectTimer = null;

function connectToMachine() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  sessionId = 0;
  replyId = 0;
  isConnected = false;

  console.log(`\n⏳ [${new Date().toLocaleTimeString()}] Menghubungkan ke Mesin ${config.machineIp}:${config.machinePort} ...`);
  socket = new net.Socket();

  socket.setTimeout(15000);

  socket.on("timeout", () => {
    console.log("⚠️ Soket timeout, menyambung ulang...");
    socket.destroy();
  });

  socket.on("error", (err) => {
    console.log(`⚠️ Koneksi mesin error (${err.message}). Mencoba lagi dalam 5 detik...`);
  });

  socket.on("close", () => {
    if (isConnected) {
      console.log("ℹ️ Koneksi mesin terputus. Mencoba reconnect dalam 5 detik...");
    }
    isConnected = false;
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(connectToMachine, 5000);
    }
  });

  socket.connect(config.machinePort, config.machineIp, () => {
    console.log("🔌 Terhubung ke port soket mesin. Mengirim jabat tangan (handshake)...");
    const connectPacket = createTCPHeader(COMMANDS.CMD_CONNECT, 0, 0, "");
    socket.write(connectPacket);
  });

  socket.on("data", async (data) => {
    try {
      const payload = removeTcpHeader(data);
      if (!payload || payload.length < 8) return;
      const cmd = payload.readUInt16LE(0);

      if (cmd === COMMANDS.CMD_ACK_OK && sessionId === 0) {
        sessionId = payload.readUInt16LE(4);
        isConnected = true;
        console.log(`✅ BERHASIL TERKONEKSI PENUH! Session ID: ${sessionId}`);
        console.log("🟢 MODE REALTIME AKTIF: Menunggu tap sidik jari guru di mesin...");

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
    } catch (e) {
      // ignore
    }
  });
}

console.log("================================================================");
console.log("   🚀 SIGAP-SMK | DAEMON SINKRONISASI REALTIME FINGERPRINT");
console.log("   Mesin InterActive X 1800 (192.168.1.201:4370)");
console.log("================================================================\n");

connectToMachine();
