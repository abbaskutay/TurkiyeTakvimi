/**
 * Common date and time utilities for TurkiyeTakvimi.
 */

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
  'ZİL-HİCCE': 'Zilhicce',
};

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
 * Formats an API date (YYYY-MM-DD) as a Turkish Gregorian date string.
 *
 * @param tarih date in YYYY-MM-DD form
 * @returns e.g. "15 Ocak 2026"
 */
export function formatGregorianDate(tarih: string): string {
  const [year, month, day] = tarih.split('-').map(Number);
  const monthName = GREGORIAN_MONTHS_TR[month - 1] || '';
  return `${day} ${monthName} ${year}`;
}

/**
 * Splits a raw HicriTarih string (e.g. "26  RECEB  1447") into its day/month/year parts.
 *
 * @param hicriRaw raw HicriTarih value from the API
 * @returns day, display-cased month, and year as strings
 */
export function parseHicriParts(hicriRaw: string): { day: string; month: string; year: string } {
  const parts = hicriRaw.trim().split(/\s+/);
  const day = parts[0] || '';
  const year = parts[parts.length - 1] || '';
  const monthKey = parts.slice(1, -1).join(' ');
  const month = HICRI_MONTH_DISPLAY[monthKey] || monthKey;
  return { day, month, year };
}

/**
 * Formats a raw HicriTarih string as a Turkish display string.
 *
 * @param hicriRaw raw HicriTarih value from the API
 * @returns e.g. "26 Receb 1447"
 */
export function formatHicriDate(hicriRaw: string): string {
  const { day, month, year } = parseHicriParts(hicriRaw);
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
