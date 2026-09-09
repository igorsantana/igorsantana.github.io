import type { MapData, MapRecord } from './types';

const STORAGE_KEY = 'maringa-imoveis-map-data';
const STORAGE_VERSION = 1;

interface StoredPayload {
  v: number;
  savedAt: string;
  data: MapData;
}

function isMapRecord(value: unknown): value is MapRecord {
  return (
    Array.isArray(value) &&
    value.length === 12 &&
    typeof value[0] === 'number' &&
    typeof value[10] === 'string'
  );
}

function isMapData(value: unknown): value is MapData {
  if (!value || typeof value !== 'object') return false;
  const data = value as MapData;
  return (
    Array.isArray(data.records) &&
    data.records.every(isMapRecord) &&
    typeof data.count === 'number' &&
    Array.isArray(data.breaks_price) &&
    Array.isArray(data.breaks_pm2)
  );
}

export function loadCachedMapData(): MapData | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredPayload;
    if (parsed.v !== STORAGE_VERSION || !isMapData(parsed.data)) return null;
    if (!parsed.data.records.length) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

export function saveCachedMapData(data: MapData): void {
  if (typeof localStorage === 'undefined' || !data.records.length) return;

  try {
    const payload: StoredPayload = {
      v: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or private-mode errors.
  }
}

export function clearCachedMapData(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
