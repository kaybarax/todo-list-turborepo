export { ThemeProvider, useTheme, isDark, isValidTheme, type DaisyUITheme } from './theme-provider';

import { useTheme, type DaisyUITheme } from './theme-provider';

export interface ThemeDescriptor {
  name: DaisyUITheme | string;
  displayName?: string;
  type: 'light' | 'dark';
  daisyUITheme?: DaisyUITheme | string;
}

export interface ThemeContextCompat {
  mode: 'light' | 'dark' | 'system';
  resolvedType: 'light' | 'dark';
  theme: ThemeDescriptor;
  themes: ThemeDescriptor[];
  daisyUITheme: DaisyUITheme | string;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  setTheme: (theme: ThemeDescriptor | DaisyUITheme | string) => void;
  setDaisyUITheme: (theme: DaisyUITheme | string) => void;
}

export function useThemeContext(): ThemeContextCompat {
  const { theme, setTheme, systemPreference } = useTheme();

  return {
    mode: 'system' as const,
    resolvedType: systemPreference,
    theme: {
      name: theme,
      displayName: theme
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      type: systemPreference,
      daisyUITheme: theme,
    },
    themes: [],
    daisyUITheme: theme,
    setMode: () => undefined,
    setTheme: nextTheme => {
      const themeName = typeof nextTheme === 'string' ? nextTheme : nextTheme.name;
      setTheme(themeName as DaisyUITheme);
    },
    setDaisyUITheme: nextTheme => setTheme(nextTheme as DaisyUITheme),
  };
}
