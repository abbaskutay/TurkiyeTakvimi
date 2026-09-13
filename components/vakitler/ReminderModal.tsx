import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { ReminderConfig } from '../../types';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ReminderModalProps {
  showSettings: string | null;
  setShowSettings: (id: string | null) => void;
  reminders: Record<string, ReminderConfig>;
  toggleReminder: (id: string) => void;
  updateOffset: (id: string, offset: number) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  showSettings,
  setShowSettings,
  reminders,
  toggleReminder,
  updateOffset,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { t, getPrayerName, isRTL, toUpper } = useLanguage();

  if (!showSettings) return null;

  return (
    <Modal
      visible={!!showSettings}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSettings(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {getPrayerName(showSettings)} - {t('reminders.title')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowSettings(null)}
              style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#222' : '#f3f4f6' }]}
            >
              <X size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Toggle Switch */}
            <View
              style={[
                styles.modalOptionRow,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Text style={[styles.modalOptionLabel, { color: theme.textPrimary }]}>
                {t('reminders.subtitle')}
              </Text>
              <TouchableOpacity
                onPress={() => toggleReminder(showSettings)}
                style={[
                  styles.toggleTrack,
                  {
                    backgroundColor: reminders[showSettings]?.enabled ? COLORS.primary : '#d1d5db',
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    reminders[showSettings]?.enabled ? styles.toggleThumbActive : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Offset Options */}
            <View style={styles.offsetSection}>
              <Text
                style={[
                  styles.offsetSectionTitle,
                  { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {toUpper(t('reminders.title'))}
              </Text>
              <View style={[styles.offsetGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {[0, 5, 10, 15, 30].map(off => {
                  const isSelected = reminders[showSettings]?.offset === off;
                  return (
                    <TouchableOpacity
                      key={off}
                      onPress={() => updateOffset(showSettings, off)}
                      style={[
                        styles.offsetButton,
                        isSelected
                          ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                          : { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      ]}
                    >
                      <Text
                        style={[
                          styles.offsetButtonText,
                          { color: isSelected ? '#ffffff' : theme.textSecondary },
                        ]}
                      >
                        {off === 0 ? t('reminders.atTime') : `${off}m`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowSettings(null)}
              style={[styles.modalSaveButton, { backgroundColor: COLORS.primary }]}
            >
              <Text style={styles.modalSaveButtonText}>{toUpper(t('common.save'))}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    gap: 20,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  modalOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  offsetSection: {
    gap: 8,
  },
  offsetSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  offsetGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  offsetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offsetButtonText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalSaveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
