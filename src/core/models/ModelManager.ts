import { KeyValueStorage } from '../storage/types';
import { findModel, ModelInfo } from './catalog';

export type DownloadStatus =
  | 'notDownloaded'
  | 'downloading'
  | 'downloaded'
  | 'failed';

export interface ModelState {
  modelId: string;
  status: DownloadStatus;
  /** 0..1 download progress. */
  progress: number;
  /** Local file path once downloaded. */
  filePath?: string;
  /** Verified total byte size of the completed file (for integrity checks). */
  bytesTotal?: number;
  error?: string;
}

const STORAGE_KEY = 'models/state/v1';

type StateMap = Record<string, ModelState>;

/**
 * Tracks per-model download state, persisted via KeyValueStorage. The actual
 * file transfer is performed by the platform downloader; this class only owns
 * the state machine, which keeps it unit-testable.
 *
 * Valid transitions:
 *   notDownloaded -> downloading -> downloaded
 *                              \-> failed -> downloading
 */
export class ModelManager {
  constructor(private readonly storage: KeyValueStorage) {}

  private async readMap(): Promise<StateMap> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as StateMap) : {};
    } catch {
      return {};
    }
  }

  private async writeMap(map: StateMap): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  private requireModel(modelId: string): ModelInfo {
    const model = findModel(modelId);
    if (!model) throw new Error(`Unknown model: ${modelId}`);
    return model;
  }

  async getState(modelId: string): Promise<ModelState> {
    const map = await this.readMap();
    return (
      map[modelId] ?? { modelId, status: 'notDownloaded', progress: 0 }
    );
  }

  async isDownloaded(modelId: string): Promise<boolean> {
    return (await this.getState(modelId)).status === 'downloaded';
  }

  private async setState(state: ModelState): Promise<ModelState> {
    const map = await this.readMap();
    map[state.modelId] = state;
    await this.writeMap(map);
    return state;
  }

  async beginDownload(modelId: string): Promise<ModelState> {
    this.requireModel(modelId);
    const current = await this.getState(modelId);
    if (current.status === 'downloading') {
      throw new Error(`Download already in progress: ${modelId}`);
    }
    return this.setState({ modelId, status: 'downloading', progress: 0 });
  }

  async setProgress(modelId: string, progress: number): Promise<ModelState> {
    const current = await this.getState(modelId);
    if (current.status !== 'downloading') {
      throw new Error(`Not downloading: ${modelId}`);
    }
    const clamped = Math.min(1, Math.max(0, progress));
    return this.setState({ ...current, progress: clamped });
  }

  async completeDownload(
    modelId: string,
    filePath: string,
    bytesTotal?: number,
  ): Promise<ModelState> {
    this.requireModel(modelId);
    return this.setState({
      modelId,
      status: 'downloaded',
      progress: 1,
      filePath,
      bytesTotal,
    });
  }

  async failDownload(modelId: string, error: string): Promise<ModelState> {
    const current = await this.getState(modelId);
    return this.setState({
      modelId,
      status: 'failed',
      progress: current.progress,
      error,
    });
  }

  async deleteModel(modelId: string): Promise<ModelState> {
    return this.setState({ modelId, status: 'notDownloaded', progress: 0 });
  }
}
