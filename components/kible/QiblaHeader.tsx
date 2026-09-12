import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, Sun, Moon } from 'lucide-react-native';

interface QiblaHeaderProps {
  cityName: string;
  locationSource: 'city' | 'gps';
  isOffline: boolean;
  isDarkMode: boolean;
  loading: boolean;
  headerBg: string;
  onToggleTheme: () => void;
  onRefresh: () => void;
}

export const QiblaHeader: React.FC<QiblaHeaderProps> = ({
  cityName,
  locationSource,
  isOffline,
  isDarkMode,
  loading,
  headerBg,
  onToggleTheme,
  onRefresh,
}) => {
  return (
    <View style={[styles.headerBanner, { backgroundColor: headerBg }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>KIBLE TAYİNİ</Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {cityName.toUpperCase()} • {locationSource === 'gps' ? 'CANLI GPS' : 'TÜRK TAKVİMİ'}
          {isOffline ? ' • ÇEVRİMDIŞI' : ''}
        </Text>
      </View>

      <View style={styles.headerRightActions}>
        <TouchableOpacity
          onPress={onToggleTheme}
          activeOpacity={0.8}
          style={styles.headerActionBtn}
          accessibilityLabel="Temayı Değiştir"
        >
          {isDarkMode ? <Sun size={17} color="#ffffff" /> : <Moon size={17} color="#ffffff" />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRefresh}
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
  );
};

const styles = StyleSheet.create({
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
