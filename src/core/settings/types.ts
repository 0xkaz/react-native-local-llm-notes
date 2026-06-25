export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'ja' | 'en';

export interface Settings {
  /** Id of the model the user selected (see models/catalog). */
  selectedModelId: string;
  theme: ThemeMode;
  language: Language;
  /** Only download models over Wi-Fi to avoid mobile-data charges. */
  wifiOnlyDownload: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  selectedModelId: 'qwen2.5-1.5b-instruct-q4_k_m',
  theme: 'system',
  language: 'en',
  wifiOnlyDownload: true,
};
