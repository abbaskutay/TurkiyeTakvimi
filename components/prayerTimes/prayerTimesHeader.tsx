import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Globe, Sun, Moon, ChevronDown } from 'lucide-react-native';
import { City } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export interface DateHeaderInfo {
  gregorianDay: string;
  gregorianSub: string;
  dayName: string;
  hicriDay: string;
  hicriSub: string;
}

interface VakitlerHeaderProps {
  currentCity: City;
  dateHeaderInfo: DateHeaderInfo;
  onCityPress: () => void;
  onYearTransitionPress: () => void;
  onLanguagePress: () => void;
}

export const VakitlerHeader: React.FC<VakitlerHeaderProps> = ({
  currentCity,
  dateHeaderInfo,
  onCityPress,
  onYearTransitionPress,
  onLanguagePress,
}) => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { language, isRTL, t } = useLanguage();

  return (
    <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
      <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Gregorian Date (Long press to preview Year Transition) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={onYearTransitionPress}
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
          onPress={onCityPress}
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
            {currentCity.district
              ? `${currentCity.district} • ${t('vakitler.calendarSource')}`
              : t('vakitler.turkiyeTakvimiTimes')}
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
          onPress={onLanguagePress}
          activeOpacity={0.8}
          style={styles.headerActionBtn}
          accessibilityLabel={t('language.changeLanguage')}
        >
          <Globe size={18} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.8}
          style={styles.headerActionBtn}
          accessibilityLabel={t('common.themeToggle')}
        >
          {isDarkMode ? <Sun size={18} color="#ffffff" /> : <Moon size={18} color="#ffffff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
