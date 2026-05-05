const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const promisePlugin = require('eslint-plugin-promise');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const globals = require('globals');

// Try to load Next.js ESLint config with better error handling
let nextConfig = {};
let nextRules = {};
let nextSettings = {};

try {
  const { FlatCompat } = require('@eslint/eslintrc');
  const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
  });

  // Convert Next.js config to flat config
  const nextConfigs = compat.extends('next/core-web-vitals');
  if (nextConfigs && nextConfigs.length > 0) {
    nextConfig = nextConfigs[0] || {};
    nextRules = nextConfig.rules || {};
    nextSettings = nextConfig.settings || {};
  }
} catch (error) {
  console.warn('Could not load Next.js ESLint config, using fallback configuration:', error.message);
  // Fallback Next.js rules
  nextRules = {
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'off',
    '@next/next/no-unwanted-polyfillio': 'error',
    '@next/next/no-page-custom-font': 'error',
  };
}

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
        tsconfigRootDir: process.cwd(),
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      promise: promisePlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      ...nextConfig.plugins,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // Next.js rules
      ...nextRules,

      // Base TypeScript rules with improved configuration
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'error',

      // General rules
      'no-console': 'off',
      'prefer-const': 'off',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'object-shorthand': 'error',
      'no-case-declarations': 'off',
      'no-duplicate-imports': 'off', // Handled by TypeScript

      // Promise rules
      'promise/always-return': 'off',
      'promise/catch-or-return': 'error',
      'promise/param-names': 'error',

      // React specific rules
      'react/prop-types': 'off', // TypeScript handles prop types
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off', // TypeScript handles default props
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-no-useless-fragment': 'off',
      'react/self-closing-comp': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',

      // Accessibility rules
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',

      // Override React rules for Next.js
      'jsx-a11y/anchor-is-valid': 'off', // Next.js handles this differently
    },
    settings: {
      react: {
        version: 'detect',
      },
      next: {
        rootDir: ['apps/web/', 'packages/ui-web/'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      ...nextSettings,
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      // Disable TypeScript-specific rules for JavaScript files
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
