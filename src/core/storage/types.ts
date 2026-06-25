/**
 * Minimal key-value storage port.
 *
 * The app wires this to AsyncStorage on device; tests use an in-memory
 * implementation. Keeping the port narrow lets all stores stay pure and
 * fully unit-testable without React Native.
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
