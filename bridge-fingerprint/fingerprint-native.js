/**
 * SIGAP-SMK | Zero-Dependency Native Fingerprint Driver
 * Langsung berkomunikasi ke Mesin InterActive X 1800 (192.168.1.201:4370)
 * Tanpa ketergantungan library luar (100% Native Node.js Sockets).
 */

const net = require("net");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");
const STATE_PATH = path.join(__dirname, "last-sync.json");

let config = {
  machineIp: "192.168.1.201",
  machinePort: 4370,
  timeout: 10000,
  sigapApiUrl: "https://sigap-smk.vercel.app/api/presensi/realtime",
  secretToken: "sigap-smk-fingerprint-2026",
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
  } catch (e) {}
}

// Teacher mapping dictionary
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

const COMMANDS = {
  CMD_CONNECT: 1000,
  CMD_EXIT: 1001,
  CMD_ENABLEDEVICE: 1002,
  CMD_DISABLEDEVICE: 1003,
  CMD_REG_EVENT: 500,
  CMD_ACK_OK: 2000,
  CMD_ACK_ERROR: 2001,
  CMD_PREPARE_DATA: 1500,
  CMD_DATA: 1501,
  CMD_FREE_DATA: 1502,
  CMD_DATA_WRRQ: 1503,
  CMD_DATA_RDY: 1504,
  CMD_GET_TIME: 201,
  EF_ATTLOG: 1,
};

const USHRT_MAX = 65535;

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

class NativeZkClient {
  constructor(ip, port, timeout = 10000) {
    this.ip = ip;
    this.port = port;
    this.timeout = timeout;
    this.socket = null;
    this.sessionId = 0;
    this.replyId = 0;
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      let timer = setTimeout(() => {
        if (this.socket) this.socket.destroy();
        reject(new Error("Connection timeout to " + this.ip + ":" + this.port));
      }, this.timeout);

      this.socket.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.connect(this.port, this.ip, async () => {
        clearTimeout(timer);
        try {
          // Send CMD_CONNECT
          const connectPacket = createTCPHeader(COMMANDS.CMD_CONNECT, 0, 0, "");
          const reply = await this.sendPacket(connectPacket);
          const payload = removeTcpHeader(reply);
          const cmd = payload.readUInt16LE(0);
          if (cmd === COMMANDS.CMD_ACK_OK) {
            this.sessionId = payload.readUInt16LE(4);
            this.isConnected = true;
            resolve(true);
          } else {
            reject(new Error("Device returned reject code: " + cmd));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  sendPacket(packet) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not created"));
      let timer = setTimeout(() => {
        reject(new Error("Timeout waiting for response from machine"));
      }, this.timeout);

      const onData = (data) => {
        clearTimeout(timer);
        this.socket.removeListener("data", onData);
        resolve(data);
      };

      this.socket.on("data", onData);
      this.socket.write(packet, (err) => {
        if (err) {
          clearTimeout(timer);
          this.socket.removeListener("data", onData);
          reject(err);
        }
      });
    });
  }

  async enableRealtimeEvents(onPunchCallback) {
    if (!this.isConnected) throw new Error("Must connect first");
    this.replyId++;
    // Command 500 (CMD_REG_EVENT) with flag 1 (EF_ATTLOG)
    const eventPacket = createTCPHeader(
      COMMANDS.CMD_REG_EVENT,
      this.sessionId,
      this.replyId,
      Buffer.from([0x01, 0x00, 0x00, 0x00])
    );
    const reply = await this.sendPacket(eventPacket);
    console.log("   ✅ Mode Realtime Mesin Aktif (Listening live punch events)");

    // Continuous listener on socket
    this.socket.on("data", (data) => {
      try {
        const payload = removeTcpHeader(data);
        if (!payload || payload.length < 8) return;
        const commandId = payload.readUInt16LE(0);

        // Check if event packet (CMD_REG_EVENT = 500)
        if (commandId === COMMANDS.CMD_REG_EVENT) {
          const recvData = payload.subarray(8);
          // Try 52-byte format
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
            onPunchCallback({ userId, attTime });
          }
        }
      } catch (err) {
        // ignore parse error on unrelated packets
      }
    });
  }

  disconnect() {
    try {
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
      }
    } catch (e) {}
    this.isConnected = false;
  }
}

// Function to send punch log to SIGAP-SMK API
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

// Main Runner
async function main() {
  console.log("================================================================");
  console.log("   🌟 SIGAP-SMK | DRIVER NATIVE MESIN FINGERPRINT");
  console.log("   Model Mesin : InterActive X 1800");
  console.log(`   Target Mesin: ${config.machineIp}:${config.machinePort}`);
  console.log("================================================================\n");

  const client = new NativeZkClient(config.machineIp, config.machinePort, 8000);

  try {
    console.log(`⏳ Menghubungkan soket TCP ke ${config.machineIp}:${config.machinePort} ...`);
    await client.connect();
    console.log("✅ BERHASIL TERHUBUNG DENGAN MESIN FINGERPRINT!");
    console.log(`   Session ID Mesin: ${client.sessionId}`);

    // Enable realtime listening
    await client.enableRealtimeEvents((punch) => {
      sendToSigapApi(punch);
    });

    console.log("\n================================================================");
    console.log("🎉 SISTEM SIAP DIGUNAKAN!");
    console.log("👉 Silakan lakukan uji coba: TEMPELKAN SIDIK JARI DI MESIN SEKARANG.");
    console.log("   Nama dan jam absensi akan langsung muncul di jendela ini!");
    console.log("================================================================\n");
    console.log("(Biarkan jendela ini tetap menyala selama jam dinas sekolah...)");
  } catch (err) {
    console.error("❌ Gagal terhubung ke mesin:", err.message);
    console.log("Pastikan IP mesin 192.168.1.201 dan kabel LAN terpasang.");
  }
}

main();
