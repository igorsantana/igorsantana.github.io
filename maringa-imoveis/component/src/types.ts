import type { CSSProperties } from 'react';

export type MapRecord = [
  number,
  number,
  number,
  number | null,
  string,
  number | null,
  number | null,
  string,
  string,
  string,
  string,
  string,
];

export interface MapData {
  generated_at?: string;
  count: number;
  records: MapRecord[];
  breaks_price: number[];
  breaks_pm2: number[];
}

export type ViewMode = 'pontos' | 'calor';
export type MetricMode = 'preco' | 'pm2' | 'tipo';
export type HeatWeight = 'densidade' | 'preco';

export interface MaringaImoveisMapProps {
  /** Pre-loaded map data (bundled — no network fetch) */
  data?: MapData;
  /** URL to fetch map data (alternative to `data`) */
  dataUrl?: string;
  /** Fetch listings live from SUB100 API */
  liveFetch?: boolean;
  /** API base URL (defaults to `/api/sub100` — use Vite proxy locally) */
  apiBase?: string;
  /** Wait for user action before fetching (default: true with `liveFetch`) */
  manualStart?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Map container height (default: 100%) */
  height?: string | number;
  title?: string;
  subtitle?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  onLoaded?: (data: MapData) => void;
  onError?: (error: Error) => void;
}

export interface LoadState {
  status: 'idle' | 'loading' | 'parsing' | 'ready' | 'error';
  progress: number;
  error: Error | null;
  data: MapData | null;
}
