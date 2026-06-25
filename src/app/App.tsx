import { useCallback, useEffect } from 'react';
import { AppState, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import {
  NavigationContainer,
  createNavigationContainerRef,
  DefaultTheme as NavLightTheme,
  DarkTheme as NavDarkTheme,
  LinkingOptions,
} from '@react-navigation/native';
import { ServicesProvider } from './services/ServicesContext';
import { SettingsProvider, useSettings } from './services/SettingsContext';
import { EngineProvider } from './services/EngineContext';
import { consumePendingSharedText } from './services/sharedStore';
import RootNavigator from './navigation/RootNavigator';
import { RootStackParamList } from './navigation/types';
import { lightTheme, darkTheme } from './theme';

const navRef = createNavigationContainerRef<RootStackParamList>();

// Deep links: the OS share sheet sends text/plain, which MainActivity rewrites
// to ainote://share?sharedText=... — routed here to open the editor prefilled.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['ainote://'],
  config: {
    screens: {
      Main: { screens: { Notes: '' } },
      Editor: 'share',
    },
  },
};

function Themed() {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' && systemScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  // iOS Share Extension hands off via an App Group container; pull any pending
  // shared text on launch and whenever the app returns to the foreground, and
  // open the editor prefilled.
  const checkPendingShare = useCallback(async () => {
    const text = await consumePendingSharedText();
    if (text.length > 0 && navRef.isReady()) {
      navRef.navigate('Editor', { sharedText: text });
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPendingShare();
    });
    return () => sub.remove();
  }, [checkPendingShare]);

  // Drive React Navigation's scene background from the Paper theme so the whole
  // screen (not just Paper components) follows light/dark.
  const navBase = isDark ? NavDarkTheme : NavLightTheme;
  const navTheme = {
    ...navBase,
    colors: {
      ...navBase.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      primary: theme.colors.primary,
    },
  };

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      <NavigationContainer
        ref={navRef}
        theme={navTheme}
        linking={linking}
        onReady={checkPendingShare}
      >
        <EngineProvider>
          <RootNavigator />
        </EngineProvider>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ServicesProvider>
        <SettingsProvider>
          <Themed />
        </SettingsProvider>
      </ServicesProvider>
    </SafeAreaProvider>
  );
}
