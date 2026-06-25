import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { ModelInfo, ModelState, NoteAi } from '../../core';
import { LlamaRnEngine } from '../../native/LlamaRnEngine';
import { useServices } from './ServicesContext';
import {
  ensureModelsDir,
  localPathFor,
  modelFileSize,
  deleteModelFile,
  downloadModel,
} from './modelFiles';

interface EngineContextValue {
  /** NoteAi wrapper around the loaded engine, or null until a model is loaded. */
  ai: NoteAi | null;
  isReady: boolean;
  getState: (model: ModelInfo) => Promise<ModelState>;
  /**
   * Download (if needed) and load the model into memory. `onWillDownload` is
   * awaited only when an actual download is about to start (file missing,
   * partial, or corrupt) — throw from it to veto the download (e.g. the
   * Wi-Fi-only policy). Loading an already-usable model never calls it.
   */
  prepare: (
    model: ModelInfo,
    opts?: { onWillDownload?: () => Promise<void> },
  ) => Promise<void>;
  remove: (model: ModelInfo) => Promise<void>;
  /** 0..1 progress of the in-flight download, if any. */
  downloadProgress: number | null;
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const { modelManager } = useServices();
  const [ai, setAi] = useState<NoteAi | null>(null);
  const [engine, setEngine] = useState<LlamaRnEngine | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const getState = useCallback(
    (model: ModelInfo) => modelManager.getState(model.id),
    [modelManager],
  );

  const downloadFile = useCallback(
    async (model: ModelInfo): Promise<number> => {
      try {
        return await downloadModel(model, (ratio) => {
          setDownloadProgress(ratio);
          void modelManager.setProgress(model.id, ratio);
        });
      } finally {
        setDownloadProgress(null);
      }
    },
    [modelManager],
  );

  /**
   * Whether the model on disk can be trusted as a finished download. We rely on
   * the persisted state machine (status === 'downloaded') rather than raw file
   * existence, and cross-check the on-disk size against the size we recorded
   * when the download completed. A partial/corrupt remnant (file present but
   * short, or never marked complete) fails this check — cheaply, without
   * re-reading the file — and is re-downloaded instead of loaded.
   */
  const isUsableOnDisk = useCallback(
    async (model: ModelInfo, state: ModelState): Promise<boolean> => {
      if (state.status !== 'downloaded') return false;
      const size = await modelFileSize(model);
      if (size === 0) return false;
      // If we recorded an expected size, require an exact match; otherwise fall
      // back to "non-empty file" for models downloaded before this check existed.
      return state.bytesTotal ? size === state.bytesTotal : true;
    },
    [],
  );

  const prepare = useCallback(
    async (
      model: ModelInfo,
      opts?: { onWillDownload?: () => Promise<void> },
    ) => {
      await ensureModelsDir();
      const state = await modelManager.getState(model.id);

      if (!(await isUsableOnDisk(model, state))) {
        // A download is genuinely required (missing/partial/corrupt). Let the
        // caller veto it before we touch anything (Wi-Fi-only policy, etc.).
        await opts?.onWillDownload?.();
        // Drop any broken/partial remnant so the transfer starts clean.
        await deleteModelFile(model);
        if (state.status !== 'downloading') {
          await modelManager.beginDownload(model.id);
        }
        let total: number;
        try {
          total = await downloadFile(model);
        } catch (e) {
          await modelManager.failDownload(model.id, String(e));
          throw e;
        }
        await modelManager.completeDownload(model.id, localPathFor(model), total);
      }

      // Release any previously loaded engine before swapping models.
      await engine?.release();
      const loaded = await LlamaRnEngine.load(localPathFor(model));
      setEngine(loaded);
      setAi(new NoteAi(loaded));
    },
    [downloadFile, engine, isUsableOnDisk, modelManager],
  );

  const remove = useCallback(
    async (model: ModelInfo) => {
      await engine?.release();
      setEngine(null);
      setAi(null);
      await deleteModelFile(model);
      await modelManager.deleteModel(model.id);
    },
    [engine, modelManager],
  );

  return (
    <EngineContext.Provider
      value={{
        ai,
        isReady: ai != null,
        getState,
        prepare,
        remove,
        downloadProgress,
      }}
    >
      {children}
    </EngineContext.Provider>
  );
}

export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContext);
  if (!ctx) {
    throw new Error('useEngine must be used within an EngineProvider');
  }
  return ctx;
}
