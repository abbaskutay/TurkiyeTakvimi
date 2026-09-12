import { PrayerTime, DetailedPrayerTime, City, ImportantDay, AppTab } from './types';

// Re-export date and prayer helper utilities for seamless backward compatibility
export * from './utils/dateUtils';
export * from './utils/prayerMappers';

export const COLORS = {
  primary: '#a01826',
  primaryDark: '#7a101d',
  primaryLight: '#b31d2e',
  accentRed: '#ff4d5e',
  
  light: {
    background: '#f8f9fa',
    card: '#ffffff',
    cardBorder: '#f0f0f0',
    headerBg: '#a01826',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    tabBarBg: '#fdfdfd',
    tabBarBorder: '#e5e7eb',
    activeTab: '#a01826',
    inactiveTab: '#9ca3af',
    highlight: '#fef2f2',
    highlightBorder: '#fee2e2',
  },
  
  dark: {
    background: '#050505',
    card: '#121212',
    cardBorder: '#222222',
    headerBg: '#1f0609',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    tabBarBg: '#0d0d0d',
    tabBarBorder: '#1f1f1f',
    activeTab: '#ff4d5e',
    inactiveTab: '#6b7280',
    highlight: '#2a0a0e',
    highlightBorder: '#3d0f15',
  }
};

export const MOCK_PRAYER_TIMES: PrayerTime[] = [
  { id: 'imsak', name: 'İmsak', time: '06:33' },
  { id: 'gunes', name: 'Güneş', time: '08:22' },
  { id: 'ogle', name: 'Öğle', time: '13:19' },
  { id: 'ikindi', name: 'İkindi', time: '15:40' },
  { id: 'aksam', name: 'Akşam', time: '17:54' },
  { id: 'yatsi', name: 'Yatsı', time: '19:31' },
];

export const GRID_PRAYER_TIMES: DetailedPrayerTime[][] = [
  [
    { id: 'imsak', name: 'İmsak', time: '06:33' },
    { id: 'sabah', name: 'Sabah', time: '06:51' }
  ],
  [
    { id: 'gunes', name: 'Güneş', time: '08:22' },
    { id: 'israk', name: 'İşrak', time: '09:17' }
  ],
  [
    { id: 'dahve', name: 'Dahve-i Kübra', time: '12:13' },
    { id: 'kerahet', name: 'Kerâhet', time: '12:56' }
  ],
  [
    { id: 'ogle', name: 'Öğle', time: '13:19' },
    { id: 'asr_evvel', name: 'Asr-ı evvel', sub: 'Birinci İkindi', time: '15:40' }
  ],
  [
    { id: 'asr_sani', name: 'Asr-ı sânî', sub: 'İkinci İkindi', time: '16:17' },
    { id: 'isfirar', name: 'İsfirâr-ı şems', sub: "İkindi'nin kerâheti", time: '17:09' }
  ],
  [
    { id: 'aksam', name: 'Akşam', time: '17:54' },
    { id: 'istibak', name: 'İştibâk-i nücûm', sub: "Akşam'ın kerâheti", time: '18:51' }
  ],
  [
    { id: 'isa_evvel', name: 'İşâ-i evvel', sub: 'Birinci Yatsı', time: '19:31' },
    { id: 'isa_sani', name: 'İşâ-i sânî', sub: 'İkinci Yatsı', time: '19:42' }
  ],
  [
    { id: 'gece_yarisi', name: 'Gece Yarısı', sub: "Şer'i gece yarısı", time: '00:13' },
    { id: 'teheccud', name: 'Teheccüd', time: '02:20' }
  ],
  [
    { id: 'seher', name: 'Seher', sub: 'Seher vakti', time: '04:26' },
    { id: 'kible_saati', name: 'Kıble Saati', time: '11:12' }
  ]
];

export const MOCK_CITIES: City[] = [
  {
    id: '16741',
    cityID: '16741',
    name: 'İstanbul',
    district: 'İstanbul',
    city: 'İstanbul',
    country: 'Türkiye',
    isCurrent: true,
  },
];

export const MOCK_IMPORTANT_DAYS: ImportantDay[] = [
  { id: '2026-01-15', name: "Mi'râc Kandili Gecesi", dateGregorian: '15 Ocak 2026', dateHijri: '26 Receb 1447' },
  { id: '2026-02-02', name: 'Berât Kandili Gecesi', dateGregorian: '2 Şubat 2026', dateHijri: "14 Şa'bân 1447" },
  { id: '2026-02-19', name: "Ramezân-ı Şerîf'in Başlangıcı", dateGregorian: '19 Şubat 2026', dateHijri: '1 Ramazan 1447' },
  { id: '2026-03-16', name: 'Kadir Gecesi', dateGregorian: '16 Mart 2026', dateHijri: '26 Ramazan 1447' },
  { id: '2026-03-19', name: 'Fıtr Bayramı Gecesi', dateGregorian: '19 Mart 2026', dateHijri: '29 Ramazan 1447' },
  { id: '2026-03-20', name: 'Fıtr (Ramazan) Bayramı 1. Günü', dateGregorian: '20 Mart 2026', dateHijri: '1 Şevval 1447' },
  { id: '2026-03-21', name: 'Fıtr (Ramazan) Bayramı 2. Günü', dateGregorian: '21 Mart 2026', dateHijri: '2 Şevval 1447' },
  { id: '2026-03-22', name: 'Fıtr (Ramazan) Bayramı 3. Günü', dateGregorian: '22 Mart 2026', dateHijri: '3 Şevval 1447' },
  { id: '2026-05-25', name: 'Terviye Günü', dateGregorian: '25 Mayıs 2026', dateHijri: '8 Zilhicce 1447' },
  { id: '2026-05-26', name: 'Arefe Günü ve Gecesi', dateGregorian: '26 Mayıs 2026', dateHijri: '9 Zilhicce 1447' },
  { id: '2026-05-27', name: 'Kurban Bayramı 1. Günü', dateGregorian: '27 Mayıs 2026', dateHijri: '10 Zilhicce 1447' },
  { id: '2026-05-28', name: 'Kurban Bayramı 2. Günü', dateGregorian: '28 Mayıs 2026', dateHijri: '11 Zilhicce 1447' },
  { id: '2026-05-29', name: 'Kurban Bayramı 3. Günü', dateGregorian: '29 Mayıs 2026', dateHijri: '12 Zilhicce 1447' },
  { id: '2026-05-30', name: 'Kurban Bayramı 4. Günü', dateGregorian: '30 Mayıs 2026', dateHijri: '13 Zilhicce 1447' },
  { id: '2026-06-15', name: 'Muharrem (Yılbaşı) Gecesi', dateGregorian: '15 Haziran 2026', dateHijri: '29 Zilhicce 1447' },
  { id: '2026-06-16', name: 'Hicrî Senebaşı (Yılbaşı Günü)', dateGregorian: '16 Haziran 2026', dateHijri: '1 Muharrem 1448' },
  { id: '2026-06-24', name: 'Aşûre Gecesi', dateGregorian: '24 Haziran 2026', dateHijri: '9 Muharrem 1448' },
  { id: '2026-06-25', name: 'Aşûre Günü', dateGregorian: '25 Haziran 2026', dateHijri: '10 Muharrem 1448' },
  { id: '2026-08-24', name: 'Mevlid Kandili Gecesi', dateGregorian: '24 Ağustos 2026', dateHijri: '11 Rebiülevvel 1448' },
  { id: '2026-12-10', name: 'Regâib Kandili Gecesi', dateGregorian: '10 Aralık 2026', dateHijri: '1 Receb 1448' },
];

export const TABS = [
  { id: AppTab.VAKITLER, label: 'Vakitler', iconName: 'Clock' },
  { id: AppTab.SEHIRLER, label: 'Şehirler', iconName: 'Globe' },
  { id: AppTab.KIBLE, label: 'Kıble', iconName: 'Compass' },
  { id: AppTab.GUNLER, label: 'Günler', iconName: 'Calendar' },
];
