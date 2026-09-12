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
  const allRemindersActive = mainPrayerTimes.every(p => reminders[p.id]?.enabled);

  return (
    <View style={[styles.prayerListCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Top Header Row with Bulk Reminder Action */}
      <View style={[styles.cardTopHeader, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.cardHeaderTitle, { color: theme.textMuted }]}>
          GÜNLÜK VAKİTLER
        </Text>
        {onToggleAllReminders && (
          <TouchableOpacity
            onPress={onToggleAllReminders}
            style={styles.toggleAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {allRemindersActive ? (
              <BellOff size={13} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
            ) : (
              <Bell size={13} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
            )}
            <Text style={[styles.toggleAllText, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
              {allRemindersActive ? 'Tümünü Kapat' : 'Tümünü Aç (15dk)'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
                  20,
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
                  <Bell size={19} color={isUpcoming ? '#ffffff' : COLORS.primary} />
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
    marginHorizontal: 16,
    marginTop: 10,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  toggleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(160, 24, 38, 0.06)',
  },
  toggleAllText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    fontSize: 17,
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
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.8,
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
  bellButton: {
    padding: 6,
  },
});
