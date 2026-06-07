// src/lib/idb.ts
// Saves exam session state to the browser's IndexedDB.
// Answers survive: network drops, browser crashes, tab closes.
// When the connection returns, ExamShell reads from here and syncs to server.

const DB_NAME = "cbt_simulator_v1";
const DB_VERSION = 1;
const STORE = "exam_sessions";

// Open (or create) the IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      // Create the object store if it does not exist yet
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "sessionId" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save current answers and flagged questions for a session
export async function saveSessionLocally(
  sessionId: string,
  data: { answers: Record<string, string>; flagged: string[] },
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ sessionId, ...data, savedAt: Date.now() });
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch (err) {
    // Never throw — local save failure must not break the exam
    console.warn("[idb] save failed:", err);
  }
}

// Load saved answers for a session (returns null if nothing saved)
export async function loadSessionLocally(
  sessionId: string,
): Promise<{ answers: Record<string, string>; flagged: string[] } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const result = await new Promise<IDBRequest["result"]>((res, rej) => {
      const req = store.get(sessionId);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    db.close();
    return result ?? null;
  } catch {
    return null;
  }
}

// Delete saved session data after successful submission
export async function clearSessionLocally(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(sessionId);
    db.close();
  } catch (err) {
    console.warn("[idb] clear failed:", err);
  }
}
