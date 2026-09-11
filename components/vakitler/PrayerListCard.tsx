import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import { PrayerTime, ReminderConfig } from '../../types';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface PrayerListCardProps {
  mainPrayerTimes: PrayerTime[];
  activePrayerId: string;
  upcomingId: string;
  activePage: number;
  reminders: Record<string, ReminderConfig>;
  globalRemindersEnabled: boolean;
  setShowSettings: (id: string) => void;
  getPrayerIcon: (id: string, size?: number, color?: string) => ReactNode;
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
}) => {
  const { isDarkMode, theme } = useTheme();

  return (
    <View style={[styles.prayerListCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {mainPrayerTimes.map((prayer, index) => {
        const isActive = prayer.id === activePrayerId;
        const isUpcoming = prayer.id === upcomingId && activePage === 0;
        const reminder = reminders[prayer.id];

        return (
          <View
            key={prayer.id}
            style={[
              styles.prayerRow,
              index < mainPrayerTimes.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
              isUpcoming
                ? styles.upcomingPrayerRow
                : isActive
                ? { backgroundColor: isDarkMode ? 'rgba(160, 24, 38, 0.15)' : 'rgba(160, 24, 38, 0.05)' }
                : null,
            ]}
          >
            <View style={styles.prayerRowLeft}>
              <View
                style={[
                  styles.prayerIconBox,
                  isUpcoming
                    ? styles.upcomingIconBox
                    : { backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6' },
                ]}
              >
                {getPrayerIcon(
                  prayer.id,
                  18,
                  isUpcoming ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary
                )}
              </View>

              <View style={styles.prayerInfoCol}>
                <View style={styles.prayerTitleRow}>
                  <Text
                    style={[
                      styles.prayerName,
                      {
                        color: isUpcoming
                          ? '#ffffff'
                          : isActive
                          ? isDarkMode
                            ? COLORS.accentRed
                            : COLORS.primary
                          : theme.textPrimary,
                      },
                    ]}
                  >
                    {prayer.name}
                  </Text>
                  {isUpcoming && (
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingBadgeText}>SIRADAKİ</Text>
                    </View>
                  )}
                </View>
                {reminder?.enabled && globalRemindersEnabled && (
                  <Text
                    style={[
                      styles.reminderOffsetSubText,
                      { color: isUpcoming ? 'rgba(255,255,255,0.7)' : theme.textMuted },
                    ]}
                  >
                    {reminder.offset === 0 ? 'Vaktinde' : `${reminder.offset} dk. önce`}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.prayerRowRight}>
              <Text
                style={[
                  styles.prayerTimeText,
                  {
                    color: isUpcoming
                      ? '#ffffff'
                      : isActive
                      ? isDarkMode
                        ? COLORS.accentRed
                        : COLORS.primary
                      : theme.textPrimary,
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
                  <Bell size={18} color={isUpcoming ? '#ffffff' : COLORS.primary} />
                ) : (
                  <BellOff size={18} color={isUpcoming ? 'rgba(255,255,255,0.5)' : theme.textMuted} />
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
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  upcomingPrayerRow: {
    backgroundColor: COLORS.primary,
  },
  prayerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  upcomingIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  prayerInfoCol: {
    justifyContent: 'center',
  },
  prayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  upcomingBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  upcomingBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  reminderOffsetSubText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  prayerRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTimeText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginRight: 12,
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  bellButton: {
    padding: 6,
  },
});
