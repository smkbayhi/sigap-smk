/**
 * SIGAP-SMK | Tarik Log Presensi Pagi dari Mesin InterActive X 1800
 * Membaca data tap sidik jari yang tersimpan di memori mesin tadi pagi,
 * menampilkan daftar guru yang sudah absen, dan menyinkronkannya ke Cloud SIGAP-SMK.
 */

const net = require("net");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");
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

const USHRT_MAX = 65535;
const MAX_CHUNK = 65472;

const COMMANDS = {
  CMD_CONNECT: 1000,
  CMD_EXIT: 1001,
  CMD_ACK_OK: 2000,
  CMD_ACK_ERROR: 2001,
  CMD_PREPARE_DATA: 1500,
  CMD_DATA: 1501,
  CMD_FREE_DATA: 1502,
  CMD_DATA_WRRQ: 1503,
  CMD_DATA_RDY: 1504,
  CMD_GET_FREE_SIZES: 50,
};

const REQUEST_DATA = {
  GET_ATTENDANCE_LOGS: Buffer.from([0x01, 0x0d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
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

  const prefix = Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x00, 0x00, 0x00, 0x00]);
  prefix.writeUInt16LE(buf.length, 4);
  return Buffer.concat([prefix, buf]);
}

function removeTcpHeader(buf) {
  if (!buf || buf.length < 8) return buf;
  if (buf.compare(Buffer.from([0x50, 0x50, 0x82, 0x7d]), 0, 4, 0, 4) !== 0) return buf;
  return buf.subarray(8);
}

function parseZkTimestamp(time) {
  const second = time % 60;
  time = Math.floor((time - second) / 60);
  const minute = time % 60;
  time = Math.floor((time - minute) / 60);
  const hour = time % 24;
  time = Math.floor((time - hour) / 24);
  const day = (time % 31) + 1;
  time = Math.floor((time - (day - 1)) / 31);
  const month = (time % 12) + 1;
  time = Math.floor((time - (month - 1)) / 12);
  const year = time + 2000;
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

class NativeZkLogPuller {
  constructor(ip, port, timeout = 10000) {
    this.ip = ip;
    this.port = port;
    this.timeout = timeout;
    this.socket = null;
    this.sessionId = 0;
    this.replyId = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      let timer = setTimeout(() => {
        if (this.socket) this.socket.destroy();
        reject(new Error(`Timeout koneksi ke ${this.ip}:${this.port}`));
      }, this.timeout);

      this.socket.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.connect(this.port, this.ip, async () => {
        clearTimeout(timer);
        try {
          const connectPacket = createTCPHeader(COMMANDS.CMD_CONNECT, 0, 0, "");
          const reply = await this.sendPacket(connectPacket);
          const payload = removeTcpHeader(reply);
          const cmd = payload.readUInt16LE(0);
          if (cmd === COMMANDS.CMD_ACK_OK) {
            this.sessionId = payload.readUInt16LE(4);
            resolve(true);
          } else {
            reject(new Error("Mesin menolak koneksi. Kode respon: " + cmd));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  sendPacket(packet) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Soket tidak terpasang"));
      let timer = setTimeout(() => {
        reject(new Error("Timeout menunggu respon dari mesin"));
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

  async getAttendanceLogs() {
    this.replyId++;
    const reqPacket = createTCPHeader(
      COMMANDS.CMD_DATA_WRRQ,
      this.sessionId,
      this.replyId,
      REQUEST_DATA.GET_ATTENDANCE_LOGS
    );

    return new Promise((resolve, reject) => {
      let timer = setTimeout(() => {
        this.socket.removeListener("data", onData);
        reject(new Error("Timeout saat meminta data log dari mesin"));
      }, this.timeout);

      let bufferReceived = Buffer.from([]);
      let expectedSize = 0;
      let chunksCount = 0;
      let totalPackets = 0;
      let isChunkMode = false;

      const onData = (data) => {
        try {
          const payload = removeTcpHeader(data);
          if (!payload || payload.length < 8) return;
          const cmd = payload.readUInt16LE(0);

          // Direct data packet (small log count)
          if (cmd === COMMANDS.CMD_DATA) {
            clearTimeout(timer);
            this.socket.removeListener("data", onData);
            const logs = this.parseLogBuffer(payload.subarray(8));
            return resolve(logs);
          }

          // Prepare data response (contains size)
          if (cmd === COMMANDS.CMD_PREPARE_DATA || cmd === COMMANDS.CMD_ACK_OK) {
            clearTimeout(timer);
            if (payload.length >= 12) {
              expectedSize = payload.readUInt32LE(8);
            } else if (payload.length >= 8) {
              expectedSize = payload.readUIntLE(4, 4);
            }

            if (expectedSize <= 0) {
              this.socket.removeListener("data", onData);
              return resolve([]);
            }

            // Start requesting chunks
            isChunkMode = true;
            const remain = expectedSize % MAX_CHUNK;
            chunksCount = Math.floor(expectedSize / MAX_CHUNK);
            totalPackets = chunksCount + (remain > 0 ? 1 : 0);

            // Timer for chunk reception
            timer = setTimeout(() => {
              this.socket.removeListener("data", onData);
              const logs = this.parseLogBuffer(bufferReceived);
              resolve(logs);
            }, 10000);

            // Request chunk 0
            for (let i = 0; i < totalPackets; i++) {
              const start = i * MAX_CHUNK;
              const size = i === totalPackets - 1 && remain > 0 ? remain : MAX_CHUNK;
              this.sendChunkRequest(start, size);
            }
            return;
          }

          if (isChunkMode) {
            clearTimeout(timer);
            timer = setTimeout(() => {
              this.socket.removeListener("data", onData);
              const logs = this.parseLogBuffer(bufferReceived);
              resolve(logs);
            }, 3000);

            // Append data payload
            const chunkPayload = payload.subarray(8);
            bufferReceived = Buffer.concat([bufferReceived, chunkPayload]);

            if (bufferReceived.length >= expectedSize) {
              this.socket.removeListener("data", onData);
              const logs = this.parseLogBuffer(bufferReceived);
              resolve(logs);
            }
          }
        } catch (err) {
          // ignore chunk parse glitch
        }
      };

      this.socket.on("data", onData);
      this.socket.write(reqPacket, (err) => {
        if (err) {
          clearTimeout(timer);
          this.socket.removeListener("data", onData);
          reject(err);
        }
      });
    });
  }

  sendChunkRequest(start, size) {
    this.replyId++;
    const reqData = Buffer.alloc(8);
    reqData.writeUInt32LE(start, 0);
    reqData.writeUInt32LE(size, 4);
    const buf = createTCPHeader(COMMANDS.CMD_DATA_RDY, this.sessionId, this.replyId, reqData);
    if (this.socket) {
      this.socket.write(buf);
    }
  }

  parseLogBuffer(buf) {
    const logs = [];
    if (!buf || buf.length < 16) return logs;

    // Check if buffer starts with a 4-byte record count
    let offset = 0;
    if (buf.length % 40 === 4 || buf.length % 16 === 4) {
      offset = 4;
    }

    const remaining = buf.length - offset;

    // Standard 40-byte records
    if (remaining % 40 === 0 || remaining >= 40) {
      for (let i = offset; i + 40 <= buf.length; i += 40) {
        const slice = buf.subarray(i, i + 40);
        const userSn = slice.readUInt16LE(0);
        const userId = slice.subarray(2, 11).toString("ascii").replace(/\0/g, "").trim();
        const rawTime = slice.readUInt32LE(27);
        const attTime = parseZkTimestamp(rawTime);
        const verified = slice.readUInt8(26);
        const status = slice.readUInt8(31);

        if (userId && rawTime > 0) {
          logs.push({ userSn, userId, attTime, verified, status });
        }
      }
      if (logs.length > 0) return logs;
    }

    // Older 16-byte records fallback
    if (remaining % 16 === 0 || remaining >= 16) {
      for (let i = offset; i + 16 <= buf.length; i += 16) {
        const slice = buf.subarray(i, i + 16);
        const userId = String(slice.readUInt16LE(0));
        const rawTime = slice.readUInt32LE(4);
        const attTime = parseZkTimestamp(rawTime);
        if (userId && rawTime > 0) {
          logs.push({ userId, attTime });
        }
      }
    }

    return logs;
  }

  async disconnect() {
    try {
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
      }
    } catch (e) {}
  }
}

async function sendToSigapApi(logs) {
  if (!logs || logs.length === 0) return;
  try {
    const res = await fetch(config.sigapApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: config.secretToken,
        logs: logs.map((l) => ({ userId: l.userId, attTime: l.attTime })),
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ Gagal kirim ke server SIGAP:", err.message);
    return null;
  }
}

async function main() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  console.log("================================================================");
  console.log("   🌟 SIGAP-SMK | TARIK DATA PRESENSI HARI INI DARI MESIN");
  console.log("   Model Mesin : InterActive X 1800");
  console.log(`   Target Mesin: ${config.machineIp}:${config.machinePort}`);
  console.log(`   Tanggal Cek : ${todayStr}`);
  console.log("================================================================\n");

  const client = new NativeZkLogPuller(config.machineIp, config.machinePort, 8000);

  try {
    console.log(`⏳ [1/4] Menghubungkan ke mesin ${config.machineIp}:${config.machinePort} ...`);
    await client.connect();
    console.log(`✅ Berhasil terhubung! (Session ID: ${client.sessionId})`);

    console.log(`\n⏳ [2/4] Mengambil seluruh log absensi dari memori internal mesin...`);
    let allLogs = [];
    try {
      allLogs = await client.getAttendanceLogs();
    } catch (logErr) {
      console.log("ℹ️  Percobaan pembacaan log utama selesai:", logErr.message);
    }

    console.log(`📊 Ditemukan total ${allLogs.length} rekaman absensi di memori mesin.`);

    // Filter logs for today
    const todayLogs = allLogs.filter((l) => l.attTime && l.attTime.startsWith(todayStr));

    console.log(`\n🔍 [3/4] Rekaman presensi untuk HARI INI (${todayStr}): ${todayLogs.length} scan terdeteksi.`);

    if (todayLogs.length === 0) {
      console.log("\n⚠️ Belum ada scan sidik jari yang tercatat dengan tanggal hari ini (" + todayStr + ").");
      console.log("   (Kemungkinan jam/tanggal di layar mesin berbeda atau belum ada tap hari ini).");
      if (allLogs.length > 0) {
        console.log("\n📋 5 Rekaman Terakhir yang ada di mesin saat ini:");
        allLogs.slice(-5).forEach((l, idx) => {
          const tName = TEACHER_NAMES[l.userId] || `Guru PIN [${l.userId}]`;
          console.log(`   ${idx + 1}. ${tName} (${l.userId}) pada: ${l.attTime}`);
        });
      }
    } else {
      console.log("\n----------------------------------------------------------------");
      console.log("📋 DAFTAR GURU YANG SUDAH ABSEN TADI PAGI:");
      console.log("----------------------------------------------------------------");

      // Group by user to find earliest punch (check-in)
      const teacherPunches = {};
      for (const log of todayLogs) {
        if (!teacherPunches[log.userId]) {
          teacherPunches[log.userId] = [];
        }
        teacherPunches[log.userId].push(log.attTime);
      }

      let counter = 1;
      const punchesToSync = [];

      for (const [userId, punchTimes] of Object.entries(teacherPunches)) {
        const teacherName = TEACHER_NAMES[userId] || `Guru PIN [${userId}]`;
        punchTimes.sort();
        const checkInTime = punchTimes[0];
        const timeOnly = checkInTime.split(" ")[1] || checkInTime;

        // Calculate late status (School starts 06:50)
        const [hh, mm] = timeOnly.split(":").map(Number);
        const totalMinutes = hh * 60 + mm;
        const targetMinutes = 6 * 60 + 50; // 06:50
        const isLate = totalMinutes > targetMinutes;
        const diff = totalMinutes - targetMinutes;

        const statusLabel = isLate ? `TERLAMBAT (+${diff} menit)` : "HADIR TEPAT WAKTU";

        console.log(`\n${counter}. 👤 ${teacherName} (PIN: ${userId})`);
        console.log(`   ⏰ Jam Scan : ${timeOnly} WIB`);
        console.log(`   📌 Status   : ${statusLabel}`);

        punchesToSync.push({ userId, attTime: checkInTime });
        counter++;
      }

      console.log("\n----------------------------------------------------------------");
      console.log(`\n⏳ [4/4] Menyinkronkan ${punchesToSync.length} data presensi pagi ke Cloud SIGAP-SMK...`);

      const syncResult = await sendToSigapApi(punchesToSync);
      if (syncResult && syncResult.success) {
        console.log(`✅ SEMUA DATA SUDAH 100% TERSINKRONISASI KE DATABASE SIGAP-SMK!`);
        console.log(`   Jumlah data berhasil diproses: ${syncResult.processedCount || punchesToSync.length}`);
        console.log(`\n👉 Silakan buka halaman Presensi di Webapp:`);
        console.log(`   http://localhost:3000/presensi`);
      } else {
        console.log(`⚠️ Gagal simpan ke server:`, syncResult?.error || "Koneksi web server lokal tidak merespon");
      }
    }

    console.log("\n================================================================");
    console.log("🎉 Proses penarikan log pagi selesai!");
    console.log("================================================================\n");
  } catch (err) {
    console.error("❌ Terjadi kendala saat membaca mesin:", err.message);
  } finally {
    await client.disconnect();
  }
}

main();
