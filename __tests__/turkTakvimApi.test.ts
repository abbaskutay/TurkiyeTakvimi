import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { turkTakvimApi, extractApiText, isAbortError } from '../services/turkTakvimApi';

const originalFetch = globalThis.fetch;

describe('turkTakvimApi - extractApiText & Entity Decoding', () => {
  it('extracts plain string and number values', () => {
    assert.strictEqual(extractApiText('Metin'), 'Metin');
    assert.strictEqual(extractApiText(2026), '2026');
  });

  it('returns empty string for null, undefined, or empty object', () => {
    assert.strictEqual(extractApiText(null), '');
    assert.strictEqual(extractApiText(undefined), '');
    assert.strictEqual(extractApiText({}), '');
    assert.strictEqual(extractApiText('   '), '');
  });

  it('extracts text from fast-xml-parser #text and #cdata-section structures', () => {
    assert.strictEqual(extractApiText({ '#text': 'XML Text' }), 'XML Text');
    assert.strictEqual(extractApiText({ '#cdata-section': 'CDATA İçeriği' }), 'CDATA İçeriği');
  });

  it('strips HTML tags and preserves paragraph spacing', () => {
    const raw = '<p>Birinci paragraf.</p><br><div>İkinci paragraf <b>vurgulu</b>.</div>';
    const clean = extractApiText(raw);
    assert(!clean.includes('<p>') && !clean.includes('</p>'));
    assert(!clean.includes('<div>') && !clean.includes('<b>'));
    assert(clean.includes('Birinci paragraf.'));
    assert(clean.includes('İkinci paragraf vurgulu.'));
  });

  it('decodes named, decimal, and hex HTML entities', () => {
    const raw = '&quot;Hak geldi&quot; &amp; b&acirc;tıl z&acirc;il oldu. &#39;G&uuml;zel&#39; g&uuml;nler &ouml;mr&uuml;m&uuml;zde.';
    const clean = extractApiText(raw);
    assert.strictEqual(clean, '"Hak geldi" & bâtıl zâil oldu. \'Güzel\' günler ömrümüzde.');
  });
});

describe('turkTakvimApi - Mocked Network Calls & Parsers', () => {
  let mockFetchHandler: ((url: string, options?: RequestInit) => Promise<Response>) | null = null;

  beforeEach(() => {
    mockFetchHandler = null;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (mockFetchHandler) {
        return mockFetchHandler(url, init);
      }
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('getCountries parses country array and handles errors gracefully', async () => {
    mockFetchHandler = async (url) => {
      assert(url.includes('tip=ulke'));
      const body = JSON.stringify({
        country: [
          { ID: '200', countryNameTR: 'TÜRKİYE', countryNameEN: 'TURKEY' },
          { ID: '1', countryNameTR: 'ABD', countryNameEN: 'USA' },
        ],
      });
      return new Response(body, { status: 200 });
    };

    const countries = await turkTakvimApi.getCountries();
    assert.strictEqual(countries.length, 2);
    assert.strictEqual(countries[0].ID, '200');

    // Error case: returns empty array
    mockFetchHandler = async () => {
      throw new Error('Network error');
    };
    const emptyCountries = await turkTakvimApi.getCountries();
    assert.deepStrictEqual(emptyCountries, []);
  });

  it('getStates passes countryID and parses eyalet array', async () => {
    mockFetchHandler = async (url) => {
      assert(url.includes('tip=eyalet') && url.includes('countryID=200'));
      const body = JSON.stringify({
        eyalet: [
          { cityStateTR: 'İstanbul', cityStateFilter: 'ISDANBUL' },
          { cityStateTR: 'Ankara', cityStateFilter: 'ANKARA' },
        ],
      });
      return new Response(body, { status: 200 });
    };

    const states = await turkTakvimApi.getStates('200');
    assert.strictEqual(states.length, 2);
    assert.strictEqual(states[0].cityStateFilter, 'ISDANBUL');
  });

  it('getCities handles countryID and encoded cityStateFilter', async () => {
    mockFetchHandler = async (url) => {
      assert(url.includes('tip=sehir'));
      assert(url.includes('countryID=200'));
      assert(url.includes('cityStateFilter=ISDANBUL'));
      const body = JSON.stringify({
        sehir: [
          { ID: '16741', CityNameTR: 'İstanbul', CityNameEN: 'Istanbul' },
        ],
      });
      return new Response(body, { status: 200 });
    };

    const cities = await turkTakvimApi.getCities('200', 'ISDANBUL');
    assert.strictEqual(cities.length, 1);
    assert.strictEqual(cities[0].CityNameTR, 'İstanbul');
  });

  it('searchCities normalizes single object result into array and respects limit/page', async () => {
    mockFetchHandler = async (url) => {
      assert(url.includes('tip=arama'));
      assert(url.includes('SearchName=Bursa'));
      assert(url.includes('adet=5'));
      assert(url.includes('sayfa=1'));
      // Single object result simulation (not array)
      const body = JSON.stringify({
        city: { ID: '16745', NameTR: 'Bursa', countryName: 'Türkiye' },
      });
      return new Response(body, { status: 200 });
    };

    const results = await turkTakvimApi.searchCities('Bursa', 5, undefined, 1);
    assert(Array.isArray(results), 'Must normalize single item into array');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].NameTR, 'Bursa');
  });

  it('searchCities handles AbortError cleanly and returns empty array', async () => {
    mockFetchHandler = async () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    };

    const results = await turkTakvimApi.searchCities('Istanbul');
    assert.deepStrictEqual(results, []);
  });

  it('searchCities handles Expo/iOS FetchRequestCanceledException cleanly and returns empty array', async () => {
    mockFetchHandler = async () => {
      throw new Error('fetch failed: FetchRequestCanceledException: Fetch request has been canceled (at Expo/NativeResponse.swift:63)');
    };

    const results = await turkTakvimApi.searchCities('Istanbul');
    assert.deepStrictEqual(results, []);
  });

  it('isAbortError accurately detects all forms of cancellation', () => {
    const domAbort = new Error('The user aborted a request.');
    domAbort.name = 'AbortError';
    assert.strictEqual(isAbortError(domAbort), true);

    const expoSwiftError = new Error('fetch failed: FetchRequestCanceledException: Fetch request has been canceled (at Expo/NativeResponse.swift:63)');
    assert.strictEqual(isAbortError(expoSwiftError), true);

    const controller = new AbortController();
    controller.abort();
    assert.strictEqual(isAbortError(new Error('Unknown network error'), controller.signal), true);

    const realNetworkError = new Error('Network request failed');
    assert.strictEqual(isAbortError(realNetworkError), false);
  });

  it('getPrayerTimes unwraps nested cityinfo.vakit structure correctly', async () => {
    mockFetchHandler = async (url) => {
      assert(url.includes('tip=vakit'));
      assert(url.includes('cityID=16741'));
      assert(url.includes('baslangic=2026-09-12'));
      assert(url.includes('bitis=2026-09-13'));

      const body = JSON.stringify({
        cityinfo: {
          '@attributes': { ID: '16741', cityNameTR: 'İstanbul', arzDer: '41', tulDer: '28' },
          vakit: [
            {
              '@attributes': { tarih: '2026-09-12', gun: 'Cumartesi', hicri: '30 SAFER 1448' },
              imsak: '05:12', gunes: '06:42', ogle: '13:08',
              ikindi: '16:42', aksam: '19:18', yatsi: '20:42',
            },
          ],
        },
      });
      return new Response(body, { status: 200 });
    };

    const res = await turkTakvimApi.getPrayerTimes('16741', '2026-09-12', '2026-09-13');
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.cityinfo['@attributes'].cityNameTR, 'İstanbul');
    assert.strictEqual(res!.vakit.length, 1);
    assert.strictEqual(res!.vakit[0].imsak, '05:12');
  });

  it('getLocalTime parses mahalli solar time node', async () => {
    mockFetchHandler = async (url) => {
      assert(url.includes('tip=mahalli'));
      const body = JSON.stringify({
        CityID: {
          '@attributes': { value: '16741' },
          saat: '13:05:42',
          tarih: '2026-09-12',
          timezone: '+03:00',
        },
      });
      return new Response(body, { status: 200 });
    };

    const res = await turkTakvimApi.getLocalTime('16741');
    assert.notStrictEqual(res, null);
    assert.strictEqual(res!.cityID, '16741');
    assert.strictEqual(res!.saat, '13:05:42');
  });

  it('getCalendarDetail parses raw XML with CDATA and OnemliGun elements', async () => {
    mockFetchHandler = async (url) => {
      assert(url.includes('tip=takvim'));
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<Takvim>
  <Veri Tarih="2026-01-15">
    <MiladiTarih>15.01.2026</MiladiTarih>
    <HicriTarih><![CDATA[26  RECEB  1447]]></HicriTarih>
    <GununSozu><![CDATA[Hikmetli bir söz.]]></GununSozu>
    <GununOlayi><![CDATA[Tarihi bir olay.]]></GununOlayi>
    <OnemliGun Turu="Dini" Baslik="Mi'râc Kandili Gecesi" />
  </Veri>
</Takvim>`;
      return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
    };

    const details = await turkTakvimApi.getCalendarDetail('2026-01-15', '2026-01-15');
    assert.strictEqual(details.length, 1);
    assert.strictEqual(extractApiText(details[0].GununSozu), 'Hikmetli bir söz.');
    assert.strictEqual(extractApiText(details[0].HicriTarih), '26 RECEB 1447');
    assert.strictEqual(details[0].OnemliGun?.['@attributes']?.Baslik, "Mi'râc Kandili Gecesi");
  });

  it('safeFetch retries over plain HTTP when HTTPS fails', async () => {
    let callCount = 0;
    mockFetchHandler = async (url) => {
      callCount++;
      if (url.startsWith('https://')) {
        throw new Error('SSL Certificate Error or Handshake Failed');
      }
      return new Response(JSON.stringify({ country: [{ ID: '200' }] }), { status: 200 });
    };

    const countries = await turkTakvimApi.getCountries();
    assert.strictEqual(callCount, 2, 'Should retry over HTTP on HTTPS failure');
    assert.strictEqual(countries.length, 1);
  });
});
