/**
 * Theme Validation Utilities
 * Validates theme configuration and provides error handling
 */

import { type Theme } from './types';
import { type ColorTokens } from '../tokens/colors';

export class ThemeValidationError extends Error {
  public readonly type: string;

  constructor(message: string, type: string = 'validation') {
    super(message);
    this.name = 'ThemeValidationError';
    this.type = type;
  }
}

/**
 * Validates if a color is a valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
};

/**
 * Validates if a color is a valid rgba color
 */
export const isValidRgbaColor = (color: string): boolean => {
  const rgbaColorRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)$/;
  return rgbaColorRegex.test(color);
};

/**
 * Validates if a color value is valid
 */
export const isValidColor = (color: string): boolean => {
  return isValidHexColor(color) || isValidRgbaColor(color) || color === 'transparent';
};

/**
 * Validates color contrast ratio for accessibility
 */
export const validateContrastRatio = (foreground: string, background: string): number => {
  const expandHex = (color: string): string | null => {
    const normalized = color.trim().toLowerCase();
    const match = normalized.match(/^#([a-f0-9]{3}|[a-f0-9]{6})$/);
    if (!match) return null;

    const hex = match[1];
    return hex.length === 3
      ? hex
          .split('')
          .map(character => character + character)
          .join('')
      : hex;
  };

  const getLinearChannel = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const getLuminance = (color: string): number => {
    if (color === 'white') return 1;
    if (color === 'black') return 0;

    const hex = expandHex(color);
    if (!hex) return 0.5;

    const red = getLinearChannel(Number.parseInt(hex.slice(0, 2), 16));
    const green = getLinearChannel(Number.parseInt(hex.slice(2, 4), 16));
    const blue = getLinearChannel(Number.parseInt(hex.slice(4, 6), 16));

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Validates color tokens structure
 */
export const validateColorTokens = (colors: ColorTokens): void => {
  // Validate text colors have sufficient contrast
  const textPrimaryContrast = validateContrastRatio(colors.text.primary, colors.background);
  if (textPrimaryContrast < 4.5) {
    console.warn('Primary text color may not have sufficient contrast ratio for accessibility');
  }

  const textSecondaryContrast = validateContrastRatio(colors.text.secondary, colors.background);
  if (textSecondaryContrast < 3) {
    console.warn('Secondary text color may not have sufficient contrast ratio for accessibility');
  }

  // Validate all color values are valid
  const validateColorScale = (scale: any, name: string) => {
    Object.entries(scale).forEach(([key, value]) => {
      if (typeof value === 'string' && !isValidColor(value)) {
        throw new ThemeValidationError(`Invalid color value in ${name}.${key}: ${value}`);
      }
    });
  };

  validateColorScale(colors.primary, 'primary');
  validateColorScale(colors.secondary, 'secondary');
  validateColorScale(colors.success, 'success');
  validateColorScale(colors.warning, 'warning');
  validateColorScale(colors.error, 'error');
  validateColorScale(colors.neutral, 'neutral');
  validateColorScale(colors.text, 'text');
  validateColorScale(colors.border, 'border');
};

/**
 * Validates complete theme configuration
 */
export const validateTheme = (theme: Theme): void => {
  if (!theme.name) {
    throw new ThemeValidationError('Theme must have a name');
  }

  if (!theme.colors) {
    throw new ThemeValidationError('Theme must have colors configuration');
  }

  if (!theme.typography) {
    throw new ThemeValidationError('Theme must have typography configuration');
  }

  if (!theme.spacing) {
    throw new ThemeValidationError('Theme must have spacing configuration');
  }

  validateColorTokens(theme.colors);
};

/**
 * Safe theme getter with validation
 */
export const getSafeTheme = (theme: Theme, fallbackTheme: Theme): Theme => {
  try {
    validateTheme(theme);
    return theme;
  } catch (error) {
    console.error('Theme validation failed, using fallback theme:', error);
    return fallbackTheme;
  }
};
