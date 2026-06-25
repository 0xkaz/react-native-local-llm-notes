import RNFS from 'react-native-fs';
import { ModelInfo } from '../../core';
import { DEV_MODEL_BASE_URL } from '../devConfig';

const MODELS_DIR = `${RNFS.DocumentDirectoryPath}/models`;

/**
 * The URL to download a model from. In development, if a LAN mirror is set in
 * devConfig, fetch `<mirror>/<original-filename>` instead of Hugging Face —
 * much faster and repeatable. Always the real catalog URL in release builds.
 */
function downloadUrlFor(model: ModelInfo): string {
  if (__DEV__ && DEV_MODEL_BASE_URL) {
    const filename = model.url.split('/').pop() ?? `${model.id}.gguf`;
    return `${DEV_MODEL_BASE_URL.replace(/\/+$/, '')}/${filename}`;
  }
  return model.url;
}

/** Local filesystem path where a given model's GGUF file lives. */
export function localPathFor(model: ModelInfo): string {
  return `${MODELS_DIR}/${model.id}.gguf`;
}

export async function ensureModelsDir(): Promise<void> {
  const exists = await RNFS.exists(MODELS_DIR);
  if (!exists) {
    await RNFS.mkdir(MODELS_DIR);
  }
}

export function modelFileExists(model: ModelInfo): Promise<boolean> {
  return RNFS.exists(localPathFor(model));
}

/**
 * Size in bytes of a model's local file, or 0 if it does not exist. Cheap to
 * call (a stat, not a read), so a partial/corrupt file can be detected without
 * re-reading its contents.
 */
export async function modelFileSize(model: ModelInfo): Promise<number> {
  const path = localPathFor(model);
  if (!(await RNFS.exists(path))) return 0;
  const stat = await RNFS.stat(path);
  return Number(stat.size) || 0;
}

export async function deleteModelFile(model: ModelInfo): Promise<void> {
  const path = localPathFor(model);
  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
  }
}

/**
 * Download a model's GGUF to its local path, reporting 0..1 progress. Uses
 * react-native-fs (follows the Hugging Face redirect to the CDN).
 *
 * Returns the total byte size of the completed file so the caller can persist
 * it and later verify the on-disk file is whole. Throws on a non-2xx response
 * or a short/truncated transfer, and deletes the partial file on any failure so
 * a later run never mistakes a broken remnant for a finished download.
 */
export async function downloadModel(
  model: ModelInfo,
  onProgress: (ratio: number) => void,
): Promise<number> {
  let expectedBytes = 0;
  try {
    const { promise } = RNFS.downloadFile({
      fromUrl: downloadUrlFor(model),
      toFile: localPathFor(model),
      progressInterval: 500,
      begin: ({ contentLength }) => {
        expectedBytes = contentLength > 0 ? contentLength : 0;
      },
      progress: ({ bytesWritten, contentLength }) => {
        const ratio = contentLength > 0 ? bytesWritten / contentLength : 0;
        onProgress(Math.max(0, Math.min(1, ratio)));
      },
    });
    const res = await promise;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`Download failed: HTTP ${res.statusCode}`);
    }
    // Guard against a silently truncated transfer (connection dropped mid-way
    // but the promise still resolved): the written file must match the size the
    // server advertised.
    const written = await modelFileSize(model);
    if (expectedBytes > 0 && written < expectedBytes) {
      throw new Error(
        `Download incomplete: ${written}/${expectedBytes} bytes`,
      );
    }
    return written;
  } catch (e) {
    // Leave no partial file behind — the next attempt starts clean and is never
    // mistaken for a finished download.
    await deleteModelFile(model).catch(() => undefined);
    throw e;
  }
}
