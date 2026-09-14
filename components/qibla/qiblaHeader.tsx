import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, Sun, Moon, Globe } from 'lucide-react-native';
import { useLanguage } from '../../context/LanguageContext';

interface QiblaHeaderProps {
  cityName: string;
  locationSource: 'city' | 'gps';
  isOffline: boolean;
  isDarkMode: boolean;
  loading: boolean;
  headerBg: string;
  onToggleTheme: () => void;
  onRefresh: () => void;
  onOpenLanguageModal?: () => void;
}

export const QiblaHeader: React.FC<QiblaHeaderProps> = ({
  cityName,
  locationSource,
  isOffline,
  isDarkMode,
  loading,
  headerBg,
  onToggleTheme,
  onRefresh,
  onOpenLanguageModal,
}) => {
  const { language, isRTL, t, toUpper } = useLanguage();

  return (
    <View style={[styles.headerBanner, { backgroundColor: headerBg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.headerLeft, isRTL && { alignItems: 'flex-end' }]}>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('qibla.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {toUpper(cityName)} • {locationSource === 'gps' ? t('qibla.liveGps') : t('qibla.turkTakvim')}
          {isOffline ? ` • ${t('qibla.offlineStatus')}` : ''}
        </Text>
      </View>

      <View style={[styles.headerRightActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {onOpenLanguageModal && (
          <TouchableOpacity
            onPress={onOpenLanguageModal}
            activeOpacity={0.8}
            style={styles.headerActionBtn}
            accessibilityLabel={t('language.changeLanguage')}
          >
            <Globe size={22} color="#ffffff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onToggleTheme}
          activeOpacity={0.8}
          style={styles.headerActionBtn}
          accessibilityLabel={t('common.themeToggle')}
        >
          {isDarkMode ? <Sun size={22} color="#ffffff" /> : <Moon size={22} color="#ffffff" />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRefresh}
          disabled={loading}
          activeOpacity={0.7}
          style={styles.headerActionBtn}
          accessibilityLabel={t('common.refresh')}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <RefreshCw size={22} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
