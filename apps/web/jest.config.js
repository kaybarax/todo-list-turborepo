const nextJest = require('next/jest');
const path = require('path');
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
    ...baseConfig.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
