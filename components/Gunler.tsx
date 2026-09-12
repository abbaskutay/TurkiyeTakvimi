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
import { MoonStar, Sun, Moon } from 'lucide-react-native';
import { ImportantDay } from '../types';
import { COLORS, MOCK_IMPORTANT_DAYS, mapCalendarToImportantDays } from '../constants';
import { turkTakvimApi } from '../services/turkTakvimApi';
import { storageService } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface GunlerProps {
  isDarkMode?: boolean;
}

export const Gunler: React.FC<GunlerProps> = () => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const currentYear = new Date().getFullYear();
  const [importantDays, setImportantDays] = useState<ImportantDay[]>(MOCK_IMPORTANT_DAYS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>MÜBAREK GÜNLER</Text>
            <Text style={styles.headerSubtitle}>DİNİ TAKVİM</Text>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={styles.headerThemeBtn}
            accessibilityLabel="Temayı Değiştir"
          >
            {isDarkMode ? <Sun size={17} color="#ffffff" /> : <Moon size={17} color="#ffffff" />}
          </TouchableOpacity>
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
            Dini günler güncelleniyor...
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
          renderItem={({ item }) => (
            <View style={[styles.holidayCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.holidaySideBar, { backgroundColor: isDarkMode ? COLORS.accentRed : COLORS.primary }]} />

              <View style={styles.holidayCardBody}>
                {/* OnemliGun Turu Badge (Disabled for now) */}
                {/* <View style={styles.holidayBadgeRow}>
                  <MoonStar size={14} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
                  <Text style={[styles.holidayBadgeText, { color: theme.textMuted }]}>DİNİ GÜN</Text>
                </View> */}

                <Text style={[styles.holidayNameText, { color: theme.textPrimary }]}>
                  {item.name}
                </Text>

                <View style={[styles.datesFooterRow, { borderTopColor: theme.cardBorder }]}>
                  <View style={styles.dateCol}>
                    <Text style={[styles.dateMainValue, { color: theme.textPrimary }]}>
                      {item.dateGregorian}
                    </Text>
                    <Text style={[styles.dateSubLabel, { color: theme.textMuted }]}>MİLADİ</Text>
                  </View>

                  <View style={[styles.dateDivider, { backgroundColor: theme.cardBorder }]} />

                  <View style={[styles.dateCol, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.dateMainValue, { color: theme.textPrimary }]}>
                      {item.dateHijri}
                    </Text>
                    <Text style={[styles.dateSubLabel, { color: theme.textMuted }]}>HİCRİ</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
