import type { MapData, MapRecord } from './types';

const RESIDENTIAL_TYPES = new Set(['Casa', 'Apartamento']);

const AREA_LIMITS: Record<string, { min: number; max: number }> = {
  Apartamento: { min: 22, max: 600 },
  Casa: { min: 35, max: 3500 },
};

/** Plausible resale R$/m² range for Maringá residential listings. */
const PM2_MIN = 800;
const PM2_MAX = 30_000;

export function parseBRL(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseArea(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value > 0 ? value : null;
  const parsed = parseBRL(value);
  return parsed && parsed > 0 ? parsed : null;
}

export function sanitizeArea(
  area: number | null,
  type: string
): number | null {
  if (area == null) return null;
  const limits = AREA_LIMITS[type] ?? { min: 20, max: 3500 };
  if (area < limits.min || area > limits.max) return null;
  return Math.round(area * 100) / 100;
}

export function computePriceM2(
  price: number,
  area: number | null
): number | null {
  if (area == null || area <= 0) return null;
  const priceM2 = price / area;
  if (!Number.isFinite(priceM2) || priceM2 < PM2_MIN || priceM2 > PM2_MAX) {
    return null;
  }
  return Math.round(priceM2);
}

export function sanitizeMapRecord(rec: MapRecord): MapRecord {
  const [
    lng,
    lat,
    price,
    ,
    type,
    area,
    dorms,
    neighborhood,
    street,
    number,
    reference,
    url,
  ] = rec;
  const cleanArea = sanitizeArea(area, type);
  const cleanPriceM2 = computePriceM2(price, cleanArea);

  return [
    lng,
    lat,
    price,
    cleanPriceM2,
    type,
    cleanArea,
    dorms,
    neighborhood,
    street,
    number,
    reference,
    url,
  ];
}

export function sanitizeMapData(data: MapData): MapData {
  const records = data.records.map(sanitizeMapRecord);
  const prices = records.map((rec) => rec[2]);
  const pricesM2 = records
    .filter((rec) => rec[3] != null)
    .map((rec) => rec[3] as number);

  return {
    ...data,
    count: records.length,
    records,
    breaks_price: computeBreaks(prices),
    breaks_pm2: computeBreaks(pricesM2),
  };
}

export interface Sub100Property {
  reference: string;
  subtype_name: string;
  latitude: string | number;
  longitude: string | number;
  total: string;
  private_area?: string | number | null;
  dorms?: number | null;
  address?: {
    neighborhood?: string;
    street?: string;
    number?: string;
  };
}

export function propertyToRecord(property: Sub100Property): MapRecord | null {
  const type = property.subtype_name;
  if (!RESIDENTIAL_TYPES.has(type)) return null;

  const lat = Number(property.latitude);
  const lng = Number(property.longitude);
  const price = parseBRL(property.total);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || price == null || price <= 0) {
    return null;
  }

  const area = sanitizeArea(parseArea(property.private_area), type);
  const priceM2 = computePriceM2(price, area);
  const neighborhood = property.address?.neighborhood ?? '';
  const street = property.address?.street ?? '';
  const number = property.address?.number ?? '';
  const url = `https://sub100.com.br/imoveis/${property.reference}`;

  return [
    lng,
    lat,
    price,
    priceM2,
    type,
    area,
    property.dorms ?? null,
    neighborhood,
    street,
    number,
    property.reference,
    url,
  ];
}

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function computeBreaks(values: number[]): number[] {
  if (!values.length) return [0, 1, 2, 3, 4, 5, 6];
  const sorted = [...values].sort((a, b) => a - b);
  return [
    sorted[0],
    quantile(sorted, 0.2),
    quantile(sorted, 0.4),
    quantile(sorted, 0.6),
    quantile(sorted, 0.8),
    quantile(sorted, 0.95),
    sorted[sorted.length - 1],
  ];
}

export function createEmptyMapData(): MapData {
  return {
    count: 0,
    records: [],
    breaks_price: [0, 1, 2, 3, 4, 5, 6],
    breaks_pm2: [0, 1, 2, 3, 4, 5, 6],
  };
}

export function appendRecords(data: MapData, records: MapRecord[]): MapData {
  if (!records.length) return data;
  const nextRecords = data.records.concat(records.map(sanitizeMapRecord));
  return sanitizeMapData({ ...data, records: nextRecords, count: nextRecords.length });
}
