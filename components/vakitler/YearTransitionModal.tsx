import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  MoonStar,
  Compass,
  ArrowRight,
} from 'lucide-react-native';
import { COLORS } from '../../constants';

interface YearTransitionModalProps {
  visible: boolean;
  targetYear: number;
  loading: boolean;
  onComplete: () => void;
  isDarkMode?: boolean;
}

export const YearTransitionModal: React.FC<YearTransitionModalProps> = ({
  visible,
  targetYear,
  loading,
  onComplete,
  isDarkMode = true,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCountdown(5);
      setStep1Done(false);
      setStep2Done(false);
      setStep3Done(false);
      setIsReady(false);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Step 1 finishes after 1.2s
      const timer1 = setTimeout(() => setStep1Done(true), 1200);
      // Step 2 finishes after 2.4s
      const timer2 = setTimeout(() => setStep2Done(true), 2400);
      // Step 3 finishes after 3.6s
      const timer3 = setTimeout(() => setStep3Done(true), 3600);

      // Countdown ticker from 5 down to 0
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearInterval(interval);
      };
    }
  }, [visible, scaleAnim, opacityAnim]);

  // When step 3 is done AND loading is false AND countdown reaches 0
  useEffect(() => {
    if (step3Done && !loading && countdown === 0) {
      setIsReady(true);
    }
  }, [step3Done, loading, countdown]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
              borderColor: isDarkMode ? '#222222' : '#f0f0f0',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Badge Icon */}
          <View style={styles.topIconWrapper}>
            <View style={styles.topIconCircle}>
              <Calendar size={32} color={COLORS.accentRed} />
            </View>
            <View style={styles.sparkleBadge}>
              <Sparkles size={14} color="#f59e0b" />
            </View>
          </View>

          {/* Title Header */}
          <View style={styles.headerArea}>
            <View style={styles.yearPill}>
              <Text style={styles.yearPillText}>YENİ TAKVİM YILI</Text>
            </View>
            <Text style={[styles.bigYearText, { color: isDarkMode ? '#ffffff' : '#111827' }]}>
              {targetYear}
            </Text>
            <Text style={styles.warningSubtitle}>
              {targetYear} Yılı Vakit ve Takvim Verileri İndirilmektedir
            </Text>
          </View>

          {/* Countdown & Timer Badge */}
          <View
            style={[
              styles.countdownBox,
              { backgroundColor: isDarkMode ? 'rgba(255,77,94,0.08)' : 'rgba(160,24,38,0.06)' },
            ]}
          >
            <Clock size={16} color={COLORS.accentRed} />
            <Text style={styles.countdownLabel}>
              {isReady ? 'Veriler Başarıyla Hazırlandı' : `Senkronizasyon: 00:0${countdown}`}
            </Text>
          </View>

          {/* Detailed Progress Steps Checklist */}
          <View style={[styles.stepsContainer, { borderColor: isDarkMode ? '#262626' : '#f3f4f6' }]}>
            {/* Step 1: Prayer Times */}
            <View style={styles.stepRow}>
              <View style={styles.stepIconBox}>
                <Clock size={15} color={step1Done ? '#16a34a' : COLORS.accentRed} />
              </View>
              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepTitle,
                    { color: isDarkMode ? '#ffffff' : '#1f2937' },
                  ]}
                >
                  {targetYear} Yıllık Namaz Vakitleri
                </Text>
                <Text style={styles.stepSub}>Türkiye Takvimi resmi vakit tablosu</Text>
              </View>
              {step1Done ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : (
                <ActivityIndicator size="small" color={COLORS.accentRed} />
              )}
            </View>

            <View style={[styles.stepDivider, { backgroundColor: isDarkMode ? '#222' : '#f3f4f6' }]} />

            {/* Step 2: Hijri Calendar & Important Days */}
            <View style={styles.stepRow}>
              <View style={styles.stepIconBox}>
                <MoonStar size={15} color={step2Done ? '#16a34a' : COLORS.accentRed} />
              </View>
              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepTitle,
                    { color: isDarkMode ? '#ffffff' : '#1f2937' },
                  ]}
                >
                  Hicri Takvim ve Dini Günler
                </Text>
                <Text style={styles.stepSub}>Kandil ve bayram tarihleri</Text>
              </View>
              {step2Done ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : step1Done ? (
                <ActivityIndicator size="small" color={COLORS.accentRed} />
              ) : (
                <View style={styles.dotPending} />
              )}
            </View>

            <View style={[styles.stepDivider, { backgroundColor: isDarkMode ? '#222' : '#f3f4f6' }]} />

            {/* Step 3: Qibla & Solar Calculations */}
            <View style={styles.stepRow}>
              <View style={styles.stepIconBox}>
                <Compass size={15} color={step3Done ? '#16a34a' : COLORS.accentRed} />
              </View>
              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepTitle,
                    { color: isDarkMode ? '#ffffff' : '#1f2937' },
                  ]}
                >
                  Kıble Açısı ve Mahalli Saatler
                </Text>
                <Text style={styles.stepSub}>Astronomik rasat doğrulaması</Text>
              </View>
              {step3Done ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : step2Done ? (
                <ActivityIndicator size="small" color={COLORS.accentRed} />
              ) : (
                <View style={styles.dotPending} />
              )}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onComplete}
            disabled={!isReady}
            style={[
              styles.actionButton,
              {
                backgroundColor: isReady ? COLORS.primary : (isDarkMode ? '#2a2a2a' : '#e5e7eb'),
              },
            ]}
          >
            {isReady ? (
              <>
                <Text style={styles.actionButtonText}>Takvimi Görüntüle</Text>
                <ArrowRight size={18} color="#ffffff" />
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                  ]}
                >
                  Veriler Hazırlanıyor...
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  topIconWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  topIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 77, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  yearPill: {
    backgroundColor: 'rgba(255, 77, 94, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  yearPillText: {
    color: COLORS.accentRed,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bigYearText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 48,
  },
  warningSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 18,
  },
  countdownLabel: {
    color: COLORS.accentRed,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  stepsContainer: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  stepIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepSub: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 1,
  },
  dotPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  stepDivider: {
    height: 1,
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
