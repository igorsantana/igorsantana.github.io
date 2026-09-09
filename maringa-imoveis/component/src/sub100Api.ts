import type { Sub100Property } from './mapDataBuilder';

export interface Sub100SearchMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Sub100SearchResponse {
  data: Sub100Property[];
  meta: Sub100SearchMeta;
}

export interface Sub100SearchParams {
  page: number;
  apiBase?: string;
}

const MARINGA_LOCAL_ID = 'e430c297-02f1-42b6-ae35-57b8d94b499a';
const BUSINESS_TYPE_ID = '289fbbf4-6fd3-47db-85fe-e72772efd6c0';
const RESIDENTIAL_TYPE_ID = '9321def4-9c0f-4088-a9c8-4cf5e5fb3643';

function buildSearchParams(page: number) {
  return new URLSearchParams({
    value: JSON.stringify({ min: '', max: '' }),
    dorms: JSON.stringify({ suites: '', dorms: '' }),
    condo_value: JSON.stringify({ min: '', max: '' }),
    installmentValues: JSON.stringify({ min: '', max: '' }),
    parking_spaces: '',
    publication_date: '',
    property_details: JSON.stringify({ details: [] }),
    condo_details: JSON.stringify({ details: [] }),
    dream_property: '0',
    mcmv: '0',
    academic_regions: '0',
    environments: JSON.stringify({ environment: null }),
    total_area: JSON.stringify({ min: '', max: '' }),
    private_area: JSON.stringify({ min: '', max: '' }),
    land_area: JSON.stringify({ min: '', max: '' }),
    floors: JSON.stringify({ min: '', max: '' }),
    pax: '',
    page: String(page),
    exact: 'false',
    onlyHighlights: '0',
    onlyBookmark: '0',
    digitalFair: '0',
    preference: 'state',
    mapLayer: 'hybrid',
    order: 'relevants',
    business_type: BUSINESS_TYPE_ID,
    business: 'venda',
    type: RESIDENTIAL_TYPE_ID,
    city: 'maringa-pr',
    map: '0',
    localName: 'Maringá ',
    localUf: 'PR',
    local: MARINGA_LOCAL_ID,
  });
}

export function resolveSub100ApiBase(apiBase?: string) {
  if (apiBase) return apiBase.replace(/\/$/, '');
  return '/api';
}

export async function fetchSub100Page({
  page,
  apiBase,
}: Sub100SearchParams): Promise<Sub100SearchResponse> {
  const base = resolveSub100ApiBase(apiBase);
  const url = `${base}/properties?${buildSearchParams(page).toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SUB100 API error (${response.status})`);
  }

  return response.json() as Promise<Sub100SearchResponse>;
}
