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
  Arkayuz?: {
    '@attributes'?: { YaziNo?: string };
    Baslik?: ApiTextField;
    Yazi?: ApiTextField;
  };
}

/**
 * Helper to safely extract string text from API JSON fields
 * which might be strings, empty objects {}, or CDATA structures.
 */
export function extractApiText(field: unknown): string {
  if (!field) return '';
  if (typeof field === 'string') return field.trim();
  if (typeof field === 'number') return String(field);
  if (typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    if (obj['#text'] && typeof obj['#text'] === 'string') return obj['#text'].trim();
    if (obj['#cdata-section'] && typeof obj['#cdata-section'] === 'string') return obj['#cdata-section'].trim();
  }
  return '';
}

/**
 * Helper to fetch data with automatic HTTP fallback if HTTPS fails.
 */
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error: unknown) {
    if (url.startsWith('https://')) {
      const httpUrl = url.replace('https://', 'http://');
      try {
        return await fetch(httpUrl, options);
      } catch {
        throw error;
      }
    }
    throw error;
  }
}

export const turkTakvimApi = {
  /**
   * Fetches the country list
   */
  async getCountries(): Promise<ApiCountry[]> {
    try {
      const response = await safeFetch(`${BASE_URL}?tip=ulke&format=json`);
      const data = await response.json();
      return data.country || [];
    } catch (e) {
      console.error('getCountries error:', e);
      return [];
    }
  },

  /**
   * Fetches states/provinces for a given country (default Turkey ID 200)
   */
  async getStates(countryID: string = '200'): Promise<ApiState[]> {
    try {
      const response = await safeFetch(`${BASE_URL}?tip=eyalet&countryID=${countryID}&format=json`);
      const data = await response.json();
      return data.eyalet || [];
    } catch (e) {
      console.error('getStates error:', e);
      return [];
    }
  },

  /**
   * Fetches cities/districts for a state filter (e.g. ADANA, ISTANBUL)
   */
  async getCities(countryID: string = '200', cityStateFilter: string = 'ISDANBUL'): Promise<ApiCity[]> {
    try {
      const response = await safeFetch(
        `${BASE_URL}?tip=sehir&countryID=${countryID}&cityStateFilter=${encodeURIComponent(cityStateFilter)}&format=json`
      );
      const data = await response.json();
      return data.sehir || [];
    } catch (e) {
      console.error('getCities error:', e);
      return [];
    }
  },

  /**
   * Searches locations by term with optional AbortSignal support
   */
  async searchCities(query: string, limit: number = 10, signal?: AbortSignal): Promise<ApiSearchResult[]> {
    try {
      const response = await safeFetch(
        `${BASE_URL}?tip=arama&SearchName=${encodeURIComponent(query)}&adet=${limit}&sayfa=1&format=json`,
        { signal }
      );
      const data = await response.json();
      let list = data.city || [];
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
   * Fetches full year/period prayer times for a cityID
   */
  async getPrayerTimes(cityID: string = '16741'): Promise<ApiVakitResponse | null> {
    try {
      const response = await safeFetch(`${BASE_URL}?tip=vakit&cityID=${cityID}&format=json`);
      const data = await response.json();
      if (data && data.vakit) {
        return {
          cityinfo: data.cityinfo,
          vakit: Array.isArray(data.vakit) ? data.vakit : [data.vakit],
        };
      }
      return null;
    } catch (e) {
      console.error('getPrayerTimes error:', e);
      return null;
    }
  },

  /**
   * Fetches calendar details (GununOlayi, GununSozu, Arkayuz, etc.) for a date range (YYYY-MM-DD)
   */
  async getCalendarDetail(startDate: string, endDate: string): Promise<ApiTakvimVeri[]> {
    try {
      const response = await safeFetch(
        `${BASE_URL}?tip=takvim&baslangic=${startDate}&bitis=${endDate}&format=json`
      );
      const data = await response.json();
      if (data && data.Veri) {
        return Array.isArray(data.Veri) ? data.Veri : [data.Veri];
      }
      return [];
    } catch (e) {
      console.error('getCalendarDetail error:', e);
      return [];
    }
  },
};
