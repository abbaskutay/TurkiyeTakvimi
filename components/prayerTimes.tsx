import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import {
  MOCK_PRAYER_TIMES,
  GRID_PRAYER_TIMES,
  COLORS,
  mapVakitToMainPrayerTimes,
  mapVakitToGridPrayerTimes,
  timeToMinutes,
} from '../constants';
import { PrayerTime, DetailedPrayerTime, ReminderConfig } from '../types';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { useLanguage } from '../context/LanguageContext';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { translations } from '../locales';
import { quoteTranslationService } from '../services/quoteTranslationService';
import { getLocalDateString } from '../utils/dateUtils';

// Subcomponents
import { getPrayerIcon } from './prayerTimes/prayerIcons';
import { VakitlerHeader, DateHeaderInfo } from './prayerTimes/prayerTimesHeader';
import { SegmentedControl } from './prayerTimes/segmentedControl';
import { CountdownBanner } from './prayerTimes/countdownBanner';
import { PrayerListCard } from './prayerTimes/prayerListCard';
import { GridPrayerCard } from './prayerTimes/gridPrayerCard';
import { QuoteCard } from './prayerTimes/quoteCard';
import { CityPickerModal } from './prayerTimes/cityPickerModal';
import { QuoteDetailModal } from './prayerTimes/quoteDetailModal';
import { ReminderModal } from './prayerTimes/reminderModal';
import { YearTransitionModal } from './prayerTimes/yearTransitionModal';
import { LanguageModal } from './languageModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES_TR = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK',
];

const DAY_NAMES_TR = [
  'PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ',
];

interface VakitlerProps {
  onNavigateToSehirler?: () => void;
}

export const Vakitler: React.FC<VakitlerProps> = ({ onNavigateToSehirler }) => {
  const { isDarkMode, theme } = useTheme();
  const { currentCity } = useCity();
  const { language, isRTL, t, toUpper } = useLanguage();

  const [reminders, setReminders] = useState<Record<string, ReminderConfig>>({});
  const [globalRemindersEnabled, setGlobalRemindersEnabled] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showYearTransition, setShowYearTransition] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [translatedQuote, setTranslatedQuote] = useState<string | null>(null);

  // Time ticker to update activePrayerId whenever the clock advances past a prayer time
  const [currentMinutesTotal, setCurrentMinutesTotal] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutesTotal(now.getHours() * 60 + now.getMinutes());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentYear = new Date().getFullYear();
  const scrollRef = useRef<ScrollView>(null);
  const cityID = currentCity.cityID || '16741';

  const {
    vakitList,
    todayVakit,
    tomorrowVakit,
    calendarDetail,
    loading,
    isOffline,
  } = usePrayerTimes(cityID);

  // Translate quote of the day if language is not Turkish
  useEffect(() => {
    let isMounted = true;
    const rawQuote = calendarDetail.gununSozu;
    if (!rawQuote) {
      setTranslatedQuote(null);
      return;
    }

    if (language === 'tr') {
      setTranslatedQuote(rawQuote);
      return;
    }

    const todayStr = getLocalDateString(new Date());
    quoteTranslationService.getOrTranslateQuote(rawQuote, todayStr, language).then(translated => {
      if (isMounted) {
        setTranslatedQuote(translated);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [calendarDetail.gununSozu, language]);

  const activeQuote =
    translatedQuote ||
    calendarDetail.gununSozu ||
    'İyi ameller güzel sûretlerle, kötü ameller de çirkin kıyâfetlerle gelecek, mizâna konacaktır.';

  const quoteAuthor = useMemo(() => {
    if (language === 'ar') {
      return calendarDetail.gununSozu ? '— تقويم تركيا' : '— ابن عباس (رضي الله عنه)';
    }
    if (language === 'en') {
      return calendarDetail.gununSozu ? '— Turkiye Calendar' : '— Ibn Abbas (r.a.)';
    }
    return calendarDetail.gununSozu ? '— Türkiye Takvimi' : '— İbn-i Abbâs (r.a.)';
  }, [language, calendarDetail.gununSozu]);

  // Initialize reminder config from storageService
  useEffect(() => {
    const loadReminders = async () => {
      const saved = await storageService.getReminders();
      const hasCheckedV2 = await AsyncStorage.getItem('@prayer_reminders_default_v2');
      if (saved && hasCheckedV2) {
        setReminders(saved);
      } else {
        const config: Record<string, ReminderConfig> = {};
        MOCK_PRAYER_TIMES.forEach(p => {
          const prevOffset = saved?.[p.id]?.offset;
          // Default to exact prayer time (offset 0), migrating legacy default of 5 or 15
          const newOffset = prevOffset === 5 || prevOffset === 15 || prevOffset === undefined ? 0 : prevOffset;
          config[p.id] = {
            enabled: saved?.[p.id]?.enabled ?? false,
            offset: newOffset,
          };
        });
        setReminders(config);
        await storageService.setReminders(config);
        await AsyncStorage.setItem('@prayer_reminders_default_v2', 'true');
      }
      const globalSaved = await storageService.getGlobalRemindersEnabled();
      setGlobalRemindersEnabled(globalSaved);
    };
    loadReminders();
  }, []);

  // Check if calendar year has transitioned
  useEffect(() => {
    const checkYearTransition = async () => {
      const lastSynced = await storageService.getLastSyncedYear();
      if (lastSynced !== null && currentYear > lastSynced) {
        setShowYearTransition(true);
      } else if (lastSynced === null) {
        await storageService.setLastSyncedYear(currentYear);
      }
    };
    checkYearTransition();
  }, [currentYear]);

  const handleYearTransitionComplete = async () => {
    await storageService.setLastSyncedYear(currentYear);
    setShowYearTransition(false);
  };

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
  const tomorrowFlattenedGridTimes = useMemo(
    () => tomorrowGridPrayerTimes.flat(),
    [tomorrowGridPrayerTimes]
  );

  const chronologicalGridTimes = useMemo(() => {
    return [...flattenedGridTimes].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [flattenedGridTimes]);

  const chronologicalTomorrowGridTimes = useMemo(() => {
    return [...tomorrowFlattenedGridTimes].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [tomorrowFlattenedGridTimes]);

  const activePrayerId = useMemo(() => {
    const targetSet = activePage === 0 ? mainPrayerTimes : chronologicalGridTimes;
    if (!targetSet || targetSet.length === 0) return 'yatsi';
    let active = targetSet[targetSet.length - 1]?.id || (activePage === 0 ? 'yatsi' : 'isa_sani');
    for (let i = 0; i < targetSet.length; i++) {
      if (timeToMinutes(targetSet[i].time) > currentMinutesTotal) {
        active = i === 0 ? targetSet[targetSet.length - 1].id : targetSet[i - 1].id;
        break;
      }
    }
    return active;
  }, [activePage, mainPrayerTimes, chronologicalGridTimes, currentMinutesTotal]);

  const countdownUpcomingId = useMemo(() => {
    const targetSet = activePage === 0 ? mainPrayerTimes : chronologicalGridTimes;
    const nextTime = targetSet.find(p => timeToMinutes(p.time) > currentMinutesTotal);
    if (nextTime) return nextTime.id;
    const tomorrowSet = activePage === 0 ? tomorrowMainPrayerTimes : chronologicalTomorrowGridTimes;
    return tomorrowSet[0]?.id || targetSet[0]?.id || (activePage === 0 ? 'imsak' : 'gece_yarisi');
  }, [activePage, mainPrayerTimes, chronologicalGridTimes, tomorrowMainPrayerTimes, chronologicalTomorrowGridTimes, currentMinutesTotal]);

  const dateHeaderInfo: DateHeaderInfo = useMemo(() => {
    const now = new Date();
    const dayNum = now.getDate().toString().padStart(2, '0');
    const monthNames = translations[language]?.months?.gregorianUpper || MONTH_NAMES_TR;
    const monthName = monthNames[now.getMonth()] || MONTH_NAMES_TR[now.getMonth()];
    const yearNum = now.getFullYear();
    const dayNames = translations[language]?.months?.weekdaysUpper || DAY_NAMES_TR;
    const dayName = dayNames[now.getDay()] || DAY_NAMES_TR[now.getDay()];

    const hicriStr = todayVakit?.['@attributes']?.hicri || 'RECEB 1447';
    const hicriParts = hicriStr.trim().split(/\s+/);
    const hicriDay = hicriParts[0] || '';
    const hicriYear = hicriParts[hicriParts.length - 1] || '1447';
    const hicriMonthRaw = hicriParts.slice(1, -1).join(' ') || hicriParts.slice(1).join(' ');
    const hijriDict = translations[language]?.months?.hijri || {};
    const localizedHicriMonth = hijriDict[hicriMonthRaw] || hicriMonthRaw;
    const hicriSub = `${localizedHicriMonth} ${hicriYear}`.trim();

    return {
      gregorianDay: dayNum,
      gregorianSub: `${monthName} ${yearNum}`,
      dayName,
      hicriDay,
      hicriSub,
    };
  }, [todayVakit, language]);

  const toggleReminder = async (id: string) => {
    const hasPermission = await notificationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert(t('reminders.notificationPermission'), t('reminders.notificationPermissionDesc'));
    }
    setReminders(prev => ({
      ...prev,
      [id]: {
        enabled: !prev[id]?.enabled,
        offset: prev[id]?.offset ?? 0,
      },
    }));
  };

  const toggleAllReminders = async () => {
    const hasPermission = await notificationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert(t('reminders.notificationPermission'), t('reminders.notificationPermissionDesc'));
    }
    const allEnabled = mainPrayerTimes.every(p => reminders[p.id]?.enabled);
    const updated: Record<string, ReminderConfig> = { ...reminders };
    mainPrayerTimes.forEach(p => {
      updated[p.id] = {
        enabled: !allEnabled,
        offset: reminders[p.id]?.offset ?? 0,
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
    const text = activeQuote;
    const shareTitle = language === 'ar' ? 'حكمة اليوم' : language === 'en' ? 'Quote of the Day' : 'Günün Sözü';
    const appHeader = language === 'ar' ? '📜 تقويم تركيا - حكمة اليوم' : language === 'en' ? '📜 TURKIYE CALENDAR - QUOTE OF THE DAY' : '📜 TÜRKİYE TAKVİMİ - GÜNÜN SÖZÜ';
    const appFooter = language === 'ar' ? '🕌 تطبيق تقويم تركيا' : language === 'en' ? '🕌 Turkiye Calendar' : '🕌 Türkiye Takvimi';
    try {
      await Share.share({
        message: `${appHeader}\n\n"${text}"\n\n${appFooter}`,
        title: shareTitle,
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Unified Top Header Banner */}
      <VakitlerHeader
        currentCity={currentCity}
        dateHeaderInfo={dateHeaderInfo}
        onCityPress={() => setShowCityModal(true)}
        onYearTransitionPress={() => setShowYearTransition(true)}
        onLanguagePress={() => setShowLanguageModal(true)}
      />

      {/* Segmented Switcher Control: [ Ana Vakitler (6) ] | [ 18 Vakit / Detaylı ] */}
      <SegmentedControl
        activePage={activePage}
        onSelectPage={scrollToPage}
      />

      {/* Horizontal Pager for Content Cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {/* PAGE 1: MAIN 6-PERIOD VIEW + GÜNÜN SÖZÜ (Fixed viewport - no vertical scrolling) */}
        <View
          style={[styles.pageOneContent, { width: SCREEN_WIDTH }]}
        >
          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.loadingBannerText, { color: theme.textMuted }]}>
                {t('vakitler.updatingTimes')}
              </Text>
            </View>
          )}

          {/* Offline Indicator */}
          {!loading && isOffline && (
            <View style={styles.loadingBanner}>
              <Text style={[styles.loadingBannerText, { color: theme.textMuted }]}>
                {t('vakitler.offlineNotice')}
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
          <QuoteCard
            activeQuote={activeQuote}
            quoteAuthor={quoteAuthor}
            onShare={handleShareQuote}
            onReadMore={() => setShowQuoteModal(true)}
          />
        </View>

        {/* PAGE 2: DETAILED 18-PERIOD GRID VIEW (Fixed viewport - no vertical scrolling) */}
        <View
          style={[styles.pageTwoContent, { width: SCREEN_WIDTH }]}
        >
          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.loadingBannerText, { color: theme.textMuted }]}>
                {t('vakitler.updatingTimes')}
              </Text>
            </View>
          )}

          {/* Offline Indicator */}
          {!loading && isOffline && (
            <View style={styles.loadingBanner}>
              <Text style={[styles.loadingBannerText, { color: theme.textMuted }]}>
                {t('vakitler.offlineNotice')}
              </Text>
            </View>
          )}

          {/* 18-Period Grid Card */}
          <GridPrayerCard
            gridPrayerTimes={gridPrayerTimes}
            upcomingId={countdownUpcomingId}
            activePage={activePage}
            activePrayerId={activePrayerId}
            setShowSettings={setShowSettings}
            getPrayerIcon={getPrayerIcon}
          />
        </View>
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
      <CityPickerModal
        visible={showCityModal}
        onClose={() => setShowCityModal(false)}
        onNavigateToSehirler={onNavigateToSehirler}
      />

      {/* Quote Detail Modal */}
      <QuoteDetailModal
        visible={showQuoteModal}
        activeQuote={activeQuote}
        quoteAuthor={quoteAuthor}
        onClose={() => setShowQuoteModal(false)}
        onShare={handleShareQuote}
      />

      {/* Notification Settings Modal */}
      <ReminderModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        reminders={reminders}
        toggleReminder={toggleReminder}
        updateOffset={updateOffset}
      />

      {/* New Year Transition & Download Countdown Modal */}
      <YearTransitionModal
        visible={showYearTransition}
        targetYear={currentYear}
        loading={loading}
        onComplete={handleYearTransitionComplete}
        isDarkMode={isDarkMode}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
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
  pageOneContent: {
    flex: 1,
    paddingBottom: 76,
  },
  pageTwoContent: {
    flex: 1,
    paddingBottom: 76,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  loadingBannerText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
