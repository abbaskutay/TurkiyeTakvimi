import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import {
  Search,
  X,
  Plus,
  Trash2,
  MapPin,
  Check,
  CheckCircle2,
  Globe,
  Edit2,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react-native';
import { City } from '../types';
import { COLORS } from '../constants';
import { turkTakvimApi, ApiSearchResult, isAbortError } from '../services/turkTakvimApi';
import { searchCitiesLocalized, getDisplayCityName } from '../services/citySearchTranslationService';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageModal } from './LanguageModal';

interface SehirlerProps {
  cities?: City[];
  onUpdateCities?: (newCities: City[]) => void;
  isDarkMode?: boolean;
  onCitySelected?: () => void;
}

export const Sehirler: React.FC<SehirlerProps> = ({
  cities: propCities,
  onUpdateCities: propOnUpdateCities,
  onCitySelected,
}) => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { cities: contextCities, updateCities: contextUpdateCities, selectCity } = useCity();
  const { t, isRTL, language, toUpper } = useLanguage();

  const cities = propCities || contextCities;
  const onUpdateCities = propOnUpdateCities || contextUpdateCities;

  const [searchLoading, setSearchLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setSearchLoading(true);
    try {
      const results = await searchCitiesLocalized(query, 12, abortControllerRef.current.signal);
      setSearchResults(results);
    } catch (error: unknown) {
      if (isAbortError(error, abortControllerRef.current?.signal)) {
        return;
      }
      console.error('City search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery]);

  const selectSearchResult = (result: ApiSearchResult) => {
    const newCity: City = {
      id: result.ID ? `city_${result.ID}` : Date.now().toString(),
      cityID: result.ID || '16741',
      name: result.NameTR || result.NameEN || 'Bilinmeyen Konum',
      district: result.NameTR || result.NameEN || 'Merkez',
      city: result.cityStateTR || result.NameTR || 'İstanbul',
      country: result.countryName || 'Türkiye',
      isCurrent: true,
    };

    const exists = cities.find(c => c.cityID === newCity.cityID || c.name === newCity.name);
    let updatedCities: City[];

    if (exists) {
      updatedCities = cities.map(c => ({
        ...c,
        isCurrent: c.id === exists.id,
      }));
    } else {
      updatedCities = [newCity, ...cities.map(c => ({ ...c, isCurrent: false }))];
    }

    onUpdateCities(updatedCities);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsEditing(false);
    onCitySelected?.();
  };

  const removeCity = (id: string) => {
    if (cities.length <= 1) {
      Alert.alert(t('common.warning'), t('cities.minCityWarning'));
      return;
    }
    const updatedCities = cities.filter(c => c.id !== id);
    if (cities.find(c => c.id === id)?.isCurrent && updatedCities.length > 0) {
      updatedCities[0].isCurrent = true;
    }
    onUpdateCities(updatedCities);
  };

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionRequired'), t('cities.locationPermissionDesc'));
        setGpsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!location || !location.coords) {
        Alert.alert(t('common.error'), t('cities.locationFailed'));
        setGpsLoading(false);
        return;
      }

      const { latitude, longitude } = location.coords;
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const searchTerm = item.subregion || item.district || item.city || item.region || 'İstanbul';
        const searchRes = await turkTakvimApi.searchCities(searchTerm, 5);

        if (searchRes && searchRes.length > 0) {
          selectSearchResult(searchRes[0]);
        } else {
          const district = item.subregion || item.district || 'Merkez';
          const city = item.region || item.city || 'İstanbul';
          const newCity: City = {
            id: Date.now().toString(),
            cityID: '16741',
            name: `${district} / ${city}`,
            district,
            city,
            country: item.country || 'Türkiye',
            isCurrent: true,
          };
          onUpdateCities([newCity, ...cities.map(c => ({ ...c, isCurrent: false }))]);
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(t('common.error'), t('cities.locationFailed'));
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
        {!isSearching ? (
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View
              style={[
                styles.headerLeft,
                isRTL ? { alignItems: 'flex-end', marginLeft: 12 } : { alignItems: 'flex-start', marginRight: 12 },
              ]}
            >
              <Text
                style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}
                numberOfLines={1}
              >
                {t('cities.title')}
              </Text>
              <Text
                style={[styles.headerSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}
                numberOfLines={1}
              >
                {t('cities.subtitle')}
              </Text>
            </View>
            <View style={[styles.headerActionBtns, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.8}
                style={[styles.headerBtn, styles.headerBtnInactive]}
                accessibilityLabel={t('language.changeLanguage')}
              >
                <Globe size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleTheme}
                activeOpacity={0.8}
                style={[styles.headerBtn, styles.headerBtnInactive]}
                accessibilityLabel={t('common.themeToggle')}
              >
                {isDarkMode ? <Sun size={24} color="#ffffff" /> : <Moon size={24} color="#ffffff" />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                activeOpacity={0.8}
                style={[
                  styles.headerBtn,
                  isEditing ? styles.headerBtnActive : styles.headerBtnInactive,
                ]}
                accessibilityLabel={isEditing ? t('common.done') : t('common.edit')}
              >
                {isEditing ? (
                  <CheckCircle2 size={24} color={COLORS.primary} />
                ) : (
                  <Edit2 size={22} color="#ffffff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsSearching(true)}
                activeOpacity={0.8}
                style={[styles.headerBtn, styles.headerBtnInactive]}
                accessibilityLabel={t('common.search')}
              >
                <Search size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.searchBarRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.searchInputContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Search
                size={22}
                color="rgba(255,255,255,0.7)"
                style={[styles.searchIcon, isRTL ? { marginLeft: 8 } : { marginRight: 8 }]}
              />
              <TextInput
                autoFocus
                placeholder={t('cities.searchPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={21} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.cancelSearchBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelSearchText}>{toUpper(t('common.close'))}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={cities}
        keyExtractor={(item, index) => item.id || `city-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Search Results Dropdown */}
            {isSearching && searchQuery.trim().length >= 2 && (
              <View style={[styles.searchResultsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {searchLoading ? (
                  <View style={styles.searchLoadingBox}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={[styles.searchLoadingText, { color: theme.textMuted }]}>
                      {t('cities.searchingDatabase')}
                    </Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <TouchableOpacity
                      key={result.ID ? `search_${result.ID}_${idx}` : `search_${idx}`}
                      onPress={() => selectSearchResult(result)}
                      style={[
                        styles.searchResultRow,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        idx < searchResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
                      ]}
                    >
                      <View
                        style={[
                          styles.searchResultInfo,
                          isRTL ? { marginLeft: 10, alignItems: 'flex-end' } : { marginRight: 10, alignItems: 'flex-start' },
                        ]}
                      >
                        <Text
                          style={[styles.searchResultName, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}
                          numberOfLines={1}
                        >
                          {getDisplayCityName(result.NameTR, result.NameEN, language)}
                        </Text>
                        <Text
                          style={[styles.searchResultSub, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}
                          numberOfLines={1}
                        >
                          {result.cityStateTR ? `${result.cityStateTR}, ` : ''}{result.countryName || 'Türkiye'}
                        </Text>
                      </View>
                      <Plus size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsBox}>
                    <Text style={[styles.noResultsText, { color: theme.textMuted }]}>
                      {t('cities.noCitiesFound')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Use Current GPS Location Button */}
            <TouchableOpacity
              onPress={handleGetLocation}
              disabled={gpsLoading}
              activeOpacity={0.8}
              style={[
                styles.currentLocationButton,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MapPin size={24} color={COLORS.primary} />
              )}
              <Text style={[styles.currentLocationText, { color: theme.textPrimary }]} numberOfLines={1}>
                {toUpper(t('cities.myLocationGps'))}
              </Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!isEditing) {
                selectCity(item.id);
                onCitySelected?.();
              }
            }}
            style={[
              styles.cityCard,
              {
                backgroundColor: theme.card,
                borderColor: item.isCurrent ? COLORS.primary : theme.cardBorder,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
              item.isCurrent && styles.activeCityCard,
            ]}
          >
            <View style={[styles.cityCardLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View
                style={[
                  styles.cityIconBox,
                  item.isCurrent
                    ? { backgroundColor: COLORS.primary }
                    : { backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6' },
                  isRTL ? { marginLeft: 12 } : { marginRight: 12 },
                ]}
              >
                {item.isCurrent ? (
                  <Check size={24} color="#ffffff" />
                ) : (
                  <Globe size={24} color={theme.textMuted} />
                )}
              </View>
              <View style={[styles.cityTextCol, isRTL && { alignItems: 'flex-end' }]}>
                <View style={[styles.cityNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text
                    style={[
                      styles.cityNameText,
                      { color: item.isCurrent ? (isDarkMode ? '#ffffff' : '#111827') : theme.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {getDisplayCityName(item.name, item.name, language)}
                  </Text>
                  {item.isCurrent && (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText} numberOfLines={1}>
                        {toUpper(t('cities.defaultCity'))}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cityRegionText, { color: theme.textMuted }]} numberOfLines={1}>
                  {item.city}, {item.country} {item.cityID ? `(ID: ${item.cityID})` : ''}
                </Text>
              </View>
            </View>

            {isEditing ? (
              <TouchableOpacity
                onPress={() => removeCity(item.id)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={22} color={COLORS.accentRed} />
              </TouchableOpacity>
            ) : (
              <ChevronRight
                size={24}
                color={item.isCurrent ? COLORS.primary : theme.textMuted}
                style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            )}
          </TouchableOpacity>
        )}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
};

export default Sehirler;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 66,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginTop: 2,
    lineHeight: 14,
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnActive: {
    backgroundColor: '#ffffff',
  },
  headerBtnInactive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
  },
  searchInputContainer: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  cancelSearchBtn: {
    height: 40,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelSearchText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },
  searchResultsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchLoadingBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '800',
  },
  searchResultSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  noResultsBox: {
    padding: 18,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 4,
    gap: 10,
    paddingHorizontal: 16,
  },
  currentLocationText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    flexShrink: 1,
    textAlign: 'center',
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCityCard: {
    borderWidth: 2,
  },
  cityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityTextCol: {
    flex: 1,
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityNameText: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  activePill: {
    backgroundColor: 'rgba(160, 24, 38, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  cityRegionText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 77, 94, 0.1)',
    borderRadius: 12,
  },
});
