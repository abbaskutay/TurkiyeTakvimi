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
  History,
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
}

export const Vakitler: React.FC<VakitlerProps> = ({ currentCity: propCity }) => {
  const { isDarkMode, theme } = useTheme();
  const { currentCity: contextCity } = useCity();
  const currentCity = propCity || contextCity;

  const [reminders, setReminders] = useState<Record<string, ReminderConfig>>({});
  const [globalRemindersEnabled, setGlobalRemindersEnabled] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const cityID = currentCity.cityID || currentCity.id || '16741';

  const {
    vakitList,
    todayVakit,
    tomorrowVakit,
    calendarDetail,
    loading,
    refreshing,
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

  const updateOffset = (id: string, offset: number) => {
    setReminders(prev => ({
      ...prev,
      [id]: {
        enabled: prev[id]?.enabled ?? true,
        offset,
      },
    }));
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
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {/* PAGE 1: MAIN LIST VIEW */}
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
          {/* Header Banner */}
          <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
            <View style={styles.headerTopRow}>
              <View style={styles.dateColLeft}>
                <Text style={styles.dateDayText}>{dateHeaderInfo.gregorianDay}</Text>
                <Text style={styles.dateSubText}>{dateHeaderInfo.gregorianSub}</Text>
              </View>

              <View style={styles.cityColCenter}>
                <Text style={styles.cityTitle}>{currentCity.city || currentCity.name}</Text>
                <Text style={styles.districtSubText} numberOfLines={1}>
                  {currentCity.district ? `${currentCity.district} • Türk Takvimi` : 'TÜRK TAKVİMİ VAKİTLERİ'}
                </Text>
              </View>

              <View style={styles.dateColRight}>
                <Text style={styles.dateDayText}>{dateHeaderInfo.hicriDay}</Text>
                <Text style={styles.dateSubText}>{dateHeaderInfo.hicriSub}</Text>
              </View>
            </View>

            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>{dateHeaderInfo.dayName}</Text>
            </View>
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.loadingBannerText, { color: theme.textMuted }]}>
                Türk Takvimi'nden vakitler güncelleniyor...
              </Text>
            </View>
          )}

          {/* Günün Olayı Card */}
          {calendarDetail.gununOlayi ? (
            <View style={[styles.quoteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quoteHeader}>
                <View style={styles.quoteIconBox}>
                  <History size={14} color={COLORS.primary} />
                </View>
                <Text style={styles.quoteBadgeText}>GÜNÜN OLAYI</Text>
              </View>
              <Text style={[styles.quoteText, { color: theme.textSecondary }]}>
                {calendarDetail.gununOlayi}
              </Text>
            </View>
          ) : null}

          {/* Günün Sözü Card */}
          <View style={[styles.quoteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.quoteHeader}>
              <View style={styles.quoteIconBox}>
                <Quote size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.quoteBadgeText}>GÜNÜN SÖZÜ</Text>
            </View>
            <Text style={[styles.quoteText, { color: theme.textSecondary }]}>
              {calendarDetail.gununSozu || '"İyi ameller güzel sûretlerle, kötü ameller de çirkin kıyâfetlerle gelecek, mizâna konacaktır."'}
            </Text>
            {!calendarDetail.gununSozu && (
              <Text style={[styles.quoteAuthor, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
                — İbn-i Abbâs (r.a.)
              </Text>
            )}
          </View>

          {/* Takvim Arka Yüzü Card */}
          {calendarDetail.arkayuzYazi ? (
            <View style={[styles.quoteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quoteHeader}>
                <View style={styles.quoteIconBox}>
                  <BookOpen size={14} color={COLORS.primary} />
                </View>
                <Text style={styles.quoteBadgeText}>
                  {calendarDetail.arkayuzBaslik || 'TAKVİM YAZISI'}
                </Text>
              </View>
              <Text style={[styles.quoteText, { color: theme.textSecondary }]}>
                {calendarDetail.arkayuzYazi}
              </Text>
            </View>
          ) : null}

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
          />
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
          {/* Header Banner */}
          <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
            <View style={styles.headerTopRow}>
              <View style={styles.dateColLeft}>
                <Text style={styles.dateDayText}>{dateHeaderInfo.gregorianDay}</Text>
                <Text style={styles.dateSubText}>{dateHeaderInfo.gregorianSub}</Text>
              </View>

              <View style={styles.cityColCenter}>
                <Text style={styles.cityTitle}>{currentCity.city || currentCity.name}</Text>
                <Text style={styles.districtSubText}>DETAYLI VAKİTLER</Text>
              </View>

              <View style={styles.dateColRight}>
                <Text style={styles.dateDayText}>{dateHeaderInfo.hicriDay}</Text>
                <Text style={styles.dateSubText}>{dateHeaderInfo.hicriSub}</Text>
              </View>
            </View>

            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>{dateHeaderInfo.dayName}</Text>
            </View>
          </View>

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

      {/* Page Indicator Dots */}
      <View style={styles.pageDotsContainer}>
        <TouchableOpacity
          onPress={() => scrollToPage(0)}
          style={[styles.dot, activePage === 0 ? styles.activeDot : { backgroundColor: theme.cardBorder }]}
        />
        <TouchableOpacity
          onPress={() => scrollToPage(1)}
          style={[styles.dot, activePage === 1 ? styles.activeDot : { backgroundColor: theme.cardBorder }]}
        />
      </View>

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
    paddingBottom: 150,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerBanner: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  dateColLeft: {
    alignItems: 'flex-start',
  },
  dateColRight: {
    alignItems: 'flex-end',
  },
  dateDayText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  dateSubText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  cityColCenter: {
    alignItems: 'center',
    maxWidth: 160,
  },
  cityTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  districtSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginTop: 2,
  },
  dayPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  quoteCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteIconBox: {
    padding: 5,
    backgroundColor: 'rgba(160, 24, 38, 0.08)',
    borderRadius: 8,
    marginRight: 8,
  },
  quoteBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 1.5,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    fontWeight: '500',
  },
  quoteAuthor: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 1,
  },
  pageDotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 4,
    width: 6,
    borderRadius: 2,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
});
