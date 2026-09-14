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
  MapPin,
  Globe,
  Edit2,
  Sun,
  Moon,
} from 'lucide-react-native';
import { City } from '../types';
import { COLORS } from '../constants';
import { turkTakvimApi, ApiSearchResult, isAbortError } from '../services/turkishCalendarApi';
import { searchCitiesLocalized } from '../services/citySearchTranslationService';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageModal } from './languageModal';
import { SavedCityItem } from './cities/savedCityItem';
import { SearchResultItem } from './cities/searchResultItem';

interface SehirlerProps {
  onCitySelected?: () => void;
}

export const Sehirler: React.FC<SehirlerProps> = ({ onCitySelected }) => {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { cities, updateCities, selectCity } = useCity();
  const { t, isRTL, language, toUpper } = useLanguage();

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

    updateCities(updatedCities);
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
    updateCities(updatedCities);
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
        const searchTerm = item.subregion || item.district || item.city || item.region || '';
        if (searchTerm) {
          const searchRes = await turkTakvimApi.searchCities(searchTerm, 5);
          if (searchRes && searchRes.length > 0) {
            selectSearchResult(searchRes[0]);
            return;
          }
        }
        // Graceful error feedback instead of silent incorrect fallback
        Alert.alert(
          t('common.warning'),
          t('cities.locationNoMatch') ||
            `${item.city || item.region || item.country || 'Konumunuz'} Türk Takvimi veritabanında otomatik bulunamadı. Lütfen listeden veya arama çubuğundan il/ilçenizi seçiniz.`
        );
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
                <Edit2 size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.headerSearchActiveRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.headerSearchActiveTitle} numberOfLines={1}>
              {toUpper(t('cities.searchPlaceholder'))}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.closeSearchBtn}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main List */}
      <FlatList
        data={cities}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Search Input Box */}
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.searchInputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Search size={20} color={theme.textMuted} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                <TextInput
                  placeholder={t('cities.searchPlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={text => {
                    setSearchQuery(text);
                    if (!isSearching) setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  style={[
                    styles.searchInput,
                    {
                      color: theme.textPrimary,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={styles.clearBtn}
                  >
                    <X size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Live Search Results Dropdown */}
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
                    <SearchResultItem
                      key={result.ID || idx}
                      result={result}
                      isLast={idx === searchResults.length - 1}
                      onSelect={() => selectSearchResult(result)}
                    />
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
          <SavedCityItem
            item={item}
            isEditing={isEditing}
            onSelect={() => {
              selectCity(item.id);
              onCitySelected?.();
            }}
            onRemove={() => removeCity(item.id)}
          />
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
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerSearchActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  headerSearchActiveTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  closeSearchBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  searchBox: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 4,
  },
  searchResultsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
  },
  searchLoadingText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  noResultsBox: {
    padding: 18,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  currentLocationText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
