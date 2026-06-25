/**
 * Catalog of local models the app can download and run.
 *
 * Ships a single default model — Qwen2.5-1.5B (Apache-2.0, safe for commercial
 * use, small enough for most phones). To offer more choices, add entries here;
 * each just needs an `id`, a Hugging Face GGUF `url`, and license metadata.
 * Larger alternatives you might add (mind the licenses):
 *   - Qwen2.5-3B Instruct  (Qwen Research License — NOT a blanket commercial grant)
 *   - Llama 3.2 3B Instruct (Llama 3.2 Community License — commercial OK)
 */

export type CommercialUse = 'allowed' | 'restricted';

export interface ModelInfo {
  id: string;
  displayName: string;
  /** Approximate on-disk size in bytes (Q4_K_M GGUF). */
  sizeBytes: number;
  /** Recommended minimum device RAM in GB. */
  minRamGB: number;
  license: string;
  commercialUse: CommercialUse;
  /** GGUF download URL (Hugging Face). */
  url: string;
}

const GB = 1024 * 1024 * 1024;

export const MODEL_CATALOG: ModelInfo[] = [
  {
    id: 'qwen2.5-1.5b-instruct-q4_k_m',
    displayName: 'Qwen2.5 1.5B Instruct (Q4_K_M)',
    sizeBytes: Math.round(1.1 * GB),
    minRamGB: 3,
    license: 'Apache-2.0',
    commercialUse: 'allowed',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
  },
];

export function findModel(id: string): ModelInfo | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

/**
 * Pick a model that fits the device. Returns the largest catalog model whose
 * RAM requirement is met, preferring commercial-use-allowed ones on a tie.
 * (With a single-model catalog this always returns the default.)
 */
export function recommendModel(deviceRamGB: number): ModelInfo {
  const fits = MODEL_CATALOG.filter((m) => m.minRamGB <= deviceRamGB);
  const pool = fits.length > 0 ? fits : [MODEL_CATALOG[0]];
  return [...pool].sort((a, b) => {
    if (b.minRamGB !== a.minRamGB) return b.minRamGB - a.minRamGB;
    const ac = a.commercialUse === 'allowed' ? 0 : 1;
    const bc = b.commercialUse === 'allowed' ? 0 : 1;
    return ac - bc;
  })[0];
}
