// @ts-nocheck
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Import core token files
import coreColors from '../lib/../tokens/core/colors.json';
import coreSpacing from '../lib/../tokens/core/spacing.json';
import coreTypography from '../lib/../tokens/core/typography.json';
import coreBorders from '../lib/../tokens/core/borders.json';
import coreShadows from '../lib/../tokens/core/shadows.json';

describe('Style Dictionary Token Generation', () => {
  const distTokensPath = resolve(__dirname, '../dist/tokens');

  beforeAll(async () => {
    const distTokensPath = resolve(__dirname, '../dist/tokens');

    // Always build tokens to ensure they're up to date
    console.log('Building tokens for tests...');
    await import(resolve(__dirname, '../scripts/build-tokens.cjs'));

    expect(existsSync(distTokensPath)).toBe(true);
  });

  describe('Token Output Files', () => {
    it('should generate CSS variables file', () => {
      const cssPath = resolve(distTokensPath, 'variables.css');
      expect(existsSync(cssPath)).toBe(true);

      const cssContent = readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain(':root');
      expect(cssContent).toContain('--color-');
      expect(cssContent).toContain('--space-');
      expect(cssContent).toContain('--font-');
    });

    it('should generate JavaScript tokens file', () => {
      const jsPath = resolve(distTokensPath, 'tokens.js');
      expect(existsSync(jsPath)).toBe(true);

      const jsContent = readFileSync(jsPath, 'utf-8');
      expect(jsContent).toContain('export');
      expect(jsContent).toContain('Color');
      expect(jsContent).toContain('Space');
      expect(jsContent).toContain('FontFamily');
    });

    it('should generate TypeScript definitions file', () => {
      const tsPath = resolve(distTokensPath, 'tokens.d.ts');
      expect(existsSync(tsPath)).toBe(true);

      const tsContent = readFileSync(tsPath, 'utf-8');
      expect(tsContent).toContain('export const');
      expect(tsContent).toContain('ColorPrimary');
    });

    it('should generate Tailwind tokens module', () => {
      const tailwindPath = resolve(distTokensPath, 'tailwind-tokens.js');
      expect(existsSync(tailwindPath)).toBe(true);

      const tailwindContent = readFileSync(tailwindPath, 'utf-8');
      expect(tailwindContent).toContain('module.exports');
    });

    it('should generate DaisyUI theme JS file', () => {
      const daisyPath = resolve(distTokensPath, 'daisyui-themes.js');
      expect(existsSync(daisyPath)).toBe(true);

      const daisyContent = readFileSync(daisyPath, 'utf-8');
      // Our format outputs CSS variable text inside a JS string, so basic markers suffice
      expect(daisyContent).toContain('[data-theme=');
      expect(daisyContent).toContain('--p:');
      expect(daisyContent).toContain('--s:');
    });
  });

  describe('Core Token Structure Validation', () => {
    it('should have valid color token structure', () => {
      expect(coreColors).toBeDefined();
      expect(coreColors.color).toBeDefined();

      // Check required color scales
      const requiredColors = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
      requiredColors.forEach(color => {
        expect(coreColors.color[color]).toBeDefined();
        expect(typeof coreColors.color[color]).toBe('object');
      });
    });

    it('should have valid spacing token structure', () => {
      expect(coreSpacing).toBeDefined();
      expect(coreSpacing.space).toBeDefined();

      // Check spacing scale values
      const spacingKeys = Object.keys(coreSpacing.space);
      expect(spacingKeys.length).toBeGreaterThan(0);

      spacingKeys.forEach(key => {
        const spacing = coreSpacing.space[key];
        expect(spacing).toHaveProperty('value');
        expect(typeof spacing.value).toBe('string');
        expect(spacing.value).toMatch(/^(\d+(\.\d+)?)?(px|rem|em)$/);
      });
    });

    it('should have valid typography token structure', () => {
      expect(coreTypography).toBeDefined();

      // Check font families
      expect(coreTypography.fontFamily).toBeDefined();
      ['sans', 'serif', 'mono'].forEach(family => {
        expect((coreTypography as any).fontFamily[family]).toBeDefined();
        expect((coreTypography as any).fontFamily[family].value).toBeInstanceOf(Array);
      });

      // Check font sizes
      expect(coreTypography.fontSize).toBeDefined();
      const fontSizes = Object.keys((coreTypography as any).fontSize);
      expect(fontSizes.length).toBeGreaterThan(0);

      // Check font weights
      expect(coreTypography.fontWeight).toBeDefined();
      const fontWeights = Object.keys((coreTypography as any).fontWeight);
      expect(fontWeights.length).toBeGreaterThan(0);
    });

    it('should have valid border token structure', () => {
      expect(coreBorders).toBeDefined();
      expect(coreBorders.borderRadius).toBeDefined();
      expect(coreBorders.borderWidth).toBeDefined();

      // Check border radius values
      const radiusKeys = Object.keys(coreBorders.borderRadius);
      radiusKeys.forEach(key => {
        const radius = coreBorders.borderRadius[key];
        expect(radius).toHaveProperty('value');
        expect(typeof radius.value).toBe('string');
      });
    });

    it('should have valid shadow token structure', () => {
      expect(coreShadows).toBeDefined();
      expect(coreShadows.boxShadow).toBeDefined();

      // Check shadow values
      const shadowKeys = Object.keys(coreShadows.boxShadow);
      shadowKeys.forEach(key => {
        const shadow = coreShadows.boxShadow[key];
        expect(shadow).toHaveProperty('value');
        expect(typeof shadow.value).toBe('string');
      });
    });
  });

  describe('Token Value Validation', () => {
    it('should have consistent color value formats', () => {
      Object.entries(coreColors.color).forEach(([colorName, colorScale]) => {
        Object.entries(colorScale).forEach(([shade, shadeData]) => {
          const { value } = shadeData as { value: string };
          // Should be valid hex, rgb, or hsl color
          expect(value).toMatch(/^(#[0-9a-fA-F]{3,8}|rgb\(|hsl\(|oklch\()/);
        });
      });
    });

    it('should have consistent spacing scale progression', () => {
      const spacingValues = Object.entries(coreSpacing.space).map(([key, data]) => ({
        key,
        value: parseFloat((data as { value: string }).value),
      }));

      // Sort by numeric value
      spacingValues.sort((a, b) => a.value - b.value);

      // Check that values are in ascending order
      for (let i = 1; i < spacingValues.length; i++) {
        expect(spacingValues[i].value).toBeGreaterThanOrEqual(spacingValues[i - 1].value);
      }
    });

    it('should have valid font weight values', () => {
      Object.entries((coreTypography as any).fontWeight).forEach(([weight, data]) => {
        const { value } = data as { value: string };
        const numValue = parseInt(value);
        expect(numValue).toBeGreaterThanOrEqual(100);
        expect(numValue).toBeLessThanOrEqual(900);
        expect(numValue % 100).toBe(0); // Should be multiples of 100
      });
    });
  });

  describe('Generated Token Consistency', () => {
    it('should maintain token consistency across output formats', async () => {
      // Import generated tokens
      const tailwindTokensPath = resolve(distTokensPath, 'tailwind-tokens.js');
      const { default: generatedTokens } = await import(tailwindTokensPath);

      // Check that core colors are present in generated tokens
      expect(generatedTokens.color).toBeDefined();
      Object.keys(coreColors.color).forEach(colorName => {
        expect(generatedTokens.color[colorName]).toBeDefined();
      });

      // Check that spacing tokens are present
      expect(generatedTokens.space).toBeDefined();
      Object.keys(coreSpacing.space).forEach(spaceKey => {
        expect(generatedTokens.space[spaceKey]).toBeDefined();
      });
    });

    it('should generate valid CSS custom properties', () => {
      const cssPath = resolve(distTokensPath, 'variables.css');
      const cssContent = readFileSync(cssPath, 'utf-8');

      // Check for proper CSS custom property format
      const customPropertyRegex = /--[\w-]+:\s*[^;]+;/g;
      const matches = cssContent.match(customPropertyRegex);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(0);

      // Check that all custom properties are properly formatted
      matches!.forEach(match => {
        expect(match).toMatch(/^--[\w-]+:\s*[^;]+;$/);
      });
    });
  });

  describe('DaisyUI Integration', () => {
    it('should generate DaisyUI compatible theme variables', () => {
      const daisyPath = resolve(distTokensPath, 'daisyui-themes.js');
      const daisyContent = readFileSync(daisyPath, 'utf-8');

      // Check for DaisyUI semantic color variables
      const daisyVars = ['--p:', '--s:', '--a:', '--n:', '--b1:', '--in:', '--su:', '--wa:', '--er:'];
      daisyVars.forEach(variable => {
        expect(daisyContent).toContain(variable);
      });
    });

    it('should contain theme selectors string', () => {
      const daisyPath = resolve(distTokensPath, 'daisyui-themes.js');
      const daisyContent = readFileSync(daisyPath, 'utf-8');

      // Should have theme selectors present in the JS output
      expect(daisyContent).toContain('[data-theme=');
    });
  });

  describe('TypeScript Integration', () => {
    it('should generate valid TypeScript definitions', () => {
      const tsPath = resolve(distTokensPath, 'tokens.d.ts');
      const tsContent = readFileSync(tsPath, 'utf-8');

      // Should export individual constants (current format)
      expect(tsContent).toContain('export const');
      expect(tsContent).toContain('ColorPrimary');

      // Should contain semantic color exports
      expect(tsContent).toContain('SemanticColorLight');
      expect(tsContent).toContain('SemanticColorDark');
      expect(tsContent).toContain('ComponentButton');
    });
  });
});
