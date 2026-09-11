import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants';
import { storageService } from '../services/storageService';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: typeof COLORS.light;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await storageService.getTheme();
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    await storageService.setTheme(nextMode ? 'dark' : 'light');
  };

  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
