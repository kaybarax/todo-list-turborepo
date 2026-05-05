import { type DaisyUITheme } from './theme-provider';

// Import generated theme tokens for validation
let daisyuiThemes: Record<string, any> = {};
try {
  daisyuiThemes = require('../../dist/tokens/daisyui-themes.js');
} catch (error) {
  console.warn('DaisyUI themes not found. Run token build first.');
}

export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  theme: DaisyUITheme;
}

export interface DaisyUIThemeColors {
  primary: string;
  'primary-focus'?: string;
  'primary-content'?: string;
  secondary: string;
  'secondary-focus'?: string;
  'secondary-content'?: string;
  accent: string;
  'accent-focus'?: string;
  'accent-content'?: string;
  neutral: string;
  'neutral-focus'?: string;
  'neutral-content'?: string;
  'base-100': string;
  'base-200': string;
  'base-300': string;
  'base-content': string;
  info: string;
  'info-content'?: string;
  success: string;
  'success-content'?: string;
  warning: string;
  'warning-content'?: string;
  error: string;
  'error-content'?: string;
}

const REQUIRED_THEME_COLORS: (keyof DaisyUIThemeColors)[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'base-100',
  'base-200',
  'base-300',
  'base-content',
  'info',
  'success',
  'warning',
  'error',
];

export function validateTheme(theme: DaisyUITheme): ThemeValidationResult {
  const result: ThemeValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    theme,
  };

  // Check if theme exists in generated themes
  if (theme.startsWith('todo-') && !daisyuiThemes[theme]) {
    result.errors.push(`Custom theme '${theme}' not found in generated themes`);
    result.isValid = false;
  }

  // Validate theme colors if it's a custom theme
  if (theme.startsWith('todo-') && daisyuiThemes[theme]) {
    const themeColors = daisyuiThemes[theme];

    // Check required colors
    for (const colorKey of REQUIRED_THEME_COLORS) {
      if (!themeColors[colorKey]) {
        result.errors.push(`Missing required color '${colorKey}' in theme '${theme}'`);
        result.isValid = false;
      }
    }

    // Validate color format (should be hex colors)
    for (const [colorKey, colorValue] of Object.entries(themeColors)) {
      if (typeof colorValue === 'string' && !isValidColor(colorValue)) {
        result.warnings.push(`Color '${colorKey}' has invalid format: ${colorValue}`);
      }
    }
  }

  // Check theme accessibility
  if (theme.startsWith('todo-') && daisyuiThemes[theme]) {
    const accessibilityCheck = validateThemeAccessibility(daisyuiThemes[theme]);
    result.warnings.push(...accessibilityCheck.warnings);
    if (!accessibilityCheck.isValid) {
      result.errors.push(...accessibilityCheck.errors);
      result.isValid = false;
    }
  }

  return result;
}

export function validateAllThemes(): Record<string, ThemeValidationResult> {
  const results: Record<string, ThemeValidationResult> = {};

  // Validate custom themes
  for (const themeName of Object.keys(daisyuiThemes)) {
    results[themeName] = validateTheme(themeName as DaisyUITheme);
  }

  return results;
}

function isValidColor(color: string): boolean {
  // Check for hex color format
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }

  // Check for rgb/rgba format
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  // Check for hsl/hsla format
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  return false;
}

function validateThemeAccessibility(themeColors: DaisyUIThemeColors): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result: { isValid: boolean; errors: string[]; warnings: string[] } = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check contrast ratios (simplified check)
  const contrastPairs: Array<[keyof DaisyUIThemeColors, keyof DaisyUIThemeColors]> = [
    ['primary', 'primary-content'],
    ['secondary', 'secondary-content'],
    ['accent', 'accent-content'],
    ['base-100', 'base-content'],
    ['info', 'info-content'],
    ['success', 'success-content'],
    ['warning', 'warning-content'],
    ['error', 'error-content'],
  ];

  for (const [bg, fg] of contrastPairs) {
    const bgColor = themeColors[bg];
    const fgColor = themeColors[fg];

    if (bgColor && fgColor) {
      // This is a simplified check - in a real implementation, you'd calculate actual contrast ratios
      if (bgColor === fgColor) {
        result.warnings.push(`Background and foreground colors are identical for ${bg}/${fg}`);
      }
    }
  }

  return result;
}

export function getThemePreview(theme: DaisyUITheme): DaisyUIThemeColors | null {
  if (theme.startsWith('todo-') && daisyuiThemes[theme]) {
    return daisyuiThemes[theme];
  }
  return null;
}

export function useThemeValidation(theme: DaisyUITheme) {
  const validation = validateTheme(theme);

  return {
    ...validation,
    hasErrors: validation.errors.length > 0,
    hasWarnings: validation.warnings.length > 0,
    preview: getThemePreview(theme),
  };
}
