import { XMLParser } from 'fast-xml-parser';

const BASE_URL = 'https://www.turktakvim.com/XMLservis.php';

export interface ApiCountry {
  ID: string;
  countryNameEN: string;
  countryNameTR: string;
}

export interface ApiState {
  cityStateTR: string;
  cityStateFilter: string;
}

export interface ApiCity {
  ID: string;
  CityNameEN: string;
  CityNameTR: string;
}

export interface ApiSearchResult {
  ID: string;
  NameTR: string;
  NameEN: string;
  cityStateTR: string;
  countryID: string;
  countryName: string;
  timezone?: string;
}

export interface ApiCityInfo {
  ID: string;
  countryID: string;
  cityNameTR: string;
  cityNameEN: string;
  cityStateTR: string;
  cityStateEN: string;
  arzDer: string;
  arzDak: string;
  arzYon: string;
  tulDer: string;
  tulDak: string;
  tulYon: string;
  qiblaangle: string;
  magdeg: string;
}

export interface ApiVakitItem {
  '@attributes': {
    tarih: string; // e.g. "2026-01-01"
    gun: string;
    hicri: string; // e.g. "12 RECEB 1447"
  };
  imsak: string;
  sabah: string;
  gunes: string;
  israk: string;
  dahve: string;
  kerahet: string;
  ogle: string;
  ikindi: string;
  asrisani: string;
  isfirar: string;
  aksam: string;
  istibak: string;
  yatsi: string;
  isaisani: string;
  geceyarisi: string;
  teheccud: string;
  seher: string;
  kible: string;
}

export interface ApiVakitResponse {
  cityinfo: {
    '@attributes': ApiCityInfo;
  };
  vakit: ApiVakitItem[];
}

export interface ApiLocalTime {
  cityID: string;
  tarih: string;
  saat: string;
  timezone: string;
}

export type ApiTextField = string | number | { '#text'?: string; '#cdata-section'?: string } | null | undefined;

export interface ApiTakvimVeri {
  '@attributes'?: {
    Tarih?: string;
  };
  MiladiTarih?: ApiTextField;
  HicriTarih?: ApiTextField;
  GununSozu?: ApiTextField;
  GununOlayi?: ApiTextField;
  IsimYemek?: ApiTextField;
  /** Present only on religious/notable days (Kandil, Bayram, Hicri Yılbaşı, etc.). */
  OnemliGun?: {
    '@attributes'?: { Turu?: string; Baslik?: string };
  };
  Arkayuz?: {
    '@attributes'?: { YaziNo?: string };
    Baslik?: ApiTextField;
    Yazi?: ApiTextField;
  };
}

/** Common named HTML entities the service embeds inside CDATA (XML entity parsing doesn't apply there). */
const HTML_NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ouml: 'ö', Ouml: 'Ö', uuml: 'ü', Uuml: 'Ü', auml: 'ä', Auml: 'Ä',
  ccedil: 'ç', Ccedil: 'Ç', scedil: 'ş', Scedil: 'Ş',
  acirc: 'â', Acirc: 'Â', icirc: 'î', Icirc: 'Î', ecirc: 'ê', Ecirc: 'Ê',
  ocirc: 'ô', Ocirc: 'Ô', ucirc: 'û', Ucirc: 'Û',
  eacute: 'é', egrave: 'è', ntilde: 'ñ', szlig: 'ß',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  hellip: '…', mdash: '—', ndash: '–', deg: '°', copy: '©', reg: '®', trade: '™', euro: '€',
};

/** Decodes numeric (&#39; / &#x27;) and common named HTML entities. */
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1] === 'x' || entity[1] === 'X'
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return HTML_NAMED_ENTITIES[entity] ?? match;
  });
}

/** Strips HTML markup the service sometimes embeds in CDATA text fields, keeping paragraph breaks. */
function stripHtml(text: string): string {
  return text
    .replace(/<(p|br|div|li)[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Safely extracts readable text from API fields which might be strings, empty
 * objects {}, or CDATA structures, cleaning up any embedded HTML/entities.
 *
 * @param field raw field value from the parsed API response
 * @returns trimmed, decoded, tag-free text, or an empty string if none is present
 */
export function extractApiText(field: unknown): string {
  let raw = '';
  if (!field) return '';
  if (typeof field === 'string') raw = field;
  else if (typeof field === 'number') raw = String(field);
  else if (typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    if (obj['#text'] && typeof obj['#text'] === 'string') raw = obj['#text'];
    else if (obj['#cdata-section'] && typeof obj['#cdata-section'] === 'string') raw = obj['#cdata-section'];
  }
  if (!raw.trim()) return '';
  return decodeHtmlEntities(stripHtml(raw));
}

/**
 * Fetches a URL, retrying over plain HTTP if the HTTPS request fails.
 *
 * @param url request URL
 * @param options standard fetch options
 * @returns the resolved Response
 */
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.warn(`safeFetch: non-OK response ${response.status} ${response.statusText} for ${url}`);
    }
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.warn(`safeFetch: https request failed for ${url}:`, error);
    if (url.startsWith('https://')) {
      const httpUrl = url.replace('https://', 'http://');
      try {
        return await fetch(httpUrl, options);
      } catch (httpError) {
        console.warn(`safeFetch: http fallback also failed for ${httpUrl}:`, httpError);
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Parses a Response body as JSON, tolerating empty bodies
 * (some tip= scenarios, e.g. hicri2, can respond with nothing).
 *
 * @param response Response to read and parse
 * @returns parsed JSON value, or null if the body was empty/invalid
 */
async function safeJson<T = any>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn(
      `safeJson: failed to parse response from ${response.url} (status ${response.status}). First 200 chars:`,
      text.slice(0, 200)
    );
    return null;
  }
}

/**
 * The service's own &format=json conversion drops every CDATA-wrapped field
 * (used by tip=takvim) into an empty object, so those endpoints are parsed
 * from the raw XML instead. htmlEntities decodes the numeric character
 * references (e.g. &#xE2;) the service emits inside CDATA and attributes.
 */
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributesGroupName: '@attributes',
  attributeNamePrefix: '',
  htmlEntities: true,
});

/**
 * Parses a Response body as XML, tolerating empty bodies.
 *
 * @param response Response to read and parse
 * @returns parsed XML value, or null if the body was empty/invalid
 */
async function safeXml<T = any>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return xmlParser.parse(text) as T;
  } catch {
    return null;
  }
}

export const turkTakvimApi = {
  /**
   * Fetches the list of countries supported by the service.
   *
   * @returns list of countries, or an empty list on failure
   */
  async getCountries(): Promise<ApiCountry[]> {
    try {
      const response = await safeFetch(`${BASE_URL}?tip=ulke&format=json`);
      const data = await safeJson(response);
      return data?.country || [];
    } catch (e) {
      console.error('getCountries error:', e);
      return [];
    }
  },

  /**
   * Fetches the states/provinces of a country.
   *
   * @param countryID country ID (default Turkey, 200)
   * @returns list of states, or an empty list on failure
   */
  async getStates(countryID: string = '200'): Promise<ApiState[]> {
    try {
      const response = await safeFetch(`${BASE_URL}?tip=eyalet&countryID=${countryID}&format=json`);
      const data = await safeJson(response);
      return data?.eyalet || [];
    } catch (e) {
      console.error('getStates error:', e);
      return [];
    }
  },

  /**
   * Fetches cities/districts for a country, optionally filtered by state/province.
   *
   * @param countryID country ID (default Turkey, 200)
   * @param cityStateFilter state/province name filter (e.g. ADANA); omit for every settlement in the country
   * @returns list of cities, or an empty list on failure
   */
  async getCities(countryID: string = '200', cityStateFilter?: string): Promise<ApiCity[]> {
    try {
      const filterParam = cityStateFilter
        ? `&cityStateFilter=${encodeURIComponent(cityStateFilter)}`
        : '';
      const response = await safeFetch(
        `${BASE_URL}?tip=sehir&countryID=${countryID}${filterParam}&format=json`
      );
      const data = await safeJson(response);
      return data?.sehir || [];
    } catch (e) {
      console.error('getCities error:', e);
      return [];
    }
  },

  /**
   * Searches locations by name.
   *
   * @param query search term
   * @param limit max results per page; pass null to omit from the request
   * @param signal optional AbortSignal to cancel the request
   * @param page page number; pass null to omit from the request
   * @returns list of matching locations, or an empty list on failure/abort
   */
  async searchCities(
    query: string,
    limit: number | null = 10,
    signal?: AbortSignal,
    page: number | null = 1
  ): Promise<ApiSearchResult[]> {
    try {
      const adetParam = limit != null ? `&adet=${limit}` : '';
      const sayfaParam = page != null ? `&sayfa=${page}` : '';
      const response = await safeFetch(
        `${BASE_URL}?tip=arama&SearchName=${encodeURIComponent(query)}${adetParam}${sayfaParam}&format=json`,
        { signal }
      );
      const data = await safeJson(response);
      let list = data?.city || [];
      if (!Array.isArray(list)) {
        list = [list];
      }
      return list;
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        return [];
      }
      console.error('searchCities error:', e);
      return [];
    }
  },

  /**
   * Fetches prayer times for a city.
   *
   * @param cityID city ID; pass null to omit it and let the service use its default city
   * @param startDate range start date (YYYY-MM-DD); omit with endDate for the full year
   * @param endDate range end date (YYYY-MM-DD); omit with startDate for the full year
   * @returns city info and prayer time list, or null on failure
   */
  async getPrayerTimes(
    cityID: string | null = '16741',
    startDate?: string,
    endDate?: string
  ): Promise<ApiVakitResponse | null> {
    try {
      const cityParam = cityID != null ? `&cityID=${cityID}` : '';
      const rangeParam = startDate && endDate ? `&baslangic=${startDate}&bitis=${endDate}` : '';
      const url = `${BASE_URL}?tip=vakit${cityParam}${rangeParam}&format=json`;
      const response = await safeFetch(url);
      const data = await safeJson(response);
      // The service nests vakit inside cityinfo (cityinfo.vakit), not as a sibling of it.
      const vakitRaw = data?.cityinfo?.vakit;
      if (data?.cityinfo && vakitRaw) {
        return {
          cityinfo: { '@attributes': data.cityinfo['@attributes'] },
          vakit: Array.isArray(vakitRaw) ? vakitRaw : [vakitRaw],
        };
      }
      console.warn(`getPrayerTimes: response for ${url} had no cityinfo.vakit field. Parsed data:`, data);
      return null;
    } catch (e) {
      console.error('getPrayerTimes error:', e);
      return null;
    }
  },

  /**
   * Fetches the mahalli (local solar) time info for a city.
   *
   * @param cityID city ID (default Istanbul, 16741)
   * @returns local time info, or null on failure
   */
  async getLocalTime(cityID: string = '16741'): Promise<ApiLocalTime | null> {
    try {
      const response = await safeFetch(`${BASE_URL}?tip=mahalli&cityID=${cityID}&format=json`);
      const data = await safeJson(response);
      const node = data?.CityID;
      if (!node) return null;
      return {
        cityID: node['@attributes']?.value ?? cityID,
        tarih: node.tarih,
        saat: node.saat,
        timezone: node.timezone,
      };
    } catch (e) {
      console.error('getLocalTime error:', e);
      return null;
    }
  },

  /**
   * Fetches calendar details (GununOlayi, GununSozu, Arkayuz, OnemliGun, etc.).
   * OnemliGun is only present on religious/notable days (Kandil, Bayram, etc.).
   *
   * @param startDate range start date (YYYY-MM-DD); omit with endDate for the full year (heavy, cache when possible)
   * @param endDate range end date (YYYY-MM-DD); omit with startDate for the full year
   * @returns list of calendar day entries, or an empty list on failure
   */
  async getCalendarDetail(startDate?: string, endDate?: string): Promise<ApiTakvimVeri[]> {
    try {
      const rangeParam = startDate && endDate ? `&baslangic=${startDate}&bitis=${endDate}` : '';
      // No &format=json here: this endpoint's CDATA fields come back empty in JSON mode.
      const response = await safeFetch(`${BASE_URL}?tip=takvim${rangeParam}`);
      const data = await safeXml<{ Takvim?: { Veri?: ApiTakvimVeri | ApiTakvimVeri[] } }>(response);
      const veri = data?.Takvim?.Veri;
      if (!veri) return [];
      return Array.isArray(veri) ? veri : [veri];
    } catch (e) {
      console.error('getCalendarDetail error:', e);
      return [];
    }
  },

  /**
   * Fetches the yearly Hijri date conversion table (tip=hicri2).
   * Note: the upstream service has been observed to return an empty body for this endpoint.
   *
   * @returns parsed response, or null if empty/failed
   */
  async getHicriYearInfo(): Promise<unknown | null> {
    try {
      const response = await safeFetch(`${BASE_URL}?tip=hicri2&format=json`);
      return await safeJson(response);
    } catch (e) {
      console.error('getHicriYearInfo error:', e);
      return null;
    }
  },
};
