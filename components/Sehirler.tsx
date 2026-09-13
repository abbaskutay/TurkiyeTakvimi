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

  const [loading, setLoading] = useState(false);
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

    setLoading(true);
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
      setLoading(false);
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
      Alert.alert('Uyarı', 'En az bir şehir listede kalmalıdır.');
      return;
    }
    const updatedCities = cities.filter(c => c.id !== id);
    if (cities.find(c => c.id === id)?.isCurrent && updatedCities.length > 0) {
      updatedCities[0].isCurrent = true;
    }
    onUpdateCities(updatedCities);
  };

  const handleGetLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Mevcut konumunuzu alabilmek için konum izni vermeniz gerekmektedir.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!location || !location.coords) {
        Alert.alert('Hata', 'Konum tespiti yapılamadı.');
        setLoading(false);
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
      Alert.alert('Hata', 'Konum bilgisi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.headerBg }]}>
        {!isSearching ? (
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={isRTL && { alignItems: 'flex-end' }}>
              <Text style={styles.headerTitle}>{t('cities.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('cities.subtitle')}</Text>
            </View>
            <View style={[styles.headerActionBtns, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.8}
                style={[styles.headerBtn, styles.headerBtnInactive]}
                accessibilityLabel={t('language.changeLanguage')}
              >
                <Globe size={18} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleTheme}
                activeOpacity={0.8}
                style={[styles.headerBtn, styles.headerBtnInactive]}
                accessibilityLabel={t('common.themeToggle')}
              >
                {isDarkMode ? <Sun size={20} color="#ffffff" /> : <Moon size={20} color="#ffffff" />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={[
                  styles.headerBtn,
                  isEditing ? styles.headerBtnActive : styles.headerBtnInactive,
                ]}
              >
                {isEditing ? (
                  <CheckCircle2 size={20} color={COLORS.primary} />
                ) : (
                  <Edit2 size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsSearching(true)}
                style={[styles.headerBtn, styles.headerBtnInactive]}
              >
                <Search size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.searchBarRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.searchInputContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Search size={18} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
              <TextInput
                autoFocus
                placeholder={t('cities.searchPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <X size={16} color="rgba(255,255,255,0.6)" />
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
                {loading ? (
                  <View style={styles.searchLoadingBox}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={[styles.searchLoadingText, { color: theme.textMuted }]}>
                      Türkiye Takvimi veritabanında aranıyor...
                    </Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <TouchableOpacity
                      key={result.ID ? `search_${result.ID}_${idx}` : `search_${idx}`}
                      onPress={() => selectSearchResult(result)}
                      style={[
                        styles.searchResultRow,
                        idx < searchResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
                      ]}
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={[styles.searchResultName, { color: theme.textPrimary }]}>
                          {getDisplayCityName(result.NameTR, result.NameEN, language)}
                        </Text>
                        <Text style={[styles.searchResultSub, { color: theme.textSecondary }]}>
                          {result.cityStateTR ? `${result.cityStateTR}, ` : ''}{result.countryName || 'Türkiye'}
                        </Text>
                      </View>
                      <Plus size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsBox}>
                    <Text style={[styles.noResultsText, { color: theme.textMuted }]}>
                      {t('cities.noSavedCities')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Use Current GPS Location Button */}
            <TouchableOpacity
              onPress={handleGetLocation}
              disabled={loading}
              style={[
                styles.currentLocationButton,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MapPin size={20} color={COLORS.primary} />
              )}
              <Text style={[styles.currentLocationText, { color: theme.textPrimary }]}>
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
                ]}
              >
                {item.isCurrent ? (
                  <Check size={20} color="#ffffff" />
                ) : (
                  <Globe size={20} color={theme.textMuted} />
                )}
              </View>
              <View style={[styles.cityTextCol, isRTL && { alignItems: 'flex-end' }]}>
                <View style={[styles.cityNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text
                    style={[
                      styles.cityNameText,
                      { color: item.isCurrent ? (isDarkMode ? '#ffffff' : '#111827') : theme.textSecondary },
                    ]}
                  >
                    {getDisplayCityName(item.name, item.name, language)}
                  </Text>
                  {item.isCurrent && (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>{toUpper(t('cities.defaultCity'))}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cityRegionText, { color: theme.textMuted }]}>
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
                <Trash2 size={20} color={COLORS.accentRed} />
              </TouchableOpacity>
            ) : (
              <ChevronRight
                size={20}
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
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginTop: 2,
  },
  headerActionBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
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
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  clearSearchBtn: {
    padding: 4,
  },
  cancelSearchBtn: {
    paddingVertical: 8,
  },
  cancelSearchText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
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
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: 10,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '800',
  },
  searchResultSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  noResultsBox: {
    padding: 20,
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
    paddingVertical: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 8,
    gap: 10,
  },
  currentLocationText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 22,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
  },
  activePill: {
    backgroundColor: 'rgba(160, 24, 38, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
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
