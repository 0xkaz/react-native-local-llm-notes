/* Test setup for the RN component suite. */
import '@testing-library/react-native/extend-expect';

// react-native-paper animates Banner/Surface mounts via Animated timers. Under
// real timers those fire after the synchronous render and emit "update not
// wrapped in act(...)" warnings. Fake timers keep them from firing during the
// (act-wrapped) render, so the suite output stays clean.
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  // Discard pending animation timers without running them, so they never fire
  // outside an act() scope after the test completes.
  jest.clearAllTimers();
  jest.useRealTimers();
});

// react-native-vector-icons (used by react-native-paper for icons) reaches for
// a native module that does not exist under Jest. Mock it to a plain stub so
// icon-bearing components (Banner, Appbar) render without warnings.
jest.mock(
  'react-native-vector-icons/MaterialCommunityIcons',
  () => {
    const React = require('react');
    const { Text } = require('react-native');
    const Icon = (props: { name?: string }) =>
      React.createElement(Text, null, props.name ?? 'icon');
    // Paper's MaterialCommunityIcon reads `.default`; expose an ESM shape.
    return { __esModule: true, default: Icon };
  },
  { virtual: true },
);
