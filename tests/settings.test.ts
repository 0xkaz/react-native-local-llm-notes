import { SettingsStore } from '../src/core/settings/SettingsStore';
import { DEFAULT_SETTINGS } from '../src/core/settings/types';
import { MemoryStorage } from '../src/core/storage/MemoryStorage';

describe('SettingsStore', () => {
  test('returns defaults when nothing stored', async () => {
    const store = new SettingsStore(new MemoryStorage());
    expect(await store.load()).toEqual(DEFAULT_SETTINGS);
  });

  test('save then load round-trips', async () => {
    const store = new SettingsStore(new MemoryStorage());
    const next = { ...DEFAULT_SETTINGS, theme: 'dark' as const };
    await store.save(next);
    expect((await store.load()).theme).toBe('dark');
  });

  test('update merges a partial patch', async () => {
    const store = new SettingsStore(new MemoryStorage());
    const updated = await store.update({ language: 'en' });
    expect(updated.language).toBe('en');
    expect(updated.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  test('merges defaults over partial stored data', async () => {
    const storage = new MemoryStorage();
    await storage.setItem('settings/v1', JSON.stringify({ language: 'en' }));
    const settings = await new SettingsStore(storage).load();
    expect(settings.language).toBe('en');
    expect(settings.wifiOnlyDownload).toBe(DEFAULT_SETTINGS.wifiOnlyDownload);
  });

  test('falls back to defaults on corrupt data', async () => {
    const storage = new MemoryStorage();
    await storage.setItem('settings/v1', 'not json');
    expect(await new SettingsStore(storage).load()).toEqual(DEFAULT_SETTINGS);
  });
});
