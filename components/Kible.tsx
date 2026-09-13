import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Vibration,
} from 'react-native';
import * as Location from 'expo-location';
import { CheckCircle2 } from 'lucide-react-native';
import { City } from '../types';
import { COLORS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { storageService } from '../services/storageService';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useCompassSensor } from '../hooks/useCompassSensor';
import {
  calculateNamazVaktiQibla,
  parseCityCoordinates,
  NamazVaktiQiblaData,
} from '../utils/qiblaUtils';
import { useLanguage } from '../context/LanguageContext';
import { LanguageModal } from './LanguageModal';
import { CompassDial } from './kible/CompassDial';
import { QiblaInfoBoard } from './kible/QiblaInfoBoard';
import { QiblaHeader } from './kible/QiblaHeader';
import { QiblaSelectors } from './kible/QiblaSelectors';

interface KibleProps {
  currentCity?: City;
  isDarkMode?: boolean;
}

type LocationSource = 'city' | 'gps';
type AngleReference = 'magnetic' | 'geographic';

export const Kible: React.FC<KibleProps> = ({ currentCity: propCity }) => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { currentCity: contextCity } = useCity();
  const { t, isRTL, toUpper } = useLanguage();
  const currentCity = propCity || contextCity;

  const [locationSource, setLocationSource] = useState<LocationSource>('city');
  const [angleReference, setAngleReference] = useState<AngleReference>('magnetic');
  const [userOffset, setUserOffsetState] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Restore the saved compass calibration offset
  useEffect(() => {
    storageService.getCompassOffset().then(setUserOffsetState);
  }, []);

  const setUserOffset = useCallback((updater: number | ((prev: number) => number)) => {
    setUserOffsetState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storageService.setCompassOffset(next);
      return next;
    });
  }, []);

  // Live Compass Sensor
  const {
    magHeading,
    trueHeading,
    isTrueHeading,
    compassAvailable,
  } = useCompassSensor(0.5);

  const cityID = currentCity.cityID || '16741';
  const { cityInfo, todayVakit, isOffline, fetchPrayerTimes } = usePrayerTimes(cityID);

  const [qiblaData, setQiblaData] = useState<NamazVaktiQiblaData>({
    geographicAngle: 151.66,
    magneticDeviation: 6.14,
    compassAngle: 146,
    distanceKm: 2405,
    latitude: 41.0082,
    longitude: 28.9784,
  });

  // Base Qibla angle depending on chosen reference
  const baseTargetAngle = useMemo(() => {
    if (angleReference === 'magnetic') {
      return qiblaData.compassAngle + userOffset;
    }
    return Math.round(qiblaData.geographicAngle) + userOffset;
  }, [angleReference, qiblaData.compassAngle, qiblaData.geographicAngle, userOffset]);

  // Device heading normalized to true north
  const effectiveTrueHeading = useMemo(() => {
    if (isTrueHeading) return trueHeading;
    return (magHeading + qiblaData.magneticDeviation + 360) % 360;
  }, [isTrueHeading, trueHeading, magHeading, qiblaData.magneticDeviation]);

  // Target needle angle relative to top of phone
  const targetNeedleAngle = useMemo(() => {
    return (Math.round(qiblaData.geographicAngle) + userOffset - effectiveTrueHeading + 360) % 360;
  }, [qiblaData.geographicAngle, userOffset, effectiveTrueHeading]);

  // Compass dial rotation (degree ring rotates with device)
  const dialRotation = useMemo(() => {
    return (-effectiveTrueHeading + 360) % 360;
  }, [effectiveTrueHeading]);

  // Check if device is aligned with Kaaba within +/- 3.5 degrees
  const isAligned = useMemo(() => {
    const diff = Math.abs(targetNeedleAngle);
    return diff <= 3.5 || Math.abs(diff - 360) <= 3.5;
  }, [targetNeedleAngle]);

  // Haptic feedback on alignment transition
  const wasAlignedRef = useRef(false);
  useEffect(() => {
    if (isAligned && !wasAlignedRef.current) {
      try {
        Vibration.vibrate(70);
      } catch {
        // ignore on unsupported environments
      }
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned]);

  // Smooth animation drivers
  const animatedCompass = useRef(new Animated.Value(0)).current;
  const animatedNeedle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedCompass, {
      toValue: dialRotation,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();

    Animated.spring(animatedNeedle, {
      toValue: targetNeedleAngle,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [dialRotation, targetNeedleAngle, animatedCompass, animatedNeedle]);

  // Calculate Qibla data from cityInfo or GPS
  const calculateQibla = useCallback(async (source: LocationSource = locationSource) => {
    setLoading(true);
    try {
      let lat = 41.0082;
      let lng = 28.9784;
      const magDeg = cityInfo?.magdeg ? parseFloat(cityInfo.magdeg) : 6.14;

      if (source === 'gps') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let location = await Location.getLastKnownPositionAsync();
            if (!location) {
              location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
            }
            if (location && location.coords) {
              lat = location.coords.latitude;
              lng = location.coords.longitude;
            } else {
              throw new Error('Konum bilgisi alınamadı');
            }
          } else {
            setLocationSource('city');
            const parsedCityCoords = parseCityCoordinates(cityInfo);
            if (parsedCityCoords) {
              lat = parsedCityCoords.latitude;
              lng = parsedCityCoords.longitude;
            }
          }
        } catch (gpsError) {
          console.warn('GPS konumu alınamadı, şehir koordinatlarına dönülüyor:', gpsError);
          setLocationSource('city');
          const parsedCityCoords = parseCityCoordinates(cityInfo);
          if (parsedCityCoords) {
            lat = parsedCityCoords.latitude;
            lng = parsedCityCoords.longitude;
          }
        }
      } else {
        const parsedCityCoords = parseCityCoordinates(cityInfo);
        if (parsedCityCoords) {
          lat = parsedCityCoords.latitude;
          lng = parsedCityCoords.longitude;
        }
      }

      const calculated = calculateNamazVaktiQibla(lat, lng, magDeg);

      if (source === 'city' && cityInfo?.qiblaangle) {
        calculated.geographicAngle = parseFloat(cityInfo.qiblaangle);
        calculated.compassAngle =
          (Math.round(calculated.geographicAngle) - Math.round(calculated.magneticDeviation) + 360) %
          360;
      }

      setQiblaData(calculated);
    } catch (error) {
      console.error('Qibla calculation error:', error);
    } finally {
      setLoading(false);
    }
  }, [cityInfo, locationSource]);

  useEffect(() => {
    calculateQibla(locationSource);
  }, [calculateQibla, locationSource]);

  const handleRefresh = useCallback(() => {
    fetchPrayerTimes(true);
    calculateQibla(locationSource);
  }, [fetchPrayerTimes, calculateQibla, locationSource]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <QiblaHeader
        cityName={currentCity.name}
        locationSource={locationSource}
        isOffline={isOffline}
        isDarkMode={isDarkMode}
        loading={loading}
        headerBg={theme.headerBg}
        onToggleTheme={toggleTheme}
        onRefresh={handleRefresh}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
      />

      {/* Location & Angle Mode Selectors */}
      <QiblaSelectors
        locationSource={locationSource}
        onSelectLocationSource={setLocationSource}
        cityName={currentCity.name}
        angleReference={angleReference}
        onSelectAngleReference={setAngleReference}
        compassAngle={qiblaData.compassAngle}
        geographicAngle={qiblaData.geographicAngle}
        isDarkMode={isDarkMode}
        cardBorder={theme.cardBorder}
        textSecondary={theme.textSecondary}
        textMuted={theme.textMuted}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Compass Section */}
        <View style={styles.compassSection}>
          {isAligned ? (
            <View style={[styles.alignedBanner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <CheckCircle2 size={22} color="#ffffff" />
              <View style={isRTL && { alignItems: 'flex-end' }}>
                <Text style={styles.alignedBannerTitle}>{t('qibla.qiblaFound')}</Text>
                <Text style={styles.alignedBannerSubtitle}>
                  {qiblaData.compassAngle}°
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.angleDisplayBox}>
              <Text
                style={[
                  styles.angleTagText,
                  { color: angleReference === 'magnetic' ? '#dc2626' : '#0d9488' },
                ]}
              >
                {angleReference === 'magnetic'
                  ? toUpper(t('qibla.compassAngle').replace(':', ''))
                  : toUpper(t('qibla.geographicNorth').replace(':', ''))}
              </Text>
              <Text style={[styles.angleBigText, { color: theme.textPrimary }]}>
                {loading ? '---' : `${baseTargetAngle}°`}
              </Text>
              <Text style={[styles.modelSubText, { color: theme.textMuted }]}>
                {compassAvailable
                  ? `${t('qibla.currentBearing')}: ${Math.round(effectiveTrueHeading)}° • ${t('qibla.targetQibla')}: ${baseTargetAngle}°`
                  : t('qibla.calibrationNotice')}
              </Text>
            </View>
          )}

          {/* SVG 360° Rotating Compass Dial */}
          <CompassDial
            dialRotation={dialRotation}
            targetNeedleAngle={targetNeedleAngle}
            isAligned={isAligned}
            isDarkMode={isDarkMode}
            needleLabel={toUpper(t('tabs.kible'))}
            isRTL={isRTL}
          />
        </View>

        {/* Qibla Calculation Data & Calibration Board */}
        <QiblaInfoBoard
          qiblaData={qiblaData}
          todayVakitKible={todayVakit?.kible}
          userOffset={userOffset}
          onSetUserOffset={setUserOffset}
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <Text style={[styles.footnoteText, { color: theme.textMuted }]}>
          {t('qibla.footnote')}
        </Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
};

export default Kible;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  compassSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  alignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  alignedBannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alignedBannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  angleDisplayBox: {
    alignItems: 'center',
    marginBottom: 4,
  },
  angleTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  angleBigText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 46,
  },
  modelSubText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  footnoteText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 20,
  },
});
