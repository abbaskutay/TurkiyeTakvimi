import { describe, it } from 'node:test';
import assert from 'node:assert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr, en, ar, translations, SUPPORTED_LANGUAGES, LanguageCode } from '../locales';
import { formatGregorianDate, formatHicriDate } from '../utils/dateUtils';
import { storageService } from '../services/storageService';

// In-memory backing store for AsyncStorage in tests
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

function compareObjectKeys(base: any, target: any, path = ''): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(base)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in target)) {
      missing.push(currentPath);
    } else if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
      missing.push(...compareObjectKeys(base[key], target[key], currentPath));
    }
  }
  return missing;
}

describe('i18n - Dictionary Parity & Integrity', () => {
  it('supported languages includes tr, en, ar with correct metadata', () => {
    assert.strictEqual(SUPPORTED_LANGUAGES.length, 3);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    assert.deepStrictEqual(codes, ['tr', 'en', 'ar']);

    const arabic = SUPPORTED_LANGUAGES.find(l => l.code === 'ar');
    assert.ok(arabic);
    assert.strictEqual(arabic.isRTL, true);

    const turkish = SUPPORTED_LANGUAGES.find(l => l.code === 'tr');
    assert.ok(turkish);
    assert.strictEqual(turkish.isRTL, false);

    const english = SUPPORTED_LANGUAGES.find(l => l.code === 'en');
    assert.ok(english);
    assert.strictEqual(english.isRTL, false);
  });

  it('English dictionary contains all keys present in Turkish dictionary', () => {
    const missing = compareObjectKeys(tr, en);
    assert.deepStrictEqual(missing, [], `Missing English keys: ${missing.join(', ')}`);
  });

  it('Arabic dictionary contains all keys present in Turkish dictionary', () => {
    const missing = compareObjectKeys(tr, ar);
    assert.deepStrictEqual(missing, [], `Missing Arabic keys: ${missing.join(', ')}`);
    assert.strictEqual(ar.tabs.kible, 'قبلة');
    assert.strictEqual(tr.tabs.kible, 'Kıble');
    assert.strictEqual(en.tabs.kible, 'Qibla');
  });

  it('has valid 6 main prayer names in all 3 languages', () => {
    const mainKeys = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
    for (const lang of ['tr', 'en', 'ar'] as LanguageCode[]) {
      const dict = translations[lang].prayers;
      for (const k of mainKeys) {
        assert.ok(dict[k], `Prayer ${k} missing or empty in ${lang}`);
        assert.strictEqual(typeof dict[k], 'string');
      }
    }
    // Verify specific Islamic translations aligned with namazvakti.com
    assert.strictEqual(en.prayers.imsak, 'Fajr');
    assert.strictEqual(en.prayers.gunes, 'Tulu');
    assert.strictEqual(en.prayers.ogle, 'Zuhr');
    assert.strictEqual(ar.prayers.imsak, 'الامساك');
    assert.strictEqual(ar.prayers.sabah, 'الفجر');
    assert.strictEqual(ar.prayers.gunes, 'الطلوع');
    assert.strictEqual(ar.prayers.aksam, 'المغرب');
  });

  it('has all 12 Gregorian months and 12 Hijri months in all 3 languages', () => {
    for (const lang of ['tr', 'en', 'ar'] as LanguageCode[]) {
      const m = translations[lang].months;
      assert.strictEqual(m.gregorian.length, 12, `${lang} gregorian months count`);
      assert.strictEqual(m.weekdays.length, 7, `${lang} weekdays count`);
      assert.strictEqual(Object.keys(m.hijri).length, 12, `${lang} hijri months count`);
    }

    assert.strictEqual(en.months.gregorian[0], 'January');
    assert.strictEqual(ar.months.gregorian[0], 'يناير');
    assert.strictEqual(ar.months.hijri['RAMEZÂN'], 'رمضان');
    assert.strictEqual(en.months.hijri['RAMEZÂN'], 'Ramadan');
  });
});

describe('i18n - Date Formatting Multi-Language', () => {
  it('formats Gregorian dates in Turkish, English, and Arabic', () => {
    const dateStr = '2026-03-20';
    assert.strictEqual(formatGregorianDate(dateStr, 'tr'), '20 Mart 2026');
    assert.strictEqual(formatGregorianDate(dateStr, 'en'), '20 March 2026');
    assert.strictEqual(formatGregorianDate(dateStr, 'ar'), '20 مارس 2026');
  });

  it('formats Hijri dates in Turkish, English, and Arabic', () => {
    const hicriRaw = '1  RAMEZÂN  1447';
    assert.strictEqual(formatHicriDate(hicriRaw, 'tr'), '1 Ramazan 1447');
    assert.strictEqual(formatHicriDate(hicriRaw, 'en'), '1 Ramadan 1447');
    assert.strictEqual(formatHicriDate(hicriRaw, 'ar'), '1 رمضان 1447');
  });

  it('translates pre-formatted Turkish Hijri dates (like in Gunler tab) to English and Arabic', () => {
    assert.strictEqual(formatHicriDate('26 Receb 1447', 'tr'), '26 Receb 1447');
    assert.strictEqual(formatHicriDate('26 Receb 1447', 'en'), '26 Rajab 1447');
    assert.strictEqual(formatHicriDate('26 Receb 1447', 'ar'), '26 رجب 1447');

    assert.strictEqual(formatHicriDate("14 Şa'bân 1447", 'en'), "14 Sha'ban 1447");
    assert.strictEqual(formatHicriDate("14 Şa'bân 1447", 'ar'), '14 شعبان 1447');

    assert.strictEqual(formatHicriDate('10 Zilhicce 1447', 'en'), '10 Dhu al-Hijjah 1447');
    assert.strictEqual(formatHicriDate('10 Zilhicce 1447', 'ar'), '10 ذو الحجة 1447');

    assert.strictEqual(formatHicriDate('1 Şevval 1447', 'en'), '1 Shawwal 1447');
    assert.strictEqual(formatHicriDate('1 Şevval 1447', 'ar'), '1 شوال 1447');
  });
});

describe('i18n - Storage Service Language Preference', () => {
  it('saves and restores language preference correctly', async () => {
    await storageService.setLanguage('en');
    let lang = await storageService.getLanguage();
    assert.strictEqual(lang, 'en');

    await storageService.setLanguage('ar');
    lang = await storageService.getLanguage();
    assert.strictEqual(lang, 'ar');

    await storageService.setLanguage('tr');
    lang = await storageService.getLanguage();
    assert.strictEqual(lang, 'tr');
  });
});
