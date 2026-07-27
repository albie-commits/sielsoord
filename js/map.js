/* ═══════════════════════════════════════════════════════════════════
   SIELSOORD — Interactive Map (Leaflet + GeoJSON)
   Professional satellite map with refined, smooth styling.
   Data source: Sielsoord.kml (latest Google Earth export)
   Users can preview but NOT download the source KML.

   v3 — Enhanced: bigger, smoother, higher detail, fullscreen,
        reset-view, inertia, retina, real-time resize.
   ═══════════════════════════════════════════════════════════════════ */

/* Load Leaflet CSS dynamically */
function loadLeafletCSS() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
}

/* Load Leaflet JS dynamically, then init map */
function loadLeafletJS(callback) {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  script.crossOrigin = '';
  script.onload = callback;
  document.head.appendChild(script);
}

/* ── Professional Map Colour Palette ──────────────────────────────
   Designed for satellite imagery: high contrast, no clashing,
   each feature instantly distinguishable but harmonious.

   SIELSOORD BOUNDARY  →  Warm gold (#E8B842) — the star, subtle fill
   FARM RUSTOORD       →  Soft gold (#C9A84C) — farm family colour
   HILLS (for sale)    →  Coral (#E07B39) — warm, inviting
   HILLS (sold)        →  Muted slate (#78909C) — clearly different
   BOREHOLES           →  Ocean blue (#3498DB) — clear, professional
   D2695 HIGHWAY       →  Warm cream (#F0E6D2) — like real gravel roads
   ETOSHA BORDER       →  Forest green (#1B5E20) — nature reserve
   ONGAVA BORDER       →  Terracotta (#A0522D) — distinct, earthy
   ──────────────────────────────────────────────────────────────── */

/* Hill number → Koppie name mapping
   Status: sold = private/not for sale, reserved = held by interested buyer, available = for sale */
const HILL_NAMES = {
  'Hill 1':         { koppie: 'Sielsrus',       status: 'sold',      url: 'berg/sielsrus.html' },
  'Hill 1 sold':    { koppie: 'Sielsrus',       status: 'sold',      url: 'berg/sielsrus.html' },
  'Hill 2':         { koppie: 'Sielskemering',  status: 'available', url: 'berg/sielskemering.html' },
  'Hill 3':         { koppie: 'Sielsaandster',  status: 'available', url: 'berg/sielsaandster.html' },
  'Hill 4':         { koppie: 'Sielswind',      status: 'available', url: 'berg/sielswind.html' },
  'Hill 5':         { koppie: 'Sielshoogte',    status: 'available', url: 'berg/sielshoogte.html' },
  'Hill 6':         { koppie: 'Sielsstilte',    status: 'available', url: 'berg/sielsstilte.html' },
  'Hill 7':         { koppie: 'Sielsdageraad',  status: 'available', url: 'berg/sielsdageraad.html' },
  'Hill 8':         { koppie: 'Sielshorison',   status: 'reserved',  url: 'berg/sielshorison.html' },
  'Hill 8 sold':    { koppie: 'Sielshorison',   status: 'reserved',  url: 'berg/sielshorison.html' }
};

function mapT(key, vars = {}) {
  const lang = localStorage.getItem('sielsoord-lang') || 'af';
  const value = window.TRANSLATIONS?.[lang]?.[key]
    || window.TRANSLATIONS?.af?.[key]
    || key;
  return Object.entries(vars).reduce(
    (text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement),
    value
  );
}

const FEATURE_STYLES = {
  'Sielsoord': {
    color: '#E8B842',
    fillColor: '#E8B842',
    fillOpacity: 0.08,
    weight: 3,
    opacity: 0.9,
    descriptionKey: 'map.popup_sielsoord_desc'
  },
  'Farm Rustoord': {
    color: '#C9A84C',
    fillColor: '#C9A84C',
    fillOpacity: 0.06,
    weight: 4,
    opacity: 0.8,
    descriptionKey: 'map.popup_rustoord_desc'
  },
  'D2695 Gravel Highway': {
    color: '#F0E6D2',
    weight: 5,
    opacity: 0.85,
    descriptionKey: 'map.popup_road_desc'
  },
  'Etosha National Game Reserve Border': {
    color: '#1B5E20',
    fillColor: '#1B5E20',
    fillOpacity: 0.12,
    weight: 5,
    opacity: 0.9,
    dashArray: '12, 8',
    descriptionKey: 'map.popup_etosha_desc'
  },
  'Ongava boarder': {
    color: '#A0522D',
    fillColor: '#A0522D',
    fillOpacity: 0.10,
    weight: 4,
    opacity: 0.85,
    descriptionKey: 'map.popup_ongava_desc'
  },
  'Borehole': {
    color: '#3498DB',
    fillColor: '#3498DB',
    fillOpacity: 0.55,
    weight: 2,
    opacity: 0.8,
    descriptionKey: 'map.popup_borehole_desc'
  },
  'default-line': {
    color: '#D4A574',
    weight: 2,
    opacity: 0.6
  }
};

/* Get hill style based on status: available, reserved, or sold */
function getHillStyle(name) {
  const info = HILL_NAMES[name];
  if (!info) return null;
  if (info.status === 'sold') {
    return {
      color: '#78909C',
      fillColor: '#78909C',
      fillOpacity: 0.15,
      weight: 3,
      opacity: 0.7,
      description: mapT('map.popup_private_desc', { hill: info.koppie }),
      status: 'sold',
      url: info.url
    };
  }
  if (info.status === 'reserved') {
    return {
      color: '#F5A623',
      fillColor: '#F5A623',
      fillOpacity: 0.15,
      weight: 3,
      opacity: 0.85,
      description: mapT('map.popup_reserved_desc', { hill: info.koppie }),
      status: 'reserved',
      url: info.url
    };
  }
  /* available */
  return {
    color: '#E07B39',
    fillColor: '#E07B39',
    fillOpacity: 0.12,
    weight: 3,
    opacity: 0.85,
    description: mapT('map.popup_available_desc', { hill: info.koppie }),
    status: 'available',
    url: info.url
  };
}

/* The GeoJSON data — embedded from Sielsoord.kml (latest export) */
const SIELSOORD_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Hill 5" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.60029687019487,-19.37599967681069],
          [15.60134779166517,-19.37642090034685]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Hill 1 sold" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.59891354358137,-19.38367278952353],
          [15.60039592849597,-19.38352075418066]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Hill 4" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.60579519552022,-19.3796656225586],
          [15.60680601281791,-19.37970388172803]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Hill 8 sold" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.5942654574986,-19.36347378470299],
          [15.5956854531073,-19.36346281422296]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Hill 7" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.61164587545357,-19.36699948886113],
          [15.61371234053756,-19.36742465154742]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Hill 6" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.60932491450354,-19.37842675181275],
          [15.6105413654154,-19.37973402956625]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Hill 3" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.6018628032906,-19.38167124077474],
          [15.60315149173963,-19.38238283032448]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Hill 2" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.60744202194663,-19.3895983025817],
          [15.60896094957397,-19.38964219229135]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Ongava boarder" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.62686087239396,-19.34733241856481],
          [15.61211334167441,-19.34413927340927],
          [15.59735343604401,-19.34101266858367],
          [15.57129655336947,-19.33373271508178],
          [15.55616138940915,-19.37010324377354]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "D2695 Gravel Highway" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.6179899720563,-19.41260702293411],
          [15.54810988688263,-19.36444748823291]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Borehole" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [15.58447393251227,-19.36679466508284],
          [15.58514404917541,-19.36682183993144],
          [15.58577016879972,-19.36683355050347],
          [15.58576236582891,-19.36582798511505],
          [15.58524304859623,-19.36581884823555],
          [15.58454452875514,-19.36577445321561],
          [15.58447393251227,-19.36679466508284]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Borehole" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [15.59352678616215,-19.35233858906043],
          [15.5932168891919,-19.35337313953465],
          [15.59452554433525,-19.35369596839512],
          [15.59477574428131,-19.35262227894698],
          [15.59352678616215,-19.35233858906043]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Etosha National Game Reserve Border" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [15.50961838790998,-19.2402827386053],
          [15.74185134939117,-19.28371846277412],
          [15.83271274665244,-19.2915430939748],
          [16.05386846154345,-19.36062599787704],
          [16.16424572854145,-19.36492723210501],
          [16.3046768895661,-19.41351666722815],
          [16.36407303484085,-19.41261081634658],
          [16.47267772221361,-19.43576043738958],
          [16.58616220610394,-19.43405590188079],
          [16.69234601830649,-19.48754626278854]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Sielsoord" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [15.60576590512681,-19.40418352219622],
          [15.60640274409477,-19.40458795756928],
          [15.6235128614229,-19.34706469734963],
          [15.59756359005149,-19.34141964065223],
          [15.57167092949925,-19.33431149912759],
          [15.56180835872768,-19.35820585841318],
          [15.60825364933893,-19.39621708820905],
          [15.60576590512681,-19.40418352219622]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Farm Rustoord" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [15.56184792745429,-19.35831966674387],
          [15.55672241825017,-19.37029495970185],
          [15.60576370324654,-19.40418250199843],
          [15.60825349305322,-19.39621613409066],
          [15.56184792745429,-19.35831966674387]
        ]]
      }
    }
  ]
};

/* Public feature summary for KML info panels */
const SIELSOORD_KML_FEATURES = [
  { key: 'map.feature_sielsoord_title', color: '#E8B842' },
  { key: 'map.feature_rustoord_title', color: '#C9A84C' },
  { key: 'map.feature_available_title', color: '#E07B39' },
  { key: 'map.legend_1reserved', color: '#F5A623' },
  { key: 'map.feature_private_title', color: '#78909C' },
  { key: 'map.feature_boreholes_title', color: '#3498DB' },
  { key: 'map.feature_road_title', color: '#F0E6D2' },
  { key: 'map.feature_etosha_title', color: '#1B5E20' },
  { key: 'map.feature_ongava_title', color: '#A0522D' }
];

/* Expose globally */
window.SIELSOORD_KML_FEATURES = SIELSOORD_KML_FEATURES;

/* ── Custom popup + control styling (injected once) ─────────────── */
function injectPopupStyles() {
  if (document.getElementById('sielsoord-popup-style')) return;
  const style = document.createElement('style');
  style.id = 'sielsoord-popup-style';
  style.textContent = `
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
      border: none !important;
      padding: 4px !important;
    }
    .leaflet-popup-content {
      margin: 14px 18px !important;
      font-family: 'Lora', Georgia, serif !important;
      line-height: 1.5 !important;
    }
    .leaflet-popup-content strong {
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-size: 1.15rem !important;
      color: #2C1810 !important;
      display: block !important;
      margin-bottom: 4px !important;
    }
    .leaflet-popup-content .popup-desc {
      font-size: 0.82rem !important;
      color: #7A6450 !important;
    }
    .leaflet-popup-content .popup-link {
      display: inline-block !important;
      margin-top: 6px !important;
      font-family: 'Montserrat', sans-serif !important;
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #E07B39 !important;
      text-decoration: none !important;
      letter-spacing: 0.04em !important;
    }
    .leaflet-popup-content .popup-sold {
      display: inline-block !important;
      margin-top: 4px !important;
      font-family: 'Montserrat', sans-serif !important;
      font-size: 0.7rem !important;
      font-weight: 700 !important;
      color: #78909C !important;
      text-transform: uppercase !important;
      letter-spacing: 0.08em !important;
    }
    .leaflet-popup-tip {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
    /* ── Zoom controls — bigger, styled ─────────────────────────── */
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
    }
    .leaflet-bar a {
      border-radius: 8px !important;
      color: #2C1810 !important;
      background: rgba(255,255,255,0.95) !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;
      width: 44px !important;
      height: 44px !important;
      line-height: 44px !important;
      font-size: 22px !important;
      margin-bottom: 4px !important;
      transition: all 0.2s ease !important;
    }
    .leaflet-bar a:hover {
      background: rgba(240,230,210,0.98) !important;
      transform: scale(1.05);
    }
    .leaflet-bar a:active {
      transform: scale(0.95);
    }
    /* ── Attribution ────────────────────────────────────────────── */
    .leaflet-control-attribution {
      background: rgba(255,255,255,0.75) !important;
      border-radius: 6px 0 0 0 !important;
      font-size: 9px !important;
      padding: 3px 8px !important;
    }
    .leaflet-control-attribution a {
      color: #7A6450 !important;
    }
    /* ── Hill labels ────────────────────────────────────────────── */
    .hill-label {
      background: transparent !important;
      border: none !important;
    }
    .hill-label-inner {
      font-family: 'Montserrat', sans-serif !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      letter-spacing: 0.04em !important;
      white-space: nowrap !important;
      padding: 3px 10px !important;
      border-radius: 12px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
      transition: transform 0.2s ease !important;
    }
    .hill-label:hover .hill-label-inner {
      transform: scale(1.12);
    }
    .hill-label-for-sale .hill-label-inner,
    .hill-label-available .hill-label-inner {
      background: rgba(224,123,57,0.92) !important;
      color: #fff !important;
      border: 1px solid rgba(255,255,255,0.5) !important;
    }
    .hill-label-sold .hill-label-inner {
      background: rgba(120,144,156,0.88) !important;
      color: #fff !important;
      border: 1px solid rgba(255,255,255,0.4) !important;
    }
    .hill-label-reserved .hill-label-inner {
      background: rgba(245,166,35,0.92) !important;
      color: #fff !important;
      border: 1px solid rgba(255,255,255,0.5) !important;
    }
    .leaflet-popup-content .popup-reserved {
      display: inline-block !important;
      margin-top: 4px !important;
      font-family: 'Montserrat', sans-serif !important;
      font-size: 0.7rem !important;
      font-weight: 700 !important;
      color: #F5A623 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.08em !important;
    }
    /* ── Custom map control buttons ─────────────────────────────── */
    .sielsoord-map-btn {
      background: rgba(255,255,255,0.95) !important;
      border: none !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
      width: 44px !important;
      height: 44px !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 20px !important;
      color: #2C1810 !important;
      transition: all 0.2s ease !important;
      margin-bottom: 6px !important;
    }
    .sielsoord-map-btn:hover {
      background: rgba(240,230,210,0.98) !important;
      transform: scale(1.05);
    }
    .sielsoord-map-btn:active {
      transform: scale(0.95);
    }
    /* ── Fullscreen mode ────────────────────────────────────────── */
    .sielsoord-map-fullscreen {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 99999 !important;
      border-radius: 0 !important;
    }
    .sielsoord-map-fullscreen #sielsoord-map {
      width: 100vw !important;
      height: 100vh !important;
    }
    /* ── Smooth tile transitions ────────────────────────────────── */
    .leaflet-tile {
      transition: opacity 0.3s ease !important;
    }
    /* ── Zoom indicator badge ───────────────────────────────────── */
    .sielsoord-zoom-badge {
      background: rgba(255,255,255,0.92) !important;
      border: none !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
      padding: 6px 14px !important;
      font-family: 'Montserrat', sans-serif !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      color: #7A6450 !important;
      letter-spacing: 0.04em !important;
    }
  `;
  document.head.appendChild(style);
}

/* ── Get the style for a feature ────────────────────────────────── */
function getFeatureStyle(feature) {
  const name = feature.properties.name;
  const hillStyle = getHillStyle(name);
  if (hillStyle) return hillStyle;
  const style = FEATURE_STYLES[name] || FEATURE_STYLES['default-line'];
  return style;
}

/* ── Get the display name for a feature ─────────────────────────── */
function getDisplayName(name) {
  const hill = HILL_NAMES[name];
  if (hill) return hill.koppie;
  if (name === 'Sielsoord') return mapT('map.feature_sielsoord_title');
  if (name === 'Farm Rustoord') return mapT('map.feature_rustoord_title');
  if (name === 'Etosha National Game Reserve Border') return mapT('map.feature_etosha_title');
  if (name === 'Ongava boarder') return mapT('map.feature_ongava_title');
  if (name === 'D2695 Gravel Highway') return mapT('map.feature_road_title');
  return name;
}

/* ── Get popup content for a feature ────────────────────────────── */
function getPopupContent(feature) {
  const name = feature.properties.name;
  const displayName = getDisplayName(name);
  const style = getFeatureStyle(feature);
  const desc = style.descriptionKey ? mapT(style.descriptionKey) : (style.description || name);

  let html = `<strong>${displayName}</strong><span class="popup-desc">${desc}</span>`;
  /* Add link for hills */
  const hill = HILL_NAMES[name];
  if (hill && hill.url) {
    if (hill.status === 'sold') {
      html += `<br><span class="popup-sold">${mapT('map.popup_private_status')}</span>`;
    } else if (hill.status === 'reserved') {
      html += `<br><span class="popup-reserved">${mapT('map.popup_reserved_status')}</span>`;
    } else {
      html += `<br><a href="${hill.url}" class="popup-link">${mapT('map.popup_view', { hill: hill.koppie })}</a>`;
    }
  }

  return html;
}

/* ── Initialise map ─────────────────────────────────────────────── */

function initSielsoordMap() {
  const mapEl = document.getElementById('sielsoord-map');
  if (!mapEl || typeof L === 'undefined') return;

  injectPopupStyles();

  const localizedPopups = [];
  const bindLocalizedPopup = (layer, render, options) => {
    layer.bindPopup(render(), options);
    localizedPopups.push({ layer, render });
    return layer;
  };

  /* ── Map creation with smooth, fluent settings ───────────────── */
  const map = L.map('sielsoord-map', {
    center: [-19.361, 15.594],
    zoom: 13,
    minZoom: 10,
    maxZoom: 21,
    scrollWheelZoom: true,
    zoomControl: false,
    attributionControl: true,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true,
    inertia: true,
    inertiaDeceleration: 3400,
    inertiaMaxSpeed: 2.5,
    easeLinearity: 0.25,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelDebounceTime: 40,
    wheelPxPerZoomLevel: 60,
    preferCanvas: true,
    worldCopyJump: false,
    updateWhenZooming: false,
  });

  /* ── Custom zoom control — positioned top-right ──────────────── */
  L.control.zoom({ position: 'topright' }).addTo(map);

  /* ── Satellite imagery — Esri World Imagery (high detail) ──────
     detectRetina gives 2x tiles on HiDPI/Retina displays for
     much sharper imagery when zoomed in close. */
  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 21,
    maxNativeZoom: 19,
    crossOrigin: true,
    detectRetina: true,
    updateWhenIdle: false,
    keepBuffer: 4
  }).addTo(map);

  /* ── Labels overlay — roads & place names (fades in at zoom 13+) */
  const labelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 21,
    maxNativeZoom: 19,
    opacity: 0.0,
    crossOrigin: true,
    detectRetina: true,
    updateWhenIdle: false,
    keepBuffer: 4
  }).addTo(map);

  /* Fade labels in as you zoom in (zoom 11 → 16) */
  function updateLabelOpacity() {
    const z = map.getZoom();
    let op = 0;
    if (z <= 11) op = 0;
    else if (z >= 16) op = 0.8;
    else op = ((z - 11) / 5) * 0.8;
    labelsLayer.setOpacity(op);
  }
  map.on('zoomend', updateLabelOpacity);
  updateLabelOpacity();

  /* ── Transportation overlay — roads become visible when close ──
     This layer adds road detail that appears as you zoom in. */
  const transportLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 21,
    maxNativeZoom: 19,
    opacity: 0.0,
    crossOrigin: true,
    detectRetina: true,
    updateWhenIdle: false,
    keepBuffer: 4
  }).addTo(map);

  function updateTransportOpacity() {
    const z = map.getZoom();
    let op = 0;
    if (z <= 13) op = 0;
    else if (z >= 16) op = 0.7;
    else op = ((z - 13) / 3) * 0.7;
    transportLayer.setOpacity(op);
  }
  map.on('zoomend', updateTransportOpacity);
  updateTransportOpacity();

  /* ── Track hill labels to add after the GeoJSON layer ────────── */
  const hillLabels = [];

  /* ── Render GeoJSON features ─────────────────────────────────── */
  const geojsonLayer = L.geoJSON(SIELSOORD_GEOJSON, {
    style: function(feature) {
      const style = getFeatureStyle(feature);
      return {
        color: style.color,
        weight: style.weight || 2,
        opacity: style.opacity !== undefined ? style.opacity : 0.8,
        fillColor: style.fillColor || style.color,
        fillOpacity: style.fillOpacity !== undefined ? style.fillOpacity : 0,
        dashArray: style.dashArray,
        lineJoin: 'round',
        lineCap: 'round'
      };
    },
    pointToLayer: function(feature, latlng) {
      const style = getFeatureStyle(feature);
      return L.circleMarker(latlng, {
        radius: 7,
        fillColor: style.fillColor || '#3498DB',
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 0.9,
        fillOpacity: 0.7
      });
    },
    onEachFeature: function(feature, layer) {
      const name = feature.properties.name;
      const style = getFeatureStyle(feature);

      /* Smooth hover highlight */
      layer.on('mouseover', function(e) {
        this.setStyle({ weight: (style.weight || 2) + 2, opacity: 1 });
        this.bringToFront();
      });
      layer.on('mouseout', function(e) {
        this.setStyle({ weight: style.weight || 2, opacity: style.opacity !== undefined ? style.opacity : 0.8 });
      });

      bindLocalizedPopup(
        layer,
        () => getPopupContent(feature),
        { closeButton: true, autoPan: true, maxWidth: 280, autoPanPadding: [30, 30] }
      );

      /* Collect hill labels */
      const hill = HILL_NAMES[name];
      if (hill) {
        const coords = feature.geometry.coordinates;
        const midLon = (coords[0][0] + coords[1][0]) / 2;
        const midLat = (coords[0][1] + coords[1][1]) / 2;
        const statusClass = `hill-label-${hill.status}`;
        hillLabels.push({ latlng: [midLat, midLon], statusClass, koppie: hill.koppie, url: hill.url, status: hill.status });
      }
    }
  }).addTo(map);

  /* ── Add hill labels as markers on top of the GeoJSON ────────── */
  hillLabels.forEach(h => {
    const icon = L.divIcon({
      html: `<div class="hill-label-inner">${h.koppie}</div>`,
      className: `hill-label ${h.statusClass}`,
      iconSize: [120, 24],
      iconAnchor: [60, 12]
    });
    const marker = L.marker(h.latlng, { icon: icon, interactive: true, keyboard: false }).addTo(map);
    bindLocalizedPopup(marker, () => {
      const number = h.status === 'sold' ? 1 : h.status === 'reserved' ? 8 : '';
      const description = h.status === 'sold'
        ? mapT('map.popup_private_desc', { hill: h.koppie })
        : h.status === 'reserved'
          ? mapT('map.popup_reserved_desc', { hill: h.koppie })
          : getHillStyle(Object.keys(HILL_NAMES).find(k => HILL_NAMES[k].koppie === h.koppie))?.description || '';
      const status = h.status === 'sold'
        ? `<br><span class="popup-sold">${mapT('map.popup_private_status')}</span>`
        : h.status === 'reserved'
          ? `<br><span class="popup-reserved">${mapT('map.popup_reserved_status')}</span>`
          : `<br><a href="${h.url}" class="popup-link">${mapT('map.popup_view', { hill: h.koppie })}</a>`;
      return `<strong>${h.koppie}</strong><span class="popup-desc">${number ? `${mapT('map.hill_label', { number })} — ` : ''}${description}</span>${status}`;
    }, { closeButton: true, maxWidth: 280, autoPanPadding: [30, 30] });
  });

  /* ── Borehole marker pins ────────────────────────────────────── */
  const boreholeCentroids = [
    { lat: -19.3663808582, lon: 15.5850588609, label: 'Borehole 1' },
    { lat: -19.3528737130, lon: 15.5939143500, label: 'Borehole 2' }
  ];

  const boreholeIcon = L.divIcon({
    html: `<div style="
      background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-family: 'Montserrat', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      white-space: nowrap;
      box-shadow: 0 3px 12px rgba(0,0,0,0.35);
      border: 2px solid rgba(255,255,255,0.7);
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    ">&#128167; BOREHOLE</div>`,
    className: 'borehole-marker',
    iconSize: [100, 28],
    iconAnchor: [50, 14]
  });

  boreholeCentroids.forEach((bh, index) => {
    const marker = L.marker([bh.lat, bh.lon], { icon: boreholeIcon, keyboard: false }).addTo(map);
    bindLocalizedPopup(
      marker,
      () => `<strong>${mapT('map.borehole_label', { number: index + 1 })}</strong><span class="popup-desc">&#128167; ${mapT('map.popup_borehole_desc')}</span>`,
      { closeButton: true, maxWidth: 280, autoPanPadding: [30, 30] }
    );
  });

  /* ── Sielsoord center marker ─────────────────────────────────── */
  const farmCenter = [-19.360930, 15.594071];
  const farmMarker = L.divIcon({
    html: `<div style="
      background: linear-gradient(135deg, #E8B842 0%, #C9842A 100%);
      color: white;
      padding: 7px 14px;
      border-radius: 24px;
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      border: 2px solid rgba(255,255,255,0.7);
      text-shadow: 0 1px 3px rgba(0,0,0,0.2);
    ">SIELSOORD</div>`,
    className: 'sielsoord-marker',
    iconSize: [102, 34],
    /* Keep the geographic point accurate while shifting the badge left of the hill labels. */
    iconAnchor: [162, 17]
  });

  const centerMarker = L.marker(farmCenter, { icon: farmMarker, keyboard: false }).addTo(map);
  bindLocalizedPopup(
    centerMarker,
    () => `<strong>Sielsoord</strong><span class="popup-desc">${mapT('map.popup_hectares_country')}</span>`,
    { closeButton: true, maxWidth: 250, autoPanPadding: [30, 30] }
  );

  /* ── Fit bounds to show everything ───────────────────────────── */
  const initialBounds = geojsonLayer.getBounds();
  map.fitBounds(initialBounds, { padding: [50, 50], maxZoom: 15 });

  /* ── Custom: Reset View button ───────────────────────────────── */
  const resetControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
      const btn = L.DomUtil.create('button', 'sielsoord-map-btn');
      btn.innerHTML = '&#8962;';
      btn.title = mapT('map.control_reset');
      btn.setAttribute('aria-label', mapT('map.control_reset'));
      btn.dataset.i18nControl = 'map.control_reset';
      L.DomEvent.on(btn, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        map.flyToBounds(initialBounds, { padding: [50, 50], maxZoom: 15, duration: 0.8 });
      });
      return btn;
    }
  });
  map.addControl(new resetControl());

  /* ── Custom: Fullscreen toggle button ────────────────────────── */
  const mapContainer = mapEl.closest('.map-container');
  let isFullscreen = false;

  const fullscreenControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
      const btn = L.DomUtil.create('button', 'sielsoord-map-btn');
      btn.innerHTML = '&#9974;';
      btn.title = mapT('map.control_fullscreen');
      btn.setAttribute('aria-label', mapT('map.control_fullscreen'));
      btn.dataset.i18nControl = 'map.control_fullscreen';
      L.DomEvent.on(btn, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        isFullscreen = !isFullscreen;
        if (isFullscreen) {
          mapContainer.classList.add('sielsoord-map-fullscreen');
          btn.innerHTML = '&#10006;';
        } else {
          mapContainer.classList.remove('sielsoord-map-fullscreen');
          btn.innerHTML = '&#9974;';
        }
        /* Give the browser a frame to apply the size change, then invalidate */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            map.invalidateSize({ animate: true, pan: true });
          });
        });
      });
      return btn;
    }
  });
  map.addControl(new fullscreenControl());

  /* ── Zoom level indicator badge (bottom-left) ────────────────── */
  const zoomBadgeControl = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function() {
      const div = L.DomUtil.create('div', 'sielsoord-zoom-badge');
      div.id = 'sielsoord-zoom-badge';
      const z = map.getZoom();
      const detailKey = z >= 16 ? 'map.zoom_high' : z >= 13 ? 'map.zoom_farm' : z >= 11 ? 'map.zoom_regional' : 'map.zoom_overview';
      div.textContent = mapT('map.zoom_label', { zoom: z.toFixed(1), detail: mapT(detailKey) });
      return div;
    }
  });
  map.addControl(new zoomBadgeControl());

  function updateZoomBadge() {
    const badge = document.getElementById('sielsoord-zoom-badge');
    if (!badge) return;
    const z = map.getZoom();
    const detailKey = z >= 17 ? 'map.zoom_ultra' : z >= 15 ? 'map.zoom_high' : z >= 13 ? 'map.zoom_farm' : z >= 11 ? 'map.zoom_regional' : 'map.zoom_overview';
    badge.textContent = mapT('map.zoom_label', { zoom: z.toFixed(1), detail: mapT(detailKey) });
  }
  map.on('zoomend', updateZoomBadge);

  window.addEventListener('sielsoord:langchange', () => {
    localizedPopups.forEach(({ layer, render }) => layer.setPopupContent(render()));
    document.querySelectorAll('[data-i18n-control]').forEach(button => {
      const label = mapT(button.dataset.i18nControl);
      button.title = label;
      button.setAttribute('aria-label', label);
    });
    updateZoomBadge();
  });

  /* ── Real-time resize handling ────────────────────────────────
     When the container changes size (window resize, layout shift,
     mobile orientation change), invalidateSize immediately so the
     map reflows smoothly without leaving grey tiles. */
  let resizeTimer = null;
  const resizeObserver = new ResizeObserver(() => {
    if (resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(() => {
      map.invalidateSize({ animate: true, pan: true });
    });
  });
  resizeObserver.observe(mapEl);

  /* Also handle window resize for older browsers */
  window.addEventListener('resize', () => {
    if (resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(() => {
      map.invalidateSize({ animate: true, pan: true });
    });
  });

  /* ── ESC key exits fullscreen ────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isFullscreen) {
      isFullscreen = false;
      mapContainer.classList.remove('sielsoord-map-fullscreen');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          map.invalidateSize({ animate: true, pan: true });
        });
      });
    }
  });

  /* Store globally for any external control */
  window._sielsoordMap = map;
}

/* ── Boot ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('sielsoord-map');
  if (!mapEl) return;

  loadLeafletCSS();
  loadLeafletJS(() => {
    setTimeout(initSielsoordMap, 50);
  });
});
