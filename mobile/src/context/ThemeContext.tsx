import React, { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgSurface: string;
  bgSurface2: string;
  bgCard: string;
  // Borders
  border: string;
  border2: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accents (same in both themes)
  cyan: string;
  amber: string;
  green: string;
  red: string;
  magenta: string;
  teal: string;
  // Semantic
  cardBg: string;
  headerBg: string;
  tabBarBg: string;
}

const DARK: ThemeColors = {
  bg: '#030a12',
  bgSurface: '#091828',
  bgSurface2: '#0d2038',
  bgCard: '#060f1c',
  border: '#122840',
  border2: '#1c3d60',
  textPrimary: '#b0d4ef',
  textSecondary: '#6a9bbe',
  textMuted: '#2d5577',
  cyan: '#00e5ff',
  amber: '#ffab00',
  green: '#00e676',
  red: '#ff1744',
  magenta: '#e040fb',
  teal: '#1de9b6',
  cardBg: '#091828',
  headerBg: '#030a12',
  tabBarBg: '#030a12',
};

const LIGHT: ThemeColors = {
  bg: '#f0f4f8',
  bgSurface: '#ffffff',
  bgSurface2: '#e8f0f7',
  bgCard: '#f8fafc',
  border: '#c8daea',
  border2: '#a0bdd4',
  textPrimary: '#0d2038',
  textSecondary: '#2d5577',
  textMuted: '#6a9bbe',
  cyan: '#0077aa',
  amber: '#b36200',
  green: '#007a3d',
  red: '#c0001a',
  magenta: '#8800c0',
  teal: '#006b55',
  cardBg: '#ffffff',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
};

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  resolved: 'dark',
  colors: DARK,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark');

  const resolved: ResolvedTheme =
    mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;

  const colors = resolved === 'light' ? LIGHT : DARK;

  const toggle = useCallback(() => {
    setMode((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, colors, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
