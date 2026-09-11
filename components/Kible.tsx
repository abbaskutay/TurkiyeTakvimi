import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Location from 'expo-location';
import { RefreshCw, Target, Activity, Compass, CheckCircle2 } from 'lucide-react-native';
import { City } from '../types';
import { COLORS } from '../constants';
import { turkTakvimApi } from '../services/turkTakvimApi';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { useCompassSensor } from '../hooks/useCompassSensor';
import { calculateDirectQibla } from '../utils/qiblaUtils';

interface KibleProps {
  currentCity?: City;
  isDarkMode?: boolean;
}

interface QiblaData {
  angle: number;
  cihet: number;
  magneticAngle: number;
  magneticDeviation: number;
  lat: number;
  lng: number;
  distance: number;
  accuracy: number;
}

export const Kible: React.FC<KibleProps> = ({ currentCity: propCity }) => {
  const { isDarkMode, theme } = useTheme();
  const { currentCity: contextCity } = useCity();
  const currentCity = propCity || contextCity;

  const [loading, setLoading] = useState(false);
  const { deviceHeading, compassAvailable } = useCompassSensor(0.5);

  const [qiblaData, setQiblaData] = useState<QiblaData>({
    angle: 151.66,
    cihet: 280.90,
    magneticAngle: 145.52,
    magneticDeviation: 6.14,
    lat: 41.00,
    lng: 28.97,
    distance: 2445,
    accuracy: 10,
  });

  const cityID = currentCity.cityID || '16741';

  // Smooth compass animation drivers
  const animatedCompass = useRef(new Animated.Value(0)).current;
  const animatedNeedle = useRef(new Animated.Value(151.66)).current;

  const targetNeedleAngle = useMemo(() => {
    return (qiblaData.angle - deviceHeading + 360) % 360;
  }, [qiblaData.angle, deviceHeading]);

  const isAligned = useMemo(() => {
    const diff = Math.abs((targetNeedleAngle + 360) % 360);
    return diff <= 4 || Math.abs(diff - 360) <= 4;
  }, [targetNeedleAngle]);

  useEffect(() => {
    Animated.spring(animatedCompass, {
      toValue: -deviceHeading,
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
  }, [deviceHeading, targetNeedleAngle, animatedCompass, animatedNeedle]);

  const calculateQibla = async () => {
    setLoading(true);
    try {
      const res = await turkTakvimApi.getPrayerTimes(cityID);
      let apiQiblaAngle: number | null = null;
      let apiMagDeg: number | null = null;

      if (res && res.cityinfo && res.cityinfo['@attributes']) {
        const info = res.cityinfo['@attributes'];
        if (info.qiblaangle) {
          apiQiblaAngle = parseFloat(info.qiblaangle);
        }
        if (info.magdeg) {
          apiMagDeg = parseFloat(info.magdeg);
        }
      }

      let latitude = 41.0082;
      let longitude = 28.9784;
      let accuracy = 10;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
        accuracy = Math.round(location.coords.accuracy || 10);
      }

      const { bearing, distance } = calculateDirectQibla(latitude, longitude);
      const finalAngle = apiQiblaAngle ?? parseFloat(bearing.toFixed(2));
      const finalMagDeviation = apiMagDeg ?? 6.14;
      const finalMagAngle = parseFloat(((finalAngle - finalMagDeviation + 360) % 360).toFixed(2));

      setQiblaData({
        angle: finalAngle,
        cihet: 280.9,
        magneticAngle: finalMagAngle,
        magneticDeviation: finalMagDeviation,
        lat: parseFloat(latitude.toFixed(4)),
        lng: parseFloat(longitude.toFixed(4)),
        distance,
        accuracy,
      });
    } catch (error) {
      console.error('Qibla calculation error:', error);
      Alert.alert('Hata', 'Kıble açısı hesaplanırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateQibla();
  }, [cityID]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>HASSAS CANLI KIBLE</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {currentCity.name} (TÜRK TAKVİMİ)
          </Text>
        </View>
        <TouchableOpacity
          onPress={calculateQibla}
          disabled={loading}
          style={styles.refreshButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <RefreshCw size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alignment Status Banner */}
        {isAligned ? (
          <View style={styles.alignedBanner}>
            <CheckCircle2 size={18} color="#ffffff" />
            <Text style={styles.alignedBannerText}>KIBLEYE HİZALANDI (TAM KABE YÖNÜ)</Text>
          </View>
        ) : (
          <View style={styles.angleDisplayBox}>
            <View style={styles.angleTagRow}>
              <Target size={16} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
              <Text
                style={[
                  styles.angleTagText,
                  { color: isDarkMode ? COLORS.accentRed : COLORS.primary },
                ]}
              >
                TÜRK TAKVİMİ KIBLE AÇISI
              </Text>
            </View>
            <Text style={[styles.angleBigText, { color: theme.textPrimary }]}>
              {loading ? '---' : `${qiblaData.angle.toFixed(2)}°`}
            </Text>
            <Text style={[styles.modelSubText, { color: theme.textMuted }]}>
              {compassAvailable ? `Telefon Açısı: ${Math.round(deviceHeading)}°` : 'Sabit Görünüm'}
            </Text>
          </View>
        )}

        {/* SVG Live Compass Dial */}
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

            {/* Rotatable Compass Dial Group */}
            <G transform={`rotate(${-deviceHeading}, 100, 100)`}>
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

              {/* Tick Marks */}
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
                    strokeWidth={isMajor ? '1.5' : '0.5'}
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

            {/* Target Qibla Needle Group */}
            <G transform={`rotate(${targetNeedleAngle}, 100, 100)`}>
              <Path d="M100 135 L124 100 L76 100 Z" fill="rgba(0,0,0,0.15)" />
              <Path
                d="M100 135 L128 100 L72 100 Z"
                fill={isAligned ? '#22c55e' : isDarkMode ? COLORS.accentRed : COLORS.primary}
              />
              <Rect
                x="94"
                y="32"
                width="12"
                height="68"
                fill={isAligned ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary}
                rx="2"
              />
              <SvgText
                x="100"
                y="66"
                fontSize="7"
                textAnchor="middle"
                fill={isAligned ? '#15803d' : '#ffffff'}
                transform="rotate(90, 100, 66)"
                fontWeight="900"
                letterSpacing="1"
              >
                KIBLE
              </SvgText>

              <G transform="translate(94, 35)">
                <Rect width="12" height="12" fill="#111111" rx="1" />
                <Rect y="4" width="12" height="2" fill="#d4af37" />
              </G>

              <Circle
                cx="100"
                cy="100"
                r="11"
                fill={isAligned ? '#22c55e' : isDarkMode ? '#121212' : '#ffffff'}
                stroke={isAligned ? '#ffffff' : isDarkMode ? COLORS.accentRed : COLORS.primary}
                strokeWidth="2"
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

        {/* 4 Data Cards Grid */}
        <View style={styles.dataCardsGrid}>
          <View style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.dataCardLabel, { color: theme.textMuted }]}>MANYETİK SAPMA</Text>
            <View style={styles.dataCardValueRow}>
              <Activity size={12} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
              <Text style={[styles.dataCardValue, { color: theme.textPrimary }]}>
                {loading ? '...' : `${qiblaData.magneticDeviation > 0 ? '+' : ''}${qiblaData.magneticDeviation.toFixed(2)}°`}
              </Text>
            </View>
            <Text style={[styles.dataCardSub, { color: theme.textMuted }]}>Türk Takvimi Modeli</Text>
          </View>

          <View style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.dataCardLabel, { color: theme.textMuted }]}>KONUM HASSASİYETİ</Text>
            <View style={styles.dataCardValueRow}>
              <Compass size={12} color="#3b82f6" />
              <Text style={[styles.dataCardValue, { color: theme.textPrimary }]}>
                {loading ? '...' : `±${qiblaData.accuracy}m`}
              </Text>
            </View>
            <Text style={[styles.dataCardSub, { color: theme.textMuted }]}>GPS / Network</Text>
          </View>

          <View style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.dataCardLabel, { color: theme.textMuted }]}>PUSULA AÇISI</Text>
            <Text style={[styles.dataCardValue, { color: theme.textPrimary }]}>
              {loading ? '...' : `${qiblaData.magneticAngle.toFixed(2)}°`}
            </Text>
            <Text style={[styles.dataCardSub, { color: theme.textMuted }]}>Manyetik Kuzey</Text>
          </View>

          <View style={[styles.dataCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.dataCardLabel, { color: theme.textMuted }]}>KABE UZAKLIĞI</Text>
            <Text style={[styles.dataCardValue, { color: theme.textPrimary }]}>
              {loading ? '...' : `${qiblaData.distance.toLocaleString()} km`}
            </Text>
            <Text style={[styles.dataCardSub, { color: theme.textMuted }]}>Ortodromik</Text>
          </View>
        </View>

        <Text style={[styles.footnoteText, { color: theme.textMuted }]}>
          Telefonunuzun pusula sensörünü doğru kullanabilmek için cihazınızı düz tutunuz ve etrafında manyetik/metalik eşyalar bulunmamasına dikkat ediniz.
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitleCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    alignItems: 'center',
  },
  alignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 10,
    marginTop: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  alignedBannerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  angleDisplayBox: {
    alignItems: 'center',
    marginTop: 8,
  },
  angleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  angleTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  angleBigText: {
    fontSize: 54,
    fontWeight: '300',
    letterSpacing: -2,
  },
  modelSubText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  compassWrapper: {
    marginVertical: 20,
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
  dataCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },
  dataCard: {
    flex: 1,
    minWidth: '47%',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  dataCardLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  dataCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dataCardValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dataCardSub: {
    fontSize: 8,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  footnoteText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 20,
    paddingHorizontal: 16,
  },
});
