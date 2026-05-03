const baseConfig = require('@todo/config-eslint/base');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'eslint.config.js',
      '**/*.test.ts',
      '**/*.spec.ts',
      'coverage/',
      'jest.config.js',
    ],
  },
];
