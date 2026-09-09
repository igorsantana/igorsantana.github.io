import type { HeatLayer } from 'leaflet';
import type { HeatWeight, MapData, MapRecord, MetricMode, ViewMode } from './types';

export const TIPO_COLORS: Record<string, string> = {
  Apartamento: '#1a6fb5',
  Casa: '#e67e22',
  Sobrado: '#7d3c98',
  Duplex: '#16a085',
  Cobertura: '#c0392b',
  Triplex: '#8e44ad',
  Sobreloja: '#95a5a6',
};

export const COLOR_SCALE = [
  { brk: 0, c: '#27ae60' },
  { brk: 1, c: '#8bc34a' },
  { brk: 2, c: '#ffd54f' },
  { brk: 3, c: '#ff9800' },
  { brk: 4, c: '#e53935' },
  { brk: 5, c: '#8e0000' },
];

export function fmtBRL(value: number) {
  return `R$ ${Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function fmtPm2(value: number) {
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
}

export function binFor(value: number, breaks: number[]) {
  for (let i = 0; i < breaks.length - 1; i += 1) {
    if (value <= breaks[i + 1]) return i;
  }
  return breaks.length - 2;
}

export function breaksFor(data: MapData, metric: MetricMode) {
  return metric === 'preco' ? data.breaks_price : data.breaks_pm2;
}

export function colorFor(
  rec: MapRecord,
  data: MapData,
  metric: MetricMode
): string {
  if (metric === 'tipo') return TIPO_COLORS[rec[4]] || '#95a5a6';
  const value = metric === 'preco' ? rec[2] : rec[3];
  if (value == null) return '#bdc3c7';
  const breaks = breaksFor(data, metric);
  return COLOR_SCALE[binFor(value, breaks)].c;
}

export interface FilterState {
  selectedTypes: Set<string>;
  neighborhood: string;
  minDorms: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export function recMatchesFilter(rec: MapRecord, filters: FilterState) {
  if (!filters.selectedTypes.has(rec[4])) return false;
  if (filters.neighborhood && rec[7] !== filters.neighborhood) return false;
  if (filters.minDorms > 0) {
    const dorms = rec[6];
    if (dorms == null || dorms < filters.minDorms) return false;
  }
  const price = rec[2];
  if (filters.minPrice != null && price < filters.minPrice) return false;
  if (filters.maxPrice != null && price > filters.maxPrice) return false;
  return true;
}

export function popupHtml(rec: MapRecord) {
  const [, , price, priceM2, type, area, dorms, neighborhood, street, number, , url] =
    rec;
  let html = `<b>${type}</b><br>`;
  html += `Preço: <b>${fmtBRL(price)}</b>`;
  if (priceM2 != null) {
    html += ` <span style="color:#777">(${fmtPm2(priceM2)}/m²)</span>`;
  }
  html += '<br>';
  if (area) html += `Área: ${area} m²<br>`;
  if (dorms) html += `Dormitórios: ${dorms}<br>`;
  if (street || number) {
    html += `Endereço: ${[street, number].filter(Boolean).join(', ')}<br>`;
  }
  if (neighborhood) html += `Bairro: ${neighborhood}<br>`;
  if (url) html += `<a href="${url}" target="_blank" rel="noopener noreferrer">Ver anúncio ↗</a>`;
  return html;
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function parsePriceInput(raw: string): number | null {
  if (!raw.trim()) return null;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

export function applyHeatOptions(
  heat: HeatLayer,
  filteredCount: number,
  weight: HeatWeight
) {
  const count = Math.max(filteredCount, 1);
  const opts = {
    radius: count > 3000 ? 15 : count > 800 ? 18 : 22,
    blur: count > 3000 ? 26 : 22,
    minOpacity: 0.22,
    max: weight === 'preco' ? 1.0 : Math.max(12, Math.sqrt(count) * 0.7),
  };

  if (typeof heat.setOptions === 'function') {
    heat.setOptions(opts);
  } else {
    Object.assign(heat.options, opts);
    const layer = heat as HeatLayer & { _heat?: { radius: Function; max?: Function; _max?: number } };
    if (layer._heat) {
      layer._heat.radius(opts.radius, opts.blur);
      if (typeof layer._heat.max === 'function') layer._heat.max(opts.max);
      else layer._heat._max = opts.max;
    }
  }

  return opts;
}

export function buildHeatPoints(
  filtered: MapRecord[],
  data: MapData,
  weight: HeatWeight
): [number, number, number][] {
  const cap = data.breaks_pm2[5] || 1;
  if (weight === 'preco') {
    return filtered
      .filter((rec) => rec[3] != null)
      .map((rec) => [rec[1], rec[0], Math.min(1, (rec[3] as number) / cap)]);
  }
  return filtered.map((rec) => [rec[1], rec[0], 1]);
}

export interface LegendState {
  title: string;
  gradient: string;
  minLabel: string;
  maxLabel: string;
  tipoHtml?: string;
}

export function buildLegend(
  data: MapData,
  viewMode: ViewMode,
  metric: MetricMode,
  heatWeight: HeatWeight
): LegendState {
  if (viewMode === 'calor') {
    return {
      title:
        heatWeight === 'preco'
          ? `Mapa de calor — intensidade = R$/m² (p95 = ${fmtBRL(Math.round(data.breaks_pm2[5] || 0))})`
          : 'Mapa de calor — densidade de anúncios',
      gradient: 'linear-gradient(to right, #2ecc71, #ffd54f, #ff9800, #e53935, #8e0000)',
      minLabel: 'frio',
      maxLabel: 'quente',
    };
  }

  const breaks = breaksFor(data, metric);
  if (metric === 'tipo') {
    const rows = Object.entries(TIPO_COLORS)
      .map(
        ([type, color]) =>
          `<div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:5px"></span>${type}</div>`
      )
      .join('');
    return {
      title: 'Tipo de imóvel',
      gradient: 'none',
      minLabel: '',
      maxLabel: '',
      tipoHtml: rows,
    };
  }

  const title = metric === 'preco' ? 'Preço total (R$)' : 'Preço por m² (R$)';
  const gradient = `linear-gradient(to right, ${COLOR_SCALE.map((c) => c.c).join(',')})`;
  const minLabel =
    metric === 'preco'
      ? fmtBRL(breaks[0])
      : fmtPm2(breaks[0]);
  const maxLabel =
    metric === 'preco'
      ? fmtBRL(breaks[breaks.length - 1])
      : fmtPm2(breaks[breaks.length - 1]);

  return { title, gradient, minLabel, maxLabel };
}
