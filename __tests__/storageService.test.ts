import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../services/storageService';
import { City, ImportantDay, ReminderConfig } from '../types';
import { ApiVakitResponse, ApiTakvimVeri } from '../services/turkTakvimApi';

// In-memory backing store for AsyncStorage
const inMemoryStore = new Map<string, string>();

(AsyncStorage as any).getItem = async (key: string) => {
  return inMemoryStore.get(key) ?? null;
};

(AsyncStorage as any).setItem = async (key: string, value: string) => {
  inMemoryStore.set(key, value);
};

(AsyncStorage as any).removeItem = async (key: string) => {
  inMemoryStore.delete(key);
};

(AsyncStorage as any).clear = async () => {
  inMemoryStore.clear();
};

describe('storageService - Theme Management', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('returns null when no theme preference is saved', async () => {
    const theme = await storageService.getTheme();
    assert.strictEqual(theme, null);
  });

  it('saves and retrieves dark and light themes', async () => {
    await storageService.setTheme('dark');
    assert.strictEqual(await storageService.getTheme(), 'dark');

    await storageService.setTheme('light');
    assert.strictEqual(await storageService.getTheme(), 'light');
  });

  it('returns null if stored theme is an invalid string', async () => {
    inMemoryStore.set('ezan_theme', 'invalid_theme');
    const theme = await storageService.getTheme();
    assert.strictEqual(theme, null);
  });
});

describe('storageService - Language Preference', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('returns null when no language is saved', async () => {
    const lang = await storageService.getLanguage();
    assert.strictEqual(lang, null);
  });

  it('saves and retrieves language preferences (tr, en, ar)', async () => {
    await storageService.setLanguage('en');
    assert.strictEqual(await storageService.getLanguage(), 'en');

    await storageService.setLanguage('ar');
    assert.strictEqual(await storageService.getLanguage(), 'ar');

    await storageService.setLanguage('tr');
    assert.strictEqual(await storageService.getLanguage(), 'tr');
  });

  it('returns null if stored language is invalid', async () => {
    inMemoryStore.set('ezan_language_v1', 'es');
    assert.strictEqual(await storageService.getLanguage(), null);
  });
});

describe('storageService - Saved Cities', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('returns null when no cities are saved', async () => {
    const cities = await storageService.getCities();
    assert.strictEqual(cities, null);
  });

  it('saves and retrieves city list correctly', async () => {
    const mockCities: City[] = [
      {
        id: 'city_16741',
        cityID: '16741',
        name: 'İstanbul',
        district: 'Fatih',
        city: 'İstanbul',
        country: 'Türkiye',
        isCurrent: true,
      },
      {
        id: 'city_16742',
        cityID: '16742',
        name: 'Ankara',
        district: 'Çankaya',
        city: 'Ankara',
        country: 'Türkiye',
        isCurrent: false,
      },
    ];

    await storageService.setCities(mockCities);
    const retrieved = await storageService.getCities();
    assert.notStrictEqual(retrieved, null);
    assert.strictEqual(retrieved!.length, 2);
    assert.strictEqual(retrieved![0].name, 'İstanbul');
    assert.strictEqual(retrieved![1].cityID, '16742');
  });

  it('handles empty array or invalid json gracefully', async () => {
    inMemoryStore.set('ezan_saved_cities', '[]');
    assert.strictEqual(await storageService.getCities(), null);

    inMemoryStore.set('ezan_saved_cities', '{ "corrupted": true }');
    assert.strictEqual(await storageService.getCities(), null);
  });
});

describe('storageService - Prayer Reminders & Global Toggle', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('persists prayer reminders configuration', async () => {
    const reminders: Record<string, ReminderConfig> = {
      imsak: { enabled: true, offset: 15 },
      ogle: { enabled: true, offset: 0 },
      ikindi: { enabled: false, offset: 5 },
    };

    await storageService.setReminders(reminders);
    const retrieved = await storageService.getReminders();
    assert.notStrictEqual(retrieved, null);
    assert.strictEqual(retrieved!['imsak'].enabled, true);
    assert.strictEqual(retrieved!['imsak'].offset, 15);
    assert.strictEqual(retrieved!['ikindi'].enabled, false);
  });

  it('manages global reminders enabled state with default true', async () => {
    assert.strictEqual(await storageService.getGlobalRemindersEnabled(), true);

    await storageService.setGlobalRemindersEnabled(false);
    assert.strictEqual(await storageService.getGlobalRemindersEnabled(), false);

    await storageService.setGlobalRemindersEnabled(true);
    assert.strictEqual(await storageService.getGlobalRemindersEnabled(), true);
  });
});

describe('storageService - Offline Caching Mechanisms', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('caches and retrieves ApiVakitResponse per cityID', async () => {
    const sampleVakitResponse: ApiVakitResponse = {
      cityinfo: {
        '@attributes': {
          ID: '16741',
          countryID: '200',
          cityNameTR: 'İstanbul',
          cityNameEN: 'Istanbul',
          cityStateTR: 'İstanbul',
          cityStateEN: 'Istanbul',
          arzDer: '41',
          arzDak: '01',
          arzYon: 'N',
          tulDer: '28',
          tulDak: '58',
          tulYon: 'E',
          qiblaangle: '151.66',
          magdeg: '5.6',
        },
      },
      vakit: [
        {
          '@attributes': { tarih: '2026-09-12', gun: 'Cumartesi', hicri: '30 SAFER 1448' },
          imsak: '05:12', sabah: '05:32', gunes: '06:42', israk: '07:35',
          dahve: '12:05', kerahet: '12:45', ogle: '13:08', ikindi: '16:42',
          asrisani: '17:22', isfirar: '18:52', aksam: '19:18', istibak: '20:12',
          yatsi: '20:42', isaisani: '21:02', geceyarisi: '00:15', teheccud: '02:05',
          seher: '04:05', kible: '11:38',
        },
      ],
    };

    await storageService.setCachedVakitResponse('16741', sampleVakitResponse);
    const cached = await storageService.getCachedVakitResponse('16741');
    assert.notStrictEqual(cached, null);
    assert.strictEqual(cached!.cityinfo['@attributes'].cityNameTR, 'İstanbul');
    assert.strictEqual(cached!.vakit.length, 1);
    assert.strictEqual(cached!.vakit[0].imsak, '05:12');

    // Missing city returns null
    assert.strictEqual(await storageService.getCachedVakitResponse('99999'), null);
  });

  it('caches and retrieves single-day calendar detail by YYYY-MM-DD', async () => {
    const calendarDay: ApiTakvimVeri = {
      '@attributes': { Tarih: '2026-09-12' },
      GununSozu: 'İlim rütbesi, rütbelerin en yücesidir.',
      GununOlayi: 'Tarihte bugün...',
    };

    await storageService.setCachedCalendarDay('2026-09-12', calendarDay);
    const cached = await storageService.getCachedCalendarDay('2026-09-12');
    assert.notStrictEqual(cached, null);
    assert.strictEqual(cached!.GununSozu, 'İlim rütbesi, rütbelerin en yücesidir.');

    // Uncached day returns null
    assert.strictEqual(await storageService.getCachedCalendarDay('2026-01-01'), null);
  });

  it('caches and retrieves yearly important religious days list', async () => {
    const days: ImportantDay[] = [
      { id: '2026-01-15', name: "Mi'râc Kandili", dateGregorian: '15 Ocak 2026', dateHijri: '26 Receb 1447' },
      { id: '2026-03-20', name: 'Ramazan Bayramı', dateGregorian: '20 Mart 2026', dateHijri: '1 Şevval 1447' },
    ];

    await storageService.setCachedImportantDays(2026, days);
    const cached = await storageService.getCachedImportantDays(2026);
    assert.notStrictEqual(cached, null);
    assert.strictEqual(cached!.length, 2);
    assert.strictEqual(cached![0].name, "Mi'râc Kandili");
  });

  it('returns null on corrupt JSON cache read without throwing', async () => {
    inMemoryStore.set('vakit_response_v2_16741', 'NOT_A_VALID_JSON{');
    const result = await storageService.getCachedVakitResponse('16741');
    assert.strictEqual(result, null);
  });
});

describe('storageService - Last Synced Year Management', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('returns null when no year has been synced yet', async () => {
    const year = await storageService.getLastSyncedYear();
    assert.strictEqual(year, null);
  });

  it('saves and retrieves last synced year correctly', async () => {
    await storageService.setLastSyncedYear(2027);
    const year = await storageService.getLastSyncedYear();
    assert.strictEqual(year, 2027);
  });
});

describe('storageService - Quote Translation & Gemini Key Management', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  it('saves and retrieves quote translations by date and language', async () => {
    assert.strictEqual(await storageService.getCachedQuoteTranslation('2026-09-13', 'en'), null);

    await storageService.setCachedQuoteTranslation(
      '2026-09-13',
      'en',
      'The rank of knowledge is the highest of ranks.'
    );
    const cachedEn = await storageService.getCachedQuoteTranslation('2026-09-13', 'en');
    assert.strictEqual(cachedEn, 'The rank of knowledge is the highest of ranks.');

    await storageService.setCachedQuoteTranslation(
      '2026-09-13',
      'ar',
      'ومرتبة العلم أعلى الدرجات'
    );
    const cachedAr = await storageService.getCachedQuoteTranslation('2026-09-13', 'ar');
    assert.strictEqual(cachedAr, 'ومرتبة العلم أعلى الدرجات');

    // Different date returns null
    assert.strictEqual(await storageService.getCachedQuoteTranslation('2026-09-14', 'en'), null);
  });

  it('saves and retrieves Gemini API key', async () => {
    assert.strictEqual(await storageService.getGeminiApiKey(), null);
    await storageService.setGeminiApiKey('AIzaSyTestKey123');
    assert.strictEqual(await storageService.getGeminiApiKey(), 'AIzaSyTestKey123');
  });
});

