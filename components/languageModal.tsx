import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Check, X, Globe } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants';
import { LanguageCode } from '../locales';

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ visible, onClose }) => {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const { isDarkMode, theme } = useTheme();

  const handleSelectLanguage = async (code: LanguageCode) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(255, 77, 94, 0.15)'
                          : 'rgba(160, 24, 38, 0.1)',
                      },
                    ]}
                  >
                    <Globe
                      size={20}
                      color={isDarkMode ? COLORS.accentRed : COLORS.primary}
                    />
                  </View>
                  <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {t('language.title')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  accessibilityLabel={t('common.close')}
                >
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Language Options List */}
              <View style={styles.listContainer}>
                {supportedLanguages.map(item => {
                  const isSelected = language === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => handleSelectLanguage(item.code)}
                      activeOpacity={0.7}
                      style={[
                        styles.languageOption,
                        {
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? 'rgba(255, 77, 94, 0.12)'
                              : 'rgba(160, 24, 38, 0.08)'
                            : isDarkMode
                            ? '#1a1a1a'
                            : '#f9fafb',
                          borderColor: isSelected
                            ? isDarkMode
                              ? COLORS.accentRed
                              : COLORS.primary
                            : theme.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.flagEmoji}>{item.flag}</Text>
                        <View style={styles.labelGroup}>
                          <Text
                            style={[
                              styles.nativeLabel,
                              {
                                color: isSelected
                                  ? isDarkMode
                                    ? COLORS.accentRed
                                    : COLORS.primary
                                  : theme.textPrimary,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {item.nativeLabel}
                          </Text>
                          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                            {item.label}
                          </Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View
                          style={[
                            styles.checkBadge,
                            {
                              backgroundColor: isDarkMode
                                ? COLORS.accentRed
                                : COLORS.primary,
                            },
                          ]}
                        >
                          <Check size={14} color="#ffffff" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    flexShrink: 0,
  },
  listContainer: {
    gap: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flagEmoji: {
    fontSize: 26,
  },
  labelGroup: {
    gap: 2,
  },
  nativeLabel: {
    fontSize: 16,
  },
  subLabel: {
    fontSize: 12,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
