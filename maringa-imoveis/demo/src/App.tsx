import { MaringaImoveisMap } from '@maringa-imoveis-map/MaringaImoveisMap';
import type { MapData } from '@maringa-imoveis-map/types';
import mapData from './map-data.json';

const data = mapData as MapData;

export function App() {
  return (
    <MaringaImoveisMap
      data={data}
      height="100vh"
      onLoaded={(loaded) => {
        console.info(`Map ready: ${loaded.count} listings`);
      }}
    />
  );
}
