import { useEffect, useState } from 'react';
import type { LoadState, MapData } from './types';

function parseMapData(text: string): MapData {
  const data = JSON.parse(text) as MapData;
  if (!Array.isArray(data.records)) {
    throw new Error('Invalid map data: missing records array');
  }
  return data;
}

/**
 * Downloads JSON with byte-level progress (XHR) for reliable progress events,
 * then parses in a separate step so the UI can show parse vs download.
 */
export function fetchMapDataWithProgress(
  url: string,
  onProgress: (ratio: number) => void
): Promise<MapData> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'text';

    xhr.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Failed to load map data (${xhr.status})`));
        return;
      }
      onProgress(1);
      resolve(parseMapData(xhr.responseText));
    };

    xhr.onerror = () => reject(new Error('Network error while loading map data'));
    xhr.onabort = () => reject(new Error('Map data request aborted'));
    xhr.send();
  });
}

export function useMapDataLoader(dataUrl: string) {
  return useMapDataSource({ dataUrl });
}

export function useMapDataSource(options: { data?: MapData; dataUrl?: string }) {
  const [state, setState] = useState<LoadState>({
    status: 'idle',
    progress: 0,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (options.data) {
      const bundled = options.data;
      setState({
        status: 'parsing',
        progress: 0.35,
        error: null,
        data: null,
      });

      const timer = window.setTimeout(() => {
        if (cancelled) return;
        setState({
          status: 'ready',
          progress: 1,
          error: null,
          data: bundled,
        });
      }, 120);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    if (options.dataUrl) {
      setState({
        status: 'loading',
        progress: 0,
        error: null,
        data: null,
      });

      fetchMapDataWithProgress(options.dataUrl, (ratio) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          status: 'loading',
          progress: Math.min(0.92, ratio * 0.92),
        }));
      })
        .then((loaded) => {
          if (cancelled) return;
          setState({
            status: 'parsing',
            progress: 0.96,
            error: null,
            data: null,
          });
          requestAnimationFrame(() => {
            if (cancelled) return;
            setState({
              status: 'ready',
              progress: 1,
              error: null,
              data: loaded,
            });
          });
        })
        .catch((error: Error) => {
          if (cancelled) return;
          setState({
            status: 'error',
            progress: 0,
            error,
            data: null,
          });
        });

      return () => {
        cancelled = true;
      };
    }

    setState({
      status: 'error',
      progress: 0,
      error: new Error('MaringaImoveisMap requires either `data` or `dataUrl`'),
      data: null,
    });

    return undefined;
  }, [options.data, options.dataUrl]);

  return state;
}
