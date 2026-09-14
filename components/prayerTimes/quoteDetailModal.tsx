import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { BookOpen, X, Share2 } from 'lucide-react-native';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface QuoteDetailModalProps {
  visible: boolean;
  activeQuote: string;
  quoteAuthor: string;
  onClose: () => void;
  onShare: () => void;
}

export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  visible,
  activeQuote,
  quoteAuthor,
  onClose,
  onShare,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { isRTL, t, toUpper } = useLanguage();

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
        <View style={[styles.quoteModalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.quoteModalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.quoteHeaderLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <BookOpen size={18} color={COLORS.primary} />
              <Text style={[styles.quoteModalTitle, { color: theme.textPrimary }]}>
                {t('vakitler.quoteOfTheDay')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 280, marginVertical: 12 }}>
            <Text
              style={[
                styles.quoteFullText,
                { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {activeQuote}
            </Text>
            <Text style={[styles.quoteAuthorModal, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
              {quoteAuthor}
            </Text>
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              onClose();
              onShare();
            }}
            style={[
              styles.modalShareBtn,
              { backgroundColor: COLORS.primary, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Share2 size={16} color="#ffffff" />
            <Text style={styles.modalShareBtnText}>{toUpper(t('common.share'))}</Text>
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
  quoteModalCard: {
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
  quoteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quoteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quoteModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 8,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  quoteFullText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  quoteAuthorModal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  modalShareBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
