import AsyncStorage from '@react-native-async-storage/async-storage';
import { City, ReminderConfig } from '../types';
import { ApiVakitItem } from './turkTakvimApi';

const KEYS = {
  THEME: 'ezan_theme',
  SAVED_CITIES: 'ezan_saved_cities',
  PRAYER_REMINDERS: 'prayer_reminders_v3',
  GLOBAL_REMINDERS_ENABLED: 'global_reminders_enabled',
  VAKIT_CACHE_PREFIX: 'vakit_data_',
} as const;

export interface CachedVakitData {
  timestamp: number;
  data: ApiVakitItem[];
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
   * Prayer Time Data Cache with TTL (default 24h)
   */
  async getCachedVakitData(cityID: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<ApiVakitItem[] | null> {
    try {
      const raw = await AsyncStorage.getItem(`${KEYS.VAKIT_CACHE_PREFIX}${cityID}`);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      // Support legacy array storage or structured CachedVakitData
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.data)) {
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < maxAgeMs) {
          return parsed.data;
        }
      }
      return null;
    } catch (e) {
      console.error('storageService.getCachedVakitData error:', e);
      return null;
    }
  },

  async setCachedVakitData(cityID: string, data: ApiVakitItem[]): Promise<void> {
    try {
      const payload: CachedVakitData = {
        timestamp: Date.now(),
        data,
      };
      await AsyncStorage.setItem(`${KEYS.VAKIT_CACHE_PREFIX}${cityID}`, JSON.stringify(payload));
    } catch (e) {
      console.error('storageService.setCachedVakitData error:', e);
    }
  },
};
