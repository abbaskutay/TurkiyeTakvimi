import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Modal,
} from 'react-native';
import {
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  MoonStar,
  Clock,
  Compass,
  AlertTriangle,
  Stars,
  CloudMoon,
  Quote,
  ChevronDown,
  Check,
  Plus,
  Share2,
  Moon,
  X,
  BookOpen,
} from 'lucide-react-native';
import {
  MOCK_PRAYER_TIMES,
  GRID_PRAYER_TIMES,
  COLORS,
  mapVakitToMainPrayerTimes,
  mapVakitToGridPrayerTimes,
} from '../constants';
import { City, PrayerTime, DetailedPrayerTime, ReminderConfig } from '../types';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { CountdownBanner } from './vakitler/CountdownBanner';
import { PrayerListCard } from './vakitler/PrayerListCard';
import { GridPrayerCard } from './vakitler/GridPrayerCard';
import { ReminderModal } from './vakitler/ReminderModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES_TR = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
];

const DAY_NAMES_TR = [
  'PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'
];

interface VakitlerProps {
  currentCity?: City;
  isDarkMode?: boolean;
  onNavigateToSehirler?: () => void;
}

export const Vakitler: React.FC<VakitlerProps> = ({
  currentCity: propCity,
  onNavigateToSehirler,
}) => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { currentCity: contextCity, cities, selectCity } = useCity();
  const currentCity = propCity || contextCity;

  const [reminders, setReminders] = useState<Record<string, ReminderConfig>>({});
  const [globalRemindersEnabled, setGlobalRemindersEnabled] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const cityID = currentCity.cityID || '16741';

  const {
    vakitList,
    todayVakit,
    tomorrowVakit,
    calendarDetail,
    loading,
    refreshing,
    isOffline,
    onRefresh,
  } = usePrayerTimes(cityID);

  // Initialize reminder config from storageService
  useEffect(() => {
    const loadReminders = async () => {
      const saved = await storageService.getReminders();
      if (saved) {
        setReminders(saved);
      } else {
        const config: Record<string, ReminderConfig> = {};
        MOCK_PRAYER_TIMES.forEach(p => {
          config[p.id] = { enabled: false, offset: 5 };
        });
        setReminders(config);
      }
      const globalSaved = await storageService.getGlobalRemindersEnabled();
      setGlobalRemindersEnabled(globalSaved);
    };
    loadReminders();
  }, []);

  // Reschedule local notifications whenever vakitList, reminders, or currentCity changes
  useEffect(() => {
    if (vakitList.length > 0 && Object.keys(reminders).length > 0) {
      storageService.setReminders(reminders);
      storageService.setGlobalRemindersEnabled(globalRemindersEnabled);

      notificationService.schedulePrayerNotifications(
        vakitList,
        reminders,
        globalRemindersEnabled,
        currentCity.city || currentCity.name
      );
    }
  }, [vakitList, reminders, globalRemindersEnabled, currentCity]);

  // Map API data or fallbacks
  const mainPrayerTimes: PrayerTime[] = useMemo(() => {
    if (todayVakit) {
      return mapVakitToMainPrayerTimes(todayVakit);
    }
    return MOCK_PRAYER_TIMES;
  }, [todayVakit]);

  const tomorrowMainPrayerTimes: PrayerTime[] = useMemo(() => {
    if (tomorrowVakit) {
      return mapVakitToMainPrayerTimes(tomorrowVakit);
    }
    return mainPrayerTimes;
  }, [tomorrowVakit, mainPrayerTimes]);

  const gridPrayerTimes: DetailedPrayerTime[][] = useMemo(() => {
    if (todayVakit) {
      return mapVakitToGridPrayerTimes(todayVakit);
    }
    return GRID_PRAYER_TIMES;
  }, [todayVakit]);

  const tomorrowGridPrayerTimes: DetailedPrayerTime[][] = useMemo(() => {
    if (tomorrowVakit) {
      return mapVakitToGridPrayerTimes(tomorrowVakit);
    }
    return gridPrayerTimes;
  }, [tomorrowVakit, gridPrayerTimes]);

  const flattenedGridTimes = useMemo(() => gridPrayerTimes.flat(), [gridPrayerTimes]);
  const tomorrowFlattenedGridTimes = useMemo(() => tomorrowGridPrayerTimes.flat(), [tomorrowGridPrayerTimes]);

  const activePrayerId = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    let active = mainPrayerTimes[mainPrayerTimes.length - 1]?.id || 'yatsi';
    for (let i = 0; i < mainPrayerTimes.length; i++) {
      if (timeToMin(mainPrayerTimes[i].time) > currentMinutes) {
        active = i === 0 ? mainPrayerTimes[mainPrayerTimes.length - 1].id : mainPrayerTimes[i - 1].id;
        break;
      }
    }
    return active;
  }, [mainPrayerTimes]);

  const countdownUpcomingId = useMemo(() => {
    const now = new Date();
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
    const targetSet = activePage === 0 ? mainPrayerTimes : flattenedGridTimes;
    const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const nextTime = targetSet.find(p => timeToMin(p.time) > currentMinutesTotal);
    if (nextTime) return nextTime.id;
    const tomorrowSet = activePage === 0 ? tomorrowMainPrayerTimes : tomorrowFlattenedGridTimes;
    return tomorrowSet[0]?.id || targetSet[0]?.id || 'imsak';
  }, [activePage, mainPrayerTimes, flattenedGridTimes, tomorrowMainPrayerTimes, tomorrowFlattenedGridTimes]);

  const dateHeaderInfo = useMemo(() => {
    const now = new Date();
    const dayNum = now.getDate().toString().padStart(2, '0');
    const monthName = MONTH_NAMES_TR[now.getMonth()];
    const yearNum = now.getFullYear();
    const dayName = DAY_NAMES_TR[now.getDay()];

    const hicriStr = todayVakit?.['@attributes']?.hicri || 'RECEB 1447';
    const hicriParts = hicriStr.trim().split(/\s+/);
    const hicriDay = hicriParts[0] || '';
    const hicriSub = hicriParts.slice(1).join(' ') || 'RECEB 1447';

    return {
      gregorianDay: dayNum,
      gregorianSub: `${monthName} ${yearNum}`,
      dayName,
      hicriDay,
      hicriSub,
    };
  }, [todayVakit]);

  const toggleReminder = async (id: string) => {
    const hasPermission = await notificationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('İzin Gerekli', 'Bildirim gönderebilmek için bildirim izni vermeniz gerekmektedir.');
    }
    setReminders(prev => ({
      ...prev,
      [id]: {
        enabled: !prev[id]?.enabled,
        offset: prev[id]?.offset ?? 5,
      },
    }));
  };

  const toggleAllReminders = async () => {
    const hasPermission = await notificationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('İzin Gerekli', 'Bildirim gönderebilmek için bildirim izni vermeniz gerekmektedir.');
    }
    const allEnabled = mainPrayerTimes.every(p => reminders[p.id]?.enabled);
    const updated: Record<string, ReminderConfig> = { ...reminders };
    mainPrayerTimes.forEach(p => {
      updated[p.id] = {
        enabled: !allEnabled,
        offset: reminders[p.id]?.offset ?? 15,
      };
    });
    setReminders(updated);
  };

  const updateOffset = (id: string, offset: number) => {
    setReminders(prev => ({
      ...prev,
      [id]: {
        enabled: prev[id]?.enabled ?? true,
        offset,
      },
    }));
  };

  const handleShareQuote = async () => {
    const text = calendarDetail.gununSozu || 'İyi ameller güzel sûretlerle, kötü ameller de çirkin kıyâfetlerle gelecek, mizâna konacaktır. — İbn-i Abbâs (r.a.)';
    try {
      await Share.share({
        message: `📜 TÜRKİYE TAKVİMİ - GÜNÜN SÖZÜ\n\n"${text}"\n\n🕌 Türkiye Takvimi Uygulaması`,
        title: 'Günün Sözü',
      });
    } catch (e) {
      console.error('Share quote error:', e);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (activePage !== page) {
      setActivePage(page);
    }
  };

  const scrollToPage = (pageIndex: number) => {
    scrollRef.current?.scrollTo({ x: pageIndex * SCREEN_WIDTH, animated: true });
    setActivePage(pageIndex);
  };

  const getPrayerIcon = (id: string, size = 20, color = '#a01826') => {
    switch (id) {
      case 'imsak':
      case 'sabah':
        return <Sunrise size={size} color={color} />;
      case 'gunes':
      case 'israk':
        return <Sun size={size} color={color} />;
      case 'dahve':
      case 'ogle':
      case 'asr_evvel':
        return <SunMedium size={size} color={color} />;
      case 'kerahet':
      case 'isfirar':
        return <AlertTriangle size={size} color={color} />;
      case 'ikindi':
      case 'asr_sani':
        return <Clock size={size} color={color} />;
      case 'aksam':
      case 'istibak':
        return <Sunset size={size} color={color} />;
      case 'yatsi':
      case 'isa_evvel':
      case 'isa_sani':
        return <MoonStar size={size} color={color} />;
      case 'gece_yarisi':
      case 'teheccud':
        return <Stars size={size} color={color} />;
      case 'seher':
        return <CloudMoon size={size} color={color} />;
      case 'kible_saati':
        return <Compass size={size} color={color} />;
      default:
        return <Clock size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Unified Top Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerTopRow}>
          {/* Gregorian Date */}
          <View style={styles.dateColLeft}>
            <Text style={styles.dateDayText}>{dateHeaderInfo.gregorianDay}</Text>
            <Text style={styles.dateSubText}>{dateHeaderInfo.gregorianSub}</Text>
          </View>

          {/* Clickable City Selector with Dropdown Chevron */}
          <TouchableOpacity
            onPress={() => setShowCityModal(true)}
            activeOpacity={0.8}
            style={styles.cityColCenter}
          >
            <View style={styles.cityTitleRow}>
              <Text style={styles.cityTitle} numberOfLines={1}>
                {currentCity.city || currentCity.name}
              </Text>
              <ChevronDown size={18} color="#ffffff" style={styles.cityChevron} />
            </View>
            <Text style={styles.districtSubText} numberOfLines={1}>
              {currentCity.district ? `${currentCity.district} • Türk Takvimi` : 'TÜRK TAKVİMİ VAKİTLERİ'}
            </Text>
          </TouchableOpacity>

          {/* Hijri Date */}
          <View style={styles.dateColRight}>
            <Text style={styles.dateDayText}>{dateHeaderInfo.hicriDay}</Text>
            <Text style={styles.dateSubText}>{dateHeaderInfo.hicriSub}</Text>
          </View>
        </View>

        {/* Header Action Row: Day Pill + Organic Theme Toggle Button */}
        <View style={styles.headerBottomRow}>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>{dateHeaderInfo.dayName}</Text>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={styles.headerThemeBtn}
            accessibilityLabel="Temayı Değiştir"
          >
            {isDarkMode ? <Sun size={15} color="#ffffff" /> : <Moon size={15} color="#ffffff" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Switcher Control: [ Ana Vakitler (6) ] | [ 18 Vakit / Detaylı ] */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          onPress={() => scrollToPage(0)}
          activeOpacity={0.8}
          style={[
            styles.segmentButton,
            activePage === 0 && { backgroundColor: isDarkMode ? COLORS.primaryDark : COLORS.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentButtonText,
              { color: activePage === 0 ? '#ffffff' : theme.textSecondary },
            ]}
          >
            Ana Vakitler (6)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => scrollToPage(1)}
          activeOpacity={0.8}
          style={[
            styles.segmentButton,
            activePage === 1 && { backgroundColor: isDarkMode ? COLORS.primaryDark : COLORS.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentButtonText,
              { color: activePage === 1 ? '#ffffff' : theme.textSecondary },
            ]}
          >
            18 Vakit / Detaylı
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Pager for Content Cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {/* PAGE 1: MAIN 6-PERIOD VIEW + GÜNÜN SÖZÜ */}
        <ScrollView
          style={[styles.pageContent, { width: SCREEN_WIDTH }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.loadingBannerText, { color: theme.textMuted }]}>
                Türk Takvimi'nden vakitler güncelleniyor...
              </Text>
            </View>
          )}

          {/* Offline Indicator */}
          {!loading && isOffline && (
            <View style={styles.loadingBanner}>
              <Text style={[styles.loadingBannerText, { color: theme.textMuted }]}>
                Çevrimdışı — internet bağlantısı bekleniyor
              </Text>
            </View>
          )}

          {/* Main 6 Prayer List Card */}
          <PrayerListCard
            mainPrayerTimes={mainPrayerTimes}
            activePrayerId={activePrayerId}
            upcomingId={countdownUpcomingId}
            activePage={activePage}
            reminders={reminders}
            globalRemindersEnabled={globalRemindersEnabled}
            setShowSettings={setShowSettings}
            getPrayerIcon={getPrayerIcon}
            onToggleAllReminders={toggleAllReminders}
          />

          {/* Günün Sözü Card */}
          <View style={[styles.quoteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.quoteHeader}>
              <View style={styles.quoteHeaderLeft}>
                <View style={styles.quoteIconBox}>
                  <Quote size={13} color={COLORS.primary} />
                </View>
                <Text style={styles.quoteBadgeText}>GÜNÜN SÖZÜ</Text>
              </View>

              <TouchableOpacity
                onPress={handleShareQuote}
                activeOpacity={0.7}
                style={styles.quoteShareBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Share2 size={13} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
                <Text style={[styles.quoteShareText, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
                  Paylaş
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.quoteText, { color: theme.textSecondary }]} numberOfLines={2}>
              {calendarDetail.gununSozu || '"İyi ameller güzel sûretlerle, kötü ameller de çirkin kıyâfetlerle gelecek, mizâna konacaktır."'}
            </Text>

            <View style={styles.quoteFooterRow}>
              <Text style={[styles.quoteAuthor, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
                {calendarDetail.gununSozu ? '— Türk Takvimi' : '— İbn-i Abbâs (r.a.)'}
              </Text>
              <TouchableOpacity onPress={() => setShowQuoteModal(true)}>
                <Text style={[styles.readMoreText, { color: theme.textMuted }]}>Tamamını Gör ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* PAGE 2: DETAILED 18-PERIOD GRID VIEW */}
        <ScrollView
          style={[styles.pageContent, { width: SCREEN_WIDTH }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* 18-Period Grid Card */}
          <GridPrayerCard
            gridPrayerTimes={gridPrayerTimes}
            upcomingId={countdownUpcomingId}
            activePage={activePage}
            activePrayerId={activePrayerId}
            setShowSettings={setShowSettings}
            getPrayerIcon={getPrayerIcon}
          />
        </ScrollView>
      </ScrollView>

      {/* Dynamic Floating Countdown Widget */}
      <CountdownBanner
        activePage={activePage}
        mainPrayerTimes={mainPrayerTimes}
        flattenedGridTimes={flattenedGridTimes}
        tomorrowMainPrayerTimes={tomorrowMainPrayerTimes}
        tomorrowGridTimes={tomorrowFlattenedGridTimes}
        getPrayerIcon={getPrayerIcon}
      />

      {/* Quick City Switcher Modal */}
      <Modal
        visible={showCityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCityModal(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.citySheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.citySheetHeader}>
              <Text style={[styles.citySheetTitle, { color: theme.textPrimary }]}>Kayıtlı Şehirlerim</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)} style={styles.sheetCloseBtn}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {cities.map(c => {
                const isSel = c.id === currentCity.id || c.cityID === currentCity.cityID;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      selectCity(c.id);
                      setShowCityModal(false);
                    }}
                    style={[
                      styles.citySheetRow,
                      isSel && { backgroundColor: isDarkMode ? 'rgba(160,24,38,0.18)' : 'rgba(160,24,38,0.06)' },
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.citySheetRowName,
                          { color: isSel ? (isDarkMode ? COLORS.accentRed : COLORS.primary) : theme.textPrimary },
                        ]}
                      >
                        {c.name}
                      </Text>
                      <Text style={[styles.citySheetRowSub, { color: theme.textMuted }]}>
                        {c.city}, {c.country}
                      </Text>
                    </View>
                    {isSel && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setShowCityModal(false);
                onNavigateToSehirler?.();
              }}
              style={[styles.addNewCityBtn, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}
            >
              <Plus size={16} color={theme.textPrimary} />
              <Text style={[styles.addNewCityBtnText, { color: theme.textPrimary }]}>Yeni Şehir Ekle</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quote Detail Modal */}
      <Modal
        visible={showQuoteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuoteModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowQuoteModal(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.quoteModalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.quoteModalHeader}>
              <View style={styles.quoteHeaderLeft}>
                <BookOpen size={18} color={COLORS.primary} />
                <Text style={[styles.quoteModalTitle, { color: theme.textPrimary }]}>Günün Takvim Yaprağı</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQuoteModal(false)} style={styles.sheetCloseBtn}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280, marginVertical: 12 }}>
              <Text style={[styles.quoteFullText, { color: theme.textPrimary }]}>
                {calendarDetail.gununSozu || '"İyi ameller güzel sûretlerle, kötü ameller de çirkin kıyâfetlerle gelecek, mizâna konacaktır."'}
              </Text>
              <Text style={[styles.quoteAuthorModal, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
                {calendarDetail.gununSozu ? '— Türk Takvimi' : '— İbn-i Abbâs (r.a.)'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setShowQuoteModal(false);
                handleShareQuote();
              }}
              style={[styles.modalShareBtn, { backgroundColor: COLORS.primary }]}
            >
              <Share2 size={16} color="#ffffff" />
              <Text style={styles.modalShareBtnText}>PAYLAŞ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notification Settings Modal */}
      <ReminderModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        reminders={reminders}
        toggleReminder={toggleReminder}
        updateOffset={updateOffset}
      />
    </View>
  );
};

export default Vakitler;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 85,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerBanner: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  dateColLeft: {
    alignItems: 'flex-start',
  },
  dateColRight: {
    alignItems: 'flex-end',
  },
  dateDayText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  dateSubText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
  },
  cityColCenter: {
    alignItems: 'center',
    maxWidth: 170,
  },
  cityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  cityChevron: {
    marginLeft: 3,
    marginTop: 2,
  },
  districtSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  dayPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 14,
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  headerThemeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 2.5,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quoteCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quoteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteIconBox: {
    padding: 4,
    backgroundColor: 'rgba(160, 24, 38, 0.08)',
    borderRadius: 6,
    marginRight: 6,
  },
  quoteBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 1.2,
  },
  quoteShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(160, 24, 38, 0.06)',
  },
  quoteShareText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    fontWeight: '500',
  },
  quoteFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  quoteAuthor: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  readMoreText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  citySheet: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  citySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  citySheetTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  citySheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  citySheetRowName: {
    fontSize: 14,
    fontWeight: '800',
  },
  citySheetRowSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  addNewCityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  addNewCityBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  quoteModalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  quoteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quoteModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 8,
  },
  quoteFullText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  quoteAuthorModal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  modalShareBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
