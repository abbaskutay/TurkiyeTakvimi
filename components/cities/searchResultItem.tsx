import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ApiSearchResult } from '../../services/turkishCalendarApi';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDisplayCityName } from '../../services/citySearchTranslationService';

interface SearchResultItemProps {
  result: ApiSearchResult;
  isLast: boolean;
  onSelect: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isLast,
  onSelect,
}) => {
  const { theme } = useTheme();
  const { language, isRTL } = useLanguage();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      style={[
        styles.searchResultRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <View style={[styles.searchResultInfo, isRTL && { alignItems: 'flex-end' }]}>
        <Text
          style={[
            styles.searchResultName,
            { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
          ]}
          numberOfLines={1}
        >
          {getDisplayCityName(result.NameTR, result.NameEN, language)}
        </Text>
        <Text
          style={[
            styles.searchResultSub,
            { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' },
          ]}
          numberOfLines={1}
        >
          {result.cityStateTR ? `${result.cityStateTR}, ` : ''}
          {result.countryName || 'Türkiye'}
        </Text>
      </View>
      <Plus size={22} color={COLORS.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});
