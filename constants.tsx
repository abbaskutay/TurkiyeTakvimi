import { PrayerTime, DetailedPrayerTime, City, ImportantDay, AppTab } from './types';
import { ApiVakitItem } from './services/turkTakvimApi';

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

export function mapVakitToGridPrayerTimes(vakit: ApiVakitItem): DetailedPrayerTime[][] {
  return [
    [
      { id: 'imsak', name: 'İmsak', time: vakit.imsak },
      { id: 'sabah', name: 'Sabah', time: vakit.sabah }
    ],
    [
      { id: 'gunes', name: 'Güneş', time: vakit.gunes },
      { id: 'israk', name: 'İşrak', time: vakit.israk }
    ],
    [
      { id: 'dahve', name: 'Dahve-i Kübra', time: vakit.dahve },
      { id: 'kerahet', name: 'Kerâhet', time: vakit.kerahet }
    ],
    [
      { id: 'ogle', name: 'Öğle', time: vakit.ogle },
      { id: 'asr_evvel', name: 'Asr-ı evvel', sub: 'Birinci İkindi', time: vakit.ikindi }
    ],
    [
      { id: 'asr_sani', name: 'Asr-ı sânî', sub: 'İkinci İkindi', time: vakit.asrisani },
      { id: 'isfirar', name: 'İsfirâr-ı şems', sub: "İkindi'nin kerâheti", time: vakit.isfirar }
    ],
    [
      { id: 'aksam', name: 'Akşam', time: vakit.aksam },
      { id: 'istibak', name: 'İştibâk-i nücûm', sub: "Akşam'ın kerâheti", time: vakit.istibak }
    ],
    [
      { id: 'isa_evvel', name: 'İşâ-i evvel', sub: 'Birinci Yatsı', time: vakit.yatsi },
      { id: 'isa_sani', name: 'İşâ-i sânî', sub: 'İkinci Yatsı', time: vakit.isaisani }
    ],
    [
      { id: 'gece_yarisi', name: 'Gece Yarısı', sub: "Şer'i gece yarısı", time: vakit.geceyarisi },
      { id: 'teheccud', name: 'Teheccüd', time: vakit.teheccud }
    ],
    [
      { id: 'seher', name: 'Seher', sub: 'Seher vakti', time: vakit.seher },
      { id: 'kible_saati', name: 'Kıble Saati', time: vakit.kible }
    ]
  ];
}

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
  { id: '1', name: 'Üç Ayların Başlaması', dateGregorian: '21 Aralık 2025', dateHijri: '1 Receb 1447' },
  { id: '2', name: "Mi'râc Kandili Gecesi", dateGregorian: '15 Ocak 2026', dateHijri: '26 Receb 1447' },
  { id: '3', name: 'Berât Kandili Gecesi', dateGregorian: '2 Şubat 2026', dateHijri: '14 Şa\'bân 1447' },
  { id: '4', name: 'Ramezân-ı Şerîf\'in Başlangıcı', dateGregorian: '19 Şubat 2026', dateHijri: '1 Ramezân 1447' },
  { id: '5', name: 'Kadir Gecesi', dateGregorian: '16 Mart 2026', dateHijri: '26 Ramezân 1447' },
  { id: '6', name: 'Ramezân Bayramı 1. Günü', dateGregorian: '20 Mart 2026', dateHijri: '1 Şevvâl 1447' },
  { id: '7', name: 'Ramezân Bayramı 2. Günü', dateGregorian: '21 Mart 2026', dateHijri: '2 Şevvâl 1447' },
  { id: '8', name: 'Kurban Bayramı 1. Günü', dateGregorian: '27 Mayıs 2026', dateHijri: '10 Zilhicce 1447' },
];

export const TABS = [
  { id: AppTab.VAKITLER, label: 'Vakitler', iconName: 'Clock' },
  { id: AppTab.SEHIRLER, label: 'Şehirler', iconName: 'Globe' },
  { id: AppTab.KIBLE, label: 'Kıble', iconName: 'Compass' },
  { id: AppTab.GUNLER, label: 'Günler', iconName: 'Calendar' },
];
