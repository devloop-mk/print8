const DB_NAME = 'print8';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to open IndexedDB'));
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('kv', 'readonly');
    const store = transaction.objectStore('kv');
    const request = store.get(key);

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to read "${key}" from IndexedDB`));
    };

    request.onsuccess = () => {
      resolve((request.result as T | undefined) ?? null);
    };
  });
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('kv', 'readwrite');
    const store = transaction.objectStore('kv');
    const request = store.put(value, key);

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to write "${key}" to IndexedDB`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function idbDelete(key: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('kv', 'readwrite');
    const store = transaction.objectStore('kv');
    const request = store.delete(key);

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to delete "${key}" from IndexedDB`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}
