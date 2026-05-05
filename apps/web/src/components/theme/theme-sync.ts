'use client';

import { useEffect, useCallback } from 'react';
import { useTheme, type DaisyUITheme } from './theme-provider';
import { validateTheme } from './theme-validator';

export interface ThemeSyncOptions {
  autoValidate?: boolean;
  onThemeChange?: (theme: DaisyUITheme) => void;
  onValidationError?: (errors: string[]) => void;
  syncWithSystem?: boolean;
}

/**
 * Hook for synchronizing theme changes with DaisyUI and Style Dictionary
 */
export function useThemeSync(options: ThemeSyncOptions = {}) {
  const { autoValidate = true, onThemeChange, onValidationError, syncWithSystem = true } = options;

  const { theme, setTheme, systemPreference } = useTheme();

  // Validate theme on change
  useEffect(() => {
    if (autoValidate) {
      const validation = validateTheme(theme);
      if (!validation.isValid && onValidationError) {
        onValidationError(validation.errors);
      }
    }
  }, [theme, autoValidate, onValidationError]);

  // Notify on theme change
  useEffect(() => {
    if (onThemeChange) {
      onThemeChange(theme);
    }
  }, [theme, onThemeChange]);

  // Sync with system preference
  useEffect(() => {
    if (syncWithSystem && !localStorage.getItem('daisyui-theme')) {
      const preferredTheme = systemPreference === 'dark' ? 'todo-dark' : 'todo-light';
      setTheme(preferredTheme);
    }
  }, [systemPreference, syncWithSystem, setTheme]);

  const forceSync = useCallback(() => {
    // Force re-apply theme to DOM
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return {
    theme,
    setTheme,
    forceSync,
    validation: autoValidate ? validateTheme(theme) : null,
  };
}

/**
 * Utility to programmatically update Style Dictionary tokens and regenerate themes
 */
export async function regenerateThemes(): Promise<boolean> {
  try {
    // This would typically trigger a rebuild of tokens
    // In a real implementation, this might call a build API or trigger a file watcher
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync('npm run build:tokens', { cwd: process.cwd() });
    return true;
  } catch (error) {
    console.error('Failed to regenerate themes:', error);
    return false;
  }
}

/**
 * Export theme configuration for external tools
 */
export function exportThemeConfig(theme: DaisyUITheme) {
  try {
    const daisyuiThemes = require('../../dist/tokens/daisyui-themes.js');
    return {
      theme,
      colors: daisyuiThemes[theme] || null,
      cssVariables: generateCSSVariables(theme),
      tailwindConfig: generateTailwindConfig(theme),
    };
  } catch (error) {
    console.warn('Could not export theme config:', error);
    return null;
  }
}

function generateCSSVariables(theme: DaisyUITheme): string {
  try {
    const daisyuiThemes = require('../../dist/tokens/daisyui-themes.js');
    const themeColors = daisyuiThemes[theme];

    if (!themeColors) return '';

    return Object.entries(themeColors)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join('\n');
  } catch {
    return '';
  }
}

function generateTailwindConfig(theme: DaisyUITheme): object {
  try {
    const daisyuiThemes = require('../../dist/tokens/daisyui-themes.js');
    const themeColors = daisyuiThemes[theme];

    if (!themeColors) return {};

    return {
      theme: {
        extend: {
          colors: themeColors,
        },
      },
    };
  } catch {
    return {};
  }
}
