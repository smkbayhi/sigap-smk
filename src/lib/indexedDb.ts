import { SchoolSettings } from "./database.types";

const IDB_NAME = "sigap_smk_db";
const IDB_STORE = "settings";

export function getIndexedDBSettings(): Promise<SchoolSettings | null> {
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
          const tx = db.transaction(IDB_STORE, "readonly");
          const store = tx.objectStore(IDB_STORE);
          const getReq = store.get("school_settings");
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
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

export function saveIndexedDBSettings(data: SchoolSettings): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve();
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
          const tx = db.transaction(IDB_STORE, "readwrite");
          const store = tx.objectStore(IDB_STORE);
          store.put(data, "school_settings");
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
