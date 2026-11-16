import { NextRequest, NextResponse } from "next/server";
import net from "net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MACHINE_IP = process.env.FINGERPRINT_IP || "192.168.1.201";
const MACHINE_PORT = parseInt(process.env.FINGERPRINT_PORT || "4370", 10);
const TIMEOUT_MS = 8000;

const USHRT_MAX = 65535;
const MAX_CHUNK = 65472;

const COMMANDS = {
  CMD_CONNECT: 1000,
  CMD_EXIT: 1001,
  CMD_ACK_OK: 2000,
  CMD_PREPARE_DATA: 1500,
  CMD_DATA: 1501,
  CMD_FREE_DATA: 1502,
  CMD_DATA_WRRQ: 1503,
  CMD_DATA_RDY: 1504,
};

const REQUEST_DATA = {
  GET_ATTENDANCE_LOGS: Buffer.from([0x01, 0x0d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
};

function createChkSum(buf: Buffer): number {
  let chksum = 0;
  for (let i = 0; i < buf.length; i += 2) {
    if (i === buf.length - 1) {
      chksum += buf[i];
    } else {
      chksum += buf.readUInt16LE(i);
    }
    chksum %= USHRT_MAX;
  }
  return USHRT_MAX - chksum - 1;
}

function createTCPHeader(command: number, sessionId: number, replyId: number, data: Buffer | string = ""): Buffer {
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

function removeTcpHeader(buf: Buffer): Buffer {
  if (!buf || buf.length < 8) return buf;
  if (buf.compare(Buffer.from([0x50, 0x50, 0x82, 0x7d]), 0, 4, 0, 4) !== 0) return buf;
  return buf.subarray(8);
}

function parseZkTimestamp(time: number): string {
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
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

interface ParsedLog {
  userId: string;
  attTime: string;
}

function fetchLogsFromMachine(): Promise<ParsedLog[]> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let sessionId = 0;
    let replyId = 0;
    let timer: NodeJS.Timeout | null = null;
    let bufferReceived = Buffer.from([]);
    let expectedSize = 0;
    let isChunkMode = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        socket.destroy();
      } catch (e) {}
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout koneksi ke mesin ${MACHINE_IP}:${MACHINE_PORT}`));
    }, TIMEOUT_MS);

    socket.once("error", (err) => {
      cleanup();
      reject(err);
    });

    socket.connect(MACHINE_PORT, MACHINE_IP, () => {
      const connectPacket = createTCPHeader(COMMANDS.CMD_CONNECT, 0, 0, "");
      socket.write(connectPacket);
    });

    socket.on("data", (data: Buffer) => {
      try {
        const payload = removeTcpHeader(data);
        if (!payload || payload.length < 8) return;
        const cmd = payload.readUInt16LE(0);

        // Step 1: Handshake response
        if (cmd === COMMANDS.CMD_ACK_OK && sessionId === 0) {
          sessionId = payload.readUInt16LE(4);
          replyId++;

          // Step 2: Request attendance logs
          const reqPacket = createTCPHeader(
            COMMANDS.CMD_DATA_WRRQ,
            sessionId,
            replyId,
            REQUEST_DATA.GET_ATTENDANCE_LOGS
          );
          socket.write(reqPacket);
          return;
        }

        // Step 3: Direct data packet
        if (cmd === COMMANDS.CMD_DATA && !isChunkMode) {
          const logs = parseLogBuffer(payload.subarray(8));
          cleanup();
          return resolve(logs);
        }

        // Step 4: Chunked data response
        if (cmd === COMMANDS.CMD_PREPARE_DATA || (cmd === COMMANDS.CMD_ACK_OK && sessionId !== 0)) {
          if (payload.length >= 12) {
            expectedSize = payload.readUInt32LE(8);
          } else if (payload.length >= 8) {
            expectedSize = payload.readUIntLE(4, 4);
          }

          if (expectedSize <= 0) {
            cleanup();
            return resolve([]);
          }

          isChunkMode = true;
          const remain = expectedSize % MAX_CHUNK;
          const chunksCount = Math.floor(expectedSize / MAX_CHUNK);
          const totalPackets = chunksCount + (remain > 0 ? 1 : 0);

          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            const logs = parseLogBuffer(bufferReceived);
            cleanup();
            resolve(logs);
          }, 6000);

          // Request chunks
          for (let i = 0; i < totalPackets; i++) {
            const start = i * MAX_CHUNK;
            const size = i === totalPackets - 1 && remain > 0 ? remain : MAX_CHUNK;
            replyId++;
            const reqData = Buffer.alloc(8);
            reqData.writeUInt32LE(start, 0);
            reqData.writeUInt32LE(size, 4);
            const chunkBuf = createTCPHeader(COMMANDS.CMD_DATA_RDY, sessionId, replyId, reqData);
            socket.write(chunkBuf);
          }
          return;
        }

        if (isChunkMode) {
          const chunkPayload = payload.subarray(8);
          bufferReceived = Buffer.concat([bufferReceived, chunkPayload]);

          if (bufferReceived.length >= expectedSize) {
            const logs = parseLogBuffer(bufferReceived);
            cleanup();
            resolve(logs);
          }
        }
      } catch (err) {
        // ignore parse glitch
      }
    });
  });
}

function parseLogBuffer(buf: Buffer): ParsedLog[] {
  const logs: ParsedLog[] = [];
  if (!buf || buf.length < 16) return logs;

  let offset = 0;
  if (buf.length % 40 === 4 || buf.length % 16 === 4) {
    offset = 4;
  }

  const remaining = buf.length - offset;

  // 40-byte format
  if (remaining % 40 === 0 || remaining >= 40) {
    for (let i = offset; i + 40 <= buf.length; i += 40) {
      const slice = buf.subarray(i, i + 40);
      const userId = slice.subarray(2, 11).toString("ascii").replace(/\0/g, "").trim();
      const rawTime = slice.readUInt32LE(27);
      const attTime = parseZkTimestamp(rawTime);
      if (userId && rawTime > 0) {
        logs.push({ userId, attTime });
      }
    }
    if (logs.length > 0) return logs;
  }

  // 16-byte format fallback
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

export async function POST(req: NextRequest) {
  try {
    // 1. Fetch attendance logs directly from physical machine via TCP socket
    let machineLogs: ParsedLog[] = [];
    try {
      machineLogs = await fetchLogsFromMachine();
    } catch (netErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Gagal terhubung ke mesin fingerprint (${MACHINE_IP}:${MACHINE_PORT}): ${netErr.message}. Pastikan kabel LAN terpasang.`,
        },
        { status: 503 }
      );
    }

    if (!machineLogs || machineLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Mesin terhubung, namun tidak ada rekaman log baru.",
        totalLogs: 0,
        todayLogs: 0,
        results: [],
      });
    }

    // 2. Filter logs based on date range (startDate & endDate)
    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const startDate = body.startDate || todayStr;
    const endDate = body.endDate || todayStr;

    const filteredLogs = machineLogs.filter((l) => {
      if (!l.attTime) return false;
      const logDate = l.attTime.split(" ")[0] || l.attTime.substring(0, 10);
      return logDate >= startDate && logDate <= endDate;
    });

    if (filteredLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Mesin terhubung (${machineLogs.length} total rekaman di memori), namun tidak ditemukan rekaman scan pada rentang ${startDate} s/d ${endDate}.`,
        totalLogs: machineLogs.length,
        todayLogs: 0,
        startDate,
        endDate,
        results: [],
      });
    }

    // 3. Forward filtered logs to /api/presensi/realtime to process & store into Supabase
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const apiUrl = `${protocol}://${host}/api/presensi/realtime`;

    const realtimeRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: "sigap-smk-fingerprint-2026",
        logs: filteredLogs,
      }),
    });

    const realtimeData = await realtimeRes.json();

    return NextResponse.json({
      success: true,
      message: `Berhasil menarik ${filteredLogs.length} rekaman presensi (${startDate} s.d. ${endDate}) langsung dari mesin!`,
      totalLogsInMachine: machineLogs.length,
      todayPunchesCount: filteredLogs.length,
      processedCount: realtimeData.processedCount || filteredLogs.length,
      startDate,
      endDate,
      results: realtimeData.results || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Terjadi kendala server: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
