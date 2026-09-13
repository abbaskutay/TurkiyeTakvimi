import { PrayerTime, DetailedPrayerTime, ImportantDay } from '../types';
import { ApiVakitItem, ApiTakvimVeri, extractApiText } from '../services/turkTakvimApi';
import { formatGregorianDate, formatHicriDate, parseHicriYear } from './dateUtils';

/**
 * Maps raw ApiVakitItem into standard 6 prayer times.
 */
export function mapVakitToMainPrayerTimes(vakit: ApiVakitItem): PrayerTime[] {
  return [
    { id: 'imsak', name: 'İmsak', time: vakit.imsak },
    { id: 'gunes', name: 'Güneş', time: vakit.gunes },
    { id: 'ogle', name: 'Öğle', time: vakit.ogle },
    { id: 'ikindi', name: 'İkindi', time: vakit.ikindi },
    { id: 'aksam', name: 'Akşam', time: vakit.aksam },
    { id: 'yatsi', name: 'Yatsı', time: vakit.yatsi },
  ];
}

/**
 * Maps raw ApiVakitItem into 9 paired rows containing all 18 detailed prayer intervals.
 */
export function mapVakitToGridPrayerTimes(vakit: ApiVakitItem): DetailedPrayerTime[][] {
  return [
    [
      { id: 'imsak', name: 'İmsak', time: vakit.imsak },
      { id: 'sabah', name: 'Sabah', time: vakit.sabah },
    ],
    [
      { id: 'gunes', name: 'Güneş', time: vakit.gunes },
      { id: 'israk', name: 'İşrak', time: vakit.israk },
    ],
    [
      { id: 'dahve', name: 'Dahve-i Kübra', time: vakit.dahve },
      { id: 'kerahet', name: 'Kerâhet', time: vakit.kerahet },
    ],
    [
      { id: 'ogle', name: 'Öğle', time: vakit.ogle },
      { id: 'asr_evvel', name: 'Asr-ı evvel', sub: 'Birinci İkindi', time: vakit.ikindi },
    ],
    [
      { id: 'asr_sani', name: 'Asr-ı sânî', sub: 'İkinci İkindi', time: vakit.asrisani },
      { id: 'isfirar', name: 'İsfirâr-ı şems', sub: "İkindi'nin kerâheti", time: vakit.isfirar },
    ],
    [
      { id: 'aksam', name: 'Akşam', time: vakit.aksam },
      { id: 'istibak', name: 'İştibâk-i nücûm', sub: "Akşam'ın kerâheti", time: vakit.istibak },
    ],
    [
      { id: 'isa_evvel', name: 'İşâ-i evvel', sub: 'Birinci Yatsı', time: vakit.yatsi },
      { id: 'isa_sani', name: 'İşâ-i sânî', sub: 'İkinci Yatsı', time: vakit.isaisani },
    ],
    [
      { id: 'gece_yarisi', name: 'Gece Yarısı', sub: "Şer'i gece yarısı", time: vakit.geceyarisi },
      { id: 'teheccud', name: 'Teheccüd', time: vakit.teheccud },
    ],
    [
      { id: 'seher', name: 'Seher', sub: 'Seher vakti', time: vakit.seher },
      { id: 'kible_saati', name: 'Kıble Saati', time: vakit.kible },
    ],
  ];
}

/**
 * Builds the religious day list from a tip=takvim response,
 * filtering for entries whose OnemliGun element has Turu="Dini" (or valid Baslik).
 *
 * @param veriList calendar day entries from turkTakvimApi.getCalendarDetail
 * @param hicriYearFilter optional Hijri year filter
 * @returns the important-day list, in chronological order
 */
export function mapCalendarToImportantDays(
  veriList: ApiTakvimVeri[],
  hicriYearFilter?: number
): ImportantDay[] {
  return veriList
    .filter(v => {
      const onemliGun = v.OnemliGun?.['@attributes'];
      if (!onemliGun?.Baslik) return false;
      if (onemliGun.Turu && onemliGun.Turu.trim().toLowerCase() !== 'dini') {
        return false;
      }
      return true;
    })
    .filter(v => {
      if (hicriYearFilter == null) return true;
      return parseHicriYear(extractApiText(v.HicriTarih)) === hicriYearFilter;
    })
    .map(v => {
      const tarih = v['@attributes']?.Tarih || '';
      const hicriRaw = extractApiText(v.HicriTarih);
      return {
        id: tarih,
        name: v.OnemliGun!['@attributes']!.Baslik!,
        dateGregorian: tarih ? formatGregorianDate(tarih) : '',
        dateHijri: hicriRaw ? formatHicriDate(hicriRaw) : '',
        hicriRaw: hicriRaw || undefined,
      };
    });
}
