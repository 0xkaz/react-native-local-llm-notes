import {
  MD3LightTheme,
  MD3DarkTheme,
  MD3Theme,
} from 'react-native-paper';

/**
 * Clean, business-oriented Material You palette: white base with a calm
 * indigo accent. Light and dark variants share the accent.
 */
const ACCENT = '#4F5BD5';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: ACCENT,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#AAB2FF',
  },
};
