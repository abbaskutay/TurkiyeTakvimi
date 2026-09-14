import { turkTakvimApi, extractApiText } from './services/turkishCalendarApi';
import {
  parseCityCoordinates,
  calculateNamazVaktiQibla,
  calculateDirectQibla,
  generateTheQiblaMapHtml,
  KAABA_COORDINATES,
} from './utils/qiblaUtils';
import {
  mapVakitToMainPrayerTimes,
  mapVakitToGridPrayerTimes,
  formatGregorianDate,
  formatHicriDate,
  parseHicriYear,
  mapCalendarToImportantDays,
  MOCK_PRAYER_TIMES,
  GRID_PRAYER_TIMES,
} from './constants';
import { ApiVakitItem, ApiTakvimVeri } from './services/turkishCalendarApi';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  durationMs: number;
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

async function test(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, name, status: 'PASS', durationMs: Date.now() - start });
    console.log(`  ✅ [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      suite,
      name,
      status: 'FAIL',
      durationMs: Date.now() - start,
      error: err?.message || String(err),
    });
    console.error(`  ❌ [FAIL] ${name}:`, err?.message || err);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed [${message}]: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('  TURKIYE TAKVIMI - COMPREHENSIVE FEATURE TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: TurkTakvim API Live Network Tests
  // ----------------------------------------------------
  console.log('--- SUITE 1: TurkTakvim API Network & Service Calls ---');

  await test('TurkTakvim API', 'getCountries() returns country list including Turkey (ID 200)', async () => {
    const countries = await turkTakvimApi.getCountries();
    assert(Array.isArray(countries), 'Countries must be an array');
    assert(countries.length > 50, `Expected >50 countries, received ${countries.length}`);
    const turkey = countries.find(c => c.ID === '200' || c.countryNameTR?.toLowerCase() === 'türkiye');
    assert(!!turkey, 'Turkey (ID 200) must be present in countries');
    assert(turkey?.countryNameTR?.toLowerCase() === 'türkiye' && turkey?.countryNameEN === 'Turkey', 'Country name verification');
  });

  let savedStates: any[] = [];
  await test('TurkTakvim API', 'getStates("200") returns states/provinces of Turkey', async () => {
    savedStates = await turkTakvimApi.getStates('200');
    assert(Array.isArray(savedStates), 'States must be an array');
    assert(savedStates.length >= 81, `Expected at least 81 provinces for Turkey, got ${savedStates.length}`);
    const istanbul = savedStates.find(s => s.cityStateTR?.toLowerCase().includes('istanbul') || s.cityStateFilter === 'ISDANBUL');
    assert(!!istanbul, 'Istanbul must be in states list');
    const ankara = savedStates.find(s => s.cityStateFilter === 'ANKARA');
    assert(!!ankara, 'Ankara must be in states list');
  });

  await test('TurkTakvim API', 'getCities("200", cityStateFilter) returns districts for Istanbul and Ankara', async () => {
    const istanbulState = savedStates.find(s => s.cityStateFilter === 'ISDANBUL' || s.cityStateTR?.toLowerCase().includes('istanbul'));
    assert(!!istanbulState, 'Istanbul state found');
    const filterKey = istanbulState.cityStateFilter || 'ISDANBUL';

    const istanbulDistricts = await turkTakvimApi.getCities('200', filterKey);
    assert(Array.isArray(istanbulDistricts), 'Districts must be an array');
    assert(istanbulDistricts.length > 0, `Expected districts for Istanbul, got ${istanbulDistricts.length}`);
    assert(!!istanbulDistricts[0].ID && !!istanbulDistricts[0].CityNameTR, 'District must have ID and Name');

    // Also test Ankara
    const ankaraDistricts = await turkTakvimApi.getCities('200', 'ANKARA');
    assert(Array.isArray(ankaraDistricts) && ankaraDistricts.length > 50, 'Ankara districts should return large list');
  });

  await test('TurkTakvim API', 'searchCities("Istanbul") finds Istanbul with accurate fields', async () => {
    const results = await turkTakvimApi.searchCities('Istanbul', 5);
    assert(Array.isArray(results), 'Search result must be an array');
    assert(results.length > 0, `Expected search results for Istanbul, got ${results.length}`);
    const match = results.find(r => r.NameTR?.toLowerCase().includes('istanbul') || r.NameEN?.toLowerCase().includes('istanbul'));
    assert(!!match, 'Match for Istanbul should be found');
    assert(!!match?.ID, 'Result must contain city ID');
  });

  await test('TurkTakvim API', 'searchCities("Berlin") finds international locations', async () => {
    const results = await turkTakvimApi.searchCities('Berlin', 5);
    assert(Array.isArray(results), 'Search result must be an array');
    assert(results.length > 0, `Expected search results for Berlin, got ${results.length}`);
    const berlin = results.find(r => r.NameTR?.toLowerCase().includes('berl') || r.NameEN?.toLowerCase().includes('berl'));
    assert(!!berlin, 'Berlin should be found');
  });

  await test('TurkTakvim API', 'searchCities pagination and limit parameters work correctly', async () => {
    const limit3 = await turkTakvimApi.searchCities('Ankara', 3, undefined, 1);
    assert(limit3.length <= 3, `Expected at most 3 items, got ${limit3.length}`);
  });

  await test('TurkTakvim API', 'searchCities handles AbortSignal cleanly without noise', async () => {
    const controller = new AbortController();
    controller.abort();
    const results = await turkTakvimApi.searchCities('Istanbul', 5, controller.signal);
    assert(Array.isArray(results), 'Should return empty array on abort');
    assertEqual(results.length, 0, 'Results length should be 0 on abort');
  });

  let cachedIstanbulVakit: ApiVakitItem | null = null;
  let cachedIstanbulCityInfo: any = null;

  await test('TurkTakvim API', 'getPrayerTimes("16741") returns Istanbul prayer times and cityinfo', async () => {
    const res = await turkTakvimApi.getPrayerTimes('16741');
    assert(res !== null, 'getPrayerTimes response should not be null');
    assert(!!res?.cityinfo?.['@attributes'], 'cityinfo attributes must exist');
    assert(Array.isArray(res?.vakit), 'vakit must be an array');
    assert((res?.vakit?.length ?? 0) > 0, 'vakit array must not be empty');

    const firstVakit = res!.vakit[0];
    cachedIstanbulVakit = firstVakit;
    cachedIstanbulCityInfo = res!.cityinfo['@attributes'];

    // Verify all 18 prayer time slots exist in the API item
    const requiredKeys: (keyof ApiVakitItem)[] = [
      'imsak', 'sabah', 'gunes', 'israk', 'dahve', 'kerahet',
      'ogle', 'ikindi', 'asrisani', 'isfirar', 'aksam', 'istibak',
      'yatsi', 'isaisani', 'geceyarisi', 'teheccud', 'seher', 'kible'
    ];
    for (const key of requiredKeys) {
      assert(typeof firstVakit[key] === 'string' && (firstVakit[key] as string).includes(':'),
        `Field ${key} should be a valid time string HH:MM, got: ${firstVakit[key]}`);
    }

    // Verify metadata attributes
    assert(!!firstVakit['@attributes']?.tarih, 'Vakit date must exist (YYYY-MM-DD)');
    assert(!!firstVakit['@attributes']?.hicri, 'Vakit Hijri date must exist');

    // Verify cityinfo coordinates and angles
    assert(!!cachedIstanbulCityInfo.arzDer, 'CityInfo must have arzDer');
    assert(!!cachedIstanbulCityInfo.tulDer, 'CityInfo must have tulDer');
    assert(!!cachedIstanbulCityInfo.qiblaangle, 'CityInfo must have qiblaangle');
  });

  await test('TurkTakvim API', 'getPrayerTimes with specific date range (3 days)', async () => {
    const today = new Date();
    const d1 = today.toISOString().split('T')[0];
    const d2Date = new Date(today);
    d2Date.setDate(d2Date.getDate() + 2);
    const d2 = d2Date.toISOString().split('T')[0];

    const res = await turkTakvimApi.getPrayerTimes('16741', d1, d2);
    assert(res !== null, 'Range response should not be null');
    assert(Array.isArray(res?.vakit), 'Range vakit must be array');
    assert((res?.vakit?.length ?? 0) >= 2, `Expected at least 2 days, got ${res?.vakit?.length}`);
  });

  await test('TurkTakvim API', 'getLocalTime("16741") returns mahalli solar time', async () => {
    const localTime = await turkTakvimApi.getLocalTime('16741');
    assert(localTime !== null, 'getLocalTime response should not be null');
    assert(!!localTime?.saat, 'saat should be present');
    assert(!!localTime?.tarih, 'tarih should be present');
  });

  await test('TurkTakvim API', 'getCalendarDetail() returns XML calendar data with CDATA fields', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const details = await turkTakvimApi.getCalendarDetail(todayStr, todayStr);
    assert(Array.isArray(details), 'Calendar detail must be an array');
    assert(details.length > 0, 'Calendar detail should return at least 1 day');

    const day = details[0];
    assert(!!day['@attributes']?.Tarih || !!day.MiladiTarih, 'Day must have date info');

    const gununSozu = extractApiText(day.GununSozu);
    const gununOlayi = extractApiText(day.GununOlayi);
    assert(gununSozu.length > 0 || gununOlayi.length > 0 || !!day.Arkayuz, 'At least one calendar text field must be present');
  });

  await test('TurkTakvim API', 'getCalendarDetail("2026-01-01", "2026-12-31") extracts 20 religious days', async () => {
    const list = await turkTakvimApi.getCalendarDetail('2026-01-01', '2026-12-31');
    assert(list.length >= 365, `Expected 365 or 366 days, got ${list.length}`);
    const importantDays = mapCalendarToImportantDays(list);
    assert(importantDays.length >= 18, `Expected at least 18 religious days in 2026, got ${importantDays.length}`);
    
    // Check specific famous religious days are detected
    const names = importantDays.map(d => d.name.toLowerCase());
    assert(names.some(n => n.includes('kandil') || n.includes("mi'râc")), 'Kandil detected');
    assert(names.some(n => n.includes('bayram') || n.includes('fıtr')), 'Bayram detected');
    assert(names.some(n => n.includes('kurban')), 'Kurban Bayramı detected');
    assert(names.some(n => n.includes('aşûre') || n.includes('asure')), 'Aşûre detected');
  });

  await test('TurkTakvim API', 'getHicriYearInfo() handles endpoint gracefully', async () => {
    const res = await turkTakvimApi.getHicriYearInfo();
    assert(res === null || typeof res === 'object', 'getHicriYearInfo must return null or object');
  });

  // ----------------------------------------------------
  // SUITE 2: Text Extraction & HTML Decoding
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: Text Extraction & HTML Decoding Utilities ---');

  await test('Text Utils', 'extractApiText handles strings, numbers, objects and CDATA', () => {
    assertEqual(extractApiText('Basit Metin'), 'Basit Metin', 'Plain string');
    assertEqual(extractApiText(12345), '12345', 'Number conversion');
    assertEqual(extractApiText(null), '', 'Null handling');
    assertEqual(extractApiText(undefined), '', 'Undefined handling');
    assertEqual(extractApiText({}), '', 'Empty object handling');
    assertEqual(extractApiText({ '#text': 'Text Field' }), 'Text Field', '#text extraction');
    assertEqual(extractApiText({ '#cdata-section': 'CDATA Metni' }), 'CDATA Metni', 'cdata extraction');
  });

  await test('Text Utils', 'extractApiText cleans embedded HTML tags and converts breaks', () => {
    const htmlSnippet = '<p>Birinci paragraf.</p><br><div>İkinci paragraf <b>kalın</b> yazı.</div>';
    const cleaned = extractApiText(htmlSnippet);
    assert(!cleaned.includes('<p>') && !cleaned.includes('</p>'), 'Tags stripped');
    assert(!cleaned.includes('<div>') && !cleaned.includes('<b>'), 'Inner tags stripped');
    assert(cleaned.includes('Birinci paragraf.') && cleaned.includes('İkinci paragraf kalın yazı.'), 'Content preserved');
  });

  await test('Text Utils', 'extractApiText decodes HTML entities and Turkish characters', () => {
    const textWithEntities = 'S&ouml;z: &#39;Hak geldi b&acirc;tıl z&acirc;il oldu&#39; &amp; &ccedil;i&ccedil;ekler a&ccedil;tı.';
    const decoded = extractApiText(textWithEntities);
    assertEqual(decoded, "Söz: 'Hak geldi bâtıl zâil oldu' & çiçekler açtı.", 'Entities properly decoded');
  });

  // ----------------------------------------------------
  // SUITE 3: Qibla Utilities & Geometry Calculations
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: Qibla Utilities & Geometry Calculations ---');

  await test('Qibla Utils', 'parseCityCoordinates handles Turkish Takvim DMS format', () => {
    // Istanbul: 41° 01' N, 28° 58' E
    const cityInfo: any = {
      arzDer: '41', arzDak: '01', arzYon: 'N',
      tulDer: '28', tulDak: '58', tulYon: 'E',
      qiblaangle: '151.7', magdeg: '5.6'
    };
    const coords = parseCityCoordinates(cityInfo);
    assert(coords !== null, 'Coordinates should be parsed');
    assertEqual(coords!.latitude, 41.0167, 'Lat calculation 41 + 1/60');
    assertEqual(coords!.longitude, 28.9667, 'Lng calculation 28 + 58/60');
  });

  await test('Qibla Utils', 'parseCityCoordinates handles Southern & Western hemispheres', () => {
    // Southern & Western: -23.5500 S, -46.6333 W
    const cityInfo: any = {
      arzDer: '23', arzDak: '33', arzYon: 'S',
      tulDer: '46', tulDak: '38', tulYon: 'W',
    };
    const coords = parseCityCoordinates(cityInfo);
    assert(coords !== null, 'Coordinates parsed');
    assert(coords!.latitude < 0, `Latitude must be negative: ${coords!.latitude}`);
    assert(coords!.longitude < 0, `Longitude must be negative: ${coords!.longitude}`);
  });

  await test('Qibla Utils', 'parseCityCoordinates returns null on invalid/empty data', () => {
    assertEqual(parseCityCoordinates(null), null, 'null input');
    assertEqual(parseCityCoordinates(undefined), null, 'undefined input');
    assertEqual(parseCityCoordinates({} as any), null, 'empty object');
    assertEqual(parseCityCoordinates({ arzDer: '0', tulDer: '0', arzDak: '0', tulDak: '0' } as any), null, 'zero coordinates');
  });

  await test('Qibla Utils', 'calculateNamazVaktiQibla calculates authentic angles for Istanbul', () => {
    // Istanbul coords
    const lat = 41.0082;
    const lng = 28.9784;
    const magDeg = 5.6;

    const data = calculateNamazVaktiQibla(lat, lng, magDeg);
    // Coğrafi Kuzeyden Kıble Açısı ~ 151.66°
    assert(Math.abs(data.geographicAngle - 151.66) < 1.0, `Geographic angle expected ~151.66°, got ${data.geographicAngle}`);
    // Magnetik Sapma ~ 5.6°
    assertEqual(data.magneticDeviation, 5.6, 'Magnetic deviation');
    // Pusula Kuzey Açısı = round(geo) - round(mag) = 152 - 6 = 146°
    assertEqual(data.compassAngle, 146, 'Pusula kuzey angle');
    // Orthodromic Great Circle Distance Istanbul to Mecca is 2405 km
    assertEqual(data.distanceKm, 2405, 'Distance to Kaaba in km');
  });

  await test('Qibla Utils', 'calculateNamazVaktiQibla handles Mecca (zero distance proximity)', () => {
    const data = calculateNamazVaktiQibla(KAABA_COORDINATES.latitude, KAABA_COORDINATES.longitude, 0);
    assert(data.distanceKm <= 5, `Distance at Kaaba should be ~0 km, got ${data.distanceKm}`);
  });

  await test('Qibla Utils', 'calculateNamazVaktiQibla handles Global Cities (Tokyo, New York, London)', () => {
    // London (approx 119° to Kaaba)
    const london = calculateNamazVaktiQibla(51.5074, -0.1278, 0);
    assert(Math.abs(london.geographicAngle - 119) < 2, `London geographic angle expected ~119°, got ${london.geographicAngle}`);

    // New York (approx 58.5° to Kaaba via Great Circle)
    const ny = calculateNamazVaktiQibla(40.7128, -74.0060, -13);
    assert(Math.abs(ny.geographicAngle - 58.5) < 2, `NY geographic angle expected ~58.5°, got ${ny.geographicAngle}`);

    // Tokyo (approx 293° to Kaaba via Great Circle)
    const tokyo = calculateNamazVaktiQibla(35.6762, 139.6503, -8);
    assert(Math.abs(tokyo.geographicAngle - 293) < 3, `Tokyo geographic angle expected ~293°, got ${tokyo.geographicAngle}`);
  });

  await test('Qibla Utils', 'calculateDirectQibla legacy function returns bearing and distance', () => {
    const res = calculateDirectQibla(41.0082, 28.9784);
    assert(typeof res.bearing === 'number', 'Bearing is number');
    assert(typeof res.distance === 'number', 'Distance is number');
    assert(res.distance > 2390 && res.distance < 2420, 'Distance range check');
  });

  await test('Qibla Utils', 'generateTheQiblaMapHtml produces valid HTML with leaflet and params', () => {
    const html = generateTheQiblaMapHtml(41.0082, 28.9784, 5.6, true);
    assert(html.includes('<!DOCTYPE html>'), 'Valid HTML doctype');
    assert(html.includes('leaflet.js'), 'Includes Leaflet');
    assert(html.includes('esri-leaflet.js'), 'Includes Esri Leaflet');
    assert(html.includes('41.0082') && html.includes('28.9784'), 'Contains latitude/longitude');
    assert(html.includes('createGreatCirclePoints'), 'Includes Great Circle geodesic calculation');
    assert(html.includes('recenterLocation'), 'Includes recenter handler');
  });

  // ----------------------------------------------------
  // SUITE 4: Constants & Mapping Functions
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: Constants & Mapping Functions ---');

  await test('Mapping', 'mapVakitToMainPrayerTimes maps all 6 prayers correctly', () => {
    const mockVakit: ApiVakitItem = {
      '@attributes': { tarih: '2026-09-12', gun: 'Cumartesi', hicri: '30 SAFER 1448' },
      imsak: '05:10', sabah: '05:30', gunes: '06:40', israk: '07:30',
      dahve: '12:00', kerahet: '12:40', ogle: '13:05', ikindi: '16:40',
      asrisani: '17:20', isfirar: '18:50', aksam: '19:15', istibak: '20:10',
      yatsi: '20:40', isaisani: '21:00', geceyarisi: '00:10', teheccud: '02:00',
      seher: '04:00', kible: '11:35'
    };

    const main = mapVakitToMainPrayerTimes(mockVakit);
    assertEqual(main.length, 6, 'Must have 6 main prayer times');
    assertEqual(main[0].id, 'imsak', '1st: imsak');
    assertEqual(main[0].time, '05:10', 'imsak time');
    assertEqual(main[1].id, 'gunes', '2nd: gunes');
    assertEqual(main[2].id, 'ogle', '3rd: ogle');
    assertEqual(main[3].id, 'ikindi', '4th: ikindi');
    assertEqual(main[4].id, 'aksam', '5th: aksam');
    assertEqual(main[5].id, 'yatsi', '6th: yatsi');
    assertEqual(main[5].time, '20:40', 'yatsi time');
  });

  await test('Mapping', 'mapVakitToGridPrayerTimes maps all 18 periods in 9 pairs', () => {
    const mockVakit: ApiVakitItem = {
      '@attributes': { tarih: '2026-09-12', gun: 'Cumartesi', hicri: '30 SAFER 1448' },
      imsak: '05:10', sabah: '05:30', gunes: '06:40', israk: '07:30',
      dahve: '12:00', kerahet: '12:40', ogle: '13:05', ikindi: '16:40',
      asrisani: '17:20', isfirar: '18:50', aksam: '19:15', istibak: '20:10',
      yatsi: '20:40', isaisani: '21:00', geceyarisi: '00:10', teheccud: '02:00',
      seher: '04:00', kible: '11:35'
    };

    const grid = mapVakitToGridPrayerTimes(mockVakit);
    assertEqual(grid.length, 9, 'Must have 9 rows');
    const flat = grid.flat();
    assertEqual(flat.length, 18, 'Must have exactly 18 periods');

    const ids = flat.map(p => p.id);
    const expectedIds = [
      'imsak', 'sabah', 'gunes', 'israk', 'dahve', 'kerahet',
      'ogle', 'asr_evvel', 'asr_sani', 'isfirar', 'aksam', 'istibak',
      'isa_evvel', 'isa_sani', 'gece_yarisi', 'teheccud', 'seher', 'kible_saati'
    ];
    for (const exp of expectedIds) {
      assert(ids.includes(exp), `Grid must contain period ${exp}`);
    }
  });

  await test('Date Formatting', 'formatGregorianDate formats YYYY-MM-DD to Turkish month names', () => {
    assertEqual(formatGregorianDate('2026-01-15'), '15 Ocak 2026', 'Jan');
    assertEqual(formatGregorianDate('2026-02-19'), '19 Şubat 2026', 'Feb');
    assertEqual(formatGregorianDate('2026-03-20'), '20 Mart 2026', 'Mar');
    assertEqual(formatGregorianDate('2026-09-12'), '12 Eylül 2026', 'Sep');
    assertEqual(formatGregorianDate('2026-12-31'), '31 Aralık 2026', 'Dec');
  });

  await test('Date Formatting', 'formatHicriDate and parseHicriYear parse Hijri strings', () => {
    assertEqual(formatHicriDate('26  RECEB  1447'), '26 Receb 1447', 'Receb');
    assertEqual(formatHicriDate("14  ŞA'BÂN  1447"), "14 Şa'bân 1447", "Sha'ban");
    assertEqual(formatHicriDate('1  RAMEZÂN  1447'), '1 Ramazan 1447', 'Ramazan');
    assertEqual(formatHicriDate('1  ŞEVVÂL  1447'), '1 Şevval 1447', 'Shevval');
    assertEqual(parseHicriYear('26 RECEB 1447'), 1447, 'Parse Hijri year 1447');
    assertEqual(parseHicriYear('1 MUHARREM 1448'), 1448, 'Parse Hijri year 1448');
  });

  await test('Mapping', 'mapCalendarToImportantDays extracts religious days correctly', () => {
    const mockVeri: ApiTakvimVeri[] = [
      {
        '@attributes': { Tarih: '2026-01-15' },
        MiladiTarih: '15.01.2026',
        HicriTarih: '26  RECEB  1447',
        OnemliGun: { '@attributes': { Turu: 'Dini', Baslik: "Mi'râc Kandili Gecesi" } },
      },
      {
        '@attributes': { Tarih: '2026-01-16' },
        MiladiTarih: '16.01.2026',
        HicriTarih: '27  RECEB  1447',
      },
      {
        '@attributes': { Tarih: '2026-03-20' },
        MiladiTarih: '20.03.2026',
        HicriTarih: '1  ŞEVVÂL  1447',
        OnemliGun: { '@attributes': { Turu: 'Dini', Baslik: 'Ramazan Bayramı 1. Günü' } },
      },
      {
        '@attributes': { Tarih: '2026-04-23' },
        MiladiTarih: '23.04.2026',
        HicriTarih: '5  ZİLKADE  1447',
        OnemliGun: { '@attributes': { Turu: 'Milli', Baslik: 'Ulusal Egemenlik ve Çocuk Bayramı' } },
      }
    ];

    const importantDays = mapCalendarToImportantDays(mockVeri);
    assertEqual(importantDays.length, 2, 'Should only contain 2 Dini days');
    assertEqual(importantDays[0].name, "Mi'râc Kandili Gecesi", '1st day name');
    assertEqual(importantDays[0].dateGregorian, '15 Ocak 2026', '1st day gregorian');
    assertEqual(importantDays[0].dateHijri, '26 Receb 1447', '1st day hijri');
    assertEqual(importantDays[1].name, 'Ramazan Bayramı 1. Günü', '2nd day name');
  });

  // ----------------------------------------------------
  // SUITE 5: Timer & Countdown Logic Simulation
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: Timer & Countdown Logic Simulation ---');

  function simulateTimer(
    timeString: string,
    mainPrayerTimes: { id: string; name: string; time: string }[],
    tomorrowPrayerTimes: { id: string; name: string; time: string }[]
  ) {
    const [currH, currM] = timeString.split(':').map(Number);
    const currentMinutes = currH * 60 + currM;

    const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    let active = mainPrayerTimes[mainPrayerTimes.length - 1]?.id || 'yatsi';
    for (let i = 0; i < mainPrayerTimes.length; i++) {
      if (timeToMin(mainPrayerTimes[i].time) > currentMinutes) {
        active = i === 0 ? mainPrayerTimes[mainPrayerTimes.length - 1].id : mainPrayerTimes[i - 1].id;
        break;
      }
    }

    let nextTime = mainPrayerTimes.find(p => timeToMin(p.time) > currentMinutes);
    let isTomorrow = false;
    if (!nextTime) {
      nextTime = tomorrowPrayerTimes[0] || mainPrayerTimes[0];
      isTomorrow = true;
    }

    return { activePrayerId: active, nextPrayerId: nextTime.id, isTomorrow };
  }

  await test('Timer Logic', 'Accurately detects active prayer and next prayer across entire day', () => {
    const mainTimes = [
      { id: 'imsak', name: 'İmsak', time: '05:00' },
      { id: 'gunes', name: 'Güneş', time: '06:30' },
      { id: 'ogle', name: 'Öğle', time: '13:00' },
      { id: 'ikindi', name: 'İkindi', time: '16:30' },
      { id: 'aksam', name: 'Akşam', time: '19:00' },
      { id: 'yatsi', name: 'Yatsı', time: '20:30' },
    ];
    const tomorrowTimes = [...mainTimes];

    // Case 1: Early morning before imsak (03:30)
    const t1 = simulateTimer('03:30', mainTimes, tomorrowTimes);
    assertEqual(t1.activePrayerId, 'yatsi', '03:30 active');
    assertEqual(t1.nextPrayerId, 'imsak', '03:30 next');
    assertEqual(t1.isTomorrow, false, '03:30 not tomorrow');

    // Case 2: Morning prayer window (05:45)
    const t2 = simulateTimer('05:45', mainTimes, tomorrowTimes);
    assertEqual(t2.activePrayerId, 'imsak', '05:45 active');
    assertEqual(t2.nextPrayerId, 'gunes', '05:45 next');

    // Case 3: Midday before noon (10:00)
    const t3 = simulateTimer('10:00', mainTimes, tomorrowTimes);
    assertEqual(t3.activePrayerId, 'gunes', '10:00 active');
    assertEqual(t3.nextPrayerId, 'ogle', '10:00 next');

    // Case 4: Afternoon (14:30)
    const t4 = simulateTimer('14:30', mainTimes, tomorrowTimes);
    assertEqual(t4.activePrayerId, 'ogle', '14:30 active');
    assertEqual(t4.nextPrayerId, 'ikindi', '14:30 next');

    // Case 5: Late afternoon (17:15)
    const t5 = simulateTimer('17:15', mainTimes, tomorrowTimes);
    assertEqual(t5.activePrayerId, 'ikindi', '17:15 active');
    assertEqual(t5.nextPrayerId, 'aksam', '17:15 next');

    // Case 6: Evening (19:45)
    const t6 = simulateTimer('19:45', mainTimes, tomorrowTimes);
    assertEqual(t6.activePrayerId, 'aksam', '19:45 active');
    assertEqual(t6.nextPrayerId, 'yatsi', '19:45 next');

    // Case 7: Night after yatsi (22:00)
    const t7 = simulateTimer('22:00', mainTimes, tomorrowTimes);
    assertEqual(t7.activePrayerId, 'yatsi', '22:00 active');
    assertEqual(t7.nextPrayerId, 'imsak', '22:00 next');
    assertEqual(t7.isTomorrow, true, '22:00 rollover to tomorrow');
  });

  // ----------------------------------------------------
  // SUITE 6: Notification Scheduling Calculations
  // ----------------------------------------------------
  console.log('\n--- SUITE 6: Notification Scheduling Calculations ---');

  await test('Notification Scheduling', 'Offset calculations and trigger times are computed properly', () => {
    const prayerDate = new Date(2026, 8, 12, 13, 0, 0); // 13:00
    const offsetMinutes = 15;
    const triggerDate = new Date(prayerDate.getTime() - offsetMinutes * 60 * 1000);

    assertEqual(triggerDate.getHours(), 12, 'Trigger hour');
    assertEqual(triggerDate.getMinutes(), 45, 'Trigger minute');

    const offset0 = 0;
    const triggerDate0 = new Date(prayerDate.getTime() - offset0 * 60 * 1000);
    assertEqual(triggerDate0.getHours(), 13, 'Trigger hour at prayer time');
    assertEqual(triggerDate0.getMinutes(), 0, 'Trigger minute at prayer time');
  });

  console.log('\n====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`  TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(e => {
  console.error('Test execution error:', e);
  process.exit(1);
});
