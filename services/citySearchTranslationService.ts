import { turkTakvimApi, ApiSearchResult, isAbortError } from './turkishCalendarApi';
import { CITY_NAME_DICTIONARY, CityDictionaryEntry } from '../data/cityNameDictionary';

/**
 * Bridges the language gap between Arabic-speaking users and
 * turkTakvimApi.searchCities, which only understands Latin-script
 * Turkish/English city names (NameTR / NameEN) and has no Arabic field at
 * all — Arabic input returns unrelated results. This module:
 *  1. Matches partial Arabic input against a local TR/AR dictionary
 *     (data/cityNameDictionary.ts) so search-as-you-type works instantly
 *     and correctly, without depending on machine translation of
 *     incomplete words (which mistranslates short fragments, e.g. the
 *     Arabic prefix of "Ağrı" translates to "pain").
 *  2. Falls back to live translation (ar -> tr) for names outside the
 *     dictionary.
 *  3. Re-ranks raw API results so exact/near-exact name matches surface
 *     first — the service's own relevance ranking is unreliable and often
 *     buries the correct city behind unrelated ones sharing a substring.
 *  4. Resolves a known city's Arabic display name for the current UI
 *     language.
 */

const ARABIC_SCRIPT_RANGE = /[؀-ۿ]/;

const translationCache = new Map<string, string>();

/**
 * Whether the given text contains Arabic-script characters.
 */
export function containsArabicScript(text: string): boolean {
  return ARABIC_SCRIPT_RANGE.test(text);
}

/**
 * Normalizes Arabic text for loose matching: strips diacritics/tashkeel,
 * unifies alef/yeh/teh-marbuta letter variants, and removes whitespace and
 * punctuation so differently-typed spellings of the same name still match.
 */
function normalizeArabic(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

/**
 * Normalizes Latin/Turkish text for loose matching: strips accents and
 * punctuation/whitespace so "Istanbul" and "İstanbul (...)" compare equal.
 */
function normalizeLatin(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

const DICTIONARY_BY_NORMALIZED_AR: { normalizedAr: string; entry: CityDictionaryEntry }[] =
  CITY_NAME_DICTIONARY.map(entry => ({ normalizedAr: normalizeArabic(entry.ar), entry }));

const DICTIONARY_BY_NORMALIZED_TR: { normalizedTr: string; entry: CityDictionaryEntry }[] =
  CITY_NAME_DICTIONARY.map(entry => ({ normalizedTr: normalizeLatin(entry.tr), entry }));

/**
 * Finds dictionary entries whose Arabic name matches the given (already
 * Arabic-normalized) query, preferring names that start with the query and
 * falling back to a looser "contains" match. Results are capped and sorted
 * by name length so the closest/most specific matches come first.
 *
 * @param normalizedQuery output of normalizeArabic() for the user's query
 * @param limit maximum number of candidate entries to return
 */
function findDictionaryCandidates(normalizedQuery: string, limit: number = 5): CityDictionaryEntry[] {
  if (!normalizedQuery) return [];

  const startsWith = DICTIONARY_BY_NORMALIZED_AR.filter(({ normalizedAr }) =>
    normalizedAr.startsWith(normalizedQuery)
  );
  const pool = startsWith.length > 0
    ? startsWith
    : DICTIONARY_BY_NORMALIZED_AR.filter(({ normalizedAr }) => normalizedAr.includes(normalizedQuery));

  return pool
    .sort((a, b) => a.normalizedAr.length - b.normalizedAr.length)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

/**
 * Translates Arabic text to Turkish via the key-free Google Translate web
 * endpoint. Used as a fallback for names outside the local dictionary.
 */
async function translateArabicToTurkish(text: string): Promise<string> {
  const cached = translationCache.get(text);
  if (cached) return cached;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=tr&dt=t&q=${encodeURIComponent(
    text
  )}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`City search translation failed with status: ${response.status}`);
  }

  const json = await response.json();
  const translated: string =
    Array.isArray(json) && Array.isArray(json[0])
      ? json[0]
          .map((item: unknown) => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ''))
          .join('')
          .trim()
      : '';

  if (!translated) {
    throw new Error('Empty translation result');
  }

  translationCache.set(text, translated);
  return translated;
}

/**
 * Re-ranks raw search results so entries whose NameTR/NameEN starts with
 * the search term come first, preserving the API's original relative order
 * within each group. The upstream service doesn't rank by relevance, so an
 * exact-ish match for e.g. "Rabat" or "Halep" can otherwise be buried among
 * dozens of unrelated results sharing a substring.
 */
function rankExactMatchesFirst(results: ApiSearchResult[], term: string): ApiSearchResult[] {
  const normalizedTerm = normalizeLatin(term);
  if (!normalizedTerm) return results;

  // Three tiers, most relevant first. A plain startsWith check alone isn't
  // enough: e.g. searching "Bursa" also prefix-matches "Bur Safajah", and
  // "Şam" (normalized "sam") prefix-matches "Samad Khan Kelay" — both would
  // otherwise outrank the real city if they happen to appear earlier in the
  // API's own (non-relevance-sorted) order.
  const exact: ApiSearchResult[] = [];
  const prefix: ApiSearchResult[] = [];
  const rest: ApiSearchResult[] = [];
  for (const result of results) {
    const nameTr = normalizeLatin(result.NameTR || '');
    const nameEn = normalizeLatin(result.NameEN || '');
    if (nameTr === normalizedTerm || nameEn === normalizedTerm) {
      exact.push(result);
    } else if (nameTr.startsWith(normalizedTerm) || nameEn.startsWith(normalizedTerm)) {
      prefix.push(result);
    } else {
      rest.push(result);
    }
  }
  return [...exact, ...prefix, ...rest];
}

/**
 * Resolves one dictionary entry to its authoritative city record by
 * searching the API with its known-good Turkish term and picking the
 * best-ranked (most likely exact) match.
 */
async function resolveDictionaryEntry(
  entry: CityDictionaryEntry,
  signal?: AbortSignal
): Promise<ApiSearchResult[]> {
  // The upstream service doesn't rank by relevance, so a common short term
  // (e.g. "Şam" normalizes to just "sam") can bury the real exact match
  // hundreds of entries deep in its own result order. A generous limit
  // ensures the exact match is actually in the set rankExactMatchesFirst
  // sorts, rather than fetching a small window that may not contain it.
  const results = await turkTakvimApi.searchCities(entry.tr, 1000, signal);
  if (results.length === 0) return [];
  const ranked = rankExactMatchesFirst(results, entry.tr);
  // A name like "Rabat" can be an exact match in more than one country
  // (Morocco's capital, plus unrelated villages elsewhere); surface a
  // handful of exact matches instead of guessing a single "best" one, so
  // the intended city isn't silently dropped in favor of an arbitrary tie.
  const normalizedTerm = normalizeLatin(entry.tr);
  const exactCount = ranked.filter(
    r => normalizeLatin(r.NameTR || '') === normalizedTerm || normalizeLatin(r.NameEN || '') === normalizedTerm
  ).length;
  return ranked.slice(0, Math.max(1, Math.min(exactCount, 3)));
}

/**
 * Searches for cities, transparently handling Arabic-script queries:
 *  - Non-Arabic queries are searched as-is (already supported upstream),
 *    with results re-ranked so the closest name matches come first.
 *  - Arabic queries first try the local dictionary (works from the very
 *    first characters typed, with correct results). If no dictionary entry
 *    matches, the query is translated to Turkish and searched normally.
 *
 * @param query raw search query as typed by the user
 * @param limit maximum results to return
 * @param signal optional AbortSignal to cancel in-flight requests
 */
export async function searchCitiesLocalized(
  query: string,
  limit: number = 12,
  signal?: AbortSignal
): Promise<ApiSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!containsArabicScript(trimmed)) {
    const results = await turkTakvimApi.searchCities(trimmed, limit, signal);
    return rankExactMatchesFirst(results, trimmed);
  }

  const normalizedQuery = normalizeArabic(trimmed);
  const candidates = findDictionaryCandidates(normalizedQuery, limit);

  if (candidates.length > 0) {
    const resolved = await Promise.all(candidates.map(entry => resolveDictionaryEntry(entry, signal)));
    const seenIds = new Set<string>();
    const deduped: ApiSearchResult[] = [];
    for (const matches of resolved) {
      for (const result of matches) {
        if (result.ID && seenIds.has(result.ID)) continue;
        if (result.ID) seenIds.add(result.ID);
        deduped.push(result);
      }
    }
    return deduped.slice(0, limit);
  }

  try {
    const translated = await translateArabicToTurkish(trimmed);
    if (signal?.aborted) return [];
    const results = await turkTakvimApi.searchCities(translated, limit, signal);
    return rankExactMatchesFirst(results, translated);
  } catch (error) {
    if (isAbortError(error, signal)) {
      return [];
    }
    console.warn('searchCitiesLocalized: Arabic translation fallback failed:', error);
    return [];
  }
}

/**
 * Resolves the best display name for a city given the app's current UI
 * language. Looks up the dictionary by the city's Turkish/English name and
 * returns the Arabic form when found and the UI is in Arabic; otherwise
 * returns the original (Turkish, falling back to English) name.
 */
export function getDisplayCityName(nameTR: string | undefined, nameEN: string | undefined, language: string): string {
  const fallback = nameTR || nameEN || '';
  if (language !== 'ar') {
    return fallback;
  }

  const normalizedTr = nameTR ? normalizeLatin(nameTR) : '';
  const normalizedEn = nameEN ? normalizeLatin(nameEN) : '';

  const match = DICTIONARY_BY_NORMALIZED_TR.find(
    ({ normalizedTr: entryTr }) =>
      (normalizedTr && (entryTr === normalizedTr || normalizedTr.startsWith(entryTr))) ||
      (normalizedEn && (entryTr === normalizedEn || normalizedEn.startsWith(entryTr)))
  );

  return match ? match.entry.ar : fallback;
}

export const citySearchTranslationService = {
  containsArabicScript,
  searchCitiesLocalized,
  getDisplayCityName,
};
