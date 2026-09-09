import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import {
  applyHeatOptions,
  buildHeatPoints,
  buildLegend,
  colorFor,
  fmtBRL,
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
import { useMapDataSource } from './useMapDataLoader';
import { useSub100LiveLoader } from './useSub100LiveLoader';
import './MaringaImoveisMap.css';

const DEFAULT_CENTER: [number, number] = [-23.43, -51.95];
const DEFAULT_ZOOM = 12;
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function MaringaImoveisMap({
  data,
  dataUrl,
  liveFetch = false,
  apiBase,
  manualStart,
  className,
  style,
  height = '100%',
  title = 'Imóveis à venda — Maringá/PR',
  subtitle = 'Dados do sub100.com.br',
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  onLoaded,
  onError,
}: MaringaImoveisMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatRef = useRef<L.HeatLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const renderedIdsRef = useRef<Set<string>>(new Set());
  const needsFullRedrawRef = useRef(true);

  const staticState = useMapDataSource(liveFetch ? {} : { data, dataUrl });
  const liveState = useSub100LiveLoader({ apiBase });
  const loadState = liveFetch ? liveState : staticState;
  const mapData = loadState.data;
  const waitForStart = liveFetch && (manualStart ?? true);

  const propertyTypes = useMemo(
    () =>
      mapData ? [...new Set(mapData.records.map((rec) => rec[4]))].sort() : [],
    [mapData]
  );

  const neighborhoods = useMemo(
    () =>
      mapData
        ? [...new Set(mapData.records.map((rec) => rec[7]))].filter(Boolean).sort()
        : [],
    [mapData]
  );

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [neighborhood, setNeighborhood] = useState('');
  const [minDorms, setMinDorms] = useState(0);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('pontos');
  const [metric, setMetric] = useState<MetricMode>('preco');
  const [heatWeight, setHeatWeight] = useState<HeatWeight>('densidade');

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

  const filters = useMemo(
    () => ({
      selectedTypes,
      neighborhood,
      minDorms,
      minPrice: parsePriceInput(minPriceInput),
      maxPrice: parsePriceInput(maxPriceInput),
    }),
    [selectedTypes, neighborhood, minDorms, minPriceInput, maxPriceInput]
  );

  const filtered = useMemo(() => {
    if (!mapData) return [];
    return mapData.records.filter((rec) => recMatchesFilter(rec, filters));
  }, [mapData, filters]);

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
      .bindPopup(popupHtml(rec))
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

  return (
    <div
      className={['mim-root', className].filter(Boolean).join(' ')}
      style={{ ...style, height }}
    >
      <div ref={mapRef} className="mim-map" />

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
          <div className="mim-sub">
            {subtitle} · <b>{stats.count}</b> imóveis residenciais (casa/apartamento)
            {canRefreshLive && (
              <>
                {' '}
                ·{' '}
                <button
                  type="button"
                  className="mim-link-btn"
                  onClick={liveState.start}
                >
                  Atualizar dados
                </button>
              </>
            )}
          </div>

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
              <div className="mim-chips">
                {propertyTypes.map((type) => (
                  <label key={type} className="mim-chip">
                    <input
                      type="checkbox"
                      checked={selectedTypes.has(type)}
                      onChange={(event) => toggleType(type, event.target.checked)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="mim-sec">Dormitórios</div>
          <div className="mim-chips">
            {[
              { value: 0, label: 'Todos' },
              { value: 1, label: '1+' },
              { value: 2, label: '2+' },
              { value: 3, label: '3+' },
              { value: 4, label: '4+' },
            ].map((option) => (
              <label key={option.value} className="mim-chip">
                <input
                  type="radio"
                  name="mim-dorms"
                  checked={minDorms === option.value}
                  onChange={() => setMinDorms(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <div className="mim-sec">Bairro</div>
          <select
            className="mim-select"
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
          >
            <option value="">Todos os bairros</option>
            {neighborhoods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

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
    </div>
  );
}
