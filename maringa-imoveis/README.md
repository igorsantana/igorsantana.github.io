# Imóveis em Maringá — mapa interativo

Mapa de casas e apartamentos à venda em Maringá (PR), com dados ao vivo do [SUB100](https://sub100.com.br).

| | |
| --- | --- |
| **Site publicado** | https://igorsantana.github.io/maringa-imoveis/ |
| **Como usar o mapa** | [GUIA.md](./GUIA.md) |
| **Proxy da API** | https://maringa-imoveis-api.vercel.app/api |

---

## O que tem neste repositório

O projeto é dividido em três partes:

```
maringa-imoveis/
├── index.html          ← site publicado (gerado pelo build)
├── assets/             ← JS e CSS publicados (gerado pelo build)
├── demo/               ← código-fonte do site
├── component/          ← componente React reutilizável do mapa
└── GUIA.md             ← instruções para quem só quer usar o mapa
```

| Pasta | Função |
| --- | --- |
| `demo/` | Aplicação React que você edita e publica |
| `component/` | Mapa, filtros e lógica de busca — pode ser copiado para outro projeto |
| `demo/api/` | Proxy serverless (Vercel) — repassa chamadas à API do SUB100 |
| `index.html` + `assets/` | Resultado do build; é isso que o GitHub Pages serve |

**Não edite** `index.html` nem `assets/` na raiz manualmente. Eles são recriados pelo comando `npm run build` dentro de `demo/`.

---

## Tecnologias

- **React** — interface
- **Leaflet** — mapa interativo
- **OpenStreetMap** — mapa de fundo (sem chave de API)
- **Vite** — servidor de desenvolvimento e build
- **TypeScript** — tipagem no componente e no demo

---

## Rodar no seu computador

Pré-requisitos: [Node.js](https://nodejs.org/) 18 ou superior.

```bash
cd maringa-imoveis/demo
npm install
npm run dev
```

Abra http://localhost:5173 no navegador.

Em desenvolvimento, o Vite redireciona `/api` para a API do SUB100 (configurado em `demo/vite.config.ts`). Não é preciso subir o proxy da Vercel localmente.

---

## Publicar no GitHub Pages

Na pasta `demo/`:

```bash
npm install
npm run build
```

O build faz duas coisas:

1. Compila o React em `demo/dist/`
2. Copia `index.html` e `assets/` para a pasta `maringa-imoveis/` (script `demo/scripts/sync-site.mjs`)

Depois, faça commit e push dos arquivos alterados em `maringa-imoveis/index.html` e `maringa-imoveis/assets/`.

---

## Como os dados chegam ao mapa

1. O usuário clica em **Carregar imóveis**.
2. O componente pede páginas à API do SUB100 (casas e apartamentos em Maringá).
3. Cada página traz ~20 anúncios; o mapa desenha os pontos assim que cada lote chega.
4. O navegador não pode chamar a API do SUB100 diretamente (restrição de segurança chamada CORS). Por isso existe o proxy em `demo/api/properties.ts`, hospedado na Vercel.

URL do proxy em produção (definida em `demo/.env.production`):

```
https://maringa-imoveis-api.vercel.app/api
```

Para republicar só o proxy:

```bash
cd maringa-imoveis/demo
npx vercel deploy --prod
```

(Requer login na Vercel.)

---

## Usar o componente em outro projeto

Copie a pasta `component/src/` ou importe via alias (como no demo).

```tsx
import { MaringaImoveisMap } from '@maringa-imoveis-map/MaringaImoveisMap';
import '@maringa-imoveis-map/MaringaImoveisMap.css';
import 'leaflet/dist/leaflet.css';

export function PaginaMapa() {
  return (
    <MaringaImoveisMap
      liveFetch
      manualStart
      apiBase="https://maringa-imoveis-api.vercel.app/api"
      height="80vh"
    />
  );
}
```

Detalhes das props e arquivos internos: [component/README.md](./component/README.md).

---

## Scripts úteis

| Comando | Onde | O que faz |
| --- | --- | --- |
| `npm run dev` | `demo/` | Servidor local com atualização automática |
| `npm run build` | `demo/` | Gera o site para publicação |
| `npm run preview` | `demo/` | Pré-visualiza o build em http://localhost:4173 |
| `npm run typecheck` | `component/` | Verifica erros de TypeScript |

---

## Observação sobre os dados

Os preços vêm de anúncios no SUB100 (oferta), não de vendas concluídas. O mapa filtra apenas **Casa** e **Apartamento** com coordenadas e preço válidos.
