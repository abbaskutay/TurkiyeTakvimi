import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { COLORS } from '../constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={36} color={COLORS.accentRed} />
            </View>

            <Text style={styles.title}>Beklenmedik Bir Hata Oluştu</Text>
            <Text style={styles.message}>
              Uygulama çalışırken beklenmeyen bir hata ile karşılaşıldı. Lütfen aşağıdaki butona
              tıklayarak ekranı yenilemeyi deneyin.
            </Text>

            {__DEV__ && this.state.error ? (
              <View style={styles.devErrorBox}>
                <Text style={styles.devErrorText} numberOfLines={4}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={this.handleReset}
              style={styles.retryButton}
            >
              <RotateCcw size={18} color="#ffffff" />
              <Text style={styles.retryButtonText}>Yeniden Dene</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161616',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 77, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  devErrorBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 77, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 94, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  devErrorText: {
    fontSize: 11,
    color: '#ff4d5e',
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
