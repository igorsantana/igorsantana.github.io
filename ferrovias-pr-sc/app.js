const map = L.map('map', {
  zoomControl: true,
  preferCanvas: true,
}).setView([-25.1, -50.8], 7);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  {
  attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>, ' +
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 16,
  }
).addTo(map);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 16, opacity: 0.9 }
).addTo(map);

const statusElement = document.getElementById('status');
const officialToggle = document.getElementById('official-toggle');
const statusInputs = [...document.querySelectorAll('[data-status]')];
let officialLayer;
let osmFeatures = [];
let osmLayer;

const colors = {
  operational: '#ff9f1c',
  tourist: '#35e58b',
  suspended: '#ffe047',
  historical: '#d7e2ee',
  removed: '#9aaabd',
  planned: '#d09cff',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusLabel(status) {
  return {
    operational: 'operacional',
    tourist: 'turística',
    suspended: 'suspensa',
    historical: 'histórica',
    removed: 'removida',
    planned: 'planejada',
  }[status] || status;
}

function lineStyle(properties) {
  const status = properties.status || 'operational';
  const color = properties.service === 'tourist' ? colors.tourist : colors[status];
  return {
    color: color || colors.operational,
    weight: properties.highlight ? 5 : 3.2,
    opacity: properties.highlight ? 1 : 0.9,
    dashArray:
      status === 'planned' ? '2 7' :
      status === 'historical' || status === 'suspended' ? '8 7' :
      undefined,
  };
}

function popup(properties) {
  return `
    <div class="railway-popup">
      <h3>${escapeHtml(properties.name)}</h3>
      <p><strong>Status:</strong> ${escapeHtml(statusLabel(properties.status))}</p>
      <p><strong>Serviço:</strong> ${escapeHtml(properties.service || 'não informado')}</p>
      ${properties.operator ? `<p><strong>Operadora:</strong> ${escapeHtml(properties.operator)}</p>` : ''}
      ${properties.gauge ? `<p><strong>Bitola:</strong> ${escapeHtml(properties.gauge)}</p>` : ''}
      <p><strong>Fonte:</strong> ${escapeHtml(properties.source)}</p>
    </div>
  `;
}

function officialPopup(properties) {
  return `
    <div class="railway-popup">
      <h3>Trecho ferroviário ANTT</h3>
      <p><strong>Código da linha:</strong> ${escapeHtml(properties.codigolinh)}</p>
      <p><strong>Código da ferrovia:</strong> ${escapeHtml(properties.codigoferr)}</p>
      <p><strong>Quilômetro:</strong> ${escapeHtml(properties.numeroquil)}</p>
      <p><strong>Extensão:</strong> ${escapeHtml(properties.numeroexte)}</p>
      <p><strong>Código da bitola:</strong> ${escapeHtml(properties.codigobito)}</p>
      <p><strong>Fonte:</strong> ANTT</p>
    </div>
  `;
}

function renderOsm() {
  const enabled = new Set(
    statusInputs.filter((input) => input.checked).map((input) => input.dataset.status)
  );

  if (osmLayer) map.removeLayer(osmLayer);

  const visibleFeatures = osmFeatures.filter((feature) => {
    const status = feature.properties.status || 'operational';
    return enabled.has(status);
  });

  osmLayer = L.geoJSON(
    { type: 'FeatureCollection', features: visibleFeatures },
    {
      style: (feature) => lineStyle(feature.properties),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(popup(feature.properties));
      },
    }
  ).addTo(map);
}

function setStatus(text) {
  statusElement.textContent = text;
}

async function loadData() {
  try {
    const [osmResponse, anttResponse] = await Promise.all([
      fetch('./data/railways-osm.geojson'),
      fetch('./data/railways-antt.geojson'),
    ]);
    if (!osmResponse.ok || !anttResponse.ok) {
      throw new Error('Não foi possível carregar os dados ferroviários.');
    }

    const osmData = await osmResponse.json();
    const anttData = await anttResponse.json();
    osmFeatures = osmData.features || [];

    officialLayer = L.geoJSON(anttData, {
      style: {
        color: '#a8b8c9',
        weight: 1.5,
        opacity: 0.55,
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(officialPopup(feature.properties));
      },
    }).addTo(map);

    renderOsm();
    const highlights = osmFeatures.filter((feature) => feature.properties.highlight).length;
    setStatus(`${osmFeatures.length.toLocaleString('pt-BR')} segmentos carregados · ${highlights} em destaque`);

    const bounds = L.geoJSON(osmData).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.04));
  } catch (error) {
    setStatus(error.message);
  }
}

statusInputs.forEach((input) => input.addEventListener('change', renderOsm));
officialToggle.addEventListener('change', () => {
  if (!officialLayer) return;
  if (officialToggle.checked) officialLayer.addTo(map);
  else map.removeLayer(officialLayer);
});

loadData();
