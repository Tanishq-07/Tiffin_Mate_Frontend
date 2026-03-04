import { createContext, useContext } from 'react';

export const LIGHT = {
  bg: '#f7f8fc',
  card: '#ffffff',
  cardAlt: '#f0f2fa',
  accent: '#5b6af0',
  accentSoft: '#eceeff',
  text: '#1a1d2e',
  subtext: '#6b7280',
  muted: '#b0b7c3',
  border: '#e5e7f0',
  headerBg: '#f7f8fc',
};

export const DARK = {
  bg: '#0e0f1a',
  card: '#1a1b2e',
  cardAlt: '#141526',
  accent: '#7b8bff',
  accentSoft: '#1e2145',
  text: '#e8eaf6',
  subtext: '#9094b0',
  muted: '#4a4e6a',
  border: '#252640',
  headerBg: '#0e0f1a',
};

export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);