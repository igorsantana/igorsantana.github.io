import 'leaflet';

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number?][],
    options?: HeatMapOptions
  ): HeatLayer;

  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends Layer {
    setOptions(options: HeatMapOptions): this;
    setLatLngs(latlngs: [number, number, number?][]): this;
    options: HeatMapOptions & LayerOptions;
  }
}
