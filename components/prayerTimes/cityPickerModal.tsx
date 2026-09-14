import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { X, Check, Plus } from 'lucide-react-native';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useCity } from '../../context/CityContext';
import { useLanguage } from '../../context/LanguageContext';

interface CityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToSehirler?: () => void;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  visible,
  onClose,
  onNavigateToSehirler,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { cities, currentCity, selectCity } = useCity();
  const { isRTL, t } = useLanguage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalOverlay}
      >
        <View style={[styles.citySheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.citySheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.citySheetTitle, { color: theme.textPrimary }]}>
              {t('cities.savedCities')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 260 }}>
            {cities.map(c => {
              const isSel = c.id === currentCity.id || c.cityID === currentCity.cityID;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    selectCity(c.id);
                    onClose();
                  }}
                  style={[
                    styles.citySheetRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    isSel && { backgroundColor: isDarkMode ? 'rgba(160,24,38,0.18)' : 'rgba(160,24,38,0.06)' },
                  ]}
                >
                  <View
                    style={[
                      { flex: 1 },
                      isRTL ? { alignItems: 'flex-end', marginLeft: 8 } : { marginRight: 8 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.citySheetRowName,
                        { color: isSel ? (isDarkMode ? COLORS.accentRed : COLORS.primary) : theme.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    <Text style={[styles.citySheetRowSub, { color: theme.textMuted }]} numberOfLines={1}>
                      {c.city}, {c.country}
                    </Text>
                  </View>
                  {isSel && <Check size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              onClose();
              onNavigateToSehirler?.();
            }}
            style={[
              styles.addNewCityBtn,
              {
                backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Plus size={16} color={theme.textPrimary} />
            <Text style={[styles.addNewCityBtnText, { color: theme.textPrimary }]}>
              {t('cities.addCityTab')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  citySheet: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  citySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  citySheetTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  citySheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  citySheetRowName: {
    fontSize: 14,
    fontWeight: '800',
  },
  citySheetRowSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  addNewCityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  addNewCityBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
