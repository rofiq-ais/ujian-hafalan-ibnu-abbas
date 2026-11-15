import { Santri, PenilaianRecord } from '../types';
import { PengajarItem, PengujiItem, api } from '../services/api';

const KEY_SANTRI = 'ibnu_abbas_cache_santri_v1';
const KEY_PENILAIAN = 'ibnu_abbas_cache_penilaian_v1';
const KEY_PENGAJAR = 'ibnu_abbas_cache_pengajar_v1';
const KEY_PENGUJI = 'ibnu_abbas_cache_penguji_v1';
const KEY_SYNC_QUEUE = 'ibnu_abbas_sync_queue_v1';
const PREFIX_DRAFT = 'ibnu_abbas_draft_ujian_';

export interface SyncQueueItem {
  id: string;
  type: 'penilaian' | 'santri' | 'pengajar';
  action: 'save' | 'delete';
  payload: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// --- 1. LOCAL STORAGE CACHING HELPERS ---

function safeGetJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return defaultValue;
  }
}

function safeSetJSON(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing localStorage key "${key}":`, e);
  }
}

// Cache Data Santri
export function getCachedSantri(): Santri[] {
  return safeGetJSON<Santri[]>(KEY_SANTRI, []);
}

export function setCachedSantri(list: Santri[]): void {
  safeSetJSON(KEY_SANTRI, list);
}

// Cache Data Penilaian
export function getCachedPenilaian(): PenilaianRecord[] {
  return safeGetJSON<PenilaianRecord[]>(KEY_PENILAIAN, []);
}

export function setCachedPenilaian(list: PenilaianRecord[]): void {
  safeSetJSON(KEY_PENILAIAN, list);
}

export function updateLocalPenilaianCache(record: PenilaianRecord): void {
  const current = getCachedPenilaian();
  const idx = current.findIndex(
    p => p.santriId === record.santriId && p.jenisUjian === record.jenisUjian
  );
  if (idx !== -1) {
    current[idx] = record;
  } else {
    current.unshift(record);
  }
  setCachedPenilaian(current);
}

export function removeLocalPenilaianCache(id: string): void {
  const current = getCachedPenilaian().filter(p => p.id !== id);
  setCachedPenilaian(current);
}

// Cache Data Pengajar & Penguji
export function getCachedPengajar(): PengajarItem[] {
  return safeGetJSON<PengajarItem[]>(KEY_PENGAJAR, []);
}

export function setCachedPengajar(list: PengajarItem[]): void {
  safeSetJSON(KEY_PENGAJAR, list);
}

export function getCachedPenguji(): PengujiItem[] {
  return safeGetJSON<PengujiItem[]>(KEY_PENGUJI, []);
}

export function setCachedPenguji(list: PengujiItem[]): void {
  safeSetJSON(KEY_PENGUJI, list);
}

// --- 2. ACTIVE EXAM DRAFT (Mencegah Kehilangan Data di Tengah Ujian) ---

export function saveActiveExamDraft(santriId: string, jenisUjian: string, data: any): void {
  if (!santriId) return;
  safeSetJSON(`${PREFIX_DRAFT}${santriId}_${jenisUjian}`, {
    ...data,
    savedAt: Date.now(),
  });
}

export function getActiveExamDraft(santriId: string, jenisUjian: string): any | null {
  if (!santriId) return null;
  return safeGetJSON<any | null>(`${PREFIX_DRAFT}${santriId}_${jenisUjian}`, null);
}

export function clearActiveExamDraft(santriId: string, jenisUjian: string): void {
  if (typeof window === 'undefined' || !santriId) return;
  try {
    localStorage.removeItem(`${PREFIX_DRAFT}${santriId}_${jenisUjian}`);
  } catch (e) {
    // ignore
  }
}

// --- 3. OFFLINE SYNC QUEUE (Antrean Sinkronisasi Otomatis) ---

export function getSyncQueue(): SyncQueueItem[] {
  return safeGetJSON<SyncQueueItem[]>(KEY_SYNC_QUEUE, []);
}

export function setSyncQueue(queue: SyncQueueItem[]): void {
  safeSetJSON(KEY_SYNC_QUEUE, queue);
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = getSyncQueue();
  // Cegah duplikasi aksi yang sama pada id yang sama
  const filtered = queue.filter(
    q => !(q.type === item.type && q.action === item.action && (q.payload.id === item.payload.id || (item.payload.santriId && q.payload.santriId === item.payload.santriId && q.payload.jenisUjian === item.payload.jenisUjian)))
  );

  filtered.push({
    ...item,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    retryCount: 0,
  });

  setSyncQueue(filtered);
}

export async function processSyncQueue(): Promise<{ processed: number; remaining: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { processed: 0, remaining: getSyncQueue().length };
  }

  const queue = getSyncQueue();
  if (queue.length === 0) return { processed: 0, remaining: 0 };

  const remaining: SyncQueueItem[] = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      if (item.type === 'penilaian') {
        if (item.action === 'save') {
          await api.savePenilaian(item.payload);
        } else if (item.action === 'delete') {
          await api.deletePenilaian(item.payload.id);
        }
      } else if (item.type === 'santri') {
        if (item.action === 'save') {
          await api.saveSantri(item.payload);
        } else if (item.action === 'delete') {
          await api.deleteSantri(item.payload.id);
        }
      } else if (item.type === 'pengajar') {
        if (item.action === 'save') {
          await api.savePengajar(item.payload);
        } else if (item.action === 'delete') {
          await api.deletePengajar(item.payload.id);
        }
      }
      processedCount++;
    } catch (err: any) {
      console.warn('Sync queue item failed:', item, err);
      // Simpan kembali untuk retry jika belum lebih dari 5 kali
      if (item.retryCount < 5) {
        remaining.push({
          ...item,
          retryCount: item.retryCount + 1,
          lastError: err?.message || 'Gagal sinkron',
        });
      }
    }
  }

  setSyncQueue(remaining);
  return { processed: processedCount, remaining: remaining.length };
}
