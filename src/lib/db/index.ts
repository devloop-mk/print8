import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const DATA_DIR = path.join(process.cwd(), 'data');

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'printing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'cod';
  locale: 'mk' | 'en';
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerCity: string;
  customerAddress: string;
  notes: string | null;
  itemsJson: string;
  fileIdsJson: string | null;
  totalAmount: number;
  createdAt: string;
}

export interface UploadSessionRecord {
  id: string;
  token: string;
  expiresAt: string;
  uploadCount: number;
  createdAt: string;
}

export interface UploadedFileRecord {
  id: string;
  sessionId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Store {
  orders: OrderRecord[];
  uploadSessions: UploadSessionRecord[];
  uploadedFiles: UploadedFileRecord[];
}

const STORE_PATH = path.join(DATA_DIR, 'store.json');

// In-memory fallback when filesystem is read-only (serverless platforms)
let memoryStore: Store | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): Store {
  ensureDataDir();
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const empty: Store = {
        orders: [],
        uploadSessions: [],
        uploadedFiles: [],
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
      return empty;
    }
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as Store;
  } catch (err) {
    if (memoryStore) return memoryStore;
    // initialize an in-memory store as a fallback
    memoryStore = { orders: [], uploadSessions: [], uploadedFiles: [] };
    return memoryStore;
  }
}

function writeStore(store: Store) {
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    // fallback to in-memory store when filesystem is not writable
    memoryStore = store;
  }
}

export const db = {
  orders: {
    insert(value: OrderRecord) {
      const store = readStore();
      store.orders.push(value);
      writeStore(store);
    },
    findByOrderNumber(orderNumber: string) {
      const store = readStore();
      return store.orders.find((o) => o.orderNumber === orderNumber) ?? null;
    },
    list() {
      return readStore().orders;
    },
  },
  uploadSessions: {
    insert(value: UploadSessionRecord) {
      const store = readStore();
      store.uploadSessions.push(value);
      writeStore(store);
    },
    findByToken(token: string) {
      const store = readStore();
      const now = new Date().toISOString();
      return (
        store.uploadSessions.find(
          (s) => s.token === token && s.expiresAt > now,
        ) ?? null
      );
    },
    incrementUploadCount(id: string) {
      const store = readStore();
      const session = store.uploadSessions.find((s) => s.id === id);
      if (session) {
        session.uploadCount += 1;
        writeStore(store);
      }
    },
  },
  uploadedFiles: {
    insert(value: UploadedFileRecord) {
      const store = readStore();
      store.uploadedFiles.push(value);
      writeStore(store);
    },
    findById(id: string) {
      const store = readStore();
      return store.uploadedFiles.find((f) => f.id === id) ?? null;
    },
  },
};

export { nanoid };
