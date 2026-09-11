import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { DetailedPrayerTime } from '../../types';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

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

  return (
    <View style={[styles.gridContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {gridPrayerTimes.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {row.map((item, colIndex) => {
            const isUpcoming = item.id === upcomingId && activePage === 1;
            const isActive = item.id === activePrayerId;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setShowSettings(item.id)}
                style={[
                  styles.gridCell,
                  colIndex === 0 && { borderRightWidth: 1, borderRightColor: theme.cardBorder },
                  rowIndex < gridPrayerTimes.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  },
                  isUpcoming
                    ? styles.upcomingGridCell
                    : isActive
                    ? { backgroundColor: isDarkMode ? 'rgba(160, 24, 38, 0.15)' : 'rgba(160, 24, 38, 0.05)' }
                    : null,
                ]}
              >
                <View style={styles.gridCellHeader}>
                  <View style={styles.gridCellTitleRow}>
                    {getPrayerIcon(
                      item.id,
                      14,
                      isUpcoming ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary
                    )}
                    <Text
                      style={[
                        styles.gridCellName,
                        {
                          color: isUpcoming
                            ? 'rgba(255,255,255,0.85)'
                            : isActive
                            ? isDarkMode
                              ? COLORS.accentRed
                              : COLORS.primary
                            : theme.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {isUpcoming && <Zap size={12} color="#ffffff" />}
                </View>

                {item.sub ? (
                  <Text
                    style={[
                      styles.gridCellSub,
                      { color: isUpcoming ? 'rgba(255,255,255,0.6)' : theme.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {item.sub}
                  </Text>
                ) : null}

                <Text
                  style={[
                    styles.gridCellTime,
                    {
                      color: isUpcoming ? '#ffffff' : theme.textPrimary,
                    },
                  ]}
                >
                  {item.time}
                </Text>
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
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  upcomingGridCell: {
    backgroundColor: COLORS.primary,
  },
  gridCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gridCellTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridCellName: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gridCellSub: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridCellTime: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
