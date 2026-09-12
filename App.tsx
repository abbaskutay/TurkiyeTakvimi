import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Clock, Globe, Compass, Calendar, Sun, Moon } from 'lucide-react-native';
import { AppTab } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CityProvider, useCity } from './context/CityContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Vakitler from './components/Vakitler';
import Sehirler from './components/Sehirler';
import Kible from './components/Kible';
import Gunler from './components/Gunler';

const MainScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { cities, currentCity, updateCities } = useCity();
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.VAKITLER);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.VAKITLER:
        return (
          <Vakitler
            currentCity={currentCity}
            isDarkMode={isDarkMode}
            onNavigateToSehirler={() => setActiveTab(AppTab.SEHIRLER)}
          />
        );
      case AppTab.SEHIRLER:
        return (
          <Sehirler
            cities={cities}
            onUpdateCities={updateCities}
            isDarkMode={isDarkMode}
            onCitySelected={() => setActiveTab(AppTab.VAKITLER)}
          />
        );
      case AppTab.KIBLE:
        return <Kible currentCity={currentCity} isDarkMode={isDarkMode} />;
      case AppTab.GUNLER:
        return <Gunler isDarkMode={isDarkMode} />;
      default:
        return (
          <Vakitler
            currentCity={currentCity}
            isDarkMode={isDarkMode}
            onNavigateToSehirler={() => setActiveTab(AppTab.SEHIRLER)}
          />
        );
    }
  };

  const tabItems = [
    { id: AppTab.VAKITLER, label: 'Vakitler', Icon: Clock },
    { id: AppTab.SEHIRLER, label: 'Şehirler', Icon: Globe },
    { id: AppTab.KIBLE, label: 'Kıble', Icon: Compass },
    { id: AppTab.GUNLER, label: 'Günler', Icon: Calendar },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Main Content Area */}
      <View style={[styles.contentArea, { paddingTop: insets.top }]}>
        {renderContent()}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.tabBarBg,
            borderTopColor: theme.tabBarBorder,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        {tabItems.map(tab => {
          const isActive = activeTab === tab.id;
          const { Icon } = tab;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tabButton}
            >
              <View style={[styles.iconWrapper, isActive && { backgroundColor: isDarkMode ? 'rgba(255,77,94,0.12)' : 'rgba(160,24,38,0.08)' }]}>
                <Icon
                  size={20}
                  color={isActive ? theme.activeTab : theme.inactiveTab}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.activeTab : theme.inactiveTab,
                    fontWeight: isActive ? '900' : '700',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <CityProvider>
            <MainScreen />
          </CityProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  iconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
