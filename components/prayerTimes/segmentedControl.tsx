import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface SegmentedControlProps {
  activePage: number;
  onSelectPage: (index: number) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  activePage,
  onSelectPage,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { isRTL, t } = useLanguage();

  return (
    <View
      style={[
        styles.segmentContainer,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => onSelectPage(0)}
        activeOpacity={0.8}
        style={[
          styles.segmentButton,
          activePage === 0 && { backgroundColor: isDarkMode ? COLORS.primaryDark : COLORS.primary },
        ]}
      >
        <Text
          style={[
            styles.segmentButtonText,
            { color: activePage === 0 ? '#ffffff' : theme.textSecondary },
          ]}
          numberOfLines={1}
        >
          {t('vakitler.mainPrayers')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onSelectPage(1)}
        activeOpacity={0.8}
        style={[
          styles.segmentButton,
          activePage === 1 && { backgroundColor: isDarkMode ? COLORS.primaryDark : COLORS.primary },
        ]}
      >
        <Text
          style={[
            styles.segmentButtonText,
            { color: activePage === 1 ? '#ffffff' : theme.textSecondary },
          ]}
          numberOfLines={1}
        >
          {t('vakitler.allPrayers')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
