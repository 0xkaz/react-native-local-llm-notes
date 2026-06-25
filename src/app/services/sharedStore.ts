import { NativeModules, Platform } from 'react-native';

interface SharedStoreModule {
  /** Returns pending shared text from the iOS App Group, clearing it. */
  consumePendingSharedText(): Promise<string>;
}

const native = (NativeModules as { SharedStore?: SharedStoreModule }).SharedStore;

/**
 * Read and clear any text the iOS Share Extension stored in the shared App
 * Group container. Returns '' on platforms/builds without the native module
 * (Android receives shares via the ACTION_SEND intent instead).
 */
export async function consumePendingSharedText(): Promise<string> {
  if (Platform.OS !== 'ios' || !native) return '';
  try {
    return await native.consumePendingSharedText();
  } catch {
    return '';
  }
}
