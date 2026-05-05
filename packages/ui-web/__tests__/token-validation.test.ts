import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';

// Import generated tokens for validation
const getGeneratedTokens = async () => {
  try {
    // Resolve to the package-local dist directory where tokens are generated
    const tokensPath = resolve(__dirname, '../dist/tokens/tokens.js');
    const tokenModule = await import(tokensPath);

    // Transform flat exports into nested structure for easier testing
    const tokens: any = {
      color: {},
      space: {},
      typography: { fontFamily: {}, fontSize: {}, fontWeight: {} },
      borderRadius: {},
      borderWidth: {},
      boxShadow: {},
    };

    Object.entries(tokenModule).forEach(([key, value]) => {
      if (key.startsWith('Color')) {
        const colorMatch = key.match(/Color([A-Z][a-z]+)(\d+)/);
        if (colorMatch) {
          const [, colorName, shade] = colorMatch;
          const lowerColorName = colorName.toLowerCase();
          if (!tokens.color[lowerColorName]) tokens.color[lowerColorName] = {};
          tokens.color[lowerColorName][shade] = value;
        }
      } else if (key.startsWith('Space')) {
        const spaceKey = key.replace('Space', '').toLowerCase();
        tokens.space[spaceKey] = value;
      } else if (key.startsWith('BorderRadius')) {
        const radiusKey = key.replace('BorderRadius', '').toLowerCase();
        tokens.borderRadius[radiusKey] = value;
      } else if (key.startsWith('BorderWidth')) {
        const widthKey = key.replace('BorderWidth', '').toLowerCase();
        tokens.borderWidth[widthKey] = value;
      }
    });

    return tokens;
  } catch (error) {
    throw new Error('Generated tokens not found. Run token build first.');
  }
};

describe('Token Validation and Type Safety', () => {
  describe('Token Structure Validation', () => {
    it('should have all required token categories', async () => {
      const tokens = await getGeneratedTokens();

      const requiredCategories = ['color', 'space', 'typography', 'borderRadius', 'boxShadow'];
      requiredCategories.forEach(category => {
        expect(tokens).toHaveProperty(category);
        expect(typeof tokens[category]).toBe('object');
      });
    });

    it('should have consistent color token structure', async () => {
      const tokens = await getGeneratedTokens();

      // Check primary color scales
      const colorScales = ['primary', 'secondary', 'accent', 'neutral'];
      colorScales.forEach(scale => {
        expect(tokens.color).toHaveProperty(scale);
        expect(typeof tokens.color[scale]).toBe('object');

        // Each scale should have numbered shades
        const shades = Object.keys(tokens.color[scale]);
        expect(shades.length).toBeGreaterThan(0);

        shades.forEach(shade => {
          expect(typeof tokens.color[scale][shade]).toBe('string');
          // Should be valid color format
          expect(tokens.color[scale][shade]).toMatch(/^(#|rgb|hsl|oklch)/);
        });
      });
    });

    it('should have semantic color tokens', async () => {
      const tokens = await getGeneratedTokens();

      const semanticColors = ['info', 'success', 'warning', 'error'];
      semanticColors.forEach(color => {
        expect(tokens.color).toHaveProperty(color);
        expect(typeof tokens.color[color]).toBe('object');
      });
    });

    it('should have consistent spacing scale', async () => {
      const tokens = await getGeneratedTokens();

      expect(tokens.space).toBeDefined();
      const spacingKeys = Object.keys(tokens.space);
      expect(spacingKeys.length).toBeGreaterThan(0);

      // Check that spacing values are valid CSS units
      spacingKeys.forEach(key => {
        const value = tokens.space[key];
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^(\d+(\.\d+)?)?(px|rem|em)$/);
      });
    });

    it('should have typography tokens with proper structure', async () => {
      const tokens = await getGeneratedTokens();

      expect(tokens.typography).toBeDefined();
      expect(tokens.typography.fontFamily).toBeDefined();
      expect(tokens.typography.fontSize).toBeDefined();
      expect(tokens.typography.fontWeight).toBeDefined();

      // Font families should be arrays
      Object.values(tokens.typography.fontFamily).forEach((family: any) => {
        expect(Array.isArray(family)).toBe(true);
        expect(family.length).toBeGreaterThan(0);
      });

      // Font sizes should be valid CSS values
      Object.values(tokens.typography.fontSize).forEach((size: any) => {
        expect(typeof size).toBe('string');
        expect(size).toMatch(/^(\d+(\.\d+)?)?(px|rem|em)$/);
      });

      // Font weights should be valid values
      Object.values(tokens.typography.fontWeight).forEach((weight: any) => {
        expect(typeof weight).toBe('string');
        const numWeight = parseInt(weight);
        expect(numWeight).toBeGreaterThanOrEqual(100);
        expect(numWeight).toBeLessThanOrEqual(900);
      });
    });
  });

  describe('Token Value Consistency', () => {
    it('should have consistent naming conventions', async () => {
      const tokens = await getGeneratedTokens();

      // Color names should follow kebab-case or camelCase
      Object.keys(tokens.color).forEach(colorName => {
        expect(colorName).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });

      // Spacing keys should be consistent
      Object.keys(tokens.space).forEach(spaceKey => {
        expect(spaceKey).toMatch(/^[a-z0-9]+$/);
      });
    });

    it('should have no duplicate values in spacing scale', async () => {
      const tokens = await getGeneratedTokens();

      const spacingValues = Object.values(tokens.space) as string[];
      const uniqueValues = [...new Set(spacingValues)];

      // Allow some duplicates (like 0) but most should be unique
      expect(uniqueValues.length).toBeGreaterThan(spacingValues.length * 0.8);
    });

    it('should have logical color relationships', async () => {
      const tokens = await getGeneratedTokens();

      // Base colors should have proper contrast progression
      if (tokens.color.base) {
        const baseShades = Object.keys(tokens.color.base).sort();
        expect(baseShades.length).toBeGreaterThan(1);

        // Should have at least base-100 and base-content
        expect(baseShades).toContain('100');
      }
    });
  });

  describe('DaisyUI Compatibility', () => {
    it('should generate DaisyUI compatible color values', async () => {
      const tokens = await getGeneratedTokens();

      // DaisyUI expects specific color formats for theme generation
      const daisyColors = ['primary', 'secondary', 'accent', 'neutral'];
      daisyColors.forEach(color => {
        if (tokens.color[color]) {
          Object.values(tokens.color[color]).forEach((value: any) => {
            // Should be valid color that DaisyUI can process
            expect(typeof value).toBe('string');
            expect(value.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should maintain semantic color mapping', async () => {
      const tokens = await getGeneratedTokens();

      // Check that semantic colors exist for DaisyUI integration
      const semanticColors = ['info', 'success', 'warning', 'error'];
      semanticColors.forEach(color => {
        expect(tokens.color).toHaveProperty(color);
        expect(typeof tokens.color[color]).toBe('object');

        // Should have at least one shade
        const shades = Object.keys(tokens.color[color]);
        expect(shades.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Build Integration', () => {
    it('should be importable as ES module', async () => {
      const tokens = await getGeneratedTokens();

      expect(tokens).toBeDefined();
      expect(typeof tokens).toBe('object');
      expect(tokens).not.toBeNull();
    });

    it('should have consistent token references', async () => {
      const tokens = await getGeneratedTokens();

      // Check that token values don't contain unresolved references
      const checkForReferences = (obj: any, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;

          if (typeof value === 'string') {
            // Should not contain unresolved token references
            expect(value).not.toMatch(/\{[^}]+\}/);
          } else if (typeof value === 'object' && value !== null) {
            checkForReferences(value, currentPath);
          }
        });
      };

      checkForReferences(tokens);
    });
  });

  describe('Performance and Size', () => {
    it('should generate reasonably sized token files', async () => {
      const tokens = await getGeneratedTokens();

      const tokenString = JSON.stringify(tokens);
      const sizeInKB = Buffer.byteLength(tokenString, 'utf8') / 1024;

      // Token file should be reasonable size (less than 100KB)
      expect(sizeInKB).toBeLessThan(100);

      // But should have substantial content (more than 1KB)
      expect(sizeInKB).toBeGreaterThan(1);
    });

    it('should have efficient token structure', async () => {
      const tokens = await getGeneratedTokens();

      // Count total number of tokens
      const countTokens = (obj: any): number => {
        let count = 0;
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            count++;
          } else if (typeof value === 'object' && value !== null) {
            count += countTokens(value);
          }
        });
        return count;
      };

      const totalTokens = countTokens(tokens);
      expect(totalTokens).toBeGreaterThan(50); // Should have substantial token set
      expect(totalTokens).toBeLessThan(1000); // But not excessive
    });
  });
});
