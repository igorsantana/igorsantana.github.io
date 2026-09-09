# MaringaImoveisMap

Componente React com mapa Leaflet, filtros, heatmap e busca ao vivo no SUB100.

## Dependências

```bash
npm install leaflet leaflet.heat react react-dom
```

Também importe o CSS do Leaflet no app:

```ts
import 'leaflet/dist/leaflet.css';
```

## Uso básico (busca ao vivo)

```tsx
import { MaringaImoveisMap } from './MaringaImoveisMap';
import './MaringaImoveisMap.css';

export function Mapa() {
  return (
    <div style={{ height: '80vh' }}>
      <MaringaImoveisMap
        liveFetch
        manualStart
        apiBase="https://maringa-imoveis-api.vercel.app/api"
      />
    </div>
  );
}
```

- `liveFetch` — busca dados na API em vez de usar arquivo estático  
- `manualStart` — mostra o botão **Carregar imóveis** antes de buscar  
- `apiBase` — URL do proxy (veja README na raiz do projeto)

## Uso com dados já carregados

Se você já tem os dados em memória ou em outro formato convertido para `MapData`:

```tsx
<MaringaImoveisMap data={mapData} />
```

Ou busque de uma URL sua:

```tsx
<MaringaImoveisMap dataUrl="/api/listings.json" />
```

## Props

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `liveFetch` | `boolean` | `false` | Ativa busca paginada no SUB100 |
| `manualStart` | `boolean` | `true` com `liveFetch` | Exige clique para iniciar a busca |
| `apiBase` | `string` | `/api` | Base do proxy da API |
| `data` | `MapData` | — | Dados prontos (sem rede) |
| `dataUrl` | `string` | — | URL para buscar JSON |
| `height` | `string \| number` | `100%` | Altura do container |
| `title` | `string` | — | Título do painel |
| `subtitle` | `string` | — | Subtítulo do painel |
| `defaultCenter` | `[lat, lng]` | Centro de Maringá | Posição inicial |
| `defaultZoom` | `number` | `12` | Zoom inicial |
| `onLoaded` | `(data) => void` | — | Chamado quando os dados estão prontos |
| `onError` | `(error) => void` | — | Chamado em caso de erro |

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `MaringaImoveisMap.tsx` | UI, mapa Leaflet, painel de filtros |
| `useSub100LiveLoader.ts` | Busca paginada com progresso |
| `sub100Api.ts` | Monta URLs e chama o proxy |
| `mapDataBuilder.ts` | Converte resposta da API → `MapRecord` |
| `mapUtils.ts` | Cores, filtros, popup, legenda, heatmap |
| `types.ts` | Tipos TypeScript |

## Formato interno (`MapRecord`)

Cada imóvel é um array com 12 posições:

```
[lng, lat, preço, preço_m², tipo, área, dorms, bairro, rua, número, referência, url]
```

`MapData` agrupa `records`, `count` e arrays `breaks_price` / `breaks_pm2` para a legenda de cores.

## Integrar no demo deste repositório

O `demo/` importa o componente via alias no `vite.config.ts`:

```ts
'@maringa-imoveis-map': path.resolve(siteRoot, 'component/src')
```

Copie o mesmo padrão no seu `vite.config` ou mova `component/src` para dentro do seu app.
