import { KeyValueStorage } from '../storage/types';
import { Settings, DEFAULT_SETTINGS } from './types';

const STORAGE_KEY = 'settings/v1';

/**
 * Loads and persists user settings. Unknown/old fields are merged over the
 * defaults so the app keeps working across schema additions.
 */
export class SettingsStore {
  constructor(private readonly storage: KeyValueStorage) {}

  async load(): Promise<Settings> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    try {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  async save(settings: Settings): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  async update(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.load();
    const next = { ...current, ...patch };
    await this.save(next);
    return next;
  }
}
