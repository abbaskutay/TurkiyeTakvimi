# 🕌 Türkiye Takvimi (Ezan Vakti & Dini Takvim)

Modern React Native ve Expo kullanılarak geliştirilmiş, **resmi Türk Takvimi API** verileriyle %100 uyumlu çalışan, interaktif uydu haritalı kıble tayini, gelişmiş kıble pusulası, vakit hatırlatıcıları, çevrimdışı önbellek desteği ve yapraklı takvim içeriği sunan mobil ezan vakti uygulaması.

---

## ✨ Öne Çıkan Özellikler

### 1. 🕋 Resmi Türk Takvimi API Entegrasyonu & 18 Vakit
- **Yıllık Veri Akışı**: Türkiye ve dünya genelindeki binlerce il ve ilçe için Türk Takvimi resmi vakit hesaplamaları.
- **Detaylı 18 Vakit Gösterimi**:
  - *Ana Vakitler*: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı.
  - *Detaylı Vakitler*: Sabah, İşrak, Dahve-i Kübra, Kerâhet, Asr-ı evvel, Asr-ı sânî, İsfirâr-ı şems, İştibâk-i nücûm, İşâ-i evvel, İşâ-i sânî, Gece Yarısı, Teheccüd, Seher, Kıble Saati.
- **Geri Sayım & İlerleme**: İçinde bulunulan vakti ve bir sonraki vakte kalan süreyi saniye hassasiyetinde gösteren dinamik sayaç ve ilerleme çubuğu.

### 2. 🧭 Çift Modlu Kıble Bulucu (Pusula & Uydu Haritası)
- **namazvakti.com Trigonometrisi**: Resmi `theQibla.php` algoritması ile Coğrafi Kuzey Açısı, Magnetik Sapma Açısı ve Pusula Kuzey Açısı hesaplaması.
- **Canlı Pusula Modu**: Cihaz manyetometresi ve jiroskopu ile gerçek zamanlı dönen kadran, gerçek kuzey (True Heading) ve manyetik kuzey desteği, Kâbe istikametine hizalandığında sesli/titreşimli (haptic) geribildirim.
- **İnteraktif Uydu Haritası (Leaflet + Esri World Imagery)**: Bulunduğunuz konumu çatısına kadar gösteren yüksek çözünürlüklü uydu görüntüsü, Kâbe'ye uzanan dinamik Büyük Çember (Great-Circle) yeşil kılavuz çizgisi ve Kâbe hedef pini.

### 3. 💾 Çevrimdışı (Offline-First) Mimari & Akıllı Önbellek
- **Kesintisiz Kullanım**: Çekilen vakitler, şehir bilgileri ve takvim yaprakları `@react-native-async-storage/async-storage` üzerinde versiyonlu ve zaman damgalı olarak önbelleğe alınır. İnternet bağlantısı kesilse dahi veriler anında görüntülenir.
- **Ağ Dayanıklılığı**: `safeFetch` HTTPS ile bağlantı kurar; SSL el sıkışması veya sertifika aksaklıklarında otomatik HTTP fallback ve yeniden deneme (retry) uygular.
- **XML / CDATA Desteği**: `fast-xml-parser` ile takvim detayları ve önemli dini günler tam metin olarak çözülür.

### 4. 🔔 Gelişmiş Ezan & Vakit Bildirimleri
- `expo-notifications` ile arka planda ve kilit ekranında çalışan yerel bildirimler.
- Her vakit için bağımsız bildirim açma/kapatma ve alarm zamanı seçimi (*Vaktinde*, *5*, *10*, *15*, *30 dakika önce*).

### 5. 📜 Günün Takvim Yaprağı & Dini Günler
- **Günün Takvimi**: Günün Sözü ve Tarihte Bugün (Günün Olayı).
- **Mübarek Günler Listesi**: 2026 yılı ve sonraki yıllar için Kandiller, Ramazan, Kurban Bayramı, Aşûre ve dini günlerin Miladi ve Hicri tarihleri; aşağı çekip yenileme (pull-to-refresh) desteği.

### 6. 🌍 Şehir Yönetimi & GPS Konum Bulma
- GPS üzerinden tek dokunuşla en yakın yerleşimi tespit etme.
- Ülke, eyalet ve şehir hiyerarşik seçimi veya anlık arama (canlı arama & AbortSignal iptal koruması).
- Birden fazla şehir kaydetme ve aralarında hızlı geçiş yapma.

### 7. 🌓 Modern Tasarım & Tema
- Sistem temasıyla otomatik senkronize olan veya elle seçilebilen Karanlık (Dark) ve Aydınlık (Light) mod.
- Ergonomik Safe Area ve responsive kart tasarımları.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Kütüphane | Açıklama |
| :--- | :--- | :--- |
| **Çekirdek** | [React Native](https://reactnative.dev/) + [Expo SDK 52](https://docs.expo.dev/) | Çapraz platform mobil uygulama çatısı |
| **Dil** | [TypeScript](https://www.typescriptlang.org/) | Tip güvenliği ve ölçeklenebilir kodlama |
| **Durum Yönetimi** | React Context (`CityContext`, `ThemeContext`) | Modüler ve hafif global state |
| **Harita & WebView** | `react-native-webview` + Leaflet + Esri | Uydu destekli Kıble haritası |
| **Sensörler & GPS** | `expo-location` | GPS konum tespiti ve pusula manyetometre dinleyicisi |
| **Bildirimler** | `expo-notifications` | Yerel bildirim ve alarm yönetimi |
| **Önbellek** | `@react-native-async-storage/async-storage` | Çevrimdışı veri kalıcılığı |
| **XML İşleme** | `fast-xml-parser` | Türk Takvimi XML ve CDATA verilerinin ayrıştırılması |
| **İkonlar** | `lucide-react-native` & `react-native-svg` | Modern vektörel arayüz ikonları |
| **Test Altyapısı** | Node.js Test Runner + `tsx` | 62 adet birim testi ve canlı entegrasyon testleri |

---

## 📋 Ön Gereksinimler (Prerequisites)

Uygulamayı derleyip çalıştırmadan önce sisteminizde aşağıdaki araçların kurulu olması gerekir:

1. **Node.js**: `v18.0.0` veya üzeri (LTS sürümü önerilir) -> [nodejs.org](https://nodejs.org/)
2. **Paket Yöneticisi**: `npm` (Node ile birlikte gelir) veya `yarn` / `pnpm`
3. **Expo Go Mobil Uygulaması**:
   - iOS: App Store'dan **Expo Go**
   - Android: Google Play Store'dan **Expo Go**
4. **Geliştirme Ortamı (Opsiyonel - Emülatör / Simülatör için)**:
   - **Android**: Android Studio & Android Virtual Device (AVD).
   - **iOS (Yalnızca macOS)**: Xcode & iOS Simulator.

---

## 🚀 Kurulum ve Çalıştırma (Installation & Running)

### 1. Projeyi Klonlayın ve Klasöre Girin

```bash
git clone https://github.com/username/TurkiyeTakvimi.git
cd TurkiyeTakvimi
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

---

## 📱 Çalıştırma Yöntemleri

### 📲 A) Expo Go ile Mobil Cihazda Çalıştırma

1. Terminalde geliştirici sunucusunu başlatın:
   ```bash
   npm start
   # veya
   npx expo start -c
   ```
2. Terminalde veya tarayıcıda beliren **QR Kodu**:
   - **Android**: Expo Go uygulamasını açıp *"Scan QR Code"* seçeneğiyle okutun.
   - **iOS**: Yerel Kamera uygulamasını açıp QR kodu taratın ve gelen bildirime dokunun.

---

### 🤖 B) Android Cihaz veya Emülatörde Çalıştırma

1. Android Studio'da Sanal Cihazınızı (AVD) başlatın veya USB hata ayıklama modunda fiziksel cihazınızı bağlayın.
2. Expo sunucusu açıkken terminalde **`a`** tuşuna basın veya doğrudan yerel build komutunu çalıştırın:
   ```bash
   npm run android
   ```

---

### 🍎 C) iOS Simülatörde Çalıştırma (macOS)

1. Xcode ve Simulator'ün kurulu olduğundan emin olun.
2. Expo sunucusu açıkken terminalde **`i`** tuşuna basın veya doğrudan çalıştırın:
   ```bash
   npm run ios
   ```

---

### 🌐 D) Web Tarayıcısında Çalıştırma

```bash
npm run web
```

---

## 🧪 Testler ve Doğrulama (Testing)

Projede hem birim testleri (unit tests) hem de canlı API entegrasyon test komutları mevcuttur:

### Otomatik Birim Testlerini Çalıştırma (Unit Tests)

Node.js dahili test koşucusu ve `tsx` altyapısı ile yazılmış 62 birim testini çalıştırmak için:

```bash
npm test
```

Test edilen modüller:
- `constants.test.ts`: Vakit sıralamaları, isimleri ve varsayılan ayarlar.
- `timerLogic.test.ts`: Aktif vakit tespiti, geri sayım hesaplamaları ve gün devri (rollover).
- `qiblaUtils.test.ts`: Namaz Vakti formülü, manyetik sapma, büyük çember koordinatları ve koordinat çözümleme.
- `storageService.test.ts`: Önbelleğe alma, okuma, TTL ve kalıcılık doğrulamaları.
- `turkishCalendarApi.test.ts`: Güvenli fetch, HTTPS/HTTP fallback, CDATA ve HTML varlık çözümleme, API endpoint mock testleri.
- `notificationService.test.ts`: Bildirim planlama ve parametre hesaplama.

### Canlı API Entegrasyon Testi (Live Integration Test)

Türk Takvimi sunucularına gerçek istekler göndererek tüm endpoint'leri canlı test etmek için:

```bash
npm run test:live
```

---

## 📂 Proje Dizin Yapısı (Project Structure)

```text
TurkiyeTakvimi/
├── tests/                      # Kapsamlı birim test paketi (62 test)
│   ├── mocks/                  # Expo ve ortam mock'ları
│   ├── setup.ts                # Test ortamı başlatıcı
│   ├── constants.test.ts
│   ├── notificationService.test.ts
│   ├── qiblaUtils.test.ts
│   ├── storageService.test.ts
│   ├── timerLogic.test.ts
│   └── turkishCalendarApi.test.ts
├── android/                    # Yerel Android derleme dosyaları (Prebuild)
├── assets/                     # İkonlar, logolar ve medya dosyaları
├── components/                 # React Native UI Bileşenleri
│   ├── vakitler/               # Vakitler ekranı alt bileşenleri
│   │   ├── CountdownBanner.tsx # Canlı sayaç ve vakit ilerleme çubuğu
│   │   ├── GridPrayerCard.tsx  # 18 detaylı vakit grid kartı
│   │   ├── PrayerListCard.tsx  # 6 ana vakit kartı
│   │   └── ReminderModal.tsx   # Hatırlatıcı ve alarm ayar penceresi
│   ├── Vakitler.tsx            # Ana Vakitler ekranı
│   ├── Sehirler.tsx            # Şehir Arama, Konum (GPS) & Seçim ekranı
│   ├── Kible.tsx               # Çift modlu Pusula & Uydu Haritalı Kıble ekranı
│   └── Gunler.tsx              # Dini Günler ve Takvim Yaprağı ekranı
├── context/                    # React Context durum yöneticileri
│   ├── CityContext.tsx         # Seçili şehir, kayıtlı şehirler ve GPS yönetimi
│   └── ThemeContext.tsx        # Aydınlık/Karanlık tema durumu
├── hooks/                      # Özel React Kancaları (Custom Hooks)
│   ├── useCompassSensor.ts     # Manyetometre, gerçek kuzey ve açı kancası
│   ├── usePrayerTimes.ts       # Vakitler, offline önbellek ve retry kancası
│   └── useTimer.ts             # Geri sayım ve dinamik yenileme zamanlayıcısı
├── services/                   # Servis Katmanı
│   ├── turkishCalendarApi.ts   # Türk Takvimi API istemcisi, XML/CDATA ayrıştırıcı
│   ├── storageService.ts       # AsyncStorage önbellek ve kalıcı depolama
│   └── notificationService.ts  # Expo yerel bildirim ve alarm planlayıcısı
├── utils/                      # Yardımcı Hesaplama Fonksiyonları
│   └── qiblaUtils.ts           # Kıble açısı, büyük çember hattı & Leaflet harita HTML
├── test_all_features.ts        # Canlı uçtan uca özellik test scripti
├── constants.tsx               # Renk paletleri, sabitler ve varsayılan veriler
├── types.ts                    # TypeScript tip tanımları
├── app.tsx                     # Kök navigasyon ve tab bar
├── app.json                    # Expo konfigürasyonu ve izin tanımları
├── package.json                # Proje bağımlılıkları ve npm script'leri
└── README.md                   # Proje Dokümantasyonu
```

---

## ⚙️ Sorun Giderme (Troubleshooting)

### Önbellek Temizleme (Cache Reset)
Metro Bundler önbelleğinden kaynaklanan beklenmedik paketleme veya modül çözümleme hatalarında sunucuyu temizleyerek başlatın:
```bash
npx expo start -c
```

### Konum ve Pusula İzinleri
- **Kıble Pusulası**: Cihazın manyetometre ve jiroskop sensörlerinin çalışması için konum iznine (`expo-location`) ihtiyaç duyulur. Emülatörlerde manyetik sensör bulunmadığından pusula açısı sabit kalabilir; gerçek cihazda test edilmesi önerilir.
- **Uydu Haritası**: Haritanın açılabilmesi için internet bağlantısı ve `react-native-webview` gereklidir.

### Bildirim İzinleri
Android 13+ ve iOS cihazlarda bildirimlerin çalışabilmesi için sistem ayarlarından uygulamaya bildirim izni verilmelidir.

---

## 📜 Lisans & Kaynakça

- Bu proje MIT Lisansı altında geliştirilmektedir.
- Dini vakit hesaplamaları ve takvim içerikleri resmi **[Türk Takvimi](https://www.turktakvim.com)** ve **[Namaz Vakti](https://www.namazvakti.com)** servisleri kaynak alınarak hazırlanmıştır.
