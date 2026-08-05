# Imóveis em Maringá - PR

Mapa interativo com imóveis residenciais à venda em Maringá (PR) e dados de transações imobiliárias (DOI/ONR).

- Acesse o mapa: https://igorsantana.github.io/maringa-imoveis/
- Dados de transações (DOI/ONR): `doi_maringa.csv` / `doi_maringa.geojson`
- Imóveis residenciais à venda: `maringa_residencial_limpo.csv` / `maringa_residencial_limpo.geojson`

## Dados

### `doi_maringa` — Transações imobiliárias (ONR/DOI)

Registros de transações imobiliárias (Declaração de Operação Imobiliária) para o município de Maringá (IBGE 4115200), extraídos da camada pública do [Mapa do Registro de Imóveis (ONR)](https://mapa.onr.org.br).

| Campo | Descrição |
| --- | --- |
| `objectid` | Identificador interno da camada |
| `id` | Identificador da transação |
| `hash` | Hash do registro |
| `matricula` | Número da matrícula |
| `cnm` | Código Nacional de Matrícula |
| `cns` | Código Nacional de Serventia |
| `municipio_cod_ibge` | Código IBGE do município |
| `lon` / `lat` | Coordenadas do imóvel |

### `maringa_residencial_limpo` — Imóveis residenciais à venda

Anúncios de imóveis residenciais à venda em Maringá (fontes públicas de portais imobiliários).

| Campo | Descrição |
| --- | --- |
| `reference` / `id` | Referência do anúncio |
| `type` | Tipo (Apartamento, Casa, etc.) |
| `business` | Natureza (Venda) |
| `price` / `price_num` | Preço (formatado / numérico) |
| `price_m2` | Preço por m² |
| `area_m2` / `private_area` / `total_area` / `land_area` | Áreas |
| `dorms`, `suites`, `bathrooms`, `parking`, `floor` | Características |
| `address_complete` / `street` / `number` / `neighborhood` | Endereço |
| `latitude` / `longitude` | Coordenadas |
| `advertiser` | Anunciante |
| `url` | Link do anúncio |

## Observação

Os dados de transações são divulgados de forma pública pela plataforma ONR (Operador Nacional do Sistema de Registro Eletrônico de Imóveis). Consulte os [Termos de Uso do Mapa ONR](https://mapa.onr.org.br/sigri/termo-de-uso).
