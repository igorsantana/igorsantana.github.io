import type { MapData, MapRecord } from './types';

const RESIDENTIAL_TYPES = new Set(['Casa', 'Apartamento']);

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

  const area = parseArea(property.private_area);
  const priceM2 = area ? price / area : null;
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
  const nextRecords = data.records.concat(records);
  const prices = nextRecords.map((rec) => rec[2]);
  const pricesM2 = nextRecords
    .filter((rec) => rec[3] != null)
    .map((rec) => rec[3] as number);

  return {
    ...data,
    count: nextRecords.length,
    records: nextRecords,
    breaks_price: computeBreaks(prices),
    breaks_pm2: computeBreaks(pricesM2),
  };
}
