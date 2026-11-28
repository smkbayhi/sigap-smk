import { SchoolSettings, DokumentasiKegiatan, NotulenRapat } from "./database.types";

const IDB_NAME = "sigap_smk_db";
const IDB_STORE = "settings";

function getStore(mode: IDBTransactionMode): Promise<{ store: IDBObjectStore; db: IDBDatabase } | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction(IDB_STORE, mode);
          const store = tx.objectStore(IDB_STORE);
          resolve({ store, db });
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// -------------------------------------------------------------------
// School Settings
// -------------------------------------------------------------------
export function getIndexedDBSettings(): Promise<SchoolSettings | null> {
  return new Promise(async (resolve) => {
    const s = await getStore("readonly");
    if (!s) return resolve(null);
    try {
      const getReq = s.store.get("school_settings");
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function saveIndexedDBSettings(data: SchoolSettings): Promise<void> {
  return new Promise(async (resolve) => {
    const s = await getStore("readwrite");
    if (!s) return resolve();
    try {
      s.store.put(data, "school_settings");
      resolve();
    } catch {
      resolve();
    }
  });
}

// -------------------------------------------------------------------
// Dokumentasi Kegiatan (Unbounded Storage for Mobile & Desktop)
// -------------------------------------------------------------------
export function getIndexedDBDokumentasi(): Promise<DokumentasiKegiatan[] | null> {
  return new Promise(async (resolve) => {
    const s = await getStore("readonly");
    if (!s) return resolve(null);
    try {
      const getReq = s.store.get("dokumentasi_kegiatan");
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function saveIndexedDBDokumentasi(data: DokumentasiKegiatan[]): Promise<void> {
  return new Promise(async (resolve) => {
    const s = await getStore("readwrite");
    if (!s) return resolve();
    try {
      s.store.put(data, "dokumentasi_kegiatan");
      resolve();
    } catch {
      resolve();
    }
  });
}

// -------------------------------------------------------------------
// Notulen Rapat
// -------------------------------------------------------------------
export function getIndexedDBNotulen(): Promise<NotulenRapat[] | null> {
  return new Promise(async (resolve) => {
    const s = await getStore("readonly");
    if (!s) return resolve(null);
    try {
      const getReq = s.store.get("notulen_rapat");
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function saveIndexedDBNotulen(data: NotulenRapat[]): Promise<void> {
  return new Promise(async (resolve) => {
    const s = await getStore("readwrite");
    if (!s) return resolve();
    try {
      s.store.put(data, "notulen_rapat");
      resolve();
    } catch {
      resolve();
    }
  });
}
