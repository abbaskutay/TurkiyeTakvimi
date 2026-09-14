import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MoonStar, Sun, Moon, Globe } from 'lucide-react-native';
import { ImportantDay } from '../types';
import { COLORS, MOCK_IMPORTANT_DAYS, mapCalendarToImportantDays } from '../constants';
import { turkTakvimApi } from '../services/turkishCalendarApi';
import { storageService } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageModal } from './languageModal';
import { formatGregorianDate, formatHicriDate } from '../utils/dateUtils';
import { translations } from '../locales';

function getLocalizedDayName(name: string, holyDaysDict: Record<string, string>): string {
  if (!holyDaysDict) return name;
  const lower = name.toLowerCase();
  if (lower.includes('mi’râc') || lower.includes("mi'râc") || lower.includes('mirac') || lower.includes('miraç')) return holyDaysDict.mirac || name;
  if (lower.includes('berât') || lower.includes('berat')) return holyDaysDict.berat || name;
  if ((lower.includes('ramezân') || lower.includes('ramazan')) && (lower.includes('başlangıç') || lower.includes('başlangıcı') || lower.includes('baslangic') || lower.includes('baslangici'))) return holyDaysDict.ramazan_start || name;
  if (lower.includes('kadir') || lower.includes('kadr')) return holyDaysDict.kadir || name;
  if (lower.includes('fıtr bayramı gecesi') || lower.includes('fitr bayrami gecesi')) return holyDaysDict.fitr_eve || name;
  if ((lower.includes('fıtr') || lower.includes('fitr')) && lower.includes('1.')) return holyDaysDict.fitr_day1 || name;
  if ((lower.includes('fıtr') || lower.includes('fitr')) && lower.includes('2.')) return holyDaysDict.fitr_day2 || name;
  if ((lower.includes('fıtr') || lower.includes('fitr')) && lower.includes('3.')) return holyDaysDict.fitr_day3 || name;
  if (lower.includes('terviye')) return holyDaysDict.terviye || name;
  if (lower.includes('arefe')) return holyDaysDict.arefe || name;
  if (lower.includes('kurban') && lower.includes('1.')) return holyDaysDict.adha_day1 || name;
  if (lower.includes('kurban') && lower.includes('2.')) return holyDaysDict.adha_day2 || name;
  if (lower.includes('kurban') && lower.includes('3.')) return holyDaysDict.adha_day3 || name;
  if (lower.includes('kurban') && lower.includes('4.')) return holyDaysDict.adha_day4 || name;
  if (lower.includes('senebaşı') || lower.includes('yılbaşı günü') || lower.includes('senebasi')) return holyDaysDict.hijri_year || name;
  if (lower.includes('muharrem') && (lower.includes('gecesi') || lower.includes('yılbaşı') || lower.includes('yilbasi'))) return holyDaysDict.hijri_eve || name;
  if (lower.includes('aşûre gecesi') || lower.includes('asure gecesi')) return holyDaysDict.asure_eve || name;
  if (lower.includes('aşûre') || lower.includes('asure')) return holyDaysDict.asure_day || name;
  if (lower.includes('mevlid')) return holyDaysDict.mevlid || name;
  if (lower.includes('regâib') || lower.includes('regaib')) return holyDaysDict.regaib || name;
  return name;
}

export const Gunler: React.FC = () => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { language, t, isRTL } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [importantDays, setImportantDays] = useState<ImportantDay[]>(MOCK_IMPORTANT_DAYS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const fetchImportantDays = useCallback(async (forceRefresh = false) => {
    // Serve the cached year list immediately; keeps the screen usable offline
    // once this year has been fetched at least once.
    const cached = await storageService.getCachedImportantDays(currentYear);
    if (cached && cached.length > 0) {
      setImportantDays(cached);
      if (!forceRefresh) setLoading(false);
    } else if (!forceRefresh) {
      setLoading(true);
    }

    try {
      const veriList = await turkTakvimApi.getCalendarDetail(
        `${currentYear}-01-01`,
        `${currentYear}-12-31`
      );
      const days = mapCalendarToImportantDays(veriList);
      if (days.length > 0) {
        setImportantDays(days);
        await storageService.setCachedImportantDays(currentYear, days);
      } else if (!cached) {
        setImportantDays(MOCK_IMPORTANT_DAYS);
      }
    } catch (error) {
      console.error('Important days fetch error:', error);
      if (!cached) {
        setImportantDays(MOCK_IMPORTANT_DAYS);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchImportantDays();
  }, [fetchImportantDays]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchImportantDays(true);
  }, [fetchImportantDays]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
        <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={isRTL && { alignItems: 'flex-end' }}>
            <Text style={styles.headerTitle}>{t('days.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('days.subtitle')}</Text>
          </View>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(true)}
              activeOpacity={0.8}
              style={styles.headerThemeBtn}
              accessibilityLabel={t('language.changeLanguage')}
            >
              <Globe size={23} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleTheme}
              activeOpacity={0.8}
              style={styles.headerThemeBtn}
              accessibilityLabel={t('common.themeToggle')}
            >
              {isDarkMode ? <Sun size={23} color="#ffffff" /> : <Moon size={23} color="#ffffff" />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.yearCenterCol}>
          <Text style={styles.yearBigText}>{currentYear}</Text>
        </View>
      </View>

      {/* Holiday Cards List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            {t('days.loadingDays')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={importantDays}
          keyExtractor={(item, index) => item.id || `day-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => {
            const localizedName = getLocalizedDayName(item.name, translations[language]?.holyDays || {});
            const localizedGregorian = item.id ? formatGregorianDate(item.id, language) : item.dateGregorian;
            const localizedHijri = (item.hicriRaw || item.dateHijri)
              ? formatHicriDate(item.hicriRaw || item.dateHijri, language)
              : item.dateHijri;

            return (
              <View
                style={[
                  styles.holidayCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <View
                  style={[
                    styles.holidaySideBar,
                    { backgroundColor: isDarkMode ? COLORS.accentRed : COLORS.primary },
                  ]}
                />

                <View style={styles.holidayCardBody}>
                  <Text
                    style={[
                      styles.holidayNameText,
                      { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {localizedName}
                  </Text>

                  <View
                    style={[
                      styles.datesFooterRow,
                      { borderTopColor: theme.cardBorder, flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View style={[styles.dateCol, isRTL && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.dateMainValue, { color: theme.textPrimary }]}>
                        {localizedGregorian}
                      </Text>
                      <Text style={[styles.dateSubLabel, { color: theme.textMuted }]}>
                        {t('days.gregorianLabel')}
                      </Text>
                    </View>

                    <View style={[styles.dateDivider, { backgroundColor: theme.cardBorder }]} />

                    <View style={[styles.dateCol, isRTL ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
                      <Text style={[styles.dateMainValue, { color: theme.textPrimary }]}>
                        {localizedHijri}
                      </Text>
                      <Text style={[styles.dateSubLabel, { color: theme.textMuted }]}>
                        {t('days.hijriLabel')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
};

export default Gunler;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
  headerThemeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: 8,
  },
  yearCenterCol: {
    alignItems: 'center',
  },
  yearBigText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  holidayCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  holidaySideBar: {
    width: 6,
  },
  holidayCardBody: {
    flex: 1,
    padding: 16,
  },
  holidayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  holidayBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  holidayNameText: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    lineHeight: 22,
  },
  datesFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  dateMainValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  dateSubLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});
