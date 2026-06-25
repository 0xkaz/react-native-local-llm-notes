/**
 * Local development overrides.
 *
 * These have NO effect in release builds — every override is guarded by
 * `__DEV__` at the call site and ships with an inert default, so production
 * always uses the real model catalog (Hugging Face).
 *
 * `DEV_MODEL_BASE_URL`: point this at a LAN mirror to make on-device model
 * downloads fast and repeatable during development. Serve your cached `.gguf`
 * files with `make serve-model` (see README / docs/native-setup.md), then set:
 *   - Android emulator: 'http://10.0.2.2:8000'
 *   - iOS simulator:    'http://localhost:8000'
 *   - physical device:  'http://<your-mac-LAN-ip>:8000'
 * The app downloads `${DEV_MODEL_BASE_URL}/<original-gguf-filename>`.
 *
 * Tip: keep your local value out of git with
 *   git update-index --skip-worktree src/app/devConfig.ts
 *
 * To point at a LAN mirror per platform (host loopback differs by target), use:
 *   import { Platform } from 'react-native';
 *   const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
 *   export const DEV_MODEL_BASE_URL = `http://${host}:8123`;
 * (Android emulator reaches the host via 10.0.2.2; iOS simulator via localhost.)
 */
export const DEV_MODEL_BASE_URL: string | null = null;
