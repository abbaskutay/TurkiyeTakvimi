import { tr, Translations } from './tr';
import { en } from './en';
import { ar } from './ar';

export type LanguageCode = 'tr' | 'en' | 'ar';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'tr', label: 'Türkçe', nativeLabel: 'Türkçe', flag: '🇹🇷', isRTL: false },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', isRTL: false },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', isRTL: true },
];

export const translations: Record<LanguageCode, Translations> = {
  tr,
  en,
  ar,
};

export { tr, en, ar, Translations };
