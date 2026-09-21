export interface NeighborhoodProperties {
  NOME?: string | null;
  ZONA?: string | number | null;
  COD_BAIRRO_GEO?: string | number | null;
  LT_NOMEFANT?: string | null;
}

export interface NeighborhoodFeature {
  type: 'Feature';
  properties: NeighborhoodProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface NeighborhoodCollection {
  type: 'FeatureCollection';
  features: NeighborhoodFeature[];
}

export interface RecordLocation {
  neighborhood: string;
  region: string;
  source: 'prefeitura' | 'sub100';
}

export const REGIONS = ['Central', 'Norte', 'Sul', 'Leste', 'Oeste'];

export const normalizeNeighborhoodName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\da-z]+/g, ' ')
    .trim();

export function displayNeighborhoodName(value: string) {
  const expanded = value
    .replace(/\bJd\.?\b/gi, 'Jardim')
    .replace(/\bCond\.?\b/gi, 'Condomínio')
    .replace(/\bConj\.?\b/gi, 'Conjunto')
    .replace(/\bParq\.?\b/gi, 'Parque')
    .replace(/\bRes\.?\b/gi, 'Residencial')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');
  const lowercaseWords = new Set(['a', 'as', 'da', 'das', 'de', 'do', 'dos', 'e']);
  const title = expanded
    .split(' ')
    .map((word, index) =>
      index > 0 && lowercaseWords.has(word)
        ? word
        : word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    )
    .join(' ');
  return title
    .replace(/\s*[-–—]?\s*Amplia.*$/i, '')
    .replace(/\s+(I|II|III|IV|V|VI|\d+)\s*(ª|º|a|o)?\s+Parte$/i, '')
    .trim();
}

const REGION_ALIASES: Record<string, string[]> = {
  Central: [
    'zona 01', 'centro', 'novo centro', 'zona 02', 'zona 03',
    'vila operaria', 'zona 04', 'zona 05', 'conjunto itamaraty',
    'maringa velho', 'zona 06', 'central parque', 'conjunto planalto',
    'zona 07', 'jardim universitario', 'jardim acema', 'jardim ipiranga',
    'zona 09', 'zona 10',
  ],
  Norte: [
    'alvorada', 'jardim novo alvorada', 'mandacaru', 'cidade universitaria',
    'jardim mandacaru', 'vila progresso', 'campos eliseos',
    'conjunto champagnat', 'jardim piata', 'loteamento batel', 'imperial',
    'jardim imperial', 'pinheiros', 'jardim pinheiros', 'jardim santa alice',
    'paris', 'jardim paris', 'jardim santa helena', 'vila esperanca',
    'vila nevada', 'vila morangueira', 'chacaras morangueira',
    'jardim castor', 'parque patricia', 'grevileas', 'parque das grevileas',
    'jardim kakogawa',
  ],
  Sul: [
    'novo horizonte', 'jardim novo horizonte', 'vila emilia', 'vila marumbi',
    'parque industrial', 'distrito industrial', 'parque industrial cocamar',
    'cidade hanover', 'guapore', 'jardim guapore', 'jardim das nacoes',
    'condominio betel', 'cidade moncoes', 'morada de florenca',
    'jardim bela vista', 'jardim italia', 'vila fontana', 'jardim botanico',
    'jardim sao conrado', 'alamar', 'jardim alamar', 'ceu azul',
    'jardim laodiceia',
  ],
  Leste: [
    'zona 08', 'aeroporto', 'acl imacao', 'aclimacao', 'parthenon',
    'versailles', 'saint etienne', 'quinta da torre', 'ipanema',
    'jardim ipanema', 'jardim leblon', 'jardim arpoador', 'parque da gavea',
    'cidade alta', 'conjunto cidade alta', 'jardim paraiso', 'loteamento madrid',
    'sao silvestre', 'greenfields', 'villagio treviso', 'conjunto europa',
  ],
  Oeste: [
    'hortencia', 'jardim california', 'jardim continental', 'parque hortencia',
    'indaia', 'jardim indaia', 'jardim montreal', 'jardim sao miguel',
    'olimpico', 'jardim olimpico', 'giardino san marco', 'residencial arezzo',
  ],
};

const NORMALIZED_REGION_ALIASES = Object.entries(REGION_ALIASES).map(
  ([region, aliases]) => ({
    region,
    aliases: aliases.map(normalizeNeighborhoodName),
  })
);

export function regionForNeighborhood(value: string): string {
  const name = normalizeNeighborhoodName(value);
  for (const { region, aliases } of NORMALIZED_REGION_ALIASES) {
    if (
      aliases.some(
        (alias) =>
          name === alias ||
          name.startsWith(`${alias} `) ||
          name.includes(` ${alias} `)
      )
    ) {
      return region;
    }
  }
  return 'Sem região no guia';
}

function pointInRing(point: [number, number], ring: number[][]) {
  let inside = false;
  const [x, y] = point;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInGeometry(
  point: [number, number],
  geometry: NeighborhoodFeature['geometry']
) {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as number[][][]]
      : (geometry.coordinates as number[][][][]);

  return polygons.some((rings) => {
    if (!pointInRing(point, rings[0])) return false;
    return !rings.slice(1).some((hole) => pointInRing(point, hole));
  });
}

export function classifyRecord(
  point: [number, number],
  rawNeighborhood: string,
  boundaries?: NeighborhoodCollection | null
): RecordLocation {
  if (boundaries) {
    const boundary = boundaries.features.find((feature) =>
      pointInGeometry(point, feature.geometry)
    );
    const officialName = boundary?.properties.NOME?.trim();
    if (officialName) {
      return {
        neighborhood: displayNeighborhoodName(officialName),
        region: regionForNeighborhood(officialName),
        source: 'prefeitura',
      };
    }
  }

  return {
    neighborhood: displayNeighborhoodName(rawNeighborhood.trim() || 'Sem bairro informado'),
    region: regionForNeighborhood(rawNeighborhood),
    source: 'sub100',
  };
}
