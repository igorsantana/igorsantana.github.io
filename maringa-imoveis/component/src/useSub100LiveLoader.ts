import { useCallback, useRef, useState } from 'react';
import {
  appendRecords,
  createEmptyMapData,
  propertyToRecord,
} from './mapDataBuilder';
import { loadCachedMapData, saveCachedMapData } from './mapDataCache';
import { fetchSub100Page } from './sub100Api';
import type { LoadState, MapData, MapRecord } from './types';

const cachedOnMount = loadCachedMapData();

const PAGE_BATCH_SIZE = 4;

export interface Sub100LiveLoaderOptions {
  apiBase?: string;
  onBatch?: (data: MapData, batch: MapRecord[]) => void;
}

export interface Sub100LiveLoaderState extends LoadState {
  started: boolean;
  loadedPages: number;
  totalPages: number;
  start: () => void;
  cancel: () => void;
}

export function useSub100LiveLoader(
  options: Sub100LiveLoaderOptions = {}
): Sub100LiveLoaderState {
  const [state, setState] = useState<Omit<Sub100LiveLoaderState, 'start' | 'cancel'>>({
    status: cachedOnMount ? 'ready' : 'idle',
    progress: cachedOnMount ? 1 : 0,
    error: null,
    data: cachedOnMount,
    started: false,
    loadedPages: 0,
    totalPages: 0,
  });

  const runIdRef = useRef(0);
  const dataRef = useRef<MapData>(cachedOnMount ?? createEmptyMapData());

  const persistData = useCallback((data: MapData) => {
    saveCachedMapData(data);
  }, []);

  const cancel = useCallback(() => {
    runIdRef.current += 1;
    setState((prev) => ({
      ...prev,
      status: prev.data ? 'ready' : 'idle',
      started: false,
    }));
  }, []);

  const start = useCallback(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    dataRef.current = createEmptyMapData();

    setState((prev) => ({
      ...prev,
      status: 'loading',
      progress: 0,
      error: null,
      data: createEmptyMapData(),
      started: true,
      loadedPages: 0,
      totalPages: 0,
    }));

    const load = async () => {
      try {
        const first = await fetchSub100Page({ page: 1, apiBase: options.apiBase });
        if (runIdRef.current !== runId) return;

        const totalPages = first.meta.last_page;
        const firstBatch = first.data
          .map(propertyToRecord)
          .filter((rec): rec is MapRecord => rec != null);

        dataRef.current = appendRecords(dataRef.current, firstBatch);
        persistData(dataRef.current);
        options.onBatch?.(dataRef.current, firstBatch);

        setState((prev) => ({
          ...prev,
          status: 'loading',
          progress: Math.min(0.95, 1 / totalPages),
          data: dataRef.current,
          loadedPages: 1,
          totalPages,
        }));

        for (let page = 2; page <= totalPages; page += PAGE_BATCH_SIZE) {
          if (runIdRef.current !== runId) return;

          const pages = Array.from(
            { length: Math.min(PAGE_BATCH_SIZE, totalPages - page + 1) },
            (_, index) => page + index
          );

          const responses = await Promise.all(
            pages.map((pageNumber) =>
              fetchSub100Page({ page: pageNumber, apiBase: options.apiBase })
            )
          );

          if (runIdRef.current !== runId) return;

          const batch = responses
            .flatMap((response) => response.data)
            .map(propertyToRecord)
            .filter((rec): rec is MapRecord => rec != null);

          dataRef.current = appendRecords(dataRef.current, batch);
          persistData(dataRef.current);
          options.onBatch?.(dataRef.current, batch);

          const loadedPages = Math.min(page + PAGE_BATCH_SIZE - 1, totalPages);
          setState((prev) => ({
            ...prev,
            status: 'loading',
            progress: Math.min(0.98, loadedPages / totalPages),
            data: dataRef.current,
            loadedPages,
            totalPages,
          }));
        }

        if (runIdRef.current !== runId) return;

        persistData(dataRef.current);

        setState((prev) => ({
          ...prev,
          status: 'ready',
          progress: 1,
          error: null,
          data: dataRef.current,
          loadedPages: totalPages,
          totalPages,
        }));
      } catch (error) {
        if (runIdRef.current !== runId) return;
        setState((prev) => ({
          ...prev,
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error : new Error('Failed to load listings'),
          started: false,
        }));
      }
    };

    void load();
  }, [options.apiBase, options.onBatch, persistData]);

  return {
    ...state,
    start,
    cancel,
  };
}
