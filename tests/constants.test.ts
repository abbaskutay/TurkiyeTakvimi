import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  mapVakitToMainPrayerTimes,
  mapVakitToGridPrayerTimes,
  formatGregorianDate,
  formatHicriDate,
  parseHicriYear,
  mapCalendarToImportantDays,
  COLORS,
  MOCK_PRAYER_TIMES,
  GRID_PRAYER_TIMES,
  TABS,
} from '../constants';
import { ApiVakitItem, ApiTakvimVeri } from '../services/turkishCalendarApi';

const sampleApiVakit: ApiVakitItem = {
  '@attributes': {
    tarih: '2026-09-12',
    gun: 'Cumartesi',
    hicri: '30 SAFER 1448',
  },
  imsak: '05:12',
  sabah: '05:32',
  gunes: '06:42',
  israk: '07:35',
  dahve: '12:05',
  kerahet: '12:45',
  ogle: '13:08',
  ikindi: '16:42',
  asrisani: '17:22',
  isfirar: '18:52',
  aksam: '19:18',
  istibak: '20:12',
  yatsi: '20:42',
  isaisani: '21:02',
  geceyarisi: '00:15',
  teheccud: '02:05',
  seher: '04:05',
  kible: '11:38',
};

describe('constants - mapVakitToMainPrayerTimes', () => {
  it('maps all 6 standard prayer times with correct IDs and times', () => {
    const list = mapVakitToMainPrayerTimes(sampleApiVakit);
    assert.strictEqual(list.length, 6);
    assert.deepStrictEqual(list.map(p => p.id), ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi']);
    assert.deepStrictEqual(list.map(p => p.name), ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı']);
    assert.strictEqual(list[0].time, '05:12');
    assert.strictEqual(list[1].time, '06:42');
    assert.strictEqual(list[2].time, '13:08');
    assert.strictEqual(list[3].time, '16:42');
    assert.strictEqual(list[4].time, '19:18');
    assert.strictEqual(list[5].time, '20:42');
  });
});

describe('constants - mapVakitToGridPrayerTimes', () => {
  it('maps into 9 paired rows containing all 18 periods', () => {
    const grid = mapVakitToGridPrayerTimes(sampleApiVakit);
    assert.strictEqual(grid.length, 9);
    for (const row of grid) {
      assert.strictEqual(row.length, 2);
    }
    const flattened = grid.flat();
    assert.strictEqual(flattened.length, 18);

    const expectedIds = [
      'imsak', 'sabah', 'gunes', 'israk', 'dahve', 'kerahet',
      'ogle', 'asr_evvel', 'asr_sani', 'isfirar', 'aksam', 'istibak',
      'isa_evvel', 'isa_sani', 'gece_yarisi', 'teheccud', 'seher', 'kible_saati'
    ];
    assert.deepStrictEqual(flattened.map(p => p.id), expectedIds);

    // Verify sub labels
    assert.strictEqual(flattened.find(p => p.id === 'asr_evvel')?.sub, 'Birinci İkindi');
    assert.strictEqual(flattened.find(p => p.id === 'asr_sani')?.sub, 'İkinci İkindi');
    assert.strictEqual(flattened.find(p => p.id === 'isfirar')?.sub, "İkindi'nin kerâheti");
    assert.strictEqual(flattened.find(p => p.id === 'istibak')?.sub, "Akşam'ın kerâheti");
    assert.strictEqual(flattened.find(p => p.id === 'isa_evvel')?.sub, 'Birinci Yatsı');
    assert.strictEqual(flattened.find(p => p.id === 'isa_sani')?.sub, 'İkinci Yatsı');
    assert.strictEqual(flattened.find(p => p.id === 'gece_yarisi')?.sub, "Şer'i gece yarısı");
  });
});

describe('constants - formatGregorianDate', () => {
  it('formats dates into Turkish localized format', () => {
    assert.strictEqual(formatGregorianDate('2026-01-01'), '1 Ocak 2026');
    assert.strictEqual(formatGregorianDate('2026-02-14'), '14 Şubat 2026');
    assert.strictEqual(formatGregorianDate('2026-03-20'), '20 Mart 2026');
    assert.strictEqual(formatGregorianDate('2026-04-23'), '23 Nisan 2026');
    assert.strictEqual(formatGregorianDate('2026-05-19'), '19 Mayıs 2026');
    assert.strictEqual(formatGregorianDate('2026-06-15'), '15 Haziran 2026');
    assert.strictEqual(formatGregorianDate('2026-07-15'), '15 Temmuz 2026');
    assert.strictEqual(formatGregorianDate('2026-08-30'), '30 Ağustos 2026');
    assert.strictEqual(formatGregorianDate('2026-09-12'), '12 Eylül 2026');
    assert.strictEqual(formatGregorianDate('2026-10-29'), '29 Ekim 2026');
    assert.strictEqual(formatGregorianDate('2026-11-10'), '10 Kasım 2026');
    assert.strictEqual(formatGregorianDate('2026-12-31'), '31 Aralık 2026');
  });
});

describe('constants - formatHicriDate & parseHicriYear', () => {
  it('formats raw Hijri strings into neat Turkish casing', () => {
    assert.strictEqual(formatHicriDate('26  RECEB  1447'), '26 Receb 1447');
    assert.strictEqual(formatHicriDate("14  ŞA'BÂN  1447"), "14 Şa'bân 1447");
    assert.strictEqual(formatHicriDate('1  RAMEZÂN  1447'), '1 Ramazan 1447');
    assert.strictEqual(formatHicriDate('1  ŞEVVÂL  1447'), '1 Şevval 1447');
    assert.strictEqual(formatHicriDate('1  MUHARREM  1448'), '1 Muharrem 1448');
    assert.strictEqual(formatHicriDate("12  REBÎ'UL-EVVEL  1448"), '12 Rebiülevvel 1448');
    assert.strictEqual(formatHicriDate("10  ZİL-HİCCE  1447"), '10 Zilhicce 1447');
  });

  it('parses Hijri year correctly from various formats', () => {
    assert.strictEqual(parseHicriYear('26 RECEB 1447'), 1447);
    assert.strictEqual(parseHicriYear('10 Zilhicce 1448'), 1448);
    assert.strictEqual(parseHicriYear(''), 0);
    assert.strictEqual(parseHicriYear('gecersiz'), 0);
  });
});

describe('constants - mapCalendarToImportantDays', () => {
  it('filters only Dini days and formats gregorian and hijri dates', () => {
    const veriList: ApiTakvimVeri[] = [
      {
        '@attributes': { Tarih: '2026-01-15' },
        HicriTarih: '26  RECEB  1447',
        OnemliGun: { '@attributes': { Turu: 'Dini', Baslik: "Mi'râc Kandili Gecesi" } },
      },
      {
        '@attributes': { Tarih: '2026-01-16' },
        HicriTarih: '27  RECEB  1447',
      },
      {
        '@attributes': { Tarih: '2026-04-23' },
        HicriTarih: '5  ZİLKADE  1447',
        OnemliGun: { '@attributes': { Turu: 'Milli', Baslik: 'Ulusal Egemenlik Bayramı' } },
      },
      {
        '@attributes': { Tarih: '2026-05-27' },
        HicriTarih: '10  ZİL-HİCCE  1447',
        OnemliGun: { '@attributes': { Turu: 'Dini', Baslik: 'Kurban Bayramı 1. Günü' } },
      },
      {
        '@attributes': { Tarih: '2026-08-24' },
        HicriTarih: "11  REBÎ'UL-EVVEL  1448",
        OnemliGun: { '@attributes': { Turu: 'Dini', Baslik: 'Mevlid Kandili Gecesi' } },
      },
    ];

    const allDiniDays = mapCalendarToImportantDays(veriList);
    assert.strictEqual(allDiniDays.length, 3);
    assert.strictEqual(allDiniDays[0].name, "Mi'râc Kandili Gecesi");
    assert.strictEqual(allDiniDays[0].dateGregorian, '15 Ocak 2026');
    assert.strictEqual(allDiniDays[0].dateHijri, '26 Receb 1447');

    assert.strictEqual(allDiniDays[1].name, 'Kurban Bayramı 1. Günü');
    assert.strictEqual(allDiniDays[2].name, 'Mevlid Kandili Gecesi');

    // Test with hicriYearFilter
    const year1448Only = mapCalendarToImportantDays(veriList, 1448);
    assert.strictEqual(year1448Only.length, 1);
    assert.strictEqual(year1448Only[0].name, 'Mevlid Kandili Gecesi');
  });
});

describe('constants - App Tokens', () => {
  it('has consistent COLORS, TABS and default mocks', () => {
    assert.strictEqual(COLORS.primary, '#a01826');
    assert.strictEqual(TABS.length, 4);
    assert.strictEqual(MOCK_PRAYER_TIMES.length, 6);
    assert.strictEqual(GRID_PRAYER_TIMES.length, 9);
  });
});
