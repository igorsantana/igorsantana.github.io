import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import {
  applyHeatOptions,
  buildHeatPoints,
  buildLegend,
  colorFor,
  fmtBRL,
  fmtPm2,
  median,
  parsePriceInput,
  popupHtml,
  recMatchesFilter,
} from './mapUtils';
import type {
  HeatWeight,
  MapRecord,
  MaringaImoveisMapProps,
  MetricMode,
  ViewMode,
} from './types';
import {
  classifyRecord,
  displayNeighborhoodName,
  REGIONS,
  normalizeNeighborhoodName,
  type NeighborhoodCollection,
  type RecordLocation,
} from './neighborhoodData';
import { useMapDataSource } from './useMapDataLoader';
import { useSub100LiveLoader } from './useSub100LiveLoader';
import './MaringaImoveisMap.css';

const DEFAULT_CENTER: [number, number] = [-23.43, -51.95];
const DEFAULT_ZOOM = 12;
const PROPERTY_PAGE_SIZE = 12;
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const NEIGHBORHOOD_COLORS = [
  '#e76f51',
  '#2a9d8f',
  '#e9c46a',
  '#457b9d',
  '#f4a261',
  '#6a4c93',
  '#43aa8b',
  '#d62828',
  '#277da1',
  '#bc6c25',
  '#577590',
  '#c8553d',
  '#4d908e',
  '#f3722c',
  '#7b2cbf',
  '#90be6d',
];

function coordinatesForBoundary(feature: NeighborhoodCollection['features'][number]) {
  const points: number[][] = [];
  const visit = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      points.push(value as number[]);
      return;
    }
    value.forEach(visit);
  };
  visit(feature.geometry.coordinates);
  return points;
}

function buildBoundaryColors(boundaries: NeighborhoodCollection) {
  const boxes = boundaries.features.map((feature) => {
    const points = coordinatesForBoundary(feature);
    return {
      minX: Math.min(...points.map((point) => point[0])),
      minY: Math.min(...points.map((point) => point[1])),
      maxX: Math.max(...points.map((point) => point[0])),
      maxY: Math.max(...points.map((point) => point[1])),
    };
  });
  const colors = new WeakMap<
    NeighborhoodCollection['features'][number],
    string
  >();

  boundaries.features.forEach((feature, index) => {
    const used = new Set<string>();
    const box = boxes[index];
    for (let previous = 0; previous < index; previous += 1) {
      const other = boxes[previous];
      const overlaps =
        box.minX <= other.maxX &&
        box.maxX >= other.minX &&
        box.minY <= other.maxY &&
        box.maxY >= other.minY;
      if (overlaps) {
        const previousColor = colors.get(boundaries.features[previous]);
        if (previousColor) used.add(previousColor);
      }
    }
    const color =
      NEIGHBORHOOD_COLORS.find((candidate) => !used.has(candidate)) ??
      NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length];
    colors.set(feature, color);
  });

  return colors;
}

type PriceM2ReportRow = {
  neighborhood: string;
  region: string;
  apartment: number[];
  house: number[];
  combined: number[];
};

function recordPhotos(record: MapRecord) {
  return record[12] ?? [];
}

function propertyDescription(record: MapRecord) {
  const [, , price, priceM2, type, area, dorms, , street, number] = record;
  return [
    `${type} por ${fmtBRL(price)}`,
    area ? `${area} m² privativos` : null,
    dorms ? `${dorms} dormitórios` : null,
    priceM2 ? `${fmtPm2(priceM2)}/m²` : null,
    street || number
      ? `Endereço: ${[street, number].filter(Boolean).join(', ')}`
      : null,
  ].filter(Boolean) as string[];
}

function buildPriceM2Report(
  records: MapRecord[],
  locations: Map<string, RecordLocation>
): PriceM2ReportRow[] {
  const grouped = new Map<string, PriceM2ReportRow>();

  for (const record of records) {
    const priceM2 = record[3];
    if (priceM2 == null || !['Apartamento', 'Casa'].includes(record[4])) continue;

    const location = locations.get(record[10]) ?? {
      neighborhood: record[7].trim() || 'Sem bairro informado',
      region: 'Sem região no guia',
    };
    const neighborhood = location.neighborhood;
    const row = grouped.get(neighborhood) ?? {
      neighborhood,
      region: location.region,
      apartment: [],
      house: [],
      combined: [],
    };

    if (record[4] === 'Apartamento') row.apartment.push(priceM2);
    if (record[4] === 'Casa') row.house.push(priceM2);
    row.combined.push(priceM2);
    grouped.set(neighborhood, row);
  }

  return [...grouped.values()].sort((a, b) =>
    a.neighborhood.localeCompare(b.neighborhood, 'pt-BR')
  );
}

function reportMedian(row: PriceM2ReportRow, key: 'apartment' | 'house' | 'combined') {
  return median(row[key]);
}

function formatReportValue(values: number[]) {
  return values.length ? fmtPm2(median(values) as number) : '—';
}

function priceCellStyle(value: number | null, values: number[]) {
  if (value == null || values.length < 2) return undefined;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  const hue = Math.round(120 - ratio * 120);
  return { backgroundColor: `hsla(${hue}, 70%, 45%, 0.16)` };
}

function downloadPriceM2Report(rows: PriceM2ReportRow[]) {
  const header = [
    'Bairro',
    'Região',
    'Apartamentos - mediana R$/m²',
    'Apartamentos - anúncios',
    'Casas - mediana R$/m²',
    'Casas - anúncios',
    'Combinado - mediana R$/m²',
    'Combinado - anúncios',
  ];
  const lines = rows.map((row) => [
    row.neighborhood,
    row.region,
    median(row.apartment) ?? '',
    row.apartment.length,
    median(row.house) ?? '',
    row.house.length,
    median(row.combined) ?? '',
    row.combined.length,
  ]);
  const csv = [header, ...lines]
    .map((line) =>
      line
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(';')
    )
    .join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'relatorio-preco-m2-por-bairro.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function MaringaImoveisMap({
  data,
  dataUrl,
  liveFetch = false,
  apiBase,
  manualStart,
  neighborhoodBoundariesUrl,
  className,
  style,
  height = '100%',
  title = 'Imóveis à venda — Maringá/PR',
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  onLoaded,
  onError,
}: MaringaImoveisMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatRef = useRef<L.HeatLayer | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const renderedIdsRef = useRef<Set<string>>(new Set());
  const needsFullRedrawRef = useRef(true);

  const staticState = useMapDataSource(liveFetch ? {} : { data, dataUrl });
  const liveState = useSub100LiveLoader({ apiBase });
  const loadState = liveFetch ? liveState : staticState;
  const mapData = loadState.data;
  const waitForStart = liveFetch && (manualStart ?? true);
  const [boundaries, setBoundaries] = useState<NeighborhoodCollection | null>(null);
  const [boundaryStatus, setBoundaryStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >(neighborhoodBoundariesUrl ? 'loading' : 'idle');

  useEffect(() => {
    if (!neighborhoodBoundariesUrl) return;
    let cancelled = false;
    setBoundaryStatus('loading');
    fetch(neighborhoodBoundariesUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar limites dos bairros');
        return response.json() as Promise<NeighborhoodCollection>;
      })
      .then((value) => {
        if (cancelled) return;
        setBoundaries(value);
        setBoundaryStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setBoundaryStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [neighborhoodBoundariesUrl]);

  const propertyTypes = useMemo(
    () =>
      mapData ? [...new Set(mapData.records.map((rec) => rec[4]))].sort() : [],
    [mapData]
  );

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [neighborhood, setNeighborhood] = useState('');
  const [neighborhoodQuery, setNeighborhoodQuery] = useState('');
  const [neighborhoodSuggestionsOpen, setNeighborhoodSuggestionsOpen] = useState(false);
  const [region, setRegion] = useState('');
  const [minDorms, setMinDorms] = useState(0);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [minAreaInput, setMinAreaInput] = useState('');
  const [maxAreaInput, setMaxAreaInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('pontos');
  const [metric, setMetric] = useState<MetricMode>('preco');
  const [heatWeight, setHeatWeight] = useState<HeatWeight>('densidade');
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedNeighborhoodPanel, setSelectedNeighborhoodPanel] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<MapRecord | null>(null);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [propertyPanelSort, setPropertyPanelSort] = useState<'price' | 'pm2'>(
    'price'
  );
  const [propertyPanelSortDirection, setPropertyPanelSortDirection] = useState<
    'asc' | 'desc'
  >('desc');
  const [visiblePropertyCount, setVisiblePropertyCount] = useState(
    PROPERTY_PAGE_SIZE
  );
  const propertyGridRef = useRef<HTMLDivElement | null>(null);
  const propertyLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const [reportSort, setReportSort] = useState<
    'neighborhood' | 'apartment' | 'house' | 'combined'
  >('neighborhood');
  const boundaryColors = useMemo(
    () => (boundaries ? buildBoundaryColors(boundaries) : null),
    [boundaries]
  );

  const recordLocations = useMemo(() => {
    const locations = new Map<string, RecordLocation>();
    const canonicalNames = new Map<string, string>();
    for (const record of mapData?.records ?? []) {
      const location = classifyRecord(
        [record[0], record[1]],
        record[7],
        boundaries
      );
      const canonicalKey = normalizeNeighborhoodName(location.neighborhood);
      const canonicalName =
        canonicalNames.get(canonicalKey) ?? location.neighborhood;
      canonicalNames.set(canonicalKey, canonicalName);
      locations.set(record[10], { ...location, neighborhood: canonicalName });
    }
    return locations;
  }, [mapData, boundaries]);

  const neighborhoods = useMemo(
    () =>
      [...new Set([...recordLocations.values()].map((location) => location.neighborhood))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [recordLocations]
  );

  const neighborhoodSuggestions = useMemo(() => {
    const query = normalizeNeighborhoodName(neighborhoodQuery);
    if (!query) return neighborhoods.slice(0, 8);
    return neighborhoods
      .filter((item) => normalizeNeighborhoodName(item).includes(query))
      .slice(0, 8);
  }, [neighborhoodQuery, neighborhoods]);

  const regions = useMemo(
    () => REGIONS,
    []
  );

  const selectedNeighborhoodRecords = useMemo(
    () =>
      mapData?.records.filter(
        (record) =>
          selectedNeighborhoodPanel &&
          recordLocations.get(record[10])?.neighborhood ===
            selectedNeighborhoodPanel
      ) ?? [],
    [mapData, recordLocations, selectedNeighborhoodPanel]
  );

  const selectedNeighborhoodReport = useMemo(() => {
    if (!selectedNeighborhoodPanel) return null;
    return (
      buildPriceM2Report(selectedNeighborhoodRecords, recordLocations).find(
        (row) => row.neighborhood === selectedNeighborhoodPanel
      ) ?? null
    );
  }, [recordLocations, selectedNeighborhoodPanel, selectedNeighborhoodRecords]);

  const sortedNeighborhoodRecords = useMemo(
    () =>
      [...selectedNeighborhoodRecords].sort((a, b) => {
        const aValue = propertyPanelSort === 'price' ? a[2] : a[3] ?? -1;
        const bValue = propertyPanelSort === 'price' ? b[2] : b[3] ?? -1;
        return propertyPanelSortDirection === 'desc'
          ? bValue - aValue
          : aValue - bValue;
      }),
    [propertyPanelSort, propertyPanelSortDirection, selectedNeighborhoodRecords]
  );

  const changePropertyPanelSort = (sort: 'price' | 'pm2') => {
    if (sort === propertyPanelSort) {
      setPropertyPanelSortDirection((direction) =>
        direction === 'desc' ? 'asc' : 'desc'
      );
      return;
    }
    setPropertyPanelSort(sort);
    setPropertyPanelSortDirection('desc');
  };

  const visibleNeighborhoodRecords = useMemo(
    () =>
      sortedNeighborhoodRecords.slice(0, visiblePropertyCount),
    [sortedNeighborhoodRecords, visiblePropertyCount]
  );

  useEffect(() => {
    setVisiblePropertyCount(PROPERTY_PAGE_SIZE);
  }, [propertyPanelSort, propertyPanelSortDirection, selectedNeighborhoodPanel]);

  useEffect(() => {
    const root = propertyGridRef.current;
    const target = propertyLoadMoreRef.current;
    if (!root || !target || visiblePropertyCount >= sortedNeighborhoodRecords.length) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisiblePropertyCount((count) =>
          Math.min(count + PROPERTY_PAGE_SIZE, sortedNeighborhoodRecords.length)
        );
      },
      { root, rootMargin: '160px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [sortedNeighborhoodRecords.length, visiblePropertyCount]);

  useEffect(() => {
    if (!mapData || !propertyTypes.length) return;
    setSelectedTypes(new Set(propertyTypes));
  }, [mapData, propertyTypes]);

  useEffect(() => {
    if (loadState.status === 'ready' && mapData) onLoaded?.(mapData);
    if (loadState.status === 'error' && loadState.error) onError?.(loadState.error);
  }, [loadState.status, loadState.error, mapData, onLoaded, onError]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      renderer: L.canvas(),
      zoomControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
    }).setView(defaultCenter, defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const heat = L.heatLayer([], {
      radius: 20,
      blur: 22,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.2,
      gradient: {
        0.25: '#2ecc71',
        0.45: '#ffd54f',
        0.65: '#ff9800',
        0.82: '#e53935',
        1: '#8e0000',
      },
    });

    mapInstanceRef.current = map;
    heatRef.current = heat;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      heatRef.current = null;
      markersRef.current = null;
      renderedIdsRef.current.clear();
    };
  }, [defaultCenter, defaultZoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }
    if (!boundaries) return;

    const layer = L.geoJSON(
      boundaries as unknown as GeoJSON.GeoJsonObject,
      {
        style: (feature) => ({
          color: '#ffffff',
          weight: 1.2,
          opacity: 0.85,
          fillColor:
            boundaryColors?.get(
              feature as NeighborhoodCollection['features'][number]
            ) ?? '#8bbcff',
          fillOpacity: 0.32,
        }),
        onEachFeature: (feature, featureLayer) => {
          const name = feature.properties?.NOME;
          if (name) {
            const displayName = displayNeighborhoodName(String(name));
            const canonicalName =
              [...recordLocations.values()].find(
                (location) =>
                  normalizeNeighborhoodName(location.neighborhood) ===
                  normalizeNeighborhoodName(displayName)
              )?.neighborhood ?? displayName;
            featureLayer.bindTooltip(canonicalName, { sticky: true });
            featureLayer.on('click', () =>
              setSelectedNeighborhoodPanel(canonicalName)
            );
          }
        },
      }
    ).addTo(map);
    boundaryLayerRef.current = layer;

    return () => {
      if (boundaryLayerRef.current === layer) {
        map.removeLayer(layer);
        boundaryLayerRef.current = null;
      }
    };
  }, [boundaries, boundaryColors, recordLocations]);

  const filters = useMemo(
    () => ({
      selectedTypes,
      neighborhood,
      region,
      minDorms,
      minPrice: parsePriceInput(minPriceInput),
      maxPrice: parsePriceInput(maxPriceInput),
      minArea: parsePriceInput(minAreaInput),
      maxArea: parsePriceInput(maxAreaInput),
    }),
    [
      selectedTypes,
      neighborhood,
      region,
      minDorms,
      minPriceInput,
      maxPriceInput,
      minAreaInput,
      maxAreaInput,
    ]
  );

  const filtered = useMemo(() => {
    if (!mapData) return [];
    return mapData.records.filter((rec) =>
      recMatchesFilter(rec, filters, recordLocations.get(rec[10]))
    );
  }, [mapData, filters, recordLocations]);

  const stats = useMemo(() => {
    const prices = filtered.map((rec) => rec[2]).sort((a, b) => a - b);
    const pricesM2 = filtered
      .filter((rec) => rec[3] != null)
      .map((rec) => rec[3] as number)
      .sort((a, b) => a - b);

    return {
      count: filtered.length,
      medianPrice: median(prices),
      medianPriceM2: median(pricesM2),
    };
  }, [filtered]);

  const priceM2Report = useMemo(
    () => buildPriceM2Report(mapData?.records ?? [], recordLocations),
    [mapData, recordLocations]
  );

  const sortedPriceM2Report = useMemo(() => {
    const rows = [...priceM2Report];
    if (reportSort === 'neighborhood') {
      return rows.sort((a, b) =>
        a.neighborhood.localeCompare(b.neighborhood, 'pt-BR')
      );
    }
    return rows.sort((a, b) =>
      (reportMedian(b, reportSort) ?? -1) - (reportMedian(a, reportSort) ?? -1)
    );
  }, [priceM2Report, reportSort]);

  const reportPriceValues = useMemo(
    () => ({
      apartment: priceM2Report
        .map((row) => reportMedian(row, 'apartment'))
        .filter((value): value is number => value != null),
      house: priceM2Report
        .map((row) => reportMedian(row, 'house'))
        .filter((value): value is number => value != null),
      combined: priceM2Report
        .map((row) => reportMedian(row, 'combined'))
        .filter((value): value is number => value != null),
    }),
    [priceM2Report]
  );

  const legend = useMemo(() => {
    if (!mapData || !mapData.records.length) return null;
    return buildLegend(mapData, viewMode, metric, heatWeight);
  }, [mapData, viewMode, metric, heatWeight]);

  useEffect(() => {
    needsFullRedrawRef.current = true;
  }, [viewMode, metric, heatWeight, filters]);

  const appendMarker = (rec: MapRecord, group: L.LayerGroup, dataForColor: NonNullable<typeof mapData>) => {
    L.circleMarker([rec[1], rec[0]], {
      radius: 6,
      color: '#fff',
      weight: 0.5,
      fillColor: colorFor(rec, dataForColor, metric),
      fillOpacity: 0.85,
    })
      .bindPopup(popupHtml(rec, recordLocations.get(rec[10])))
      .addTo(group);
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    const heat = heatRef.current;
    if (!map || !heat || !mapData) return;

    if (viewMode === 'calor') {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
        markersRef.current = null;
        renderedIdsRef.current.clear();
      }
      if (!map.hasLayer(heat)) heat.addTo(map);
      applyHeatOptions(heat, filtered.length, heatWeight);
      heat.setLatLngs(buildHeatPoints(filtered, mapData, heatWeight));
      return;
    }

    if (map.hasLayer(heat)) map.removeLayer(heat);

    if (needsFullRedrawRef.current) {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
      }
      markersRef.current = L.layerGroup().addTo(map);
      renderedIdsRef.current.clear();
      needsFullRedrawRef.current = false;
    }

    const group = markersRef.current ?? L.layerGroup().addTo(map);
    markersRef.current = group;

    for (const rec of filtered) {
      const id = rec[10];
      if (renderedIdsRef.current.has(id)) continue;
      renderedIdsRef.current.add(id);
      appendMarker(rec, group, mapData);
    }
  }, [mapData, filtered, viewMode, metric, heatWeight]);

  const toggleType = (type: string, checked: boolean) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  };

  const progressPct = Math.round(loadState.progress * 100);
  const isLoading = loadState.status === 'loading' || loadState.status === 'parsing';
  const showStart = waitForStart && loadState.status === 'idle';
  const canRefreshLive =
    liveFetch && mapData?.records.length && loadState.status === 'ready' && !isLoading;
  const loadingLabel = liveFetch
    ? `Carregando imóveis… ${liveState.loadedPages}/${liveState.totalPages || '?'} páginas`
    : loadState.status === 'parsing'
      ? 'Preparando mapa…'
      : 'Carregando mapa…';

  const panelVisible = mapData || liveFetch;

  const movePhoto = (
    event: MouseEvent<HTMLButtonElement>,
    record: MapRecord,
    direction: number
  ) => {
    event.stopPropagation();
    const photos = recordPhotos(record);
    if (!photos.length) return;
    setLoadingPhotos((previous) => ({ ...previous, [record[10]]: true }));
    setPhotoIndexes((previous) => ({
      ...previous,
      [record[10]]:
        ((previous[record[10]] ?? 0) + direction + photos.length) % photos.length,
    }));
  };

  const markPhotoLoaded = (reference: string) => {
    setLoadingPhotos((previous) => {
      if (!previous[reference]) return previous;
      const next = { ...previous };
      delete next[reference];
      return next;
    });
  };

  return (
    <div
      className={['mim-root', className].filter(Boolean).join(' ')}
      style={{ ...style, height }}
    >
      <div ref={mapRef} className="mim-map" />

      {canRefreshLive && (
        <button
          type="button"
          className="mim-refresh-btn"
          onClick={liveState.start}
        >
          <span aria-hidden="true">↻</span>
          Atualizar dados
        </button>
      )}

      {showStart && (
        <div className="mim-start">
          <div className="mim-start-card">
            <div className="mim-loader-title">Mapa de imóveis em Maringá</div>
            <div className="mim-loader-sub">
              Busca anúncios residenciais (casa e apartamento) ao vivo no SUB100.
            </div>
            <button type="button" className="mim-start-btn" onClick={liveState.start}>
              Carregar imóveis
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mim-loader mim-loader-inline" role="status" aria-live="polite">
          <div className="mim-loader-card">
            <div className="mim-loader-title">{loadingLabel}</div>
            <div className="mim-loader-sub">
              {mapData?.count
                ? `${mapData.count.toLocaleString('pt-BR')} imóveis no mapa`
                : 'Aguardando primeiros resultados…'}
            </div>
            <div className="mim-progress" aria-hidden="true">
              <div className="mim-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mim-progress-label">{progressPct}%</div>
          </div>
        </div>
      )}

      {loadState.status === 'error' && (
        <div className="mim-error">
          <div>
            <strong>Não foi possível carregar o mapa.</strong>
            <div>{loadState.error?.message}</div>
            {liveFetch && (
              <button type="button" className="mim-start-btn mim-start-btn-inline" onClick={liveState.start}>
                Tentar novamente
              </button>
            )}
          </div>
        </div>
      )}

      {panelVisible && (
        <div className="mim-panel">
          <h1>{title}</h1>

          <details className="mim-filter-details">
            <summary>
              <span>Filtros</span>
              <span className="mim-filter-summary">visualização · imóvel · localização</span>
            </summary>

          <div className="mim-sec">Visualização</div>
          <div className="mim-btn-group">
            <button
              type="button"
              className={`mim-btn${viewMode === 'pontos' ? ' is-active' : ''}`}
              onClick={() => setViewMode('pontos')}
              disabled={!mapData?.records.length}
            >
              Pontos
            </button>
            <button
              type="button"
              className={`mim-btn${viewMode === 'calor' ? ' is-active' : ''}`}
              onClick={() => setViewMode('calor')}
              disabled={!mapData?.records.length}
            >
              Mapa de calor
            </button>
          </div>

          {viewMode === 'calor' && (
            <>
              <div className="mim-sec">Peso do calor</div>
              <div className="mim-btn-group">
                <button
                  type="button"
                  className={`mim-btn${heatWeight === 'densidade' ? ' is-active' : ''}`}
                  onClick={() => setHeatWeight('densidade')}
                >
                  Densidade
                </button>
                <button
                  type="button"
                  className={`mim-btn${heatWeight === 'preco' ? ' is-active' : ''}`}
                  onClick={() => setHeatWeight('preco')}
                >
                  Preço R$/m²
                </button>
              </div>
            </>
          )}

          <div className="mim-sec">Cor por</div>
          <div className="mim-btn-group">
            <button
              type="button"
              className={`mim-btn${metric === 'preco' ? ' is-active' : ''}`}
              onClick={() => setMetric('preco')}
            >
              Preço
            </button>
            <button
              type="button"
              className={`mim-btn${metric === 'pm2' ? ' is-active' : ''}`}
              onClick={() => setMetric('pm2')}
            >
              R$/m²
            </button>
            <button
              type="button"
              className={`mim-btn${metric === 'tipo' ? ' is-active' : ''}`}
              onClick={() => setMetric('tipo')}
            >
              Tipo
            </button>
          </div>

          {propertyTypes.length > 0 && (
            <>
              <div className="mim-sec">Tipo</div>
                <div className="mim-choice-grid">
                {propertyTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`mim-choice-btn${selectedTypes.has(type) ? ' is-active' : ''}`}
                      aria-pressed={selectedTypes.has(type)}
                      onClick={() => toggleType(type, !selectedTypes.has(type))}
                    >
                      {type}
                    </button>
                ))}
              </div>
            </>
          )}

          <div className="mim-sec">Dormitórios</div>
            <div className="mim-dorm-slider">
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={minDorms}
                onChange={(event) => setMinDorms(Number(event.target.value))}
                aria-label="Mínimo de dormitórios"
              />
              <output>{minDorms === 0 ? 'Todos' : `${minDorms}+`}</output>
          </div>

          <div className="mim-sec">Bairro</div>
            <div className="mim-typeahead">
              <input
                className="mim-input"
                type="search"
                value={neighborhood || neighborhoodQuery}
                placeholder={
                  boundaryStatus === 'ready'
                    ? 'Buscar bairro oficial…'
                    : 'Buscar bairro…'
                }
                onChange={(event) => {
                  setNeighborhood('');
                  setNeighborhoodQuery(event.target.value);
                  setNeighborhoodSuggestionsOpen(true);
                }}
                onFocus={() => setNeighborhoodSuggestionsOpen(true)}
                onBlur={() => {
                  window.setTimeout(
                    () => setNeighborhoodSuggestionsOpen(false),
                    120
                  );
                }}
                aria-label="Buscar bairro"
                aria-autocomplete="list"
              />
              {neighborhood && (
                <button
                  type="button"
                  className="mim-typeahead-clear"
                  onClick={() => {
                    setNeighborhood('');
                    setNeighborhoodQuery('');
                  }}
                  aria-label="Limpar bairro"
                >
                  ×
                </button>
              )}
              {neighborhoodSuggestionsOpen && !neighborhood && (
                <div className="mim-typeahead-list" role="listbox">
                  <button
                    type="button"
                    className="mim-typeahead-option mim-typeahead-option-muted"
                    onMouseDown={() => {
                      setNeighborhood('');
                      setNeighborhoodQuery('');
                      setNeighborhoodSuggestionsOpen(false);
                    }}
                  >
                    Todos os bairros
                  </button>
                  {neighborhoodSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="mim-typeahead-option"
                      onMouseDown={() => {
                        setNeighborhood(item);
                        setNeighborhoodQuery('');
                        setNeighborhoodSuggestionsOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

          <div className="mim-sec">Região</div>
            <div className="mim-choice-grid mim-region-grid">
              <button
                type="button"
                className={`mim-choice-btn${!region ? ' is-active' : ''}`}
                aria-pressed={!region}
                onClick={() => setRegion('')}
              >
                Todas
              </button>
              {regions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`mim-choice-btn${region === item ? ' is-active' : ''}`}
                  aria-pressed={region === item}
                  onClick={() => setRegion(item)}
                >
                  {item}
                </button>
              ))}
            </div>

          <div className="mim-sec">Faixa de preço (R$)</div>
          <div className="mim-price-row">
            <input
              className="mim-input"
              placeholder="mín"
              inputMode="numeric"
              value={minPriceInput}
              onChange={(event) => setMinPriceInput(event.target.value)}
            />
            <input
              className="mim-input"
              placeholder="máx"
              inputMode="numeric"
              value={maxPriceInput}
              onChange={(event) => setMaxPriceInput(event.target.value)}
            />
          </div>

          <div className="mim-sec">Área privativa (m²)</div>
          <div className="mim-price-row">
            <input
              className="mim-input"
              placeholder="mín"
              inputMode="numeric"
              value={minAreaInput}
              onChange={(event) => setMinAreaInput(event.target.value)}
              aria-label="Área mínima em metros quadrados"
            />
            <input
              className="mim-input"
              placeholder="máx"
              inputMode="numeric"
              value={maxAreaInput}
              onChange={(event) => setMaxAreaInput(event.target.value)}
              aria-label="Área máxima em metros quadrados"
            />
          </div>

          </details>

          <button
            type="button"
            className="mim-report-btn"
            onClick={() => setReportOpen(true)}
            disabled={!mapData?.records.length}
          >
            <span aria-hidden="true">▤</span>
            Gerar relatório de R$/m² por bairro
          </button>

          <div className="mim-stats">
            <div className="mim-stat">
              <b>{stats.count}</b>
              <span>imóveis</span>
            </div>
            <div className="mim-stat">
              <b>{stats.medianPrice != null ? fmtBRL(stats.medianPrice) : '—'}</b>
              <span>preço mediano</span>
            </div>
            <div className="mim-stat">
              <b>
                {stats.medianPriceM2 != null
                  ? `R$ ${Math.round(stats.medianPriceM2).toLocaleString('pt-BR')}`
                  : '—'}
              </b>
              <span>R$/m² mediano</span>
            </div>
          </div>

          {legend && (
            <div className="mim-legend">
              <div className="lbl">{legend.title}</div>
              {legend.tipoHtml ? (
                <div
                  className="grad"
                  style={{ background: 'none' }}
                  dangerouslySetInnerHTML={{
                    __html: `<div style="font-size:11px">${legend.tipoHtml}</div>`,
                  }}
                />
              ) : (
                <div className="grad" style={{ background: legend.gradient }} />
              )}
              <div className="labels">
                <span>{legend.minLabel}</span>
                <span>{legend.maxLabel}</span>
              </div>
              <div className="mim-footnote">
                Fontes: sub100.com.br (coletado ao vivo). Preços são de <b>anúncio</b> (oferta),
                não de venda efetiva.
              </div>
            </div>
          )}
        </div>
      )}

      {selectedNeighborhoodPanel && mapData && (
        <aside className="mim-property-panel">
          <div className="mim-property-panel-header">
            <div>
              <div className="mim-sec">Bairro selecionado</div>
              <h2>{selectedNeighborhoodPanel}</h2>
              {selectedNeighborhoodReport?.region && (
                <span>{selectedNeighborhoodReport.region}</span>
              )}
            </div>
            <button
              type="button"
              className="mim-report-close"
              onClick={() => setSelectedNeighborhoodPanel('')}
              aria-label="Fechar imóveis do bairro"
            >
              ×
            </button>
          </div>

          {selectedNeighborhoodReport && (
            <div className="mim-neighborhood-summary">
              <div>
                <span>Apartamentos</span>
                <b>{formatReportValue(selectedNeighborhoodReport.apartment)}</b>
              </div>
              <div>
                <span>Casas</span>
                <b>{formatReportValue(selectedNeighborhoodReport.house)}</b>
              </div>
              <div>
                <span>Combinado</span>
                <b>{formatReportValue(selectedNeighborhoodReport.combined)}</b>
              </div>
            </div>
          )}

          <div className="mim-property-panel-count">
            {selectedNeighborhoodRecords.length} imóveis encontrados
          </div>
          <div className="mim-property-panel-sort">
            <span>Ordenar por</span>
            <button
              type="button"
              className={propertyPanelSort === 'price' ? 'is-active' : ''}
              onClick={() => changePropertyPanelSort('price')}
            >
              Preço {propertyPanelSort === 'price' ? (propertyPanelSortDirection === 'desc' ? '↓' : '↑') : ''}
            </button>
            <button
              type="button"
              className={propertyPanelSort === 'pm2' ? 'is-active' : ''}
              onClick={() => changePropertyPanelSort('pm2')}
            >
              R$/m² {propertyPanelSort === 'pm2' ? (propertyPanelSortDirection === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
          {selectedNeighborhoodRecords.length ? (
            <div className="mim-property-grid" ref={propertyGridRef}>
              {visibleNeighborhoodRecords.map((record) => {
                const photos = recordPhotos(record);
                const photoIndex = photoIndexes[record[10]] ?? 0;
                const markerColor = colorFor(record, mapData, 'preco');
                return (
                  <article
                    key={record[10]}
                    className="mim-property-card"
                    style={{ borderTopColor: markerColor }}
                    onClick={() => setSelectedProperty(record)}
                  >
                    <div
                      className={`mim-property-image${
                        loadingPhotos[record[10]] ? ' is-loading' : ''
                      }`}
                    >
                      {photos.length ? (
                        <img
                          src={photos[photoIndex]}
                          alt={`${record[4]} em ${selectedNeighborhoodPanel}`}
                          loading="lazy"
                          onLoadStart={() =>
                            setLoadingPhotos((previous) => ({
                              ...previous,
                              [record[10]]: true,
                            }))
                          }
                          onLoad={() => markPhotoLoaded(record[10])}
                          onError={() => markPhotoLoaded(record[10])}
                        />
                      ) : (
                        <div className="mim-property-no-image">Sem foto</div>
                      )}
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="mim-property-arrow mim-property-arrow-left"
                            onClick={(event) => movePhoto(event, record, -1)}
                            disabled={Boolean(loadingPhotos[record[10]])}
                            aria-label="Foto anterior"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="mim-property-arrow mim-property-arrow-right"
                            onClick={(event) => movePhoto(event, record, 1)}
                            disabled={Boolean(loadingPhotos[record[10]])}
                            aria-label="Próxima foto"
                          >
                            ›
                          </button>
                        </>
                      )}
                      <span
                        className="mim-property-price"
                        style={{ color: markerColor }}
                      >
                        {fmtBRL(record[2])}
                      </span>
                      <span
                        className="mim-property-price-bar"
                        style={{ backgroundColor: markerColor }}
                        aria-hidden="true"
                      />
                      <div className="mim-property-overlay">
                        <b>{record[4]}</b>
                        <span>{record[5] ? `${record[5]} m²` : 'Área não informada'}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {visiblePropertyCount < sortedNeighborhoodRecords.length && (
                <div
                  ref={propertyLoadMoreRef}
                  className="mim-property-load-more"
                  aria-hidden="true"
                />
              )}
            </div>
          ) : (
            <div className="mim-property-empty">
              Nenhum imóvel carregado dentro deste bairro.
            </div>
          )}
        </aside>
      )}

      {selectedProperty && (
        <div className="mim-property-modal-backdrop" role="presentation">
          <section
            className="mim-property-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mim-property-modal-title"
          >
            <button
              type="button"
              className="mim-report-close"
              onClick={() => setSelectedProperty(null)}
              aria-label="Fechar detalhes do imóvel"
            >
              ×
            </button>
            <div
              className={`mim-property-modal-image${
                loadingPhotos[selectedProperty[10]] ? ' is-loading' : ''
              }`}
            >
              {recordPhotos(selectedProperty).length ? (
                <img
                  src={
                    recordPhotos(selectedProperty)[
                      photoIndexes[selectedProperty[10]] ?? 0
                    ]
                  }
                  alt={selectedProperty[4]}
                  onLoadStart={() =>
                    setLoadingPhotos((previous) => ({
                      ...previous,
                      [selectedProperty[10]]: true,
                    }))
                  }
                  onLoad={() => markPhotoLoaded(selectedProperty[10])}
                  onError={() => markPhotoLoaded(selectedProperty[10])}
                />
              ) : (
                <div className="mim-property-no-image">Sem foto</div>
              )}
              {recordPhotos(selectedProperty).length > 1 && (
                <>
                  <button
                    type="button"
                    className="mim-property-arrow mim-property-arrow-left"
                    onClick={(event) => movePhoto(event, selectedProperty, -1)}
                    disabled={Boolean(loadingPhotos[selectedProperty[10]])}
                    aria-label="Foto anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="mim-property-arrow mim-property-arrow-right"
                    onClick={(event) => movePhoto(event, selectedProperty, 1)}
                    disabled={Boolean(loadingPhotos[selectedProperty[10]])}
                    aria-label="Próxima foto"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            <div className="mim-property-modal-body">
              <div className="mim-sec">Detalhes do imóvel</div>
              <h2 id="mim-property-modal-title">{selectedProperty[4]}</h2>
              {propertyDescription(selectedProperty).map((line) => (
                <p key={line}>{line}</p>
              ))}
              <a
                className="mim-property-link"
                href={selectedProperty[11]}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver anúncio completo ↗
              </a>
            </div>
          </section>
        </div>
      )}

      {reportOpen && (
        <div className="mim-report-backdrop" role="presentation">
          <section
            className="mim-report"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mim-report-title"
          >
            <div className="mim-report-header">
              <div>
                <div className="mim-sec">Relatório</div>
                <h2 id="mim-report-title">Preço mediano por m² e bairro</h2>
                <p>
                  Apartamentos, casas e combinado. Anúncios sem área válida não
                  entram no cálculo.
                </p>
              </div>
              <button
                type="button"
                className="mim-report-close"
                onClick={() => setReportOpen(false)}
                aria-label="Fechar relatório"
              >
                ×
              </button>
            </div>

            <div className="mim-report-actions">
              <div className="mim-report-sort">
                <label htmlFor="mim-report-sort">Ordenar:</label>
                <select
                  id="mim-report-sort"
                  value={reportSort}
                  onChange={(event) =>
                    setReportSort(
                      event.target.value as
                        | 'neighborhood'
                        | 'apartment'
                        | 'house'
                        | 'combined'
                    )
                  }
                >
                  <option value="neighborhood">Bairro</option>
                  <option value="combined">Combinado (maior)</option>
                  <option value="apartment">Apartamento (maior)</option>
                  <option value="house">Casa (maior)</option>
                </select>
              </div>
              <span>{priceM2Report.length} bairros oficiais</span>
              <span className="mim-report-scale">menor <i /> maior</span>
              <button
                type="button"
                className="mim-report-download"
                onClick={() => downloadPriceM2Report(priceM2Report)}
              >
                Baixar CSV
              </button>
            </div>

            <div className="mim-report-table-wrap">
              <table className="mim-report-table">
                <thead>
                  <tr>
                    <th>Bairro</th>
                    <th>Apartamentos</th>
                    <th>Casas</th>
                    <th>Combinado</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPriceM2Report.map((row) => (
                    <tr key={row.neighborhood}>
                      <th scope="row">
                        {row.neighborhood}
                        <small>{row.region}</small>
                      </th>
                      <td style={priceCellStyle(reportMedian(row, 'apartment'), reportPriceValues.apartment)}>
                        <b>{formatReportValue(row.apartment)}</b>
                        <small>{row.apartment.length} anúncios</small>
                      </td>
                      <td style={priceCellStyle(reportMedian(row, 'house'), reportPriceValues.house)}>
                        <b>{formatReportValue(row.house)}</b>
                        <small>{row.house.length} anúncios</small>
                      </td>
                      <td style={priceCellStyle(reportMedian(row, 'combined'), reportPriceValues.combined)}>
                        <b>{formatReportValue(row.combined)}</b>
                        <small>{row.combined.length} anúncios</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
