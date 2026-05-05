import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'node:path';
import globals from 'globals';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const reactConfig = require('../config-eslint/react.js');

export default [
  // Ignore generated and build artifacts, plus config files that are not part of TS project
  {
    ignores: [
      'dist/**',
      'storybook-static/**',
      'showcase/dist/**',
      '__tests__/**',
      'lib/**',
      'showcase/**',
      '**/*.timestamp-*.mjs',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/*.config.ts',
      '**/*.config.mts',
      '**/*.config.cts',
      '.storybook/test-runner.js',
      'scripts/**/*.cjs',
    ],
  },
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.dev.json',
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.dev.json',
        },
      },
    },
    rules: {
      // Package-level relaxations to reduce churn and focus on functional issues
      // Allow unused parameters in function type definitions
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Relax strict import styling rules that caused many errors
      'import/order': 'off',
      'import/consistent-type-specifier-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      // Avoid noisy style-only errors
      'object-shorthand': 'off',
      'react/function-component-definition': 'off',
      // Some TS assertions in tests/components are benign
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // Make nullish-coalescing preference non-blocking
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.test.{js,ts,tsx}', '**/__tests__/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
  // Storybook stories and showcase are examples; relax hook and a11y rules there
  {
    files: ['src/stories/**/*.{ts,tsx}', 'showcase/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      // Allow inline style objects in stories for rapid prototyping & visual documentation.
      // No dedicated rule exists in this config currently, but if one is introduced upstream
      // (e.g. a custom "no-inline-styles" rule or enabling react-native plugin), keep it disabled here.
      'react-native/no-inline-styles': 'off',
      'react-native/no-unused-styles': 'off',
    },
  },
  // Theme files: allow some unused vars during experimental validation utilities
  {
    files: ['src/theme/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Vite and Tailwind/PostCSS configs can be linted without TS project context; but we already ignore them above.
];
