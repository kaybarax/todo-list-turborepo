'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type DaisyUITheme =
  | 'todo-light'
  | 'todo-dark'
  | 'light'
  | 'dark'
  | 'cupcake'
  | 'bumblebee'
  | 'emerald'
  | 'corporate'
  | 'synthwave'
  | 'retro'
  | 'cyberpunk'
  | 'valentine'
  | 'halloween'
  | 'garden'
  | 'forest'
  | 'aqua'
  | 'lofi'
  | 'pastel'
  | 'fantasy'
  | 'wireframe'
  | 'black'
  | 'luxury'
  | 'dracula'
  | 'cmyk'
  | 'autumn'
  | 'business'
  | 'acid'
  | 'lemonade'
  | 'night'
  | 'coffee'
  | 'winter'
  | 'dim'
  | 'nord'
  | 'sunset';

interface ThemeContextType {
  theme: DaisyUITheme;
  setTheme: (theme: DaisyUITheme) => void;
  toggleTheme: () => void;
  systemPreference: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'daisyui-theme';
const DEFAULT_LIGHT_THEME: DaisyUITheme = 'todo-light';
const DEFAULT_DARK_THEME: DaisyUITheme = 'todo-dark';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: DaisyUITheme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_LIGHT_THEME,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');
  const [theme, setThemeState] = useState<DaisyUITheme>(defaultTheme);

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored && isValidTheme(stored)) {
      setThemeState(stored as DaisyUITheme);
    } else {
      // Use system preference for default themes
      const preferredTheme = systemPreference === 'dark' ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
      setThemeState(preferredTheme);
    }
  }, [storageKey, systemPreference]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Also set a CSS class for additional styling if needed
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme}`);

    // Store theme preference
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const setTheme = (newTheme: DaisyUITheme) => {
    if (isValidTheme(newTheme)) {
      setThemeState(newTheme);
    } else {
      console.warn(`Invalid theme: ${newTheme}. Using default theme.`);
      setThemeState(defaultTheme);
    }
  };

  const toggleTheme = () => {
    const isDarkTheme = isDark(theme);
    const newTheme = isDarkTheme ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    systemPreference,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme validation and utility functions
function isValidTheme(theme: string): theme is DaisyUITheme {
  const validThemes: DaisyUITheme[] = [
    'todo-light',
    'todo-dark',
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
  ];
  return validThemes.includes(theme as DaisyUITheme);
}

function isDark(theme: DaisyUITheme): boolean {
  const darkThemes: DaisyUITheme[] = [
    'todo-dark',
    'dark',
    'synthwave',
    'halloween',
    'forest',
    'black',
    'luxury',
    'dracula',
    'night',
    'coffee',
    'dim',
  ];
  return darkThemes.includes(theme);
}

// Export utility functions
export { isValidTheme, isDark };
