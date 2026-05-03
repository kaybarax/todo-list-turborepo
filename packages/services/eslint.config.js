const baseConfig = require('../config-eslint/base.js');
const globals = require('globals');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    files: ['src/blockchain/implementations/*BlockchainService.ts'],
    rules: {
      'no-unreachable': 'off', // Temporary fix for false positives in catch blocks
      '@typescript-eslint/require-await': 'off', // Many methods are async for interface compatibility but don't await in mock implementations
      '@typescript-eslint/no-non-null-assertion': 'off', // Some blockchain operations require non-null assertions for known-good data
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }], // Allow console.log for blockchain debugging
    },
  },
];
