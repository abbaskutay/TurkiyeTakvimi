/**
 * Local Arabic <-> Turkish city name lookup for Türkiye's 81 provinces and a
 * curated set of world/Islamic cities. turktakvim.com's search endpoint has
 * no Arabic-script field at all and returns irrelevant results for Arabic
 * input, so this table lets the app (a) resolve a partial Arabic query to
 * the correct Turkish search term instantly, without a translation
 * round-trip, and (b) display a proper Arabic name for known cities instead
 * of the raw Turkish one.
 *
 * `tr` is the exact term to send to turkTakvimApi.searchCities: for
 * provinces it's the province's own name; for world cities it's whichever
 * of the service's NameTR/NameEN fields was empirically found to surface
 * the correct entry (verified individually against the live API).
 */
export interface CityDictionaryEntry {
  tr: string;
  ar: string;
}

export const TURKISH_PROVINCES: CityDictionaryEntry[] = [
  { tr: 'Adana', ar: 'أضنة' },
  { tr: 'Adıyaman', ar: 'أديامان' },
  { tr: 'Afyonkarahisar', ar: 'أفيون قره حصار' },
  { tr: 'Ağrı', ar: 'أغري' },
  { tr: 'Aksaray', ar: 'أكساراي' },
  { tr: 'Amasya', ar: 'أماسيا' },
  { tr: 'Ankara', ar: 'أنقرة' },
  { tr: 'Antalya', ar: 'أنطاليا' },
  { tr: 'Ardahan', ar: 'أردهان' },
  { tr: 'Artvin', ar: 'آرتفين' },
  { tr: 'Aydın', ar: 'آيدين' },
  { tr: 'Balıkesir', ar: 'باليكسير' },
  { tr: 'Bartın', ar: 'بارتين' },
  { tr: 'Batman', ar: 'باتمان' },
  { tr: 'Bayburt', ar: 'بايبورت' },
  { tr: 'Bilecik', ar: 'بيلجيك' },
  { tr: 'Bingöl', ar: 'بينجول' },
  { tr: 'Bitlis', ar: 'بتليس' },
  { tr: 'Bolu', ar: 'بولو' },
  { tr: 'Burdur', ar: 'بوردور' },
  { tr: 'Bursa', ar: 'بورصة' },
  { tr: 'Çanakkale', ar: 'كاناكالي' },
  { tr: 'Çankırı', ar: 'كانكيري' },
  { tr: 'Çorum', ar: 'كوروم' },
  { tr: 'Denizli', ar: 'دنيزلي' },
  { tr: 'Diyarbakır', ar: 'ديار بكر' },
  { tr: 'Düzce', ar: 'دوزجي' },
  { tr: 'Edirne', ar: 'أدرنة' },
  { tr: 'Elazığ', ar: 'إيلازيغ' },
  { tr: 'Erzincan', ar: 'أرزينجان' },
  { tr: 'Erzurum', ar: 'أرضروم' },
  { tr: 'Eskişehir', ar: 'إسكيشير' },
  { tr: 'Gaziantep', ar: 'غازي عنتاب' },
  { tr: 'Giresun', ar: 'غيرسون' },
  { tr: 'Gümüşhane', ar: 'غوموشخانة' },
  { tr: 'Hakkari', ar: 'هكاري' },
  { tr: 'Hatay', ar: 'هاتاي' },
  { tr: 'Iğdır', ar: 'إغدير' },
  { tr: 'Isparta', ar: 'إسبرطة' },
  { tr: 'İstanbul', ar: 'إسطنبول' },
  { tr: 'İzmir', ar: 'إزمير' },
  { tr: 'Kahramanmaraş', ar: 'كهرمان مرعش' },
  { tr: 'Karabük', ar: 'كارابوك' },
  { tr: 'Karaman', ar: 'كارامان' },
  { tr: 'Kars', ar: 'كارس' },
  { tr: 'Kastamonu', ar: 'كاستامونو' },
  { tr: 'Kayseri', ar: 'قيصري' },
  { tr: 'Kırıkkale', ar: 'كيريكالي' },
  { tr: 'Kırklareli', ar: 'كيركلاريلي' },
  { tr: 'Kırşehir', ar: 'كيرشهير' },
  { tr: 'Kilis', ar: 'كليس' },
  { tr: 'Kocaeli', ar: 'كوجالي' },
  { tr: 'Konya', ar: 'قونية' },
  { tr: 'Kütahya', ar: 'كوتاهيا' },
  { tr: 'Malatya', ar: 'ملاطية' },
  { tr: 'Manisa', ar: 'مانيسا' },
  { tr: 'Mardin', ar: 'ماردين' },
  { tr: 'Mersin', ar: 'مرسين' },
  { tr: 'Muğla', ar: 'موغلا' },
  { tr: 'Muş', ar: 'موش' },
  { tr: 'Nevşehir', ar: 'نوشهير' },
  { tr: 'Niğde', ar: 'نيغده' },
  { tr: 'Ordu', ar: 'أوردو' },
  { tr: 'Osmaniye', ar: 'عثمانية' },
  { tr: 'Rize', ar: 'ريزة' },
  { tr: 'Sakarya', ar: 'ساكاريا' },
  { tr: 'Samsun', ar: 'سامسون' },
  { tr: 'Şanlıurfa', ar: 'شانلي أورفة' },
  { tr: 'Siirt', ar: 'سيرت' },
  { tr: 'Sinop', ar: 'سينوب' },
  { tr: 'Şırnak', ar: 'شرناك' },
  { tr: 'Sivas', ar: 'سيواس' },
  { tr: 'Tekirdağ', ar: 'تكيرداغ' },
  { tr: 'Tokat', ar: 'توكات' },
  { tr: 'Trabzon', ar: 'طرابزون' },
  { tr: 'Tunceli', ar: 'تونجلي' },
  { tr: 'Uşak', ar: 'أوشاك' },
  { tr: 'Van', ar: 'وان' },
  { tr: 'Yalova', ar: 'يالوفا' },
  { tr: 'Yozgat', ar: 'يوزغات' },
  { tr: 'Zonguldak', ar: 'زونغولداك' },
];

export const WORLD_CITIES: CityDictionaryEntry[] = [
  { tr: 'Mekke', ar: 'مكة المكرمة' },
  { tr: 'Medine', ar: 'المدينة المنورة' },
  { tr: 'Cidde', ar: 'جدة' },
  { tr: 'Riyad', ar: 'الرياض' },
  { tr: 'Ad Dammam', ar: 'الدمام' },
  { tr: 'Kahire', ar: 'القاهرة' },
  { tr: 'İskenderiye', ar: 'الإسكندرية' },
  { tr: 'Kudüs', ar: 'القدس' },
  { tr: 'Amman', ar: 'عمّان' },
  { tr: 'Beyrut', ar: 'بيروت' },
  { tr: 'Şam', ar: 'دمشق' },
  { tr: 'Halep', ar: 'حلب' },
  { tr: 'Bağdat', ar: 'بغداد' },
  { tr: 'Basra', ar: 'البصرة' },
  { tr: 'Kuveyt', ar: 'الكويت' },
  { tr: 'Dawhah', ar: 'الدوحة' },
  { tr: 'Manama', ar: 'المنامة' },
  { tr: 'Maskat', ar: 'مسقط' },
  { tr: 'Abu Dabi', ar: 'أبوظبي' },
  { tr: 'Dubai', ar: 'دبي' },
  { tr: 'Tunus', ar: 'تونس' },
  { tr: 'Algiers', ar: 'الجزائر' },
  { tr: 'Rabat', ar: 'الرباط' },
  { tr: 'Kazablanka', ar: 'الدار البيضاء' },
  { tr: 'Trablus', ar: 'طرابلس' },
  { tr: 'Hartum', ar: 'الخرطوم' },
];

export const CITY_NAME_DICTIONARY: CityDictionaryEntry[] = [...TURKISH_PROVINCES, ...WORLD_CITIES];
