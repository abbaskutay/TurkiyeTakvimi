import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
  Vibration,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import {
  RefreshCw,
  Compass,
  Map as MapIcon,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Navigation,
  LocateFixed,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react-native';
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
  generateTheQiblaMapHtml,
  NamazVaktiQiblaData,
} from '../utils/qiblaUtils';

interface KibleProps {
  currentCity?: City;
  isDarkMode?: boolean;
}

type ViewMode = 'map' | 'compass';
type LocationSource = 'city' | 'gps';
type AngleReference = 'magnetic' | 'geographic';

export const Kible: React.FC<KibleProps> = ({ currentCity: propCity }) => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { currentCity: contextCity } = useCity();
  const currentCity = propCity || contextCity;

  const [viewMode, setViewMode] = useState<ViewMode>('compass');
  const [locationSource, setLocationSource] = useState<LocationSource>('city');
  const [angleReference, setAngleReference] = useState<AngleReference>('magnetic');
  const [userOffset, setUserOffsetState] = useState<number>(0); // manual micro-offset in degrees
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Restore the saved compass calibration offset, so it isn't lost on every app restart.
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
  const { cityInfo, todayVakit, isOffline } = usePrayerTimes(cityID);

  const [qiblaData, setQiblaData] = useState<NamazVaktiQiblaData>({
    geographicAngle: 151.66,
    magneticDeviation: 6.14,
    compassAngle: 146,
    distanceKm: 2405,
    latitude: 41.0082,
    longitude: 28.9784,
  });

  // Base Qibla angle depending on chosen reference (Magnetic Pusula Açısı: 146° vs Geographic: 152°)
  const baseTargetAngle = useMemo(() => {
    if (angleReference === 'magnetic') {
      // Pusula Kuzeyinden Kıble Açısı (Türk Takvimi standart pusula derecesi - sola 6° kaydırılmış)
      return qiblaData.compassAngle + userOffset;
    } else {
      // Coğrafi Kuzeyden Kıble Açısı
      return Math.round(qiblaData.geographicAngle) + userOffset;
    }
  }, [angleReference, qiblaData.compassAngle, qiblaData.geographicAngle, userOffset]);

  // Device heading normalized to TRUE north, regardless of angleReference toggle.
  // Mixing a true-north bearing (geographicAngle) with a raw magnetic heading (magHeading) - or
  // vice versa - silently introduces an error equal to the local magnetic declination, which
  // shows up as the needle drifting a few degrees off to one side. Using the device's own
  // trueHeading when available (already declination-corrected by iOS/Android for the exact GPS
  // fix) keeps the needle consistent with namazvakti.com's true-north-oriented map in every mode.
  const effectiveTrueHeading = useMemo(() => {
    if (isTrueHeading) return trueHeading;
    return (magHeading + qiblaData.magneticDeviation + 360) % 360;
  }, [isTrueHeading, trueHeading, magHeading, qiblaData.magneticDeviation]);

  // Target needle angle relative to top of phone (always computed against true-north bearing):
  const targetNeedleAngle = useMemo(() => {
    const target = (Math.round(qiblaData.geographicAngle) + userOffset - effectiveTrueHeading + 360) % 360;
    return target;
  }, [qiblaData.geographicAngle, userOffset, effectiveTrueHeading]);

  // Compass dial rotation (outer degree ring rotates with the device, true-north referenced)
  const dialRotation = useMemo(() => {
    return (-effectiveTrueHeading + 360) % 360;
  }, [effectiveTrueHeading]);

  // Check if device is aligned with Kaaba within +/- 3.5 degrees
  const isAligned = useMemo(() => {
    const diff = Math.abs(targetNeedleAngle);
    return diff <= 3.5 || Math.abs(diff - 360) <= 3.5;
  }, [targetNeedleAngle]);

  // Haptic Feedback on alignment transition (false -> true)
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
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = location.coords.latitude;
          lng = location.coords.longitude;
        } else {
          // fallback to city coords
          const parsedCityCoords = parseCityCoordinates(cityInfo);
          if (parsedCityCoords) {
            lat = parsedCityCoords.latitude;
            lng = parsedCityCoords.longitude;
          }
        }
      } else {
        // City Mode: Authoritative TurkTakvim City Coordinates
        const parsedCityCoords = parseCityCoordinates(cityInfo);
        if (parsedCityCoords) {
          lat = parsedCityCoords.latitude;
          lng = parsedCityCoords.longitude;
        }
      }

      const calculated = calculateNamazVaktiQibla(lat, lng, magDeg);

      // If API provides explicit authoritative qiblaangle, preserve it for the city
      if (source === 'city' && cityInfo?.qiblaangle) {
        calculated.geographicAngle = parseFloat(cityInfo.qiblaangle);
        calculated.compassAngle = (Math.round(calculated.geographicAngle) - Math.round(calculated.magneticDeviation) + 360) % 360;
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

  // Generate the Leaflet HTML map content
  const mapHtml = useMemo(() => {
    return generateTheQiblaMapHtml(
      qiblaData.latitude,
      qiblaData.longitude,
      qiblaData.magneticDeviation,
      isDarkMode
    );
  }, [qiblaData.latitude, qiblaData.longitude, qiblaData.magneticDeviation, isDarkMode]);

  // Handle live drag messages from the map
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        const updated = calculateNamazVaktiQibla(
          data.lat,
          data.lng,
          qiblaData.magneticDeviation
        );
        setQiblaData(updated);
      }
    } catch {
      // ignore
    }
  };

  const windowHeight = Dimensions.get('window').height;
  const mapHeight = Math.max(380, windowHeight * 0.48);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>KIBLE TAYİNİ</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {currentCity.name.toUpperCase()} • {locationSource === 'gps' ? 'CANLI GPS' : 'TÜRK TAKVİMİ'}
            {isOffline ? ' • ÇEVRİMDIŞI' : ''}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={styles.headerActionBtn}
            accessibilityLabel="Temayı Değiştir"
          >
            {isDarkMode ? <Sun size={17} color="#ffffff" /> : <Moon size={17} color="#ffffff" />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => calculateQibla(locationSource)}
            disabled={loading}
            activeOpacity={0.7}
            style={styles.headerActionBtn}
            accessibilityLabel="Yenile"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <RefreshCw size={17} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Mode Switcher (Canlı Pusula vs Uydu Haritası) - Şimdilik devre dışı bırakıldı */}
      {/*
      <View style={[styles.modeSwitcherContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setViewMode('compass')}
          style={[
            styles.modeButton,
            viewMode === 'compass' && {
              backgroundColor: isDarkMode ? COLORS.primaryDark : COLORS.primary,
            },
          ]}
        >
          <Compass size={16} color={viewMode === 'compass' ? '#ffffff' : theme.textSecondary} />
          <Text
            style={[
              styles.modeButtonText,
              { color: viewMode === 'compass' ? '#ffffff' : theme.textSecondary },
            ]}
          >
            Canlı Pusula
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setViewMode('map')}
          style={[
            styles.modeButton,
            viewMode === 'map' && {
              backgroundColor: isDarkMode ? COLORS.primaryDark : COLORS.primary,
            },
          ]}
        >
          <MapIcon size={16} color={viewMode === 'map' ? '#ffffff' : theme.textSecondary} />
          <Text
            style={[
              styles.modeButtonText,
              { color: viewMode === 'map' ? '#ffffff' : theme.textSecondary },
            ]}
          >
            Uydu Haritası (theQibla)
          </Text>
        </TouchableOpacity>
      </View>
      */}

      {/* Location & Angle Mode Selectors */}
      <View style={styles.selectorsContainer}>
        {/* Source Pills (City vs GPS) */}
        <View style={styles.sourceSelectorRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setLocationSource('city')}
            style={[
              styles.sourcePill,
              {
                backgroundColor: locationSource === 'city' ? (isDarkMode ? '#2a0a0e' : '#fee2e2') : 'transparent',
                borderColor: locationSource === 'city' ? COLORS.primary : theme.cardBorder,
              },
            ]}
          >
            <MapPin size={12} color={locationSource === 'city' ? COLORS.primary : theme.textMuted} />
            <Text
              style={[
                styles.sourcePillText,
                { color: locationSource === 'city' ? (isDarkMode ? COLORS.accentRed : COLORS.primary) : theme.textMuted },
              ]}
            >
              {currentCity.name}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setLocationSource('gps')}
            style={[
              styles.sourcePill,
              {
                backgroundColor: locationSource === 'gps' ? (isDarkMode ? '#064e3b' : '#dcfce7') : 'transparent',
                borderColor: locationSource === 'gps' ? '#16a34a' : theme.cardBorder,
              },
            ]}
          >
            <LocateFixed size={12} color={locationSource === 'gps' ? '#16a34a' : theme.textMuted} />
            <Text
              style={[
                styles.sourcePillText,
                { color: locationSource === 'gps' ? '#16a34a' : theme.textMuted },
              ]}
            >
              Canlı GPS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pusula Açısı Reference Switcher (Pusula: 146° vs Coğrafi: 152°) */}
        {viewMode === 'compass' && (
          <View style={styles.referenceSelectorRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAngleReference('magnetic')}
              style={[
                styles.refBadge,
                {
                  backgroundColor: angleReference === 'magnetic' ? '#dc2626' : (isDarkMode ? '#1f2937' : '#f3f4f6'),
                },
              ]}
            >
              <Text
                style={[
                  styles.refBadgeText,
                  { color: angleReference === 'magnetic' ? '#ffffff' : theme.textSecondary },
                ]}
              >
                Pusula Açısı ({qiblaData.compassAngle}°)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAngleReference('geographic')}
              style={[
                styles.refBadge,
                {
                  backgroundColor: angleReference === 'geographic' ? '#0d9488' : (isDarkMode ? '#1f2937' : '#f3f4f6'),
                },
              ]}
            >
              <Text
                style={[
                  styles.refBadgeText,
                  { color: angleReference === 'geographic' ? '#ffffff' : theme.textSecondary },
                ]}
              >
                Coğrafi Açı ({Math.round(qiblaData.geographicAngle)}°)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* VIEW MODE 1: INTERACTIVE THEQIBLA.PHP SATELLITE MAP - Şimdilik devre dışı bırakıldı */}
        {/*
        <View style={styles.mapContainer}>
          <View style={[styles.mapCard, { height: mapHeight, borderColor: theme.cardBorder }]}>
            {Platform.OS === 'web' ? (
              // Web iframe render
              // @ts-ignore
              <iframe
                title="theQibla Map"
                srcDoc={mapHtml}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 20,
                }}
              />
            ) : (
              // Native WebView render
              <WebView
                originWhitelist={['*']}
                source={{ html: mapHtml }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleMapMessage}
              />
            )}
          </View>

          <Text style={[styles.mapDragHint, { color: theme.textMuted }]}>
            💡 <Text style={{ fontWeight: '700' }}>İpucu:</Text> Haritayı kaydırıp kırmızı işareti evinizin/binanızın üzerine getirdiğinizde çıkan yeşil hat, o binanın tam kıble istikâmetidir.
          </Text>
        </View>
        */}

        {/* VIEW MODE 2: LIVE COMPASS SENSOR VIEW */}
          <View style={styles.compassSection}>
            {isAligned ? (
              <View style={styles.alignedBanner}>
                <CheckCircle2 size={22} color="#ffffff" />
                <View>
                  <Text style={styles.alignedBannerTitle}>KIBLEYE HİZALANDI</Text>
                  <Text style={styles.alignedBannerSubtitle}>Telefonunuz tam Kâbe yönüne bakıyor</Text>
                </View>
              </View>
            ) : (
              <View style={styles.angleDisplayBox}>
                <Text style={[styles.angleTagText, { color: angleReference === 'magnetic' ? '#dc2626' : '#0d9488' }]}>
                  {angleReference === 'magnetic' ? 'TÜRK TAKVİMİ PUSULA AÇISI' : 'COĞRAFİ KUZEY AÇISI'}
                </Text>
                <Text style={[styles.angleBigText, { color: theme.textPrimary }]}>
                  {loading ? '---' : `${baseTargetAngle}°`}
                </Text>
                <Text style={[styles.modelSubText, { color: theme.textMuted }]}>
                  {compassAvailable
                    ? `Pusula Yönü: ${Math.round(effectiveTrueHeading)}° • Hedef Açısı: ${baseTargetAngle}°`
                    : 'Pusula Sensörü Hazır Değil'}
                </Text>
              </View>
            )}

            {/* SVG 360° Rotating Compass Dial */}
            <View style={[styles.compassWrapper, isAligned && styles.alignedCompassWrapper]}>
              <Svg width="270" height="260" viewBox="0 0 200 200">
                <Defs>
                  <RadialGradient id="compassGradLight" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#ffffff" />
                    <Stop offset="100%" stopColor="#f3f4f6" />
                  </RadialGradient>
                  <RadialGradient id="compassGradDark" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#222222" />
                    <Stop offset="100%" stopColor="#111111" />
                  </RadialGradient>
                  <RadialGradient id="compassGradAligned" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#15803d" />
                    <Stop offset="100%" stopColor="#166534" />
                  </RadialGradient>
                </Defs>

                {/* Rotatable Compass Rose / Degree Ring */}
                <G transform={`rotate(${dialRotation}, 100, 100)`}>
                  <Circle
                    cx="100"
                    cy="100"
                    r="96"
                    fill={
                      isAligned
                        ? 'url(#compassGradAligned)'
                        : isDarkMode
                        ? 'url(#compassGradDark)'
                        : 'url(#compassGradLight)'
                    }
                    stroke={isAligned ? '#22c55e' : isDarkMode ? '#333333' : '#e5e7eb'}
                    strokeWidth={isAligned ? '3' : '2'}
                  />
                  <Circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke={isAligned ? 'rgba(255,255,255,0.2)' : isDarkMode ? '#222' : '#f0f0f0'}
                    strokeWidth="1"
                  />

                  {/* Tick Marks (Every 5 degrees, major ticks every 30 degrees) */}
                  {[...Array(72)].map((_, i) => {
                    const ang = i * 5;
                    const rad = ((ang - 90) * Math.PI) / 180;
                    const isMajor = i % 6 === 0;
                    const r1 = isMajor ? 84 : 88;
                    const r2 = 94;
                    return (
                      <Line
                        key={i}
                        x1={100 + r1 * Math.cos(rad)}
                        y1={100 + r1 * Math.sin(rad)}
                        x2={100 + r2 * Math.cos(rad)}
                        y2={100 + r2 * Math.sin(rad)}
                        stroke={
                          isAligned
                            ? '#ffffff'
                            : isMajor
                            ? isDarkMode
                              ? COLORS.accentRed
                              : COLORS.primary
                            : isDarkMode
                            ? '#444'
                            : '#d1d5db'
                        }
                        strokeWidth={isMajor ? '1.8' : '0.6'}
                      />
                    );
                  })}

                  {/* Cardinal Letters (N, E, S, W) */}
                  {[
                    { ang: 0, label: 'N' },
                    { ang: 90, label: 'E' },
                    { ang: 180, label: 'S' },
                    { ang: 270, label: 'W' },
                  ].map(({ ang, label }) => {
                    const rad = ((ang - 90) * Math.PI) / 180;
                    const x = 100 + 72 * Math.cos(rad);
                    const y = 100 + 72 * Math.sin(rad);
                    return (
                      <SvgText
                        key={label}
                        x={x}
                        y={y + 4}
                        fontSize="12"
                        fontWeight="900"
                        textAnchor="middle"
                        fill={
                          isAligned
                            ? '#ffffff'
                            : ang === 0
                            ? isDarkMode
                              ? COLORS.accentRed
                              : COLORS.primary
                            : isDarkMode
                            ? '#6b7280'
                            : '#9ca3af'
                        }
                      >
                        {label}
                      </SvgText>
                    );
                  })}
                </G>

                {/* PROMINENT QIBLA NEEDLE (Arrow pointing directly towards Kaaba) */}
                <G transform={`rotate(${targetNeedleAngle}, 100, 100)`}>
                  {/* Subtle Shadow */}
                  <Path
                    d="M100 20 L112 88 L100 78 L88 88 Z"
                    fill="rgba(0,0,0,0.15)"
                  />

                  {/* Forward Arrowhead (Pointing UP to 12 o'clock / Kaaba) */}
                  <Path
                    d="M100 22 L112 88 L100 78 L88 88 Z"
                    fill={isAligned ? '#22c55e' : isDarkMode ? COLORS.accentRed : COLORS.primary}
                  />
                  <Path
                    d="M100 22 L100 78 L88 88 Z"
                    fill={isAligned ? '#16a34a' : isDarkMode ? '#b31d2e' : '#7a101d'}
                  />

                  {/* Golden Kaaba Badge on the Pointer Tip */}
                  <G transform="translate(92, 38)">
                    <Rect width="16" height="16" rx="2" fill="#111111" stroke="#d4af37" strokeWidth="1" />
                    <Rect y="5" width="16" height="2.5" fill="#d4af37" />
                  </G>

                  {/* KIBLE / KÂBE Label on Arrow Shaft */}
                  <SvgText
                    x="100"
                    y="68"
                    fontSize="6.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontWeight="900"
                    letterSpacing="0.8"
                  >
                    KIBLE
                  </SvgText>

                  {/* Rear Tail (Pointing DOWN to South / opposite) */}
                  <Path
                    d="M100 160 L108 112 L100 120 L92 112 Z"
                    fill={isDarkMode ? '#374151' : '#cbd5e1'}
                  />
                  <Path
                    d="M100 160 L100 120 L92 112 Z"
                    fill={isDarkMode ? '#1f2937' : '#94a3b8'}
                  />

                  {/* Center Pivot Point */}
                  <Circle
                    cx="100"
                    cy="100"
                    r="12"
                    fill={isAligned ? '#22c55e' : isDarkMode ? '#1e293b' : '#ffffff'}
                    stroke={isAligned ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary}
                    strokeWidth="2.5"
                  />
                  <Circle
                    cx="100"
                    cy="100"
                    r="4"
                    fill={isAligned ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary}
                  />
                </G>
              </Svg>
            </View>
          </View>
        {/* )} - Uydu haritası devre dışı olduğu için Pusula doğrudan gösteriliyor */}

        {/* theQibla.php AUTHENTIC INFORMATION BOARD */}
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
          {todayVakit?.kible ? (
            <View style={[styles.boardDataRow, styles.kibleSaatiRow]}>
              <View style={styles.rowLabelGroup}>
                <Clock size={14} color="#d97706" />
                <Text style={[styles.boardLabel, { color: isDarkMode ? '#fbbf24' : '#b45309', fontWeight: '700' }]} numberOfLines={1}>
                  Bugünün Kıble Saati:
                </Text>
              </View>
              <Text style={styles.kibleSaatiVal}>
                {todayVakit.kible}
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
                onPress={() => setUserOffset(prev => prev - 2)}
                style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-2°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUserOffset(prev => prev - 1)}
                style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-1°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUserOffset(0)}
                style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb', borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>Sıfırla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUserOffset(prev => prev + 1)}
                style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+1°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUserOffset(prev => prev + 2)}
                style={[styles.stepperBtn, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', borderColor: theme.cardBorder }]}
              >
                <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+2°</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* COLLAPSIBLE EXPLANATION (Haritanın Açıklaması - theQibla.php) - Şimdilik devre dışı bırakıldı */}
        {/*
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowExplanation(!showExplanation)}
          style={[styles.explanationToggle, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        >
          <View style={styles.explanationToggleLeft}>
            <Info size={16} color={COLORS.primary} />
            <Text style={[styles.explanationToggleText, { color: theme.textPrimary }]}>
              Haritanın Açıklaması
            </Text>
          </View>
          {showExplanation ? (
            <ChevronUp size={18} color={theme.textMuted} />
          ) : (
            <ChevronDown size={18} color={theme.textMuted} />
          )}
        </TouchableOpacity>

        {showExplanation && (
          <View style={[styles.explanationBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.explanationText, { color: theme.textSecondary }]}>
              Şehir merkezinin üzerinde kırmızı ampul şekli ile bu ampulden çıkan ve kıble istikâmetini gösteren yeşil bir hat görülür.
              {'\n\n'}
              Buradaki harîta üzerine çift parmak ile dokunarak harîta büyütülebilir. Kâfi miktarda büyütülünce, harîtada bulunan gidilecek binâ veyâ kalınacak ev, otel üzerine, kırmızı ampulün ucunun getirilmesi için, ampul sabit olduğundan, harîta parmakla sağa sola ve aşağı yukarı hareket ettirilir.
              {'\n\n'}
              O binânın veyâ evin üstüne kırmızı ampulün ucu getirildiğinde, ampulden çıkan yeşil hat, o binâ veya evin kıble istikâmetidir. Yani, bulunulan binâ veyâ evin kıble istikâmeti doğru olarak bu şekilde bulunur.
            </Text>
          </View>
        )}
        */}

        <Text style={[styles.footnoteText, { color: theme.textMuted }]}>
          Türk Takvimi rasat ve hesaplama metotları baz alınmıştır. (namazvakti.com/theQibla.php)
        </Text>
      </ScrollView>
    </View>
  );
};

export default Kible;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  selectorsContainer: {
    marginHorizontal: 16,
    marginBottom: 4,
    gap: 6,
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
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  referenceSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  refBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  refBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  mapCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  mapDragHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  compassSection: {
    width: '100%',
    alignItems: 'center',
  },
  alignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 12,
    marginTop: 6,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  alignedBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  alignedBannerSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  angleDisplayBox: {
    alignItems: 'center',
    marginTop: 6,
  },
  angleTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  angleBigText: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -2,
  },
  modelSubText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  compassWrapper: {
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  alignedCompassWrapper: {
    shadowColor: '#22c55e',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  fineTuneBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  fineTuneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fineTuneLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepperBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepperBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  infoBoardCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  boardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boardTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  coordsPill: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  boardDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    marginVertical: 10,
  },
  boardDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  kibleSaatiRow: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    marginVertical: 2,
  },
  rowLabelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  boardLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cografiKuzeyVal: {
    color: '#0d9488',
    fontWeight: '900',
    fontSize: 15,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  magSapmaVal: {
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  pusulaKuzeyVal: {
    color: '#dc2626',
    fontWeight: '900',
    fontSize: 15,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  kibleSaatiVal: {
    color: '#d97706',
    fontWeight: '900',
    fontSize: 15,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  distanceVal: {
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  explanationToggle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  explanationToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  explanationToggleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  explanationBox: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 19,
  },
  footnoteText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 18,
    paddingHorizontal: 16,
  },
});
