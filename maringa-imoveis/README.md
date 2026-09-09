# Imóveis em Maringá - PR

Mapa interativo com imóveis residenciais à venda em Maringá (PR).

- **Produção:** https://igorsantana.github.io/maringa-imoveis/
- **Stack:** React + Leaflet, dados embutidos no bundle (sem fetch de JSON em runtime)

## Desenvolvimento

```bash
cd demo
npm install
npm run dev
```

## Build para GitHub Pages

```bash
cd demo
npm install
npm run build
```

O build gera `index.html` e `assets/` na pasta `maringa-imoveis/` (raiz do site).

## Estrutura

| Pasta | Descrição |
| --- | --- |
| `demo/` | App Vite (fonte da página publicada) |
| `demo/src/map-data.json` | Dados do mapa (importados no bundle) |
| `component/` | Componente React reutilizável (`MaringaImoveisMap`) |

## Componente React

Passe `data` (bundled) ou `dataUrl` (fetch remoto):

```tsx
import { MaringaImoveisMap } from '@maringa-imoveis-map/MaringaImoveisMap';
import mapData from './map-data.json';

<MaringaImoveisMap data={mapData} height="80vh" />
```

Veja `component/README.md` para integração em outros projetos.
