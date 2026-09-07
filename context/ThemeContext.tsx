import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LightColors, DarkColors, ThemeColors } from '../lib/theme';

const THEME_KEY = 'raikaro_dark_mode';

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((val) => {
      if (val !== null) setIsDark(val === 'true');
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    setIsDark((prev) => {
      const next = !prev;
      SecureStore.setItemAsync(THEME_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DarkColors : LightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
