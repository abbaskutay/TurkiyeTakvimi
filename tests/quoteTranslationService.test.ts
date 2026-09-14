import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  quoteTranslationService,
  translateWithFreeEndpoint,
  translateWithGemini,
} from '../services/quoteTranslationService';
import { storageService } from '../services/storageService';

// Mock in-memory AsyncStorage for Node.js test runner
const inMemoryStore = new Map<string, string>();

storageService.getCachedQuoteTranslation = async (dateKey: string, lang: string) => {
  return inMemoryStore.get(`quote_translation_v1_${dateKey}_${lang}`) ?? null;
};

storageService.setCachedQuoteTranslation = async (dateKey: string, lang: string, text: string) => {
  inMemoryStore.set(`quote_translation_v1_${dateKey}_${lang}`, text);
};

storageService.getGeminiApiKey = async () => {
  return inMemoryStore.get('gemini_api_key_v1') ?? null;
};

storageService.setGeminiApiKey = async (key: string) => {
  inMemoryStore.set('gemini_api_key_v1', key);
};

const originalFetch = globalThis.fetch;

describe('quoteTranslationService - Cache & Translation Flow', () => {
  beforeEach(() => {
    inMemoryStore.clear();
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  });

  it('returns original quote immediately for Turkish (tr) without network or cache write', async () => {
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error('Should not be called');
    };

    const quote = 'İlim rütbesi rütbelerin en yücesidir.';
    const result = await quoteTranslationService.getOrTranslateQuote(quote, '2026-09-13', 'tr');

    assert.strictEqual(result, quote);
    assert.strictEqual(fetchCalled, false);
    assert.strictEqual(inMemoryStore.size, 0);
  });

  it('returns empty string if raw quote is empty', async () => {
    const result = await quoteTranslationService.getOrTranslateQuote('', '2026-09-13', 'en');
    assert.strictEqual(result, '');
  });

  it('returns cached translation if available without calling fetch', async () => {
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error('Should not be called when cache exists');
    };

    await storageService.setCachedQuoteTranslation(
      '2026-09-13',
      'en',
      'The rank of knowledge is the highest of ranks.'
    );

    const result = await quoteTranslationService.getOrTranslateQuote(
      'İlim rütbesi rütbelerin en yücesidir.',
      '2026-09-13',
      'en'
    );

    assert.strictEqual(result, 'The rank of knowledge is the highest of ranks.');
    assert.strictEqual(fetchCalled, false);
  });

  it('translates via free keyless endpoint, stores in cache, and returns result', async () => {
    let requestedUrl = '';
    globalThis.fetch = async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      const mockGtxResponse = [
        [
          ['The rank of science is the highest of ranks', 'İlim rütbesi rütbelerin en yücesidir', null, null, 3],
        ],
        null,
        'tr',
      ];
      return {
        ok: true,
        status: 200,
        json: async () => mockGtxResponse,
      } as Response;
    };

    const quote = 'İlim rütbesi rütbelerin en yücesidir.';
    const result = await quoteTranslationService.getOrTranslateQuote(quote, '2026-09-13', 'en');

    assert.strictEqual(result, 'The rank of science is the highest of ranks');
    assert.ok(requestedUrl.includes('client=gtx'));
    assert.ok(requestedUrl.includes('tl=en'));

    // Verify it was written to cache
    const cached = await storageService.getCachedQuoteTranslation('2026-09-13', 'en');
    assert.strictEqual(cached, 'The rank of science is the highest of ranks');
  });

  it('translates via Gemini when API key is provided and writes to cache', async () => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test_gemini_key';

    let requestedUrl = '';
    let requestBody = '';
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = String(input);
      requestBody = String(init?.body || '');
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'ومرتبة العلم أعلى الدرجات' }],
            },
          },
        ],
      };
      return {
        ok: true,
        status: 200,
        json: async () => mockGeminiResponse,
      } as Response;
    };

    const quote = 'İlim rütbesi rütbelerin en yücesidir.';
    const result = await quoteTranslationService.getOrTranslateQuote(quote, '2026-09-13', 'ar');

    assert.strictEqual(result, 'ومرتبة العلم أعلى الدرجات');
    assert.ok(requestedUrl.includes('gemini-2.5-flash:generateContent'));
    assert.ok(requestedUrl.includes('key=test_gemini_key'));
    assert.ok(requestBody.includes('Arabic'));

    // Verify it was written to cache
    const cached = await storageService.getCachedQuoteTranslation('2026-09-13', 'ar');
    assert.strictEqual(cached, 'ومرتبة العلم أعلى الدرجات');
  });

  it('falls back to key-free endpoint if Gemini API returns error', async () => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'invalid_key';

    let geminiAttempted = false;
    let freeAttempted = false;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('gemini')) {
        geminiAttempted = true;
        return {
          ok: false,
          status: 403,
          text: async () => 'API key not valid',
        } as Response;
      }
      if (url.includes('client=gtx')) {
        freeAttempted = true;
        return {
          ok: true,
          status: 200,
          json: async () => [[['Free fallback translation', '...', null, null, 1]]],
        } as Response;
      }
      throw new Error('Unknown URL');
    };

    const result = await quoteTranslationService.getOrTranslateQuote('Deneme söz', '2026-09-13', 'en');

    assert.ok(geminiAttempted);
    assert.ok(freeAttempted);
    assert.strictEqual(result, 'Free fallback translation');
  });

  it('gracefully returns original quote if network fails completely', async () => {
    globalThis.fetch = async () => {
      throw new Error('Network timeout / offline');
    };

    const quote = 'Orijinal hikmetli söz';
    const result = await quoteTranslationService.getOrTranslateQuote(quote, '2026-09-13', 'en');

    assert.strictEqual(result, quote);
  });
});
