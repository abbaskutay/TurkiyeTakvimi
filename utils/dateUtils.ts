/**
 * Common date and time utilities for TurkiyeTakvimi.
 */
import { translations, LanguageCode } from '../locales';

const GREGORIAN_MONTHS_TR: string[] = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/** Maps the API's uppercase Hijri month tokens to their conventional Turkish display form. */
const HICRI_MONTH_DISPLAY: Record<string, string> = {
  'MUHARREM': 'Muharrem',
  'SAFER': 'Safer',
  "REBÎ'UL-EVVEL": 'Rebiülevvel',
  "REBÎ'UL-ÂHIR": 'Rebiülâhir',
  'CEMÂZİL-EVVEL': 'Cemaziyelevvel',
  'CEMÂZİL-ÂHIR': 'Cemaziyelâhir',
  'RECEB': 'Receb',
  "ŞA'BÂN": "Şa'bân",
  'RAMEZÂN': 'Ramazan',
  'ŞEVVÂL': 'Şevval',
  "ZİL-KA'DE": 'Zilkade',
  "ZİL-HİCCE": 'Zilhicce',
};

const HIJRI_NAME_TO_CANONICAL: Record<string, string> = {
  // Canonical keys
  'muharrem': 'MUHARREM',
  'safer': 'SAFER',
  "rebî'ul-evvel": "REBÎ'UL-EVVEL",
  "rebî'ul-âhir": "REBÎ'UL-ÂHIR",
  'cemâzil-evvel': 'CEMÂZİL-EVVEL',
  'cemâzil-âhir': 'CEMÂZİL-ÂHIR',
  'receb': 'RECEB',
  "şa'bân": "ŞA'BÂN",
  'ramezân': 'RAMEZÂN',
  'şevvâl': 'ŞEVVÂL',
  "zîl-ka'de": "ZİL-KA'DE",
  "zîl-hicce": "ZİL-HİCCE",
  // Turkish display and variants
  'rebiülevvel': "REBÎ'UL-EVVEL",
  'rebiulevvel': "REBÎ'UL-EVVEL",
  'rebîülevvel': "REBÎ'UL-EVVEL",
  'rebiülahir': "REBÎ'UL-ÂHIR",
  'rebiülâhir': "REBÎ'UL-ÂHIR",
  'rebiulahir': "REBÎ'UL-ÂHIR",
  'cemaziyelevvel': 'CEMÂZİL-EVVEL',
  'cemaziyelahir': 'CEMÂZİL-ÂHIR',
  'cemaziyelâhir': 'CEMÂZİL-ÂHIR',
  'recep': 'RECEB',
  'şaban': "ŞA'BÂN",
  'ramazan': 'RAMEZÂN',
  'şevval': 'ŞEVVÂL',
  'zilkade': "ZİL-KA'DE",
  'zilhicce': "ZİL-HİCCE",
  // English names
  'muharram': 'MUHARREM',
  'safar': 'SAFER',
  'rabi al-awwal': "REBÎ'UL-EVVEL",
  "rabi' al-awwal": "REBÎ'UL-EVVEL",
  'rabi al-thani': "REBÎ'UL-ÂHIR",
  'rabi’al-âkhir': "REBÎ'UL-ÂHIR",
  'rabi al-akhir': "REBÎ'UL-ÂHIR",
  'jumada al-awwal': 'CEMÂZİL-EVVEL',
  'jumada al-thani': 'CEMÂZİL-ÂHIR',
  'rajab': 'RECEB',
  "sha'ban": "ŞA'BÂN",
  'shaban': "ŞA'BÂN",
  'shawwal': 'ŞEVVÂL',
  "dhu al-qi'dah": "ZİL-KA'DE",
  'dhu al-qidah': "ZİL-KA'DE",
  'dhu al-hijjah': "ZİL-HİCCE",
  // Arabic names
  'محرم': 'MUHARREM',
  'صفر': 'SAFER',
  'ربيع الأول': "REBÎ'UL-EVVEL",
  'ربيع الاول': "REBÎ'UL-EVVEL",
  'ربيع الثاني': "REBÎ'UL-ÂHIR",
  'ربيع الآخر': "REBÎ'UL-ÂHIR",
  'ربيع الاخر': "REBÎ'UL-ÂHIR",
  'جمادى الأولى': 'CEMÂZİL-EVVEL',
  'جمادى الاولى': 'CEMÂZİL-EVVEL',
  'جمادى الآخرة': 'CEMÂZİL-ÂHIR',
  'جمادى الاخره': 'CEMÂZİL-ÂHIR',
  'رجب': 'RECEB',
  'شعبان': "ŞA'BÂN",
  'رمضان': 'RAMEZÂN',
  'شوال': 'ŞEVVÂL',
  'ذو القعدة': "ZİL-KA'DE",
  'ذو الحجة': "ZİL-HİCCE",
};

export function normalizeHicriMonthKey(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (HICRI_MONTH_DISPLAY[trimmed]) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (HIJRI_NAME_TO_CANONICAL[lower]) {
    return HIJRI_NAME_TO_CANONICAL[lower];
  }
  const clean = lower
    .replace(/['’`^îâû]/g, m => {
      if (m === 'î') return 'i';
      if (m === 'â') return 'a';
      if (m === 'û') return 'u';
      return '';
    })
    .trim();

  for (const [name, canonical] of Object.entries(HIJRI_NAME_TO_CANONICAL)) {
    const cleanName = name
      .replace(/['’`^îâû]/g, m => {
        if (m === 'î') return 'i';
        if (m === 'â') return 'a';
        if (m === 'û') return 'u';
        return '';
      })
      .trim();
    if (cleanName === clean) {
      return canonical;
    }
  }
  return trimmed;
}

/**
 * Returns a local date string in YYYY-MM-DD format using local time components.
 */
export function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a "HH:MM" time string into total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formats an API date (YYYY-MM-DD) as a Gregorian date string in the chosen language.
 *
 * @param tarih date in YYYY-MM-DD form
 * @param lang language code ('tr' | 'en' | 'ar', defaults to 'tr')
 * @returns e.g. "15 Ocak 2026" or "15 January 2026"
 */
export function formatGregorianDate(tarih: string, lang: LanguageCode = 'tr'): string {
  const [year, month, day] = tarih.split('-').map(Number);
  const monthNames = (translations[lang] || translations.tr).months.gregorian;
  const monthName = monthNames[month - 1] || GREGORIAN_MONTHS_TR[month - 1] || '';
  return `${day} ${monthName} ${year}`;
}

/**
 * Splits a raw HicriTarih string (e.g. "26  RECEB  1447" or "26 Receb 1447") into its day/month/year parts.
 *
 * @param hicriRaw raw HicriTarih value from the API or formatted string
 * @param lang language code ('tr' | 'en' | 'ar', defaults to 'tr')
 * @returns day, display-cased month, and year as strings
 */
export function parseHicriParts(
  hicriRaw: string,
  lang: LanguageCode = 'tr'
): { day: string; month: string; year: string } {
  const parts = hicriRaw.trim().split(/\s+/);
  const day = parts[0] || '';
  const year = parts[parts.length - 1] || '';
  const rawMonthKey = parts.slice(1, -1).join(' ');
  const canonicalKey = normalizeHicriMonthKey(rawMonthKey);

  const dict = (translations[lang] || translations.tr).months.hijri;
  let month = dict[canonicalKey] || dict[rawMonthKey];
  if (!month) {
    if (lang === 'tr') {
      month = HICRI_MONTH_DISPLAY[canonicalKey] || rawMonthKey;
    } else {
      month = HICRI_MONTH_DISPLAY[canonicalKey] || rawMonthKey;
    }
  }
  return { day, month, year };
}

/**
 * Formats a raw HicriTarih string as a display string in the chosen language.
 *
 * @param hicriRaw raw HicriTarih value from the API
 * @param lang language code ('tr' | 'en' | 'ar', defaults to 'tr')
 * @returns e.g. "26 Receb 1447"
 */
export function formatHicriDate(hicriRaw: string, lang: LanguageCode = 'tr'): string {
  const { day, month, year } = parseHicriParts(hicriRaw, lang);
  return `${day} ${month} ${year}`.trim();
}

/**
 * Extracts the Hijri year from a raw HicriTarih string.
 *
 * @param hicriRaw raw HicriTarih value from the API
 * @returns the Hijri year, or 0 if it could not be parsed
 */
export function parseHicriYear(hicriRaw: string): number {
  return parseInt(parseHicriParts(hicriRaw).year, 10) || 0;
}
