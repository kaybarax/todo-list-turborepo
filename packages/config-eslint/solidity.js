const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const promisePlugin = require('eslint-plugin-promise');
const securityPlugin = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.es2022,
        // Hardhat globals
        artifacts: 'readonly',
        contract: 'readonly',
        web3: 'readonly',
        ethers: 'readonly',
        network: 'readonly',
        deployments: 'readonly',
        getNamedAccounts: 'readonly',
        // Hardhat Runtime Environment
        hre: 'readonly',
        // Chai globals for testing
        expect: 'readonly',
        assert: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      promise: promisePlugin,
      security: securityPlugin,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // TypeScript rules for smart contract development
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
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Security rules for smart contracts
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // General rules for contract development
      'no-console': 'off', // Allow console for debugging
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'object-shorthand': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // Promise rules
      'promise/always-return': 'off',
      'promise/catch-or-return': 'error',
      'promise/param-names': 'error',
      'promise/no-return-wrap': 'error',

      // Import rules - relaxed for Hardhat projects
      'import/no-unresolved': 'off', // Hardhat handles imports differently
      'import/order': 'off', // Different import patterns in Solidity projects
      'import/no-duplicates': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './hardhat.config.ts'],
        },
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
  },
  {
    files: ['**/*.sol'],
    languageOptions: {
      parser: null, // Don't use TypeScript parser for Solidity files
      globals: {
        // Solidity globals
        msg: 'readonly',
        block: 'readonly',
        tx: 'readonly',
        now: 'readonly',
        this: 'readonly',
        super: 'readonly',
        selfdestruct: 'readonly',
        addmod: 'readonly',
        mulmod: 'readonly',
        keccak256: 'readonly',
        sha256: 'readonly',
        sha3: 'readonly',
        ripemd160: 'readonly',
        ecrecover: 'readonly',
        revert: 'readonly',
        require: 'readonly',
        assert: 'readonly',
      },
    },
    rules: {
      // Disable all TypeScript and JavaScript rules for .sol files
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'off',
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
