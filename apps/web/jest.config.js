const nextJest = require('next/jest');
const baseConfig = require('@todo/config-jest/jest.config.nextjs.js');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  ...baseConfig,
  setupFilesAfterEnv: ['<rootDir>/../../packages/config-jest/setup-tests.js', '<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@todo/utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
    '^@todo/services$': '<rootDir>/../../packages/services/src',
    '^@todo/services/(.*)$': '<rootDir>/../../packages/services/src/$1',
    '^@todo/ui-web$': '<rootDir>/../../packages/ui-web/src',
    '^@todo/ui-web/(.*)$': '<rootDir>/../../packages/ui-web/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
