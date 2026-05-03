import baseConfig from '@todo/config-eslint/base';
import globals from 'globals';

export default [
  ...baseConfig,
  {
    ignores: ['dist/', 'coverage/', 'node_modules/', 'vite.config.ts', 'vitest.config.ts'],
  },
  // Enable test environment globals for utils test files
  {
    files: ['**/__tests__/**/*.{js,ts,tsx}', '**/*.{test,spec}.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  // Relax certain strictness in utils where flexible typings are necessary
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Core rule disabled globally in base, keep it off here too for safety
      'no-unused-vars': 'off',
    },
  },
];
