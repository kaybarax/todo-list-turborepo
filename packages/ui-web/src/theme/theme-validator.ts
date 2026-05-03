import type { DaisyUITheme, DaisyUIThemeColors } from './types';

// Import generated theme tokens for validation
let daisyuiThemes: Record<string, any> = {};
try {
  const generatedThemes = require('../../dist/tokens/daisyui-themes.js');
  daisyuiThemes = generatedThemes.themeObjects ?? generatedThemes;
} catch {
  console.warn('DaisyUI themes not found. Run token build first.');
}

export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  theme: DaisyUITheme;
}

// DaisyUIThemeColors interface comes from './types'

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

// --- Accessibility helpers ---
function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  // Hex #RGB or #RRGGBB
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split('')
            .map(ch => ch + ch)
            .join('')
        : hex;
    if (/^[A-Fa-f0-9]{6}$/.test(normalized)) {
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return { r, g, b };
    }
  }

  // rgb/rgba
  const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)$/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return { r: Number(r), g: Number(g), b: Number(b) };
  }

  // hsl/hsla
  const hslMatch = color.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+)?\s*\)$/i);
  if (hslMatch) {
    const [, hStr, sStr, lStr] = hslMatch;
    const h = Number(hStr) / 360;
    const s = Number(sStr) / 100;
    const l = Number(lStr) / 100;

    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const toRgb = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const r = Math.round(toRgb(h + 1 / 3) * 255);
    const g = Math.round(toRgb(h) * 255);
    const b = Math.round(toRgb(h - 1 / 3) * 255);
    return { r, g, b };
  }

  return null;
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const srgb = [r, g, b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(fg: string, bg: string): number | null {
  const fgRgb = parseColorToRgb(fg);
  const bgRgb = parseColorToRgb(bg);
  if (!fgRgb || !bgRgb) return null;
  const L1 = relativeLuminance(fgRgb);
  const L2 = relativeLuminance(bgRgb);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

function validateThemeAccessibility(themeColors: Record<string, string>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const MIN_RATIO = 4.5; // WCAG AA for normal text

  // Pairs to check: prefer explicit *-content when provided
  const pairs: Array<[string, string, string]> = [
    [themeColors['base-content'] || '#000000', themeColors['base-100'], 'base-content vs base-100'],
    [themeColors['base-content'] || '#000000', themeColors['base-200'], 'base-content vs base-200'],
    [
      themeColors['neutral-content'] || themeColors['base-content'] || '#000000',
      themeColors['neutral'],
      'neutral-content vs neutral',
    ],
    [
      themeColors['primary-content'] || themeColors['base-content'] || '#000000',
      themeColors['primary'],
      'primary-content vs primary',
    ],
    [
      themeColors['secondary-content'] || themeColors['base-content'] || '#000000',
      themeColors['secondary'],
      'secondary-content vs secondary',
    ],
    [
      themeColors['accent-content'] || themeColors['base-content'] || '#000000',
      themeColors['accent'],
      'accent-content vs accent',
    ],
    [
      themeColors['info-content'] || themeColors['base-content'] || '#000000',
      themeColors['info'],
      'info-content vs info',
    ],
    [
      themeColors['success-content'] || themeColors['base-content'] || '#000000',
      themeColors['success'],
      'success-content vs success',
    ],
    [
      themeColors['warning-content'] || themeColors['base-content'] || '#000000',
      themeColors['warning'],
      'warning-content vs warning',
    ],
    [
      themeColors['error-content'] || themeColors['base-content'] || '#000000',
      themeColors['error'],
      'error-content vs error',
    ],
  ];

  for (const [fg, bg, label] of pairs) {
    if (!fg || !bg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio == null) {
      warnings.push(`Could not parse colors for contrast check: ${label}`);
      continue;
    }
    if (ratio < MIN_RATIO) {
      errors.push(`Insufficient contrast (${ratio.toFixed(2)}). Pair: ${label}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
