import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import { PrayerTime, ReminderConfig } from '../../types';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface PrayerListCardProps {
  mainPrayerTimes: PrayerTime[];
  activePrayerId: string;
  upcomingId: string;
  activePage: number;
  reminders: Record<string, ReminderConfig>;
  globalRemindersEnabled: boolean;
  setShowSettings: (id: string) => void;
  getPrayerIcon: (id: string, size?: number, color?: string) => ReactNode;
  onToggleAllReminders?: () => void;
}

export const PrayerListCard: React.FC<PrayerListCardProps> = ({
  mainPrayerTimes,
  activePrayerId,
  upcomingId,
  activePage,
  reminders,
  globalRemindersEnabled,
  setShowSettings,
  getPrayerIcon,
  onToggleAllReminders,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { t, getPrayerName, isRTL, toUpper } = useLanguage();
  const allRemindersActive = mainPrayerTimes.every(p => reminders[p.id]?.enabled);

  return (
    <View style={[styles.prayerListCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Top Header Row with Bulk Reminder Action */}
      <View
        style={[
          styles.cardTopHeader,
          {
            borderBottomColor: theme.cardBorder,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Text style={[styles.cardHeaderTitle, { color: theme.textMuted }]} numberOfLines={1}>
          {toUpper(t('vakitler.mainPrayers'))}
        </Text>
        {onToggleAllReminders && (
          <TouchableOpacity
            onPress={onToggleAllReminders}
            style={[styles.toggleAllBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {allRemindersActive ? (
              <BellOff size={13} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
            ) : (
              <Bell size={13} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
            )}
            <Text style={[styles.toggleAllText, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
              {allRemindersActive ? t('reminders.disableAll') : t('reminders.enableAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {mainPrayerTimes.map((prayer, index) => {
        const isActive = prayer.id === activePrayerId;
        const isUpcoming = prayer.id === upcomingId && activePage === 0;
        const reminder = reminders[prayer.id];

        const activeBg = isDarkMode ? 'rgba(255, 77, 94, 0.16)' : '#fdf1f2';
        const activeAccentColor = isDarkMode ? COLORS.accentRed : COLORS.primary;

        return (
          <View
            key={prayer.id}
            style={[
              styles.prayerRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
              index < mainPrayerTimes.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
              isUpcoming
                ? styles.upcomingPrayerRow
                : isActive
                ? [
                    styles.activePrayerRow,
                    {
                      backgroundColor: activeBg,
                      borderLeftColor: activeAccentColor,
                      borderRightColor: activeAccentColor,
                    },
                    isRTL ? { borderRightWidth: 4 } : { borderLeftWidth: 4 },
                  ]
                : null,
            ]}
          >
            <View
              style={[
                styles.prayerRowLeft,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                isRTL ? { marginLeft: 8 } : { marginRight: 8 },
              ]}
            >
              <View
                style={[
                  styles.prayerIconBox,
                  isRTL ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12 },
                  isUpcoming
                    ? styles.upcomingIconBox
                    : isActive
                    ? { backgroundColor: isDarkMode ? 'rgba(255, 77, 94, 0.22)' : 'rgba(160, 24, 38, 0.14)' }
                    : { backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6' },
                ]}
              >
                {getPrayerIcon(
                  prayer.id,
                  20,
                  isUpcoming ? '#ffffff' : isActive ? activeAccentColor : isDarkMode ? COLORS.accentRed : COLORS.primary
                )}
              </View>

              <View style={[styles.prayerInfoCol, isRTL && { alignItems: 'flex-end' }]}>
                <View style={[styles.prayerTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text
                    style={[
                      styles.prayerName,
                      {
                        color: isUpcoming
                          ? '#ffffff'
                          : isActive
                          ? activeAccentColor
                          : theme.textPrimary,
                        fontWeight: isActive || isUpcoming ? '900' : '800',
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {getPrayerName(prayer.id)}
                  </Text>
                  {isUpcoming ? (
                    <View style={[styles.upcomingBadge, isRTL ? { marginRight: 6, marginLeft: 0 } : { marginLeft: 6 }]}>
                      <Text style={styles.upcomingBadgeText}>{t('vakitler.nextPrayer')}</Text>
                    </View>
                  ) : isActive ? (
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: isDarkMode ? 'rgba(255, 77, 94, 0.22)' : 'rgba(160, 24, 38, 0.12)' },
                        isRTL ? { marginRight: 6, marginLeft: 0 } : { marginLeft: 6 },
                      ]}
                    >
                      <View style={[styles.activeDot, { backgroundColor: activeAccentColor }]} />
                      <Text style={[styles.activeBadgeText, { color: activeAccentColor }]}>
                        {toUpper(t('vakitler.currentPrayer'))}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {reminder?.enabled && globalRemindersEnabled && reminder.offset > 0 && (
                  <Text
                    style={[
                      styles.reminderOffsetSubText,
                      {
                        color: isUpcoming ? 'rgba(255,255,255,0.7)' : theme.textMuted,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {t('reminders.minutesBefore', { minutes: reminder.offset })}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.prayerRowRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text
                style={[
                  styles.prayerTimeText,
                  {
                    color: isUpcoming
                      ? '#ffffff'
                      : isActive
                      ? activeAccentColor
                      : theme.textPrimary,
                    fontWeight: isActive || isUpcoming ? '900' : '800',
                  },
                ]}
              >
                {prayer.time}
              </Text>

              <TouchableOpacity
                onPress={() => setShowSettings(prayer.id)}
                style={styles.bellButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {reminder?.enabled && globalRemindersEnabled ? (
                  <Bell size={19} color={isUpcoming ? '#ffffff' : isActive ? activeAccentColor : COLORS.primary} />
                ) : (
                  <BellOff size={19} color={isUpcoming ? 'rgba(255,255,255,0.5)' : theme.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  prayerListCard: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  cardHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    flexShrink: 1,
    marginRight: 8,
  },
  toggleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(160, 24, 38, 0.06)',
    flexShrink: 0,
  },
  toggleAllText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  prayerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 40,
  },
  upcomingPrayerRow: {
    backgroundColor: COLORS.primary,
  },
  prayerRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  upcomingIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  prayerInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  prayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  prayerName: {
    fontSize: 16.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  upcomingBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6.5,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
  upcomingBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  reminderOffsetSubText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  prayerRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  prayerTimeText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginRight: 12,
    fontVariant: ['tabular-nums'],
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  activePrayerRow: {
    // Leading accent indicator dynamically applied via borderLeftWidth/borderRightWidth
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  activeBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bellButton: {
    padding: 5,
  },
});
