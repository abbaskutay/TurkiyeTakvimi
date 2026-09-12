import AsyncStorage from '@react-native-async-storage/async-storage';
import { City, ImportantDay, ReminderConfig } from '../types';
import { ApiTakvimVeri, ApiVakitResponse } from './turkTakvimApi';

const KEYS = {
  THEME: 'ezan_theme',
  SAVED_CITIES: 'ezan_saved_cities',
  PRAYER_REMINDERS: 'prayer_reminders_v3',
  GLOBAL_REMINDERS_ENABLED: 'global_reminders_enabled',
  COMPASS_OFFSET: 'compass_offset_v1',
  VAKIT_CACHE_PREFIX: 'vakit_response_v2_',
  CALENDAR_DAY_CACHE_PREFIX: 'calendar_day_v2_',
  IMPORTANT_DAYS_CACHE_PREFIX: 'important_days_v2_',
  LAST_SYNCED_YEAR: 'ezan_last_synced_year',
} as const;

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

/**
 * Reads a cached, timestamped entry, ignoring age — offline callers should
 * decide for themselves whether stale data is still worth showing.
 *
 * @param key full AsyncStorage key
 * @returns the cached entry, or null if missing/corrupt
 */
async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'number' && 'data' in parsed) {
      return parsed as CacheEntry<T>;
    }
    return null;
  } catch (e) {
    console.error(`storageService cache read error (${key}):`, e);
    return null;
  }
}

/**
 * Writes a timestamped cache entry.
 *
 * @param key full AsyncStorage key
 * @param data value to cache
 */
async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { timestamp: Date.now(), data };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.error(`storageService cache write error (${key}):`, e);
  }
}

export const storageService = {
  /**
   * Theme Preference
   */
  async getTheme(): Promise<'dark' | 'light' | null> {
    try {
      const value = await AsyncStorage.getItem(KEYS.THEME);
      if (value === 'dark' || value === 'light') {
        return value;
      }
      return null;
    } catch (e) {
      console.error('storageService.getTheme error:', e);
      return null;
    }
  },

  async setTheme(theme: 'dark' | 'light'): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.THEME, theme);
    } catch (e) {
      console.error('storageService.setTheme error:', e);
    }
  },

  /**
   * Saved Cities
   */
  async getCities(): Promise<City[] | null> {
    try {
      const json = await AsyncStorage.getItem(KEYS.SAVED_CITIES);
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      console.error('storageService.getCities error:', e);
      return null;
    }
  },

  async setCities(cities: City[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SAVED_CITIES, JSON.stringify(cities));
    } catch (e) {
      console.error('storageService.setCities error:', e);
    }
  },

  /**
   * Prayer Reminders Configuration
   */
  async getReminders(): Promise<Record<string, ReminderConfig> | null> {
    try {
      const json = await AsyncStorage.getItem(KEYS.PRAYER_REMINDERS);
      if (json) {
        return JSON.parse(json);
      }
      return null;
    } catch (e) {
      console.error('storageService.getReminders error:', e);
      return null;
    }
  },

  async setReminders(reminders: Record<string, ReminderConfig>): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PRAYER_REMINDERS, JSON.stringify(reminders));
    } catch (e) {
      console.error('storageService.setReminders error:', e);
    }
  },

  /**
   * Global Reminders Toggle State
   */
  async getGlobalRemindersEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEYS.GLOBAL_REMINDERS_ENABLED);
      if (val !== null) {
        return JSON.parse(val);
      }
      return true;
    } catch (e) {
      console.error('storageService.getGlobalRemindersEnabled error:', e);
      return true;
    }
  },

  async setGlobalRemindersEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.GLOBAL_REMINDERS_ENABLED, JSON.stringify(enabled));
    } catch (e) {
      console.error('storageService.setGlobalRemindersEnabled error:', e);
    }
  },

  /**
   * Manual Kıble compass calibration offset (degrees), set via the
   * "Pusula İnce Kalibrasyonu" stepper.
   */
  async getCompassOffset(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(KEYS.COMPASS_OFFSET);
      return val !== null ? JSON.parse(val) : 0;
    } catch (e) {
      console.error('storageService.getCompassOffset error:', e);
      return 0;
    }
  },

  async setCompassOffset(offset: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.COMPASS_OFFSET, JSON.stringify(offset));
    } catch (e) {
      console.error('storageService.setCompassOffset error:', e);
    }
  },

  /**
   * Prayer time + city info cache, per city. Used as the offline fallback when
   * a live fetch fails, so reads ignore age on purpose.
   */
  async getCachedVakitResponse(cityID: string): Promise<ApiVakitResponse | null> {
    const entry = await readCache<ApiVakitResponse>(`${KEYS.VAKIT_CACHE_PREFIX}${cityID}`);
    return entry?.data ?? null;
  },

  async setCachedVakitResponse(cityID: string, data: ApiVakitResponse): Promise<void> {
    await writeCache(`${KEYS.VAKIT_CACHE_PREFIX}${cityID}`, data);
  },

  /**
   * Single-day calendar entry cache (GununSozu, GununOlayi, OnemliGun, etc.), keyed by YYYY-MM-DD.
   */
  async getCachedCalendarDay(dateKey: string): Promise<ApiTakvimVeri | null> {
    const entry = await readCache<ApiTakvimVeri>(`${KEYS.CALENDAR_DAY_CACHE_PREFIX}${dateKey}`);
    return entry?.data ?? null;
  },

  async setCachedCalendarDay(dateKey: string, data: ApiTakvimVeri): Promise<void> {
    await writeCache(`${KEYS.CALENDAR_DAY_CACHE_PREFIX}${dateKey}`, data);
  },

  /**
   * Yearly religious-day list cache (Gunler screen), keyed by Gregorian year.
   */
  async getCachedImportantDays(year: number): Promise<ImportantDay[] | null> {
    const entry = await readCache<ImportantDay[]>(`${KEYS.IMPORTANT_DAYS_CACHE_PREFIX}${year}`);
    return entry?.data ?? null;
  },

  async setCachedImportantDays(year: number, data: ImportantDay[]): Promise<void> {
    await writeCache(`${KEYS.IMPORTANT_DAYS_CACHE_PREFIX}${year}`, data);
  },

  /**
   * Last synchronized calendar year
   */
  async getLastSyncedYear(): Promise<number | null> {
    try {
      const val = await AsyncStorage.getItem(KEYS.LAST_SYNCED_YEAR);
      return val !== null ? parseInt(val, 10) : null;
    } catch (e) {
      console.error('storageService.getLastSyncedYear error:', e);
      return null;
    }
  },

  async setLastSyncedYear(year: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_SYNCED_YEAR, String(year));
    } catch (e) {
      console.error('storageService.setLastSyncedYear error:', e);
    }
  },
};
