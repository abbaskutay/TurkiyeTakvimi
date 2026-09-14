import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  containsArabicScript,
  searchCitiesLocalized,
  getDisplayCityName,
} from '../services/citySearchTranslationService';

describe('citySearchTranslationService - containsArabicScript', () => {
  it('detects Arabic-script text', () => {
    assert.strictEqual(containsArabicScript('إسطنبول'), true);
    assert.strictEqual(containsArabicScript('Ankara القدس'), true);
  });

  it('returns false for Latin/Turkish text', () => {
    assert.strictEqual(containsArabicScript('Istanbul'), false);
    assert.strictEqual(containsArabicScript('İstanbul'), false);
    assert.strictEqual(containsArabicScript(''), false);
  });
});

describe('citySearchTranslationService - searchCitiesLocalized', () => {
  const originalFetch = globalThis.fetch;
  let mockFetchHandler: ((url: string) => Promise<Response>) | null = null;

  beforeEach(() => {
    mockFetchHandler = null;
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (mockFetchHandler) {
        return mockFetchHandler(url);
      }
      return new Response('{}', { status: 200 });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('searches non-Arabic queries directly against the API', async () => {
    let requestedUrl = '';
    mockFetchHandler = async (url) => {
      requestedUrl = url;
      const body = JSON.stringify({
        Toplam: { ID: '1' },
        city: { ID: '16741', NameTR: 'İstanbul', NameEN: 'Istanbul', countryName: 'Türkiye' },
      });
      return new Response(body, { status: 200 });
    };

    const results = await searchCitiesLocalized('Istanbul');
    assert(requestedUrl.includes('SearchName=Istanbul'));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].NameTR, 'İstanbul');
  });

  it('resolves a partial Arabic query via the local dictionary without needing a full word', async () => {
    // Only three letters typed ("اسط", the start of "إسطنبول"/Istanbul) — a
    // fragment that machine translation mistranslates to an unrelated word
    // ("Ayarlamak" = "to set"). The dictionary must still resolve correctly.
    const requestedUrls: string[] = [];
    mockFetchHandler = async (url) => {
      requestedUrls.push(url);
      if (url.includes('SearchName=%C4%B0stanbul') || url.includes('SearchName=Istanbul')) {
        const body = JSON.stringify({
          Toplam: { ID: '1' },
          city: { ID: '16741', NameTR: 'İstanbul', NameEN: 'Istanbul', countryName: 'Türkiye' },
        });
        return new Response(body, { status: 200 });
      }
      return new Response(JSON.stringify({ Toplam: { ID: '0' } }), { status: 200 });
    };

    const results = await searchCitiesLocalized('اسط');
    assert(!requestedUrls.some(u => u.includes('translate.googleapis.com')), 'should not call machine translation');
    assert(results.some(r => r.NameTR === 'İstanbul'));
  });

  it('resolves a partial Arabic query for a province that shares its name with an ordinary word', async () => {
    // "Ağrı" (a Turkish province) also means "pain" in Turkish, so a naive
    // word-for-word translation of a full or partial query breaks. The
    // dictionary entry must be used verbatim as the search term instead.
    mockFetchHandler = async (url) => {
      if (url.includes(encodeURIComponent('Ağrı'))) {
        const body = JSON.stringify({
          Toplam: { ID: '1' },
          city: { ID: '12345', NameTR: 'Ağrı', NameEN: 'Agri', countryName: 'Türkiye' },
        });
        return new Response(body, { status: 200 });
      }
      return new Response(JSON.stringify({ Toplam: { ID: '0' } }), { status: 200 });
    };

    const results = await searchCitiesLocalized('أغ');
    assert(results.some(r => r.NameTR === 'Ağrı'));
  });

  it('re-ranks results so the exact/prefix name match comes before unrelated substring matches', async () => {
    mockFetchHandler = async () => {
      const body = JSON.stringify({
        Toplam: { ID: '2' },
        city: [
          { ID: '1', NameTR: 'Alik Rabat', NameEN: 'Alik Rabat', countryName: 'Afganistan' },
          { ID: '2', NameTR: 'Rabat', NameEN: 'Rabat', countryName: 'Fas' },
        ],
      });
      return new Response(body, { status: 200 });
    };

    const results = await searchCitiesLocalized('Rabat');
    assert.strictEqual(results[0].countryName, 'Fas');
  });

  it('falls back to translation when no dictionary entry matches the Arabic query', async () => {
    const requestedUrls: string[] = [];
    mockFetchHandler = async (url) => {
      requestedUrls.push(url);
      if (url.includes('translate.googleapis.com')) {
        return new Response(JSON.stringify([[['Paris', 'باريس', null, null, 11]]]), { status: 200 });
      }
      const body = JSON.stringify({
        Toplam: { ID: '1' },
        city: { ID: '999', NameTR: 'Paris', NameEN: 'Paris', countryName: 'Fransa' },
      });
      return new Response(body, { status: 200 });
    };

    const results = await searchCitiesLocalized('باريس');
    assert(requestedUrls.some(u => u.includes('translate.googleapis.com')));
    assert(results.some(r => r.NameTR === 'Paris'));
  });

  it('returns an empty array when translation fails for a query outside the dictionary', async () => {
    mockFetchHandler = async () => new Response('error', { status: 500 });

    const results = await searchCitiesLocalized('باريس');
    assert.deepStrictEqual(results, []);
  });
});

describe('citySearchTranslationService - getDisplayCityName', () => {
  it('returns the Turkish name unchanged for non-Arabic UI language', () => {
    assert.strictEqual(getDisplayCityName('İstanbul', 'Istanbul', 'tr'), 'İstanbul');
    assert.strictEqual(getDisplayCityName('İstanbul', 'Istanbul', 'en'), 'İstanbul');
  });

  it('returns the Arabic name for a known dictionary city when UI is Arabic', () => {
    assert.strictEqual(getDisplayCityName('İstanbul', 'Istanbul', 'ar'), 'إسطنبول');
    assert.strictEqual(getDisplayCityName('Ankara', 'Ankara', 'ar'), 'أنقرة');
  });

  it('matches names with extra parenthetical suffixes returned by the API', () => {
    assert.strictEqual(getDisplayCityName('Kudüs (Al Quds)', 'Al-Quds (Jerusalem)', 'ar'), 'القدس');
  });

  it('falls back to the original name for a city outside the dictionary', () => {
    assert.strictEqual(getDisplayCityName('Berlin', 'Berlin', 'ar'), 'Berlin');
  });
});
