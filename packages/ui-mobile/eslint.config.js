// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import globals from 'globals';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reactNativeConfig = require('../config-eslint/react-native.js');

export default [
  // Ignore built and generated files
  {
    ignores: [
      // Keep ignoring generated type/output subpaths but allow component source under lib/components
      'lib/**/*.d.ts',
      'lib/**/index.js.map',
      'dist/**',
      'coverage/**',
      'storybook-static/**',
      '.turbo/**',
      // (Removed blanket ignore of story files; now handled via scoped override below.)
      'src/test/**',
      '**/*.d.ts',
      '**/*.map',
    ],
  },
  // Scoped override for Storybook stories: allow inline styles & loosen a11y/filename specifics for rapid prototyping.
  // Keeps stories in lint pipeline for syntax / import / unused checks while avoiding noise.
  {
    files: ['src/stories/**/*.{ts,tsx}'],
    rules: {
      // If later re-enabled upstream, ensure we keep them off only here.
      'react-native/no-inline-styles': 'off',
      'react-native/no-unused-styles': 'off',
      // Allow headings, temporary inline elements for docs-like text blocks.
      'react/jsx-no-useless-fragment': 'off',
      // Story playground pragmatics: allow console logging for interaction demos.
      'no-console': 'off',
      // Relax hook placement warnings inside Storybook `render` patterns.
      'react-hooks/rules-of-hooks': 'off',
      // Permit rapid iteration without nullish refactors.
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Non-critical in stories; avoid breaking builds for experimentation.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  ...reactNativeConfig,
  {
    files: ['**/*.{ts,tsx}'],
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
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
  // Override: disallow `style?: any` in component source to enforce typed style props
  {
    files: ['lib/components/**/*.{ts,tsx}'],
    rules: {
      // General ban on explicit any for style prop declarations
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: false }],
      // Narrow, readable error if someone tries to reintroduce `style?: any;`
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSPropertySignature[key.name='style'] TSTypeAnnotation TSTypeReference Identifier[name='any']",
          message: 'Use StyleProp<...> (e.g., StyleProp<ViewStyle | TextStyle>) instead of `any` for style prop.',
        },
      ],
    },
  },
  // Temporary exception: Text component has duplicate react-native type resolution causing StyleProp mismatch.
  // Allow explicit any until dependency tree flattened. (Tracked by remediation tasks TXT-2)
  {
    files: ['lib/components/Text/Text.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  // Jest globals for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
