import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, LocateFixed } from 'lucide-react-native';
import { COLORS } from '../../constants';

interface QiblaSelectorsProps {
  locationSource: 'city' | 'gps';
  onSelectLocationSource: (source: 'city' | 'gps') => void;
  cityName: string;
  angleReference: 'magnetic' | 'geographic';
  onSelectAngleReference: (reference: 'magnetic' | 'geographic') => void;
  compassAngle: number;
  geographicAngle: number;
  isDarkMode: boolean;
  cardBorder: string;
  textSecondary: string;
  textMuted: string;
}

export const QiblaSelectors: React.FC<QiblaSelectorsProps> = ({
  locationSource,
  onSelectLocationSource,
  cityName,
  angleReference,
  onSelectAngleReference,
  compassAngle,
  geographicAngle,
  isDarkMode,
  cardBorder,
  textSecondary,
  textMuted,
}) => {
  return (
    <View style={styles.selectorsContainer}>
      {/* Source Pills (City vs GPS) */}
      <View style={styles.sourceSelectorRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectLocationSource('city')}
          style={[
            styles.sourcePill,
            {
              backgroundColor:
                locationSource === 'city'
                  ? isDarkMode
                    ? '#2a0a0e'
                    : '#fee2e2'
                  : 'transparent',
              borderColor: locationSource === 'city' ? COLORS.primary : cardBorder,
            },
          ]}
        >
          <MapPin size={12} color={locationSource === 'city' ? COLORS.primary : textMuted} />
          <Text
            style={[
              styles.sourcePillText,
              {
                color:
                  locationSource === 'city'
                    ? isDarkMode
                      ? COLORS.accentRed
                      : COLORS.primary
                    : textMuted,
              },
            ]}
          >
            {cityName}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectLocationSource('gps')}
          style={[
            styles.sourcePill,
            {
              backgroundColor:
                locationSource === 'gps'
                  ? isDarkMode
                    ? '#064e3b'
                    : '#dcfce7'
                  : 'transparent',
              borderColor: locationSource === 'gps' ? '#16a34a' : cardBorder,
            },
          ]}
        >
          <LocateFixed size={12} color={locationSource === 'gps' ? '#16a34a' : textMuted} />
          <Text
            style={[
              styles.sourcePillText,
              { color: locationSource === 'gps' ? '#16a34a' : textMuted },
            ]}
          >
            Canlı GPS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pusula Açısı Reference Switcher (Pusula: 146° vs Coğrafi: 152°) */}
      <View style={styles.referenceSelectorRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectAngleReference('magnetic')}
          style={[
            styles.refBadge,
            {
              backgroundColor:
                angleReference === 'magnetic'
                  ? '#dc2626'
                  : isDarkMode
                  ? '#1f2937'
                  : '#f3f4f6',
            },
          ]}
        >
          <Text
            style={[
              styles.refBadgeText,
              { color: angleReference === 'magnetic' ? '#ffffff' : textSecondary },
            ]}
          >
            Pusula Açısı ({compassAngle}°)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectAngleReference('geographic')}
          style={[
            styles.refBadge,
            {
              backgroundColor:
                angleReference === 'geographic'
                  ? '#0d9488'
                  : isDarkMode
                  ? '#1f2937'
                  : '#f3f4f6',
            },
          ]}
        >
          <Text
            style={[
              styles.refBadgeText,
              { color: angleReference === 'geographic' ? '#ffffff' : textSecondary },
            ]}
          >
            Coğrafi Açı ({Math.round(geographicAngle)}°)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  sourceSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sourcePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  referenceSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  refBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
