// jest-expo preset handles the React Native transform pipeline.
// The transformIgnorePatterns list tells Jest which node_modules packages
// ship as ES modules and need to be compiled by Babel before running.
module.exports = {
  preset: 'jest-expo',

  // Packages that ship ES modules must not be excluded from transformation.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|zustand)',
  ],

  // Only look for tests inside __tests__/
  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],

  // Map @/* imports the same way tsconfig and babel do.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Collect coverage from src/ only (excludes node_modules, assets, config files).
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
