import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Settings, DEFAULT_SETTINGS } from '../../core';
import { useServices } from './ServicesContext';

interface SettingsContextValue {
  settings: Settings;
  /** False until the persisted settings have loaded. */
  ready: boolean;
  /** Persist a patch and update the shared state so the whole app re-renders. */
  update: (patch: Partial<Settings>) => Promise<Settings>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Holds the user settings in shared state. Because every consumer reads from
 * here, changing the theme (or any setting) re-renders the whole app live —
 * not just the Settings screen.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settingsStore } = useServices();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    settingsStore.load().then((s) => {
      setSettings(s);
      setReady(true);
    });
  }, [settingsStore]);

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      const next = await settingsStore.update(patch);
      setSettings(next);
      return next;
    },
    [settingsStore],
  );

  return (
    <SettingsContext.Provider value={{ settings, ready, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
