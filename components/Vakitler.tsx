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
  Globe,
} from 'lucide-react-native';
import {
  MOCK_PRAYER_TIMES,
  GRID_PRAYER_TIMES,
  COLORS,
  mapVakitToMainPrayerTimes,
  mapVakitToGridPrayerTimes,
  timeToMinutes,
} from '../constants';
import { City, PrayerTime, DetailedPrayerTime, ReminderConfig } from '../types';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { useLanguage } from '../context/LanguageContext';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { CountdownBanner } from './vakitler/CountdownBanner';
import { PrayerListCard } from './vakitler/PrayerListCard';
import { GridPrayerCard } from './vakitler/GridPrayerCard';
import { ReminderModal } from './vakitler/ReminderModal';
import { YearTransitionModal } from './vakitler/YearTransitionModal';
import { LanguageModal } from './LanguageModal';
import { translations } from '../locales';
import { quoteTranslationService } from '../services/quoteTranslationService';
import { getLocalDateString } from '../utils/dateUtils';

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
  const { language, isRTL, t, getPrayerName, toUpper } = useLanguage();
  const currentCity = propCity || contextCity;

  const [reminders, setReminders] = useState<Record<string, ReminderConfig>>({});
  const [globalRemindersEnabled, setGlobalRemindersEnabled] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showYearTransition, setShowYearTransition] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const currentYear = new Date().getFullYear();
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

  const [translatedQuote, setTranslatedQuote] = useState<string | null>(null);

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

  const activeQuote = translatedQuote || calendarDetail.gununSozu || 'İyi ameller güzel sûretlerle, kötü ameller de çirkin kıyâfetlerle gelecek, mizâna konacaktır.';

  const quoteAuthor = useMemo(() => {
    if (language === 'ar') {
      return calendarDetail.gununSozu ? '— تقويم تركيا' : '— ابن عباس (رضي الله عنه)';
    }
    if (language === 'en') {
      return calendarDetail.gununSozu ? '— Türkiye Takvimi' : '— Ibn Abbas (r.a.)';
    }
    return calendarDetail.gununSozu ? '— Türkiye Takvimi' : '— İbn-i Abbâs (r.a.)';
  }, [language, calendarDetail.gununSozu]);

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
  const tomorrowFlattenedGridTimes = useMemo(() => tomorrowGridPrayerTimes.flat(), [tomorrowGridPrayerTimes]);

  const chronologicalGridTimes = useMemo(() => {
    return [...flattenedGridTimes].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [flattenedGridTimes]);

  const chronologicalTomorrowGridTimes = useMemo(() => {
    return [...tomorrowFlattenedGridTimes].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [tomorrowFlattenedGridTimes]);

  const activePrayerId = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetSet = activePage === 0 ? mainPrayerTimes : chronologicalGridTimes;
    if (!targetSet || targetSet.length === 0) return 'yatsi';
    let active = targetSet[targetSet.length - 1]?.id || (activePage === 0 ? 'yatsi' : 'isa_sani');
    for (let i = 0; i < targetSet.length; i++) {
      if (timeToMinutes(targetSet[i].time) > currentMinutes) {
        active = i === 0 ? targetSet[targetSet.length - 1].id : targetSet[i - 1].id;
        break;
      }
    }
    return active;
  }, [activePage, mainPrayerTimes, chronologicalGridTimes]);

  const countdownUpcomingId = useMemo(() => {
    const now = new Date();
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
    const targetSet = activePage === 0 ? mainPrayerTimes : chronologicalGridTimes;
    const nextTime = targetSet.find(p => timeToMinutes(p.time) > currentMinutesTotal);
    if (nextTime) return nextTime.id;
    const tomorrowSet = activePage === 0 ? tomorrowMainPrayerTimes : chronologicalTomorrowGridTimes;
    return tomorrowSet[0]?.id || targetSet[0]?.id || (activePage === 0 ? 'imsak' : 'gece_yarisi');
  }, [activePage, mainPrayerTimes, chronologicalGridTimes, tomorrowMainPrayerTimes, chronologicalTomorrowGridTimes]);

  const dateHeaderInfo = useMemo(() => {
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
    const text = activeQuote;
    const shareTitle = language === 'ar' ? 'حكمة اليوم' : language === 'en' ? 'Quote of the Day' : 'Günün Sözü';
    const appHeader = language === 'ar' ? '📜 تقويم تركيا - حكمة اليوم' : language === 'en' ? '📜 TÜRKİYE TAKVİMİ - QUOTE OF THE DAY' : '📜 TÜRKİYE TAKVİMİ - GÜNÜN SÖZÜ';
    const appFooter = language === 'ar' ? '🕌 تطبيق تقويم تركيا' : '🕌 Türkiye Takvimi';
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
        <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Gregorian Date (Long press to preview Year Transition) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setShowYearTransition(true)}
            style={[styles.dateColLeft, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}
          >
            <Text style={[styles.dateDayText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {dateHeaderInfo.gregorianDay}
            </Text>
            <Text style={[styles.dateSubText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {dateHeaderInfo.gregorianSub}
            </Text>
          </TouchableOpacity>

          {/* Clickable City Selector with Dropdown Chevron */}
          <TouchableOpacity
            onPress={() => setShowCityModal(true)}
            activeOpacity={0.8}
            style={styles.cityColCenter}
          >
            <View style={[styles.cityTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.cityTitle} numberOfLines={1}>
                {currentCity.city || currentCity.name}
              </Text>
              <ChevronDown size={16} color="#ffffff" style={styles.cityChevron} />
            </View>
            <Text style={styles.districtSubText} numberOfLines={1}>
              {currentCity.district ? `${currentCity.district} • Türkiye Takvimi` : t('vakitler.turkiyeTakvimiTimes')}
            </Text>
          </TouchableOpacity>

          {/* Hijri Date */}
          <View style={[styles.dateColRight, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
            <Text style={[styles.dateDayText, { textAlign: isRTL ? 'left' : 'right' }]}>
              {dateHeaderInfo.hicriDay}
            </Text>
            <Text style={[styles.dateSubText, { textAlign: isRTL ? 'left' : 'right' }]} numberOfLines={1}>
              {dateHeaderInfo.hicriSub}
            </Text>
          </View>
        </View>

        {/* Header Action Row: Day Pill + Language Button + Organic Theme Toggle Button */}
        <View style={[styles.headerBottomRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>{dateHeaderInfo.dayName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.8}
            style={styles.headerLangBtn}
            accessibilityLabel={t('language.changeLanguage')}
          >
            <Globe size={13} color="#ffffff" />
            <Text style={styles.headerLangText}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={styles.headerThemeBtn}
            accessibilityLabel={t('common.themeToggle')}
          >
            {isDarkMode ? <Sun size={15} color="#ffffff" /> : <Moon size={15} color="#ffffff" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Switcher Control: [ Ana Vakitler (6) ] | [ 18 Vakit / Detaylı ] */}
      <View
        style={[
          styles.segmentContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
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
            {t('vakitler.mainPrayers')}
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
            {t('vakitler.allPrayers')}
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
                Türkiye Takvimi'nden vakitler güncelleniyor...
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
              <View style={[styles.quoteHeaderLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.quoteIconBox, isRTL ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }]}>
                  <Quote size={13} color={COLORS.primary} />
                </View>
                <Text style={styles.quoteBadgeText}>{toUpper(t('vakitler.quoteOfTheDay'))}</Text>
              </View>

              <TouchableOpacity
                onPress={handleShareQuote}
                activeOpacity={0.7}
                style={[styles.quoteShareBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Share2 size={13} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
                <Text style={[styles.quoteShareText, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
                  {t('common.share')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.quoteText,
                { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' },
              ]}
              numberOfLines={2}
            >
              {activeQuote}
            </Text>

            <View style={[styles.quoteFooterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.quoteAuthor, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
                {quoteAuthor}
              </Text>
              <TouchableOpacity onPress={() => setShowQuoteModal(true)}>
                <Text style={[styles.readMoreText, { color: theme.textMuted }]}>
                  {t('vakitler.readMore')} ›
                </Text>
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
            <View style={[styles.citySheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.citySheetTitle, { color: theme.textPrimary }]}>{t('cities.savedCities')}</Text>
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
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      isSel && { backgroundColor: isDarkMode ? 'rgba(160,24,38,0.18)' : 'rgba(160,24,38,0.06)' },
                    ]}
                  >
                    <View style={isRTL && { alignItems: 'flex-end' }}>
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
              style={[
                styles.addNewCityBtn,
                {
                  backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Plus size={16} color={theme.textPrimary} />
              <Text style={[styles.addNewCityBtnText, { color: theme.textPrimary }]}>
                {t('cities.addCityTab')}
              </Text>
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
            <View style={[styles.quoteModalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.quoteHeaderLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <BookOpen size={18} color={COLORS.primary} />
                <Text style={[styles.quoteModalTitle, { color: theme.textPrimary }]}>
                  {t('vakitler.quoteOfTheDay')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowQuoteModal(false)} style={styles.sheetCloseBtn}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280, marginVertical: 12 }}>
              <Text
                style={[
                  styles.quoteFullText,
                  { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {activeQuote}
              </Text>
              <Text style={[styles.quoteAuthorModal, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
                {quoteAuthor}
              </Text>
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setShowQuoteModal(false);
                handleShareQuote();
              }}
              style={[
                styles.modalShareBtn,
                { backgroundColor: COLORS.primary, flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Share2 size={16} color="#ffffff" />
              <Text style={styles.modalShareBtnText}>{toUpper(t('common.share'))}</Text>
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
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dateColRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
    letterSpacing: 0.6,
  },
  cityColCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    maxWidth: '46%',
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
    textAlign: 'center',
  },
  cityChevron: {
    marginHorizontal: 3,
    marginTop: 2,
  },
  districtSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
    marginTop: 1,
    textAlign: 'center',
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  dayPill: {
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  headerThemeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
  },
  headerLangText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
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
