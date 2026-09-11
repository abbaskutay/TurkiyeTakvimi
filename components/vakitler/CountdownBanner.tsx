import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PrayerTime, DetailedPrayerTime } from '../../types';
import { COLORS } from '../../constants';
import { useTimer } from '../../hooks/useTimer';
import { useTheme } from '../../context/ThemeContext';

interface CountdownBannerProps {
  activePage: number;
  mainPrayerTimes: PrayerTime[];
  flattenedGridTimes: DetailedPrayerTime[];
  tomorrowMainPrayerTimes: PrayerTime[];
  tomorrowGridTimes: DetailedPrayerTime[];
  getPrayerIcon: (id: string, size?: number, color?: string) => ReactNode;
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({
  activePage,
  mainPrayerTimes,
  flattenedGridTimes,
  tomorrowMainPrayerTimes,
  tomorrowGridTimes,
  getPrayerIcon,
}) => {
  const { isDarkMode } = useTheme();
  const { countdownInfo } = useTimer(
    activePage,
    mainPrayerTimes,
    flattenedGridTimes,
    tomorrowMainPrayerTimes,
    tomorrowGridTimes
  );

  return (
    <View style={styles.floatingCountdownContainer}>
      <View style={[styles.floatingCountdownBox, { backgroundColor: isDarkMode ? '#1a1a1a' : '#111827' }]}>
        <View style={styles.floatingCountdownContent}>
          <View style={styles.floatingCountdownLeft}>
            <View style={styles.floatingIconBadge}>
              {getPrayerIcon(countdownInfo.id, 16, '#ffffff')}
            </View>
            <View>
              <Text style={styles.floatingSubLabel}>
                {activePage === 0 ? 'SIRADAKİ VAKİT' : 'SIRADAKİ DETAY'}
              </Text>
              <Text style={styles.floatingPrayerName}>{countdownInfo.name}</Text>
            </View>
          </View>

          <View style={styles.floatingTimerDigits}>
            <Text style={styles.floatingTimerText}>{countdownInfo.h}</Text>
            <Text style={styles.floatingTimerColon}>:</Text>
            <Text style={styles.floatingTimerText}>{countdownInfo.m}</Text>
            <Text style={styles.floatingTimerColon}>:</Text>
            <Text style={[styles.floatingTimerText, { color: COLORS.accentRed }]}>{countdownInfo.s}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${countdownInfo.progress}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingCountdownContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  floatingCountdownBox: {
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  floatingCountdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  floatingCountdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  floatingSubLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  floatingPrayerName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  floatingTimerDigits: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingTimerText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  floatingTimerColon: {
    fontSize: 18,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentRed,
    borderRadius: 2,
  },
});
