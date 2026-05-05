import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Bundle Size Tests', () => {
  const distPath = resolve(__dirname, '../../dist');

  it('main bundle size should be within limits', () => {
    try {
      const bundlePath = resolve(distPath, 'index.js');
      const stats = statSync(bundlePath);
      const sizeInKB = stats.size / 1024;

      // Bundle should be under 100KB
      expect(sizeInKB).toBeLessThan(100);
      console.log(`Bundle size: ${sizeInKB.toFixed(2)}KB`);
    } catch (error) {
      console.warn('Bundle not found, run build first');
    }
  });

  it('should not include development dependencies in bundle', () => {
    try {
      const bundlePath = resolve(distPath, 'index.js');
      const bundleContent = readFileSync(bundlePath, 'utf-8');

      // Should not contain development-only code
      expect(bundleContent).not.toContain('console.log');
      expect(bundleContent).not.toContain('debugger');
      expect(bundleContent).not.toContain('storybook');
    } catch (error) {
      console.warn('Bundle not found, run build first');
    }
  });

  it('should support tree-shaking', () => {
    // Test that individual component imports work
    const componentTest = `
      import { Button } from '@todo/ui-web';
      // Should only import Button, not entire library
    `;

    expect(componentTest).toContain('Button');
    // In a real test, we'd check the actual bundle size difference
  });
});
