import {
  NoteStore,
  SettingsStore,
  ChatStore,
  ModelManager,
} from '../../core';
import { asyncStorageAdapter } from '../adapters/AsyncStorageAdapter';
import { systemClock, idGenerator } from '../adapters/system';

export interface Services {
  noteStore: NoteStore;
  settingsStore: SettingsStore;
  chatStore: ChatStore;
  modelManager: ModelManager;
}

/** Builds the app's persistence services from the AsyncStorage adapter. */
export function buildServices(): Services {
  const storage = asyncStorageAdapter;
  return {
    noteStore: new NoteStore(storage, systemClock, idGenerator),
    settingsStore: new SettingsStore(storage),
    chatStore: new ChatStore(storage),
    modelManager: new ModelManager(storage),
  };
}
