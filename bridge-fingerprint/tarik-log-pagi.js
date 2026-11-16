/**
 * SIGAP-SMK | Tarik Log Presensi dari Mesin InterActive X 1800
 * Target Mesin: 192.168.1.201:4370
 * 
 * Fitur:
 * 1. Mendukung pemilihan rentang tanggal (CLI arguments: node tarik-log-pagi.js [startDate] [endDate])
 * 2. Autentikasi otomatis CommKey (313 / 0)
 * 3. Filter ketat: HANYA Guru/Staf SMK Bayt Al-Hikmah (seluruh civitas SMP, SMA, Pondok diabaikan)
 * 4. Otomatis sinkronisasi ke Cloud SIGAP-SMK (Vercel + Supabase)
 */

const fs = require("fs");
const path = require("path");
const ZKLib = require("./node_modules/zklib-js/zklib");
const { COMMANDS } = require("./node_modules/zklib-js/constants");

// 1. Load Konfigurasi
const CONFIG_PATH = path.join(__dirname, "config.json");
let config = {
  machineIp: "192.168.1.201",
  machinePort: 4370,
  commKey: 313,
  timeout: 35000,
  sigapApiUrl: "https://sigap-smk.vercel.app/api/presensi/realtime",
  secretToken: "sigap-smk-fingerprint-2026",
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
  } catch (e) {}
}

// 2. Daftar Resmi Guru & Tenaga Kependidikan SMK Bayt Al-Hikmah
const SMK_TEACHERS = {
  "11556022": "Nur Faizah, S.Kom",
  "11550622": "Nur Faizah, S.Kom",
  "16": "Nur Faizah, S.Kom",
  "11861027": "AINIYATUL FITRIYAH, S.S",
  "12616042": "Luluk Mamlu'atus S., S.S",
  "21610624": "Luluk Mamlu'atus S., S.S",
  "13559090": "Yudha Prihantanto, S.Pd, M.Pd",
  "1355099": "Yudha Prihantanto, S.Pd, M.Pd",
  "142908": "Mokhamat Ekhsan, S.Kom",
  "142980": "Mokhamat Ekhsan, S.Kom",
  "14215094": "Mokhamat Ekhsan, S.Kom",
  "16402178": "Nur Afandi, S.Pd",
  "16041287": "Nur Afandi, S.Pd",
  "18076236": "Akhmad Khoiron, Lc",
  "8170263": "Akhmad Khoiron, Lc",
  "2563": "Achmad Jabbar, S. Sn",
  "5236": "Achmad Jabbar, S. Sn",
  "19070265": "Achmad Jabbar, S. Sn",
  "3": "Moh. Nasih Aminulloh, S.Mat, M.Si",
  "3239": "Moh. Nasih Aminulloh, S.Mat, M.Si",
  "23060333": "Moh. Nasih Aminulloh, S.Mat, M.Si",
  "5399": "Muhammad Fajarul Afthon, S.Pd",
  "5939": "Muhammad Fajarul Afthon, S.Pd",
  "22060315": "Muhammad Fajarul Afthon, S.Pd",
  "4432": "ISHANANI, S.Pd",
  "1432": "ISHANANI, S.Pd",
};

// Algoritma Pembuat Hash CommKey ZKTeco Standalone
function makeCommkey(key, sessionId, ticks = 50) {
  key = parseInt(key) || 0;
  sessionId = parseInt(sessionId) || 0;
  let k = 0;
  for (let i = 0; i < 32; i++) {
    if (key & (1 << i)) k = ((k << 1) | 1) >>> 0;
    else k = (k << 1) >>> 0;
  }
  k = (k + sessionId) >>> 0;
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(k, 0);
  buf[0] ^= "Z".charCodeAt(0);
  buf[1] ^= "K".charCodeAt(0);
  buf[2] ^= "S".charCodeAt(0);
  buf[3] ^= "O".charCodeAt(0);
  const w0 = buf.readUInt16LE(0);
  const w1 = buf.readUInt16LE(2);
  buf.writeUInt16LE(w1, 0);
  buf.writeUInt16LE(w0, 2);
  const B = 0xff & ticks;
  buf[0] ^= B;
  buf[1] ^= B;
  buf[2] = B;
  buf[3] ^= B;
  return buf;
}

const pad = (n) => String(n).padStart(2, "0");

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function main() {
  const args = process.argv.slice(2);
  const todayStr = formatDate(new Date());

  let startDate = todayStr;
  let endDate = todayStr;

  if (args.length >= 2) {
    startDate = args[0];
    endDate = args[1];
  } else if (args.length === 1) {
    startDate = args[0];
    endDate = args[0];
  }

  console.log("================================================================");
  console.log("   SIGAP-SMK | TARIK DATA LOG PRESENSI MESIN FINGERPRINT");
  console.log("   Model Mesin     : InterActive X 1800");
  console.log(`   IP Mesin        : ${config.machineIp}:${config.machinePort}`);
  console.log(`   Rentang Tanggal : ${startDate} s/d ${endDate}`);
  console.log("================================================================\n");

  const zk = new ZKLib(config.machineIp, config.machinePort, config.timeout || 35000, 4000);

  // Monkey-patch untuk mendukung autentikasi CommKey
  zk.zklibTcp.connect = async function () {
    const reply = await this.executeCmd(COMMANDS.CMD_CONNECT, "");
    if (!reply) throw new Error("Tidak ada respon dari mesin saat CMD_CONNECT");
    const cmd = reply.readUInt16LE(0);

    if (cmd === 2005) {
      console.log("🔐 Mesin meminta autentikasi (2005). Memverifikasi CommKey...");
      const keysToTry = [config.commKey || 313, 313, 0];
      let authSuccess = false;

      for (const k of keysToTry) {
        try {
          const authReply = await this.executeCmd(COMMANDS.CMD_AUTH, makeCommkey(k, this.sessionId));
          if (authReply && authReply.readUInt16LE(0) === COMMANDS.CMD_ACK_OK) {
            console.log(`   ✅ Autentikasi BERHASIL dengan CommKey: ${k}`);
            authSuccess = true;
            break;
          }
        } catch (e) {}
      }

      if (!authSuccess) {
        throw new Error("Autentikasi gagal. Seluruh CommKey (313, 0) ditolak oleh mesin.");
      }
    }
    return true;
  };

  try {
    console.log("📡 1. Menghubungkan ke mesin fingerprint...");
    await zk.createSocket();
    console.log("   ✅ Koneksi TCP ke mesin aktif!");

    console.log("\n📥 2. Sedang mengunduh seluruh data log dari memori mesin...");
    const atts = await zk.getAttendances((curr, total) => {
      const pct = Math.round((curr / total) * 100);
      process.stdout.write(`\r   Progress transfer: ${curr} / ${total} bytes (${pct}%)`);
    });
    console.log("\n   ✅ Data berhasil diunduh dari mesin!");
    await zk.disconnect();

    const allRecords = atts?.data || [];
    console.log(`\n📊 3. Analisis & Filter Data:`);
    console.log(`   - Total seluruh log di mesin (Semua Unit Civitas) : ${allRecords.length} log`);

    // Saring HANYA Guru SMK
    const smkFiltered = [];
    for (const r of allRecords) {
      const uid = String(r.deviceUserId || "").trim();
      if (SMK_TEACHERS[uid]) {
        const d = new Date(r.recordTime);
        const dStr = formatDate(d);
        if (dStr >= startDate && dStr <= endDate) {
          smkFiltered.push({
            userId: uid,
            teacherName: SMK_TEACHERS[uid],
            dateStr: dStr,
            timeStr: formatTime(d),
            rawDate: d,
          });
        }
      }
    }

    console.log(`   - Log TERFILTER HANYA GURU SMK (${startDate} s/d ${endDate}) : ${smkFiltered.length} log`);
    console.log(`   - Data civitas non-SMK (SMP, SMA, Pondok) : DIABAIKAN (DIBUANG)`);

    console.log("\n================================================================");
    console.log(`   RINCIAN PRESENSI GURU SMK (${startDate} s/d ${endDate})`);
    console.log("================================================================");

    if (smkFiltered.length === 0) {
      console.log("   ⚠️ Tidak ditemukan catatan scan jari guru SMK pada rentang tanggal tersebut.");
    } else {
      // Urutkan berdasarkan waktu
      smkFiltered.sort((a, b) => a.rawDate - b.rawDate);

      // Tampilkan per tanggal
      const perDate = {};
      smkFiltered.forEach((l) => {
        if (!perDate[l.dateStr]) perDate[l.dateStr] = [];
        perDate[l.dateStr].push(l);
      });

      for (const [tgl, logs] of Object.entries(perDate)) {
        console.log(`\n📅 Tanggal: ${tgl} (${logs.length} scan)`);
        logs.forEach((l, idx) => {
          console.log(`   ${pad(idx + 1)}. [${l.timeStr}] ${l.teacherName.padEnd(35)} (ID: ${l.userId})`);
        });
      }

      // Rekap per guru
      console.log("\n----------------------------------------------------------------");
      console.log("📊 REKAP TOTAL KEHADIRAN PER GURU:");
      const countMap = {};
      smkFiltered.forEach((l) => {
        if (!countMap[l.teacherName]) countMap[l.teacherName] = 0;
        countMap[l.teacherName]++;
      });

      Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
          console.log(`   - ${name.padEnd(35)} : ${count} kali tap`);
        });
      console.log("----------------------------------------------------------------");

      // 4. Sinkronisasi ke Cloud SIGAP-SMK
      console.log(`\n☁️ 4. Mengirim ${smkFiltered.length} log guru SMK ke Cloud SIGAP-SMK...`);
      const payloadLogs = smkFiltered.map((l) => ({
        userId: l.userId,
        attTime: `${l.dateStr} ${l.timeStr}`,
      }));

      try {
        const res = await fetch(config.sigapApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: config.secretToken,
            startDate: startDate,
            endDate: endDate,
            createSeparatePeriod: true,
            logs: payloadLogs,
          }),
        });

        const resData = await res.json();
        if (res.ok && resData.success) {
          console.log("🎉 SINKRONISASI KE CLOUD BERHASIL 100%!");
          console.log(`   Status Cloud : OK`);
          console.log(`   Total log diproses server : ${resData.syncedCount || resData.results?.length || smkFiltered.length}`);
          console.log(`   Endpoint     : ${config.sigapApiUrl}`);
          console.log("\n💡 Silakan buka https://sigap-smk.vercel.app/presensi");
          console.log("   dan klik tombol [🔄 Sinkron Cloud] untuk melihat data di tabel!");
        } else {
          console.log("⚠️ Respon Server Cloud:", resData.error || resData.message || res.statusText);
        }
      } catch (cloudErr) {
        console.error("❌ Gagal menghubungi server Cloud:", cloudErr.message);
      }
    }

    console.log("\n================================================================");
    console.log("   PROSES SELESAI");
    console.log("================================================================\n");
  } catch (err) {
    console.error("\n❌ Gagal menarik log presensi:", err.message);
    console.log("\n🛠️ Solusi:");
    console.log("   1. Pastikan kabel LAN dari mesin tertancap ke laptop.");
    console.log("   2. Pastikan laptop terhubung ke WiFi/Internet untuk push ke Cloud.");
    console.log("   3. Jalankan TEST-MESIN.bat untuk mendiagnosis koneksi.");
  }
}

main();
