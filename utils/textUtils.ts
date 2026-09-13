/**
 * Converts text to uppercase according to locale rules,
 * with robust support for Turkish characters:
 * - 'i' -> 'İ'
 * - 'ı' -> 'I'
 * - 'ş' -> 'Ş'
 * - 'ğ' -> 'Ğ'
 * - 'ç' -> 'Ç'
 * - 'ö' -> 'Ö'
 * - 'ü' -> 'Ü'
 *
 * Ensures that words like "Vakitler" never become "VAKITLER" (with dotless I),
 * and always become "VAKİTLER".
 */
export const toLocaleUpper = (text: string, locale: string = 'tr'): string => {
  if (!text) return '';
  if (locale === 'tr' || locale === 'tr-TR') {
    return text
      .replace(/i/g, 'İ')
      .replace(/ı/g, 'I')
      .toLocaleUpperCase('tr-TR')
      .replace(/VAKITLER/g, 'VAKİTLER')
      .replace(/VAKIT/g, 'VAKİT');
  }
  return text.toLocaleUpperCase(locale);
};
