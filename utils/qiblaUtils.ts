import { ApiCityInfo } from '../services/turkTakvimApi';

/**
 * Kaaba (Makkah al-Mukarramah) exact coordinates as specified on namazvakti.com/theQibla.php
 */
export const KAABA_COORDINATES = {
  latitude: 21.422498,
  longitude: 39.826176,
} as const;

export interface QiblaCalculationResult {
  bearing: number;
  distance: number;
}

export interface NamazVaktiQiblaData {
  geographicAngle: number; // Coğrafi Kuzeyden Saat Yönünde Kıble Açısı
  magneticDeviation: number; // Magnetik Sapma Açısı
  compassAngle: number; // Pusula Kuzeyinden Saat Yönünde Kıble Açısı
  distanceKm: number; // Kâbe-i Şerîf Uzaklığı (km)
  latitude: number;
  longitude: number;
}

/**
 * Parses degrees/minutes/direction from TurkTakvim ApiCityInfo into decimal lat/lng
 */
export function parseCityCoordinates(cityInfo?: ApiCityInfo | null): { latitude: number; longitude: number } | null {
  if (!cityInfo) return null;
  const { arzDer, arzDak, arzYon, tulDer, tulDak, tulYon } = cityInfo;
  if (!arzDer || !tulDer) return null;

  let lat = parseFloat(arzDer) + (parseFloat(arzDak || '0') / 60);
  if (arzYon?.toUpperCase() === 'S') lat = -lat;

  let lng = parseFloat(tulDer) + (parseFloat(tulDak || '0') / 60);
  if (tulYon?.toUpperCase() === 'W') lng = -lng;

  if (isNaN(lat) || isNaN(lng) || lat === 0 && lng === 0) return null;
  return { latitude: parseFloat(lat.toFixed(4)), longitude: parseFloat(lng.toFixed(4)) };
}

/**
 * The exact Qibla angle calculation from https://www.namazvakti.com/theQibla.php
 *
 * @param lat Location latitude
 * @param lng Location longitude
 * @param magDeg Magnetic deviation in degrees (e.g. from TurkTakvim API magdeg)
 */
export function calculateNamazVaktiQibla(
  lat: number,
  lng: number,
  magDeg?: number | null
): NamazVaktiQiblaData {
  const qlat = KAABA_COORDINATES.latitude;
  const qlon = KAABA_COORDINATES.longitude;
  const pi = Math.PI / 180;

  // Exact theQibla.php trigonometric formula
  let dt = (qlon - lng) * pi;
  const dd = Math.cos(dt) * Math.sin(lat * pi) - Math.tan(qlat * pi) * Math.cos(lat * pi);

  if (dd === 0) {
    dt = Math.PI / 2 + 1e-7;
  } else {
    dt = Math.atan(Math.sin(dt) / dd) / pi;
    if (dt < 0) dt += 180;
    if (lng > qlon || lng < qlon - 180) dt += 180;
  }
  dt = 180 - dt;
  if (dt < 0) dt = 360 + dt;

  const geographicAngle = parseFloat(dt.toFixed(2));
  const magneticDeviation = magDeg !== undefined && magDeg !== null ? parseFloat(Number(magDeg).toFixed(2)) : 6.0;
  
  // pusKuzey = (Math.round(dt) - Number(manyetikSapma))
  let compassAngle = (Math.round(geographicAngle) - Math.round(magneticDeviation));
  compassAngle = (compassAngle % 360 + 360) % 360;

  // Orthodromic Great-Circle distance
  const R = 6371; // Earth mean radius in km
  const phi1 = lat * pi;
  const phi2 = qlat * pi;
  const deltaPhi = (qlat - lat) * pi;
  const deltaLambda = (qlon - lng) * pi;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  return {
    geographicAngle,
    magneticDeviation,
    compassAngle,
    distanceKm,
    latitude: parseFloat(lat.toFixed(4)),
    longitude: parseFloat(lng.toFixed(4)),
  };
}

/**
 * Legacy compatibility helper
 */
export function calculateDirectQibla(lat1: number, lon1: number): QiblaCalculationResult {
  const res = calculateNamazVaktiQibla(lat1, lon1);
  return { bearing: res.geographicAngle, distance: res.distanceKm };
}

/**
 * Generates an interactive Leaflet + Esri Satellite geodesic map matching namazvakti.com/theQibla.php
 */
export function generateTheQiblaMapHtml(
  lat: number,
  lng: number,
  initialMagDeg = 6.0,
  isDark = false
): string {
  const qlat = KAABA_COORDINATES.latitude;
  const qlon = KAABA_COORDINATES.longitude;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>theQibla Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: ${isDark ? '#050505' : '#111827'};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Center target crosshair / red marker bulb */
    .center-pointer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
    }
    .pointer-bulb {
      width: 28px;
      height: 28px;
      background: #ef4444;
      border: 3px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.45);
    }
    .pointer-dot {
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 7px;
      left: 7px;
    }

    /* Floating Header Dashboard (theQibla.php style) */
    .qibla-dashboard {
      position: absolute;
      bottom: 16px;
      left: 12px;
      right: 12px;
      z-index: 1001;
      background: ${isDark ? 'rgba(18, 18, 18, 0.94)' : 'rgba(255, 255, 255, 0.96)'};
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 12px 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
      color: ${isDark ? '#f3f4f6' : '#111827'};
      font-size: 13px;
      line-height: 1.5;
    }
    .dash-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .dash-label {
      font-weight: 600;
      font-size: 12px;
      color: ${isDark ? '#9ca3af' : '#4b5563'};
    }
    .cografiKuzey {
      color: #0d9488;
      font-weight: 800;
      font-size: 14px;
    }
    .pusulaKuzey {
      color: #dc2626;
      font-weight: 800;
      font-size: 14px;
    }
    .magSapma {
      color: ${isDark ? '#e5e7eb' : '#1f2937'};
      font-weight: 700;
    }
    .coords-tag {
      font-size: 11px;
      color: ${isDark ? '#9ca3af' : '#6b7280'};
      font-family: monospace;
      font-weight: 600;
      background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
      padding: 2px 6px;
      border-radius: 6px;
    }
    .qibla-line-info {
      font-size: 11px;
      color: #16a34a;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
    }
    .green-dot {
      width: 8px;
      height: 8px;
      background: #16a34a;
      border-radius: 50%;
      display: inline-block;
    }

    /* Recenter Button */
    .map-btn {
      position: absolute;
      right: 12px;
      top: 12px;
      z-index: 1001;
      background: ${isDark ? '#1f2937' : '#ffffff'};
      color: ${isDark ? '#ffffff' : '#111827'};
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/esri-leaflet@3.0.12/dist/esri-leaflet.js"></script>
</head>
<body>
  <div id="map"></div>

  <!-- Center Pin / Red Bulb -->
  <div class="center-pointer">
    <div class="pointer-bulb">
      <div class="pointer-dot"></div>
    </div>
  </div>

  <button class="map-btn" onclick="recenterLocation()">📍 Konumuma Dön</button>

  <!-- Info Dashboard matching theQibla.php -->
  <div class="qibla-dashboard">
    <div class="dash-row">
      <span class="coords-tag" id="coordsText">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
      <span style="font-size: 11px; font-weight: 700; color: #16a34a;">KÂBE HATTI AKTİF</span>
    </div>
    <div class="dash-row">
      <span class="dash-label">• Coğrafi Kuzey Açısı:</span>
      <span class="cografiKuzey" id="geoAngle">...°</span>
    </div>
    <div class="dash-row">
      <span class="dash-label">• Magnetik Sapma Açısı:</span>
      <span class="magSapma" id="magDev">${initialMagDeg > 0 ? '+' : ''}${initialMagDeg}°</span>
    </div>
    <div class="dash-row">
      <span class="dash-label">• Pusula Kuzey Açısı:</span>
      <span class="pusulaKuzey" id="compAngle">...°</span>
    </div>
    <div class="qibla-line-info">
      <span class="green-dot"></span>
      <span>Yeşil hat doğrudan Kâbe-i Şerîf istikâmetidir.</span>
    </div>
  </div>

  <script>
    var map;
    var qiblaPolyline;
    var defaultLat = ${lat};
    var defaultLng = ${lng};
    var qlat = ${qlat};
    var qlon = ${qlon};
    var magDeg = ${initialMagDeg};

    function calculateAngles(lat, lng) {
      var pi = Math.PI / 180;
      var dt = (qlon - lng) * pi;
      var dd = Math.cos(dt) * Math.sin(lat * pi) - Math.tan(qlat * pi) * Math.cos(lat * pi);

      if (dd == 0) {  
        dt = Math.PI/2 + 1e-7;
      } else {
        dt = Math.atan(Math.sin(dt) / dd) / pi;
        if (dt < 0) dt += 180;
        if ((lng > qlon) || (lng < qlon - 180)) dt += 180;
      }
      dt = 180 - dt;
      if (dt < 0) dt = 360 + dt;
      
      var geo = dt;
      var pus = (Math.round(geo) - Math.round(magDeg) + 360) % 360;
      return { geo: Math.round(geo), pus: pus, rawGeo: geo };
    }

    function createGreatCirclePoints(lat1, lon1, lat2, lon2, numPoints) {
      var points = [];
      var p1 = { lat: lat1 * Math.PI / 180, lon: lon1 * Math.PI / 180 };
      var p2 = { lat: lat2 * Math.PI / 180, lon: lon2 * Math.PI / 180 };
      
      var d = 2 * Math.asin(Math.sqrt(
        Math.pow(Math.sin((p1.lat - p2.lat) / 2), 2) +
        Math.cos(p1.lat) * Math.cos(p2.lat) * Math.pow(Math.sin((p1.lon - p2.lon) / 2), 2)
      ));

      if (d === 0) return [[lat1, lon1], [lat2, lon2]];

      for (var i = 0; i <= numPoints; i++) {
        var f = i / numPoints;
        var A = Math.sin((1 - f) * d) / Math.sin(d);
        var B = Math.sin(f * d) / Math.sin(d);
        var x = A * Math.cos(p1.lat) * Math.cos(p1.lon) + B * Math.cos(p2.lat) * Math.cos(p2.lon);
        var y = A * Math.cos(p1.lat) * Math.sin(p1.lon) + B * Math.cos(p2.lat) * Math.sin(p2.lon);
        var z = A * Math.sin(p1.lat) + B * Math.sin(p2.lat);
        var lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
        var lon = Math.atan2(y, x) * 180 / Math.PI;
        points.push([lat, lon]);
      }
      return points;
    }

    function updateView() {
      var center = map.getCenter();
      var cLat = center.lat;
      var cLng = center.lng;

      var angles = calculateAngles(cLat, cLng);
      document.getElementById('geoAngle').innerText = angles.geo + '°';
      document.getElementById('compAngle').innerText = angles.pus + '°';
      document.getElementById('coordsText').innerText = cLat.toFixed(4) + ', ' + cLng.toFixed(4);

      // Redraw Great Circle line to Kaaba
      if (qiblaPolyline) map.removeLayer(qiblaPolyline);
      var linePoints = createGreatCirclePoints(cLat, cLng, qlat, qlon, 60);
      qiblaPolyline = L.polyline(linePoints, {
        color: '#16a34a',
        weight: 5,
        opacity: 0.95,
        smoothFactor: 1
      }).addTo(map);

      // Notify React Native
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          lat: cLat,
          lng: cLng,
          geoAngle: angles.geo,
          compassAngle: angles.pus
        }));
      }
    }

    function recenterLocation() {
      map.setView([defaultLat, defaultLng], 17, { animate: true });
    }

    window.addEventListener('load', function() {
      map = L.map('map', {
        center: [defaultLat, defaultLng],
        zoom: 16,
        maxZoom: 19,
        minZoom: 4,
        zoomControl: false
      });

      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Esri Satellite Imagery layer
      var satelliteLayer = L.esri.basemapLayer('Imagery', { detectRetina: true });
      var labelsLayer = L.esri.basemapLayer('ImageryLabels', { detectRetina: true });
      var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      });

      satelliteLayer.addTo(map);
      labelsLayer.addTo(map);

      var baseLayers = {
        "Uydu": satelliteLayer,
        "Sokak": streetLayer
      };
      var overlays = {
        "Etiketler": labelsLayer
      };
      L.control.layers(baseLayers, overlays, { position: 'topright' }).addTo(map);

      // Add Kaaba Marker
      var kaabaIcon = L.divIcon({
        className: 'kaaba-pin',
        html: '<div style="background:#111;color:#d4af37;border:2px solid #d4af37;font-size:10px;font-weight:900;padding:4px 6px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.5);">🕋 KÂBE</div>',
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });
      L.marker([qlat, qlon], { icon: kaabaIcon }).addTo(map);

      updateView();

      map.on('move', updateView);
      map.on('dragend', updateView);
      map.on('zoomend', updateView);
    });
  </script>
</body>
</html>`;
}

