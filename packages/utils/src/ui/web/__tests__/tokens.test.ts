import { describe, it, expect, vi } from 'vitest';

import {
  getToken,
  getTokenWithFallback,
  generateCSSCustomProperties,
  validateTokenStructure,
  mergeTokenThemes,
  TOKEN_CATEGORIES,
  COLOR_SHADES,
  SPACING_SCALE,
} from '../tokens';

describe('token utilities', () => {
  const mockTokens = {
    color: {
      primary: {
        500: '#3b82f6',
        600: '#2563eb',
      },
      secondary: {
        500: '#6b7280',
      },
    },
    space: {
      4: '1rem',
      8: '2rem',
    },
    typography: {
      fontSize: {
        base: '1rem',
        lg: '1.125rem',
      },
    },
    border: {
      radius: {
        md: '0.375rem',
      },
    },
    shadow: {
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    semantic: {
      themes: {
        light: {
          primary: '#3b82f6',
        },
      },
    },
  };

  describe('getToken', () => {
    it('should retrieve token by path', () => {
      expect(getToken(mockTokens, 'color.primary.500')).toBe('#3b82f6');
      expect(getToken(mockTokens, 'space.4')).toBe('1rem');
      expect(getToken(mockTokens, 'typography.fontSize.base')).toBe('1rem');
    });

    it('should return undefined for non-existent paths', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(getToken(mockTokens, 'color.nonexistent')).toBeUndefined();
      expect(getToken(mockTokens, 'nonexistent.path')).toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith('Token not found: color.nonexistent');
      expect(consoleSpy).toHaveBeenCalledWith('Token not found: nonexistent.path');

      consoleSpy.mockRestore();
    });

    it('should handle nested object access', () => {
      expect(getToken(mockTokens, 'semantic.themes.light.primary')).toBe('#3b82f6');
    });

    it('should handle single-level paths', () => {
      expect(getToken({ test: 'value' } as any, 'test')).toBe('value');
    });
  });

  describe('getTokenWithFallback', () => {
    it('should return token value when found', () => {
      expect(getTokenWithFallback(mockTokens, 'color.primary.500', 'fallback')).toBe('#3b82f6');
    });

    it('should return fallback when token not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(getTokenWithFallback(mockTokens, 'nonexistent', 'fallback')).toBe('fallback');

      consoleSpy.mockRestore();
    });

    it('should preserve fallback type', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const numberFallback = getTokenWithFallback(mockTokens, 'nonexistent', 42);
      expect(numberFallback).toBe(42);
      expect(typeof numberFallback).toBe('number');

      const objectFallback = getTokenWithFallback(mockTokens, 'nonexistent', { default: true });
      expect(objectFallback).toEqual({ default: true });

      consoleSpy.mockRestore();
    });
  });

  describe('generateCSSCustomProperties', () => {
    it('should generate CSS custom properties', () => {
      const css = generateCSSCustomProperties(mockTokens);

      expect(css).toContain(':root {');
      expect(css).toContain('--color-primary-500: #3b82f6;');
      expect(css).toContain('--space-4: 1rem;');
      expect(css).toContain('--typography-font-size-base: 1rem;');
      expect(css).toContain('}');
    });

    it('should handle nested objects', () => {
      const css = generateCSSCustomProperties(mockTokens);

      expect(css).toContain('--semantic-themes-light-primary: #3b82f6;');
    });

    it('should handle camelCase to kebab-case conversion', () => {
      const tokens = {
        fontSize: {
          baseLarge: '1.25rem',
        },
      };

      const css = generateCSSCustomProperties(tokens as any);
      expect(css).toContain('--font-size-base-large: 1.25rem;');
    });

    it('should handle empty tokens', () => {
      const css = generateCSSCustomProperties({} as any);
      expect(css).toBe(':root {\n\n}');
    });
  });

  describe('validateTokenStructure', () => {
    it('should validate complete token structure', () => {
      expect(validateTokenStructure(mockTokens)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(validateTokenStructure(null)).toBe(false);
      expect(validateTokenStructure(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(validateTokenStructure('string')).toBe(false);
      expect(validateTokenStructure(123)).toBe(false);
      expect(validateTokenStructure([])).toBe(false);
    });

    it('should return false for missing required categories', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const incompleteTokens = {
        color: {},
        space: {},
        // missing typography, border, shadow
      };

      expect(validateTokenStructure(incompleteTokens)).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing required token category: typography');

      consoleSpy.mockRestore();
    });

    it('should validate with all required categories present', () => {
      const validTokens = {
        color: {},
        space: {},
        typography: {},
        border: {},
        shadow: {},
      };

      expect(validateTokenStructure(validTokens)).toBe(true);
    });
  });

  describe('mergeTokenThemes', () => {
    it('should merge token themes', () => {
      const baseTokens = {
        color: { primary: '#blue' },
        space: { 4: '1rem' },
        typography: {},
        border: {},
        shadow: {},
        semantic: {
          light: { bg: 'white' },
        },
      };

      const themeTokens = {
        color: { secondary: '#red' },
        semantic: {
          dark: { bg: 'black' },
        },
      };

      const merged = mergeTokenThemes(baseTokens, themeTokens);

      expect(merged.color).toEqual({ secondary: '#red' });
      expect(merged.space).toEqual({ 4: '1rem' });
      expect(merged.semantic).toEqual({
        light: { bg: 'white' },
        dark: { bg: 'black' },
      });
    });

    it('should handle empty theme tokens', () => {
      const baseTokens = {
        color: { primary: '#blue' },
        space: {},
        typography: {},
        border: {},
        shadow: {},
        semantic: { light: { bg: 'white' } },
      };

      const merged = mergeTokenThemes(baseTokens, {});

      expect(merged).toEqual(baseTokens);
    });

    it('should handle missing semantic in base tokens', () => {
      const baseTokens = {
        color: {},
        space: {},
        typography: {},
        border: {},
        shadow: {},
      };

      const themeTokens = {
        semantic: { dark: { bg: 'black' } },
      };

      const merged = mergeTokenThemes(baseTokens, themeTokens);

      expect(merged.semantic).toEqual({
        dark: { bg: 'black' },
      });
    });
  });

  describe('constants', () => {
    it('should export TOKEN_CATEGORIES', () => {
      expect(TOKEN_CATEGORIES).toEqual(['color', 'space', 'typography', 'border', 'shadow', 'semantic']);
    });

    it('should export COLOR_SHADES', () => {
      expect(COLOR_SHADES).toEqual(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']);
    });

    it('should export SPACING_SCALE', () => {
      expect(SPACING_SCALE).toContain('0');
      expect(SPACING_SCALE).toContain('4');
      expect(SPACING_SCALE).toContain('96');
      expect(SPACING_SCALE.length).toBe(30);
    });
  });
});
