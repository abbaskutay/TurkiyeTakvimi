import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PrayerTime, DetailedPrayerTime } from '../../types';
import { COLORS } from '../../constants';
import { useTimer } from '../../hooks/useTimer';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t, getPrayerName, isRTL, toUpper } = useLanguage();
  const { countdownInfo } = useTimer(
    activePage,
    mainPrayerTimes,
    flattenedGridTimes,
    tomorrowMainPrayerTimes,
    tomorrowGridTimes
  );

  return (
    <View style={styles.floatingCountdownContainer}>
      <View
        style={[
          styles.floatingCountdownBox,
          {
            backgroundColor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'rgba(17,24,39,0.96)',
            borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)',
          },
        ]}
      >
        <View style={[styles.floatingCountdownContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.floatingCountdownLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.floatingIconBadge, isRTL ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }]}>
              {getPrayerIcon(countdownInfo.id, 16, '#ffffff')}
            </View>
            <View>
              <Text style={[styles.floatingSubLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('vakitler.nextPrayer')}
              </Text>
              <Text style={[styles.floatingPrayerName, { textAlign: isRTL ? 'right' : 'left' }]}>
                {toUpper(getPrayerName(countdownInfo.id))}
              </Text>
            </View>
          </View>

          <View style={styles.floatingTimerRight}>
            <View style={styles.floatingTimerDigits}>
              <Text style={styles.floatingTimerText}>{countdownInfo.h}</Text>
              <Text style={styles.floatingTimerColon}>:</Text>
              <Text style={styles.floatingTimerText}>{countdownInfo.m}</Text>
              <Text style={styles.floatingTimerColon}>:</Text>
              <Text style={[styles.floatingTimerText, { color: COLORS.accentRed }]}>{countdownInfo.s}</Text>
            </View>
            <Text style={styles.progressPercentText}>%{countdownInfo.progress}</Text>
          </View>
        </View>

        {/* Dynamic Progress Bar */}
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
    bottom: 10,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  floatingCountdownBox: {
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCountdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  floatingCountdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  floatingSubLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  floatingPrayerName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  floatingTimerRight: {
    alignItems: 'flex-end',
  },
  floatingTimerDigits: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingTimerText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  floatingTimerColon: {
    fontSize: 16,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 1.5,
  },
  progressPercentText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentRed,
    borderRadius: 2,
  },
});
