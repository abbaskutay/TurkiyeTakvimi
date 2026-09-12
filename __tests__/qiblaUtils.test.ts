import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseCityCoordinates,
  calculateNamazVaktiQibla,
  calculateDirectQibla,
  generateTheQiblaMapHtml,
  KAABA_COORDINATES,
} from '../utils/qiblaUtils';

describe('qiblaUtils - parseCityCoordinates', () => {
  it('parses Northern and Eastern DMS coordinates (Istanbul)', () => {
    const cityInfo: any = {
      arzDer: '41', arzDak: '01', arzYon: 'N',
      tulDer: '28', tulDak: '58', tulYon: 'E',
    };
    const coords = parseCityCoordinates(cityInfo);
    assert.notStrictEqual(coords, null);
    assert.strictEqual(coords!.latitude, 41.0167);
    assert.strictEqual(coords!.longitude, 28.9667);
  });

  it('parses Southern and Western DMS coordinates', () => {
    const cityInfo: any = {
      arzDer: '23', arzDak: '33', arzYon: 'S',
      tulDer: '46', tulDak: '38', tulYon: 'W',
    };
    const coords = parseCityCoordinates(cityInfo);
    assert.notStrictEqual(coords, null);
    assert(coords!.latitude < 0, 'Southern latitude must be negative');
    assert(coords!.longitude < 0, 'Western longitude must be negative');
    assert.strictEqual(coords!.latitude, -23.55);
    assert.strictEqual(coords!.longitude, -46.6333);
  });

  it('returns null for null, undefined, or empty object', () => {
    assert.strictEqual(parseCityCoordinates(null), null);
    assert.strictEqual(parseCityCoordinates(undefined), null);
    assert.strictEqual(parseCityCoordinates({} as any), null);
  });

  it('returns null for 0,0 coordinates or missing der values', () => {
    assert.strictEqual(parseCityCoordinates({ arzDer: '0', tulDer: '0' } as any), null);
    assert.strictEqual(parseCityCoordinates({ arzDer: '', tulDer: '28' } as any), null);
    assert.strictEqual(parseCityCoordinates({ arzDer: 'abc', tulDer: 'xyz' } as any), null);
  });

  it('handles missing minutes (arzDak/tulDak) by defaulting to 0', () => {
    const cityInfo: any = {
      arzDer: '40', arzDak: '', arzYon: 'N',
      tulDer: '30', tulDak: '', tulYon: 'E',
    };
    const coords = parseCityCoordinates(cityInfo);
    assert.notStrictEqual(coords, null);
    assert.strictEqual(coords!.latitude, 40.0);
    assert.strictEqual(coords!.longitude, 30.0);
  });
});

describe('qiblaUtils - calculateNamazVaktiQibla', () => {
  it('calculates accurate Qibla data for Istanbul', () => {
    const lat = 41.0082;
    const lng = 28.9784;
    const magDeg = 5.6;

    const data = calculateNamazVaktiQibla(lat, lng, magDeg);

    // Coğrafi Kuzeyden Saat Yönünde Kıble Açısı (~151.66°)
    assert(Math.abs(data.geographicAngle - 151.66) < 0.5, `Expected ~151.66, got ${data.geographicAngle}`);

    // Magnetik Sapma Açısı
    assert.strictEqual(data.magneticDeviation, 5.6);

    // Pusula Kuzeyinden Saat Yönünde Kıble Açısı: round(151.66) - round(5.6) = 152 - 6 = 146
    assert.strictEqual(data.compassAngle, 146);

    // Great Circle distance to Kaaba in km: 2405 km
    assert.strictEqual(data.distanceKm, 2405);
  });

  it('handles exact Kaaba coordinates with ~0 km distance', () => {
    const data = calculateNamazVaktiQibla(
      KAABA_COORDINATES.latitude,
      KAABA_COORDINATES.longitude,
      0
    );
    assert(data.distanceKm <= 5, `Expected distance near 0 km, got ${data.distanceKm}`);
  });

  it('calculates global city angles correctly', () => {
    // London: ~118.9°
    const london = calculateNamazVaktiQibla(51.5074, -0.1278, 0);
    assert(Math.abs(london.geographicAngle - 118.9) < 1.0);

    // New York: ~58.5°
    const ny = calculateNamazVaktiQibla(40.7128, -74.0060, -13);
    assert(Math.abs(ny.geographicAngle - 58.5) < 1.0);

    // Tokyo: ~293.0°
    const tokyo = calculateNamazVaktiQibla(35.6762, 139.6503, -8);
    assert(Math.abs(tokyo.geographicAngle - 293.0) < 1.5);
  });

  it('keeps all returned angles within [0, 360) range', () => {
    const testCases = [
      { lat: 0, lng: 0 },
      { lat: 80, lng: -170 },
      { lat: -50, lng: 120 },
      { lat: 45, lng: 40 }, // Same longitude as Mecca approx
    ];

    for (const tc of testCases) {
      const res = calculateNamazVaktiQibla(tc.lat, tc.lng, 5.0);
      assert(res.geographicAngle >= 0 && res.geographicAngle < 360, `Geographic angle ${res.geographicAngle} out of bounds`);
      assert(res.compassAngle >= 0 && res.compassAngle < 360, `Compass angle ${res.compassAngle} out of bounds`);
      assert(res.distanceKm >= 0, `Distance ${res.distanceKm} must be positive`);
    }
  });

  it('legacy calculateDirectQibla returns bearing and distance', () => {
    const legacy = calculateDirectQibla(41.0082, 28.9784);
    assert(typeof legacy.bearing === 'number');
    assert(typeof legacy.distance === 'number');
    assert.strictEqual(legacy.distance, 2405);
  });
});

describe('qiblaUtils - generateTheQiblaMapHtml', () => {
  it('generates complete HTML document with Leaflet, Esri and coordinates', () => {
    const html = generateTheQiblaMapHtml(41.0082, 28.9784, 5.6, true);
    assert(html.startsWith('<!DOCTYPE html>'));
    assert(html.includes('leaflet.css'));
    assert(html.includes('leaflet.js'));
    assert(html.includes('esri-leaflet.js'));
    assert(html.includes('41.0082'));
    assert(html.includes('28.9784'));
    assert(html.includes('defaultLat = 41.0082'));
    assert(html.includes('defaultLng = 28.9784'));
    assert(html.includes('createGreatCirclePoints'));
    assert(html.includes('recenterLocation'));
    assert(html.includes('background: #050505'), 'Dark theme background');
  });

  it('generates light theme background when isDark is false', () => {
    const html = generateTheQiblaMapHtml(41.0082, 28.9784, 5.6, false);
    assert(html.includes('background: #111827'), 'Light theme map background');
  });
});
