# 🕌 Ezan Vakti & Dini Takvim Mobil Uygulaması (Türk Takvimi API Entegreli)

Modern React Native ve Expo SDK 52 kullanılarak geliştirilmiş, **resmi Türk Takvimi API** verileriyle %100 uyumlu çalışan, gelişmiş kıble pusulası, vakit hatırlatıcıları ve yapraklı takvim içeriği sunan mobil ezan vakti uygulaması.

---

## ✨ Öne Çıkan Özellikler

- 🕋 **Resmi Türk Takvimi API Entegrasyonu**: Türkiye ve dünya genelindeki tüm şehirler için yıllık vakit verileri.
- ⏰ **Detaylı 18 Vakit Listesi**:
  - *Ana Vakitler*: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı.
  - *Detaylı Vakitler*: Sabah, İşrak, Dahve-i Kübra, Kerâhet, Asr-ı evvel, Asr-ı sânî, İsfirâr-ı şems, İştibâk-i nücûm, İşâ-i evvel, İşâ-i sânî, Gece Yarısı, Teheccüd, Seher, Kıble Saati.
- ⏳ **Canlı Geri Sayım & İlerleme Çubuğu**: Sıradaki vakte kalan süreyi saniye saniye takip eden dinamik kart.
- 🔔 **Gelişmiş Bildirim & Ezan Alarmları**:
  - `expo-notifications` ile arka planda ve kilit ekranında çalışan yerel alarmlar.
  - Her vakit için özel süre seçimi (Vaktinde, 5, 10, 15, 30 dakika önce).
- 🧭 **Canlı Hassas Kıble Pusulası**:
  - `expo-location` ve cihazın manyetometre sensörleri ile canlı dönen pusula kadranı.
  - Kabe yönüne hizalandığında yeşil görsel geribildirim.
  - Türk Takvimi resmi kıble açısı ve manyetik sapma verileri.
- 📜 **Günün Takvim Yaprağı İçerikleri**: Günün Sözü, Tarihte Bugün (Günün Olayı) ve Takvim Arka Yüzü okuma makaleleri.
- 🌍 **Şehir Yönetimi & GPS Konumu**:
  - Otomatik GPS konumu ile en yakın şehri bulma.
  - Canlı arama ile binlerce şehir ve ilçe ekleme.
- 📅 **Dini Günler & Mübarek Geceler Takvimi**: Miladi ve Hicri yıl seçenekli Kandil ve Bayram tarihleri.
- 🌙 **Otomatik Karanlık / Aydınlık Mod**: Sistem temasıyla uyumlu veya manuel geçişli şık tasarım.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Framework**: [React Native](https://reactnative.dev/) + [Expo SDK 52](https://docs.expo.dev/)
- **Dil**: [TypeScript](https://www.typescriptlang.org/)
- **Ikonlar**: [Lucide React Native](https://lucide.dev/) & [React Native SVG](https://github.com/software-mansion/react-native-svg)
- **Konum & Sensörler**: `expo-location`
- **Bildirimler**: `expo-notifications`
- **Depolama**: `@react-native-async-storage/async-storage`
- **Tasarım**: Safe Area Context & Responsive Flexbox UI

---

## 📋 Ön Gereksinimler (Prerequisites)

Uygulamayı yerel ortamınızda derleyip çalıştırmadan önce sisteminizde aşağıdaki araçların kurulu olması gerekir:

1. **Node.js**: `v18.0.0` veya üzeri (LTS sürümü önerilir) -> [nodeJS.org](https://nodejs.org/)
2. **Paket Yöneticisi**: `npm` (Node ile birlikte gelir) veya `yarn` / `pnpm`
3. **Expo Go Mobil Uygulaması**:
   - iOS: App Store'dan **Expo Go** indirin.
   - Android: Google Play Store'dan **Expo Go** indirin.
4. **Geliştirme Ortamı (Opsiyonel - Emülatör / Simülatör için)**:
   - **Android**: Android Studio & Android Virtual Device (AVD).
   - **iOS (Yalnızca macOS)**: Xcode & iOS Simulator.

---

## 🚀 Kurulum ve Çalıştırma (Installation & Running)

### 1. Projeyi Klonlayın ve Klasöre Girin

```bash
git clone https://github.com/username/ezan-vakti.git
cd ezan-vakti
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

---

## 📱 Uygulamayı İşletim Sistemlerine Göre Çalıştırma

### 📲 A) Expo Go ile Mobil Cihazda Çalıştırma (Windows & macOS)

1. Terminalde geliştirici sunucusunu başlatın:
   ```bash
   npx expo start -c
   ```
2. Ekranda beliren **QR Kodu**:
   - **Android**: Expo Go uygulamasını açıp *"Scan QR Code"* seçeneğiyle okutun.
   - **iOS**: Telefonun yerel **Kamera** uygulamasını açıp QR koda doğrultun ve gelen bildirime dokunun.

---

### 🤖 B) Android Emülatörde Çalıştırma (Windows & macOS)

1. **Android Studio**'yu açın ve bir Sanal Cihaz (AVD - Android Emulator) başlatın.
2. Terminalde Expo sunucusunu çalıştırın:
   ```bash
   npx expo start
   ```
3. Terminal aktifken klavyeden **`a`** tuşuna basın. Expo CLI otomatik olarak emülatöre bağlanacak ve uygulamayı yükleyecektir.

#### Yerel Android Derlemesi Yapmak İstiyorsanız (Expo Prebuild / Native Run):
```bash
npx expo run:android
```

---

### 🍎 C) iOS Simülatörde Çalıştırma (Yalnızca macOS)

1. macOS cihazınızda **Xcode** uygulamasının kurulu olduğundan ve Command Line Tools'un etkinleştirildiğinden emin olun.
2. Terminalde Expo sunucusunu çalıştırın:
   ```bash
   npx expo start
   ```
3. Terminal aktifken klavyeden **`i`** tuşuna basın. Expo CLI otomatik olarak varsayılan iOS Simülatörünü açacaktır.

#### Yerel iOS Derlemesi Yapmak İstiyorsanız (macOS):
```bash
npx expo run:ios
```

---

### 🌐 D) Web Tarayıcısında Çalıştırma

```bash
npx expo start --web
```
veya terminal açıkken **`w`** tuşuna basın.

---

## 📂 Proje Yapısı (Directory Structure)

```text
ezan-vakti/
├── assets/                  # Görseller, ikonlar ve fontlar
├── components/              # React Native UI Bileşenleri
│   ├── Vakitler.tsx         # Ana Vakitler, 18 Vakit Grid & Geri Sayım
│   ├── Sehirler.tsx         # Şehir Arama, Ekleme/Çıkarma & GPS
│   ├── Kible.tsx            # Canlı Pusula, Sensör & Hizalama
│   └── Gunler.tsx           # Dini Günler, Hicri/Miladi Takvim
├── services/                # API ve Arka Plan Servisleri
│   ├── turkTakvimApi.ts     # Türk Takvimi XML/JSON API Entegrasyonu
│   └── notificationService.ts # Expo Yerel Bildirim Zamanlayıcı
├── constants.tsx            # Renkler, Sabitler & Dönüştürücü Helper'lar
├── types.ts                 # TypeScript Arayüz ve Tip Tanımlamaları
├── App.tsx                  # Ana Giriş ve Tab Bar Navigasyonu
├── index.js                 # Expo Root Register
├── app.json                 # Expo Proje Yapılandırması
├── package.json             # Bağımlılıklar ve Komutlar
└── README.md                # Proje Dokümantasyonu
```

---

## ⚙️ Sorun Giderme (Troubleshooting)

### Önbellek Temizleme (Cache Reset)
Metro Bundler önbelleğinden kaynaklanan beklenmedik paketleme hatalarında sunucuyu önbelleği temizleyerek başlatın:

```bash
npx expo start -c
```

### Bildirim İzinleri
Android 13+ ve iOS cihazlarda bildirimlerin çalışabilmesi için cihaz ayarlarından **Expo Go** veya derlenen uygulama için **Bildirim İzninin** açık olması gerekmektedir.

---

## 📜 Lisans

Bu proje MIT Lisansı altında sunulmaktadır.
Dini vakit verileri ve takvim yazıları resmi **[Türk Takvimi](https://www.turktakvim.com)** servislerinden çekilmektedir.
