/**
 * Jest config for the React Native app layer (component tests via
 * @testing-library/react-native). Kept separate from the core `jest.config.js`
 * so the fast, dependency-free core suite (and the Stop hook) never has to load
 * the React Native preset. Run with `npm run test:app` / `make test-app`.
 */
module.exports = {
  preset: 'react-native',
  rootDir: '.',
  roots: ['<rootDir>/tests/app'],
  testMatch: ['**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/app/setup.tsx'],
  // The RN preset already transforms react-native itself; extend the allowlist
  // to the UI libraries we render in tests (they ship untranspiled ESM/Flow).
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?@?react-native|@react-native-community|@react-navigation|react-native-paper|react-native-vector-icons|react-native-safe-area-context)',
  ],
};
