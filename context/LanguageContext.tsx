import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, LanguageOption, translations, Translations } from '../locales';
import { storageService } from '../services/storageService';
import { toLocaleUpper } from '../utils/textUtils';

interface LanguageContextType {
  language: LanguageCode;
  isRTL: boolean;
  translations: Translations;
  supportedLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  getPrayerName: (id: string) => string;
  getPrayerSub: (id: string) => string | undefined;
  formatGregorianDateLocale: (tarih: string) => string;
  formatHicriDateLocale: (hicriRaw: string) => string;
  toUpper: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Traverses an object using dot-notation ("section.subsection.key").
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('tr');

  useEffect(() => {
    const loadLanguage = async () => {
      const saved = await storageService.getLanguage();
      if (saved) {
        setLanguageState(saved);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (newLang: LanguageCode) => {
    setLanguageState(newLang);
    await storageService.setLanguage(newLang);
  }, []);

  const currentTranslations = useMemo(() => {
    return translations[language] || translations.tr;
  }, [language]);

  const isRTL = useMemo(() => {
    return language === 'ar';
  }, [language]);

  const currentLanguageOption = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(currentTranslations, key);
      // Fallback to Turkish if missing in target language
      if (!value && language !== 'tr') {
        value = getNestedValue(translations.tr, key);
      }
      if (!value) {
        return key;
      }
      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
          return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        }, value);
      }
      return value;
    },
    [currentTranslations, language]
  );

  const getPrayerName = useCallback(
    (id: string): string => {
      const prayerDict = currentTranslations.prayers as Record<string, string>;
      if (prayerDict && prayerDict[id]) {
        return prayerDict[id];
      }
      const trDict = translations.tr.prayers as Record<string, string>;
      return trDict[id] || id;
    },
    [currentTranslations]
  );

  const getPrayerSub = useCallback(
    (id: string): string | undefined => {
      const subKey = `${id}_sub`;
      const prayerDict = currentTranslations.prayers as Record<string, string>;
      if (prayerDict && prayerDict[subKey]) {
        return prayerDict[subKey];
      }
      const trDict = translations.tr.prayers as Record<string, string>;
      return trDict[subKey] || undefined;
    },
    [currentTranslations]
  );

  const formatGregorianDateLocale = useCallback(
    (tarih: string): string => {
      if (!tarih) return '';
      const [year, month, day] = tarih.split('-').map(Number);
      if (!month || !day) return tarih;
      const monthNames = currentTranslations.months.gregorian;
      const monthName = monthNames[month - 1] || '';
      return `${day} ${monthName} ${year}`;
    },
    [currentTranslations]
  );

  const formatHicriDateLocale = useCallback(
    (hicriRaw: string): string => {
      if (!hicriRaw) return '';
      const parts = hicriRaw.trim().split(/\s+/);
      const day = parts[0] || '';
      const year = parts[parts.length - 1] || '';
      const monthKey = parts.slice(1, -1).join(' ');
      const hicriDict = currentTranslations.months.hijri;
      const month = hicriDict[monthKey] || monthKey;
      return `${day} ${month} ${year}`.trim();
    },
    [currentTranslations]
  );

  const toUpper = useCallback(
    (text: string): string => {
      return toLocaleUpper(text, language);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      isRTL,
      translations: currentTranslations,
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLanguageOption,
      setLanguage,
      t,
      getPrayerName,
      getPrayerSub,
      formatGregorianDateLocale,
      formatHicriDateLocale,
      toUpper,
    }),
    [
      language,
      isRTL,
      currentTranslations,
      currentLanguageOption,
      setLanguage,
      t,
      getPrayerName,
      getPrayerSub,
      formatGregorianDateLocale,
      formatHicriDateLocale,
      toUpper,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
