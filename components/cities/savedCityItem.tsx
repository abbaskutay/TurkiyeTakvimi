import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Globe, Trash2, ChevronRight } from 'lucide-react-native';
import { City } from '../../types';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDisplayCityName } from '../../services/citySearchTranslationService';

interface SavedCityItemProps {
  item: City;
  isEditing: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export const SavedCityItem: React.FC<SavedCityItemProps> = ({
  item,
  isEditing,
  onSelect,
  onRemove,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { language, isRTL, t, toUpper } = useLanguage();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (!isEditing) {
          onSelect();
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
          onPress={onRemove}
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
  );
};

const styles = StyleSheet.create({
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activeCityCard: {
    borderWidth: 1.5,
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
