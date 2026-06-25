import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyValueStorage } from '../../core';

/** Wires the core KeyValueStorage port to React Native AsyncStorage. */
export const asyncStorageAdapter: KeyValueStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
