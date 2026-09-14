import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextLayoutEventData,
  LayoutChangeEvent,
} from 'react-native';
import { Quote, Share2 } from 'lucide-react-native';
import { COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface QuoteCardProps {
  activeQuote: string;
  quoteAuthor: string;
  onShare: () => void;
  onReadMore: () => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  activeQuote,
  quoteAuthor,
  onShare,
  onReadMore,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { isRTL, t, toUpper } = useLanguage();

  const [isTruncated, setIsTruncated] = useState(false);
  const [visibleHeight, setVisibleHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);

  // Reset truncation state whenever active quote changes
  useEffect(() => {
    setIsTruncated(false);
    setVisibleHeight(0);
    setFullHeight(0);
  }, [activeQuote]);

  // Native onTextLayout callback on the unconstrained hidden measure text
  const handleMeasureTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const lines = e.nativeEvent?.lines;
      if (lines) {
        setIsTruncated(lines.length > 2);
      }
    },
    []
  );

  // Native onTextLayout callback on the visible text (for platforms that report all lines)
  const handleVisibleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const lines = e.nativeEvent?.lines;
      if (lines && lines.length > 2) {
        setIsTruncated(true);
      }
    },
    []
  );

  // Height measurement callbacks for Web and cross-platform layout comparison
  const handleVisibleLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent?.layout?.height;
    if (typeof h === 'number' && h > 0) {
      setVisibleHeight(h);
    }
  }, []);

  const handleMeasureLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent?.layout?.height;
    if (typeof h === 'number' && h > 0) {
      setFullHeight(h);
    }
  }, []);

  useEffect(() => {
    if (fullHeight > 0 && visibleHeight > 0) {
      // If unconstrained text height exceeds the 2-line clamped height by at least 3px, it is truncated
      setIsTruncated(fullHeight > visibleHeight + 3);
    }
  }, [fullHeight, visibleHeight]);

  return (
    <View style={[styles.quoteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.quoteHeader}>
        <View style={[styles.quoteHeaderLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.quoteIconBox, isRTL ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }]}>
            <Quote size={13} color={COLORS.primary} />
          </View>
          <Text style={styles.quoteBadgeText} numberOfLines={1}>
            {toUpper(t('vakitler.quoteOfTheDay'))}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onShare}
          activeOpacity={0.7}
          style={[styles.quoteShareBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Share2 size={13} color={isDarkMode ? COLORS.accentRed : COLORS.primary} />
          <Text style={[styles.quoteShareText, { color: isDarkMode ? COLORS.accentRed : COLORS.primary }]}>
            {t('common.share')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quoteTextContainer}>
        <Text
          style={[
            styles.quoteText,
            { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' },
          ]}
          numberOfLines={2}
          onPress={isTruncated ? onReadMore : undefined}
          onTextLayout={handleVisibleTextLayout}
          onLayout={handleVisibleLayout}
        >
          {activeQuote}
        </Text>

        {/* Hidden measurement text to detect if the quote exceeds 2 lines */}
        <Text
          style={[
            styles.quoteText,
            styles.measureText,
            { textAlign: isRTL ? 'right' : 'left' },
          ]}
          onTextLayout={handleMeasureTextLayout}
          onLayout={handleMeasureLayout}
          pointerEvents="none"
          aria-hidden
          importantForAccessibility="no"
          accessible={false}
        >
          {activeQuote}
        </Text>
      </View>

      <View style={[styles.quoteFooterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text
          style={[
            styles.quoteAuthor,
            { color: isDarkMode ? COLORS.accentRed : COLORS.primary },
            isRTL ? { marginLeft: 8 } : { marginRight: 8 },
          ]}
          numberOfLines={1}
        >
          {quoteAuthor}
        </Text>
        {isTruncated && (
          <TouchableOpacity onPress={onReadMore} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={[styles.readMoreText, { color: theme.textMuted }]}>
              {t('vakitler.readMore')} ›
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quoteCard: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quoteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quoteIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(160,24,38,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  quoteShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(160,24,38,0.08)',
  },
  quoteShareText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  quoteTextContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 18.5,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  measureText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
    pointerEvents: 'none',
    zIndex: -1,
  },
  quoteFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteAuthor: {
    fontSize: 11.5,
    fontWeight: '800',
    flex: 1,
  },
  readMoreText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
});
