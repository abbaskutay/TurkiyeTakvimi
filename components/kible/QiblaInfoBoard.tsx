import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Navigation, Sliders } from 'lucide-react-native';
import { NamazVaktiQiblaData } from '../../utils/qiblaUtils';
import { COLORS } from '../../constants';

interface QiblaInfoBoardProps {
  qiblaData: NamazVaktiQiblaData;
  todayVakitKible?: string;
  userOffset: number;
  onSetUserOffset: (updater: number | ((prev: number) => number)) => void;
  isDarkMode: boolean;
  theme: {
    card: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
}

export const QiblaInfoBoard: React.FC<QiblaInfoBoardProps> = ({
  qiblaData,
  todayVakitKible,
  userOffset,
  onSetUserOffset,
  isDarkMode,
  theme,
}) => {
  return (
    <View style={[styles.infoBoardCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.boardHeaderRow}>
        <View style={styles.boardHeaderLeft}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={[styles.boardTitle, { color: theme.textPrimary }]}>
            KIBLE HESAPLAMA VERİLERİ
          </Text>
        </View>
        <Text style={[styles.coordsPill, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6', color: theme.textSecondary }]}>
          {qiblaData.latitude.toFixed(4)} , {qiblaData.longitude.toFixed(4)}
        </Text>
      </View>

      <View style={styles.boardDivider} />

      {/* 1. Coğrafi Kuzey Açısı */}
      <View style={styles.boardDataRow}>
        <View style={styles.rowLabelGroup}>
          <View style={[styles.dotIndicator, { backgroundColor: '#0d9488' }]} />
          <Text style={[styles.boardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            Coğrafi Kuzey Açısı:
          </Text>
        </View>
        <Text style={styles.cografiKuzeyVal}>
          {Math.round(qiblaData.geographicAngle)}°
        </Text>
      </View>

      {/* 2. Magnetik Sapma Açısı */}
      <View style={styles.boardDataRow}>
        <View style={styles.rowLabelGroup}>
          <View style={[styles.dotIndicator, { backgroundColor: theme.textMuted }]} />
          <Text style={[styles.boardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            Magnetik Sapma Açısı:
          </Text>
        </View>
        <Text style={[styles.magSapmaVal, { color: theme.textPrimary }]}>
          {qiblaData.magneticDeviation > 0 ? '+' : ''}{Math.round(qiblaData.magneticDeviation)}°
        </Text>
      </View>

      {/* 3. Pusula Kuzey Açısı */}
      <View style={styles.boardDataRow}>
        <View style={styles.rowLabelGroup}>
          <View style={[styles.dotIndicator, { backgroundColor: '#dc2626' }]} />
          <Text style={[styles.boardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            Pusula Kıble Açısı:
          </Text>
        </View>
        <Text style={styles.pusulaKuzeyVal}>
          {qiblaData.compassAngle}°
        </Text>
      </View>

      {/* 4. Bugünün Kıble Saati (TurkTakvim API) */}
      {todayVakitKible ? (
        <View style={[styles.boardDataRow, styles.kibleSaatiRow]}>
          <View style={styles.rowLabelGroup}>
            <Clock size={14} color="#d97706" />
            <Text style={[styles.boardLabel, { color: isDarkMode ? '#fbbf24' : '#b45309', fontWeight: '700' }]} numberOfLines={1}>
              Bugünün Kıble Saati:
            </Text>
          </View>
          <Text style={styles.kibleSaatiVal}>
            {todayVakitKible}
          </Text>
        </View>
      ) : null}

      {/* 5. Kâbe-i Şerîf Uzaklığı */}
      <View style={styles.boardDataRow}>
        <View style={styles.rowLabelGroup}>
          <Navigation size={14} color={theme.textMuted} />
          <Text style={[styles.boardLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            Kâbe-i Şerîf Uzaklığı:
          </Text>
        </View>
        <Text style={[styles.distanceVal, { color: theme.textPrimary }]}>
          {qiblaData.distanceKm.toLocaleString('tr-TR')} km
        </Text>
      </View>

      {/* Micro-Adjustment Stepper inside the info board */}
      <View style={[styles.fineTuneBox, { borderTopColor: theme.cardBorder }]}>
        <View style={styles.fineTuneHeader}>
          <Sliders size={13} color={theme.textMuted} />
          <Text style={[styles.fineTuneLabel, { color: theme.textMuted }]}>
            Pusula İnce Kalibrasyonu ({userOffset > 0 ? `+${userOffset}°` : `${userOffset}°`}):
          </Text>
        </View>
        <View style={styles.stepperGroup}>
          <TouchableOpacity
            onPress={() => onSetUserOffset(prev => prev - 2)}
            style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-2°</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSetUserOffset(prev => prev - 1)}
            style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-1°</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSetUserOffset(0)}
            style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb', borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>Sıfırla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSetUserOffset(prev => prev + 1)}
            style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+1°</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSetUserOffset(prev => prev + 2)}
            style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+2°</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBoardCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  boardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  boardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coordsPill: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  boardDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  boardDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  boardLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cografiKuzeyVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0d9488',
  },
  magSapmaVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  pusulaKuzeyVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
  },
  kibleSaatiRow: {
    backgroundColor: 'rgba(217,119,6,0.06)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  kibleSaatiVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#d97706',
  },
  distanceVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  fineTuneBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  fineTuneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fineTuneLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepperBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepperBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
