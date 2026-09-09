import { MaringaImoveisMap } from '@maringa-imoveis-map/MaringaImoveisMap';

const apiBase =
  import.meta.env.VITE_SUB100_API_BASE ||
  'https://maringa-imoveis-api.vercel.app/api';

export function App() {
  return (
    <MaringaImoveisMap
      liveFetch
      manualStart
      apiBase={apiBase}
      height="100vh"
      onLoaded={(loaded) => {
        console.info(`Map ready: ${loaded.count} listings`);
      }}
    />
  );
}
