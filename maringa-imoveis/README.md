# Imóveis em Maringá - PR

Mapa interativo com imóveis residenciais à venda em Maringá (PR).

- **Produção:** https://igorsantana.github.io/maringa-imoveis/
- **Stack:** React + Leaflet + OpenStreetMap
- **Dados:** busca ao vivo no SUB100 (sem arquivos JSON)

## Como funciona

1. Abra o mapa — basemap OpenStreetMap (sem API key).
2. Clique em **Carregar imóveis** para iniciar a busca.
3. Os pontos aparecem progressivamente enquanto as páginas da API são carregadas.

A API do SUB100 exige proxy CORS. Produção usa:
`https://maringa-imoveis-api.vercel.app/api`

## Desenvolvimento

```bash
cd demo
npm install
npm run dev
# http://localhost:5173 — proxy local em /api
```

## Build para GitHub Pages

```bash
cd demo
npm install
npm run build
```

Gera `index.html` e `assets/` na pasta `maringa-imoveis/`.

## Estrutura

| Pasta | Descrição |
| --- | --- |
| `demo/` | App Vite publicado no GitHub Pages |
| `demo/api/` | Proxy Vercel para a API SUB100 |
| `component/` | Componente React reutilizável |
| `proxy/` | Cloudflare Worker alternativo (opcional) |

## Componente React

```tsx
import { MaringaImoveisMap } from '@maringa-imoveis-map/MaringaImoveisMap';

<MaringaImoveisMap
  liveFetch
  manualStart
  apiBase="https://maringa-imoveis-api.vercel.app/api"
  height="80vh"
/>
```
