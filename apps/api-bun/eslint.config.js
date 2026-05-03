const baseConfig = require('@todo/config-eslint/base');

module.exports = [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'],
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: {
        Bun: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'import/external-module-folders': ['node_modules', 'node_modules/@types'],
      'import/core-modules': ['bun', 'bun:test', 'bun:jsc', 'bun:sqlite'],
    },
  },
];
