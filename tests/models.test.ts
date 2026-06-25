import {
  MODEL_CATALOG,
  findModel,
  recommendModel,
} from '../src/core/models/catalog';
import { ModelManager } from '../src/core/models/ModelManager';
import { MemoryStorage } from '../src/core/storage/MemoryStorage';

describe('model catalog', () => {
  test('ships the Apache-2.0 Qwen 1.5B model as the default', () => {
    const m = findModel('qwen2.5-1.5b-instruct-q4_k_m');
    expect(m?.commercialUse).toBe('allowed');
    expect(m?.license).toBe('Apache-2.0');
  });

  test('recommendModel returns the default model (low or high RAM)', () => {
    expect(recommendModel(2).id).toBe('qwen2.5-1.5b-instruct-q4_k_m');
    expect(recommendModel(8).id).toBe('qwen2.5-1.5b-instruct-q4_k_m');
    expect(recommendModel(8).commercialUse).toBe('allowed');
  });

  test('every catalog entry has a gguf url', () => {
    for (const m of MODEL_CATALOG) {
      expect(m.url.endsWith('.gguf')).toBe(true);
    }
  });
});

describe('ModelManager state machine', () => {
  const ID = 'qwen2.5-1.5b-instruct-q4_k_m';

  function mgr() {
    return new ModelManager(new MemoryStorage());
  }

  test('unknown model defaults to notDownloaded', async () => {
    const state = await mgr().getState(ID);
    expect(state.status).toBe('notDownloaded');
    expect(state.progress).toBe(0);
  });

  test('full happy path: begin -> progress -> complete', async () => {
    const m = mgr();
    await m.beginDownload(ID);
    await m.setProgress(ID, 0.5);
    const done = await m.completeDownload(ID, '/models/qwen.gguf');
    expect(done.status).toBe('downloaded');
    expect(done.progress).toBe(1);
    expect(done.filePath).toBe('/models/qwen.gguf');
    expect(await m.isDownloaded(ID)).toBe(true);
  });

  test('records the verified total size on completion', async () => {
    const m = mgr();
    await m.beginDownload(ID);
    const done = await m.completeDownload(ID, '/models/qwen.gguf', 1234567);
    expect(done.bytesTotal).toBe(1234567);
    expect((await m.getState(ID)).bytesTotal).toBe(1234567);
  });

  test('clamps progress into [0,1]', async () => {
    const m = mgr();
    await m.beginDownload(ID);
    expect((await m.setProgress(ID, 5)).progress).toBe(1);
    expect((await m.setProgress(ID, -2)).progress).toBe(0);
  });

  test('cannot begin a second concurrent download', async () => {
    const m = mgr();
    await m.beginDownload(ID);
    await expect(m.beginDownload(ID)).rejects.toThrow('already in progress');
  });

  test('cannot set progress when not downloading', async () => {
    const m = mgr();
    await expect(m.setProgress(ID, 0.5)).rejects.toThrow('Not downloading');
  });

  test('failure can be retried, and delete resets state', async () => {
    const m = mgr();
    await m.beginDownload(ID);
    const failed = await m.failDownload(ID, 'network');
    expect(failed.status).toBe('failed');
    expect(failed.error).toBe('network');
    await expect(m.beginDownload(ID)).resolves.toMatchObject({
      status: 'downloading',
    });
    await m.completeDownload(ID, '/p');
    const deleted = await m.deleteModel(ID);
    expect(deleted.status).toBe('notDownloaded');
  });

  test('rejects unknown model ids', async () => {
    await expect(mgr().beginDownload('nope')).rejects.toThrow('Unknown model');
  });
});
