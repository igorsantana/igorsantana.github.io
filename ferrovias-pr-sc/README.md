# Ferrovias — Paraná e Santa Catarina

Mapa estático das linhas ferroviárias do Paraná e de Santa Catarina.

## Dados

O projeto combina duas camadas:

- `data/railways-osm.geojson`: segmentos com nomes, operadoras, status e tags do
  OpenStreetMap, baixados via Overpass em setembro de 2026.
- `data/railways-antt.geojson`: referência geométrica da malha ferroviária da
  ANTT, recortada para a área de Paraná e Santa Catarina.

Os dados OSM são classificados visualmente como:

- `operational`: linha ativa, geralmente de carga;
- `suspended`: trecho com tráfego suspenso ou desativado;
- `historical`: trecho abandonado ou removido;
- `planned`: trecho proposto ou em construção;
- `tourist`: serviço turístico identificado nas tags.

As linhas em laranja, verde, amarelo, cinza e roxo são derivadas do OSM. A
linha cinza fina é a camada de referência da ANTT. A classificação deve ser
confirmada com as fontes oficiais antes de ser usada para fins operacionais.

## Fontes

- [Ministério dos Transportes — mapas ferroviários e bases do DNIT](https://www.gov.br/transportes/pt-br/assuntos/dados-de-transportes/bit/bit-mapas)
- [ANTT — camada da malha ferroviária](https://geopr.iat.pr.gov.br/server/rest/services/00_PUBLICACOES/malha_ferroviaria_antt/MapServer/0)
- [Paraná Interativo — Ferrovia (Eixo)](https://paranainterativo.pr.gov.br/interativo/rest/services/BaseDadosParanaInterativo/FeatureServer/39)
- [OpenStreetMap — copyright e licença ODbL](https://www.openstreetmap.org/copyright)

## Execução local

Como os dados são carregados via `fetch`, use um servidor HTTP:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000/ferrovias-pr-sc/`.
