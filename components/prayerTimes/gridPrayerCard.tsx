import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { DetailedPrayerTime } from '../../types';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface GridPrayerCardProps {
  gridPrayerTimes: DetailedPrayerTime[][];
  upcomingId: string;
  activePage: number;
  activePrayerId: string;
  setShowSettings: (id: string) => void;
  getPrayerIcon: (id: string, size?: number, color?: string) => ReactNode;
}

export const GridPrayerCard: React.FC<GridPrayerCardProps> = ({
  gridPrayerTimes,
  upcomingId,
  activePage,
  activePrayerId,
  setShowSettings,
  getPrayerIcon,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { getPrayerName, getPrayerSub, isRTL, toUpper } = useLanguage();

  return (
    <View style={[styles.gridContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {gridPrayerTimes.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[styles.gridRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {row.map((item, colIndex) => {
            const isUpcoming = item.id === upcomingId && activePage === 1;
            const isActive = item.id === activePrayerId;
            const prayerName = getPrayerName(item.id);
            const prayerSub = getPrayerSub(item.id) || item.sub;

            const activeBg = isDarkMode ? 'rgba(255, 77, 94, 0.16)' : '#fdf1f2';
            const activeAccentColor = isDarkMode ? COLORS.accentRed : COLORS.primary;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setShowSettings(item.id)}
                style={[
                  styles.gridCell,
                  colIndex === 0 && (isRTL
                    ? { borderLeftWidth: 1, borderLeftColor: theme.cardBorder }
                    : { borderRightWidth: 1, borderRightColor: theme.cardBorder }),
                  rowIndex < gridPrayerTimes.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  },
                  isUpcoming
                    ? styles.upcomingGridCell
                    : isActive
                    ? [
                        {
                          backgroundColor: activeBg,
                          borderLeftColor: activeAccentColor,
                          borderRightColor: activeAccentColor,
                        },
                        isRTL ? { borderRightWidth: 3 } : { borderLeftWidth: 3 },
                      ]
                    : null,
                ]}
              >
                <View
                  style={[
                    styles.gridCellHeader,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View
                    style={[
                      styles.gridCellTitleRow,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    {getPrayerIcon(
                      item.id,
                      12,
                      isUpcoming ? '#ffffff' : isActive ? activeAccentColor : isDarkMode ? COLORS.accentRed : COLORS.primary
                    )}
                    <Text
                      style={[
                        styles.gridCellName,
                        {
                          color: isUpcoming
                            ? '#ffffff'
                            : isActive
                            ? activeAccentColor
                            : theme.textSecondary,
                          fontWeight: isActive || isUpcoming ? '900' : '700',
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {toUpper(prayerName)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.gridCellTimeBox,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    {isUpcoming ? (
                      <Zap size={10} color="#ffffff" style={isRTL ? { marginLeft: 3 } : { marginRight: 3 }} />
                    ) : isActive ? (
                      <View
                        style={[
                          styles.activeGridDot,
                          { backgroundColor: activeAccentColor },
                          isRTL ? { marginLeft: 3 } : { marginRight: 3 },
                        ]}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.gridCellTime,
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
                    >
                      {item.time}
                    </Text>
                  </View>
                </View>

                {prayerSub ? (
                  <Text
                    style={[
                      styles.gridCellSub,
                      {
                        color: isUpcoming ? 'rgba(255,255,255,0.7)' : theme.textMuted,
                        textAlign: isRTL ? 'right' : 'left',
                        paddingLeft: isRTL ? 0 : 16,
                        paddingRight: isRTL ? 16 : 0,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {prayerSub}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  upcomingGridCell: {
    backgroundColor: COLORS.primary,
  },
  gridCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridCellTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  gridCellName: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  gridCellTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  gridCellTime: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  gridCellSub: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  activeGridDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
