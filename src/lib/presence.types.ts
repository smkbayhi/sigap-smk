export interface UserPresenceRecord {
  userId: string;
  name: string;
  niy: string;
  role: string;
  jabatan: string;
  avatar?: string;
  phone?: string;
  firstAccessAt?: string; // ISO string when user first opened webapp
  lastActiveAt?: string; // ISO string when user was last active/heartbeat
  lastPage?: string; // e.g. "/presensi", "/disposisi", "/surat-masuk"
  lastPageTitle?: string; // e.g. "Monitoring Presensi Mandiri", "Lembar Disposisi"
  lastAction?: string; // e.g. "Membuka lembar disposisi tugas"
  totalVisits: number;
  hasEverOpened: boolean;
  openedDisposisiIds?: string[]; // IDs of disposisi opened by this user
  openedPresensiReportIds?: string[]; // IDs of presensi reports opened by this user
}

export interface PresencePayload {
  sessions: Record<string, UserPresenceRecord>;
  updatedAt: string;
}

export const PRESENCE_CLOUD_ROW_ID = "user-presence-tracker";
