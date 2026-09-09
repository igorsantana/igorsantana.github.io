# Maringá Imóveis Map — React component

Portable React component for Maringá residential listings with heatmap, filters, and loading progress.

## Install in your project

```bash
npm install leaflet leaflet.heat
# copy or link this package, then:
npm install @igorsantana/maringa-imoveis-map
```

Peer dependencies: `react`, `react-dom`, `leaflet`.

## Usage (bundled data — recommended)

Import map data at build time so there is no runtime JSON fetch:

```tsx
import { MaringaImoveisMap } from '@igorsantana/maringa-imoveis-map';
import '@igorsantana/maringa-imoveis-map/styles.css';
import 'leaflet/dist/leaflet.css';
import mapData from './map-data.json';

export function PropertyMapPage() {
  return (
    <div style={{ height: '80vh' }}>
      <MaringaImoveisMap
        data={mapData}
        onLoaded={(data) => console.log('loaded', data.count)}
      />
    </div>
  );
}
```

## Usage (remote URL)

```tsx
<MaringaImoveisMap dataUrl="/api/map-data.json" />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `MapData` | — | Pre-loaded data (no network) |
| `dataUrl` | `string` | — | URL to fetch map data |
| `height` | `string \| number` | `100%` | Container height |
| `title` | `string` | Maringá title | Panel heading |
| `subtitle` | `string` | sub100 source | Panel subtitle |
| `defaultCenter` | `[lat, lng]` | Maringá center | Initial map center |
| `defaultZoom` | `number` | `12` | Initial zoom |
| `onLoaded` | `(data) => void` | — | Called when data is ready |
| `onError` | `(error) => void` | — | Called on failure |

Provide either `data` or `dataUrl`.

## Copy into a monorepo

Copy `component/src` into your app and import locally:

```tsx
import { MaringaImoveisMap } from '@/components/maringa-imoveis';
import '@/components/maringa-imoveis/MaringaImoveisMap.css';
```

## Data format

```json
{
  "count": 11732,
  "records": [[lng, lat, price, price_m2, type, area, dorms, neighborhood, street, number, ref, url]],
  "breaks_price": [],
  "breaks_pm2": []
}
```
