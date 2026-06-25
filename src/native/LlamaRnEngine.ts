/**
 * Device-only LlmEngine backed by llama.rn.
 *
 * This file is NOT part of the unit-tested core (it requires native modules and
 * a real GGUF model on device, so it is excluded from lint/typecheck). It shows
 * how the pure `LlmEngine` interface is wired to llama.rn at runtime.
 *
 * Usage (on device):
 *   const engine = await LlamaRnEngine.load(modelFilePath);
 *   const ai = new NoteAi(engine);
 */
// @ts-nocheck
import { initLlama } from 'llama.rn';
import {
  LlmEngine,
  ChatMessage,
  GenerateOptions,
  GenerateResult,
} from '../core/llm/types';

export class LlamaRnEngine implements LlmEngine {
  private constructor(private readonly context: any) {}

  // Serializes completion() calls. llama.rn has a single context with one
  // sampler; overlapping completions race in initSampling() and double-free the
  // sampler (Scudo "invalid chunk state" → SIGABRT, crashing the whole app), so
  // every generate() is chained to run strictly one at a time.
  private queue: Promise<unknown> = Promise.resolve();

  static async load(
    modelPath: string,
    opts: { nCtx?: number; nGpuLayers?: number } = {},
  ): Promise<LlamaRnEngine> {
    const context = await initLlama({
      model: modelPath,
      n_ctx: opts.nCtx ?? 4096,
      // Offload layers to GPU (Metal on iOS) when available; 0 = CPU only.
      n_gpu_layers: opts.nGpuLayers ?? 0,
    });
    return new LlamaRnEngine(context);
  }

  isReady(): boolean {
    return this.context != null;
  }

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const task = async (): Promise<GenerateResult> => {
      const params = {
        messages,
        temperature: options.temperature ?? 0.4,
        n_predict: options.maxTokens ?? 512,
        stop: options.stop ?? [],
      };
      // llama.rn's completion takes an optional per-token callback as 2nd arg.
      const tokenCallback = options.onToken
        ? (data) => {
            if (data?.token) options.onToken(data.token);
          }
        : undefined;
      const result = await this.context.completion(params, tokenCallback);
      // stopped_limit means we hit n_predict; stopped_eos/word are clean stops.
      const truncated = Boolean(result.stopped_limit);
      const stopReason = truncated
        ? 'length'
        : result.stopped_word
          ? 'stop'
          : 'eos';
      return { text: (result.text ?? '').trim(), truncated, stopReason };
    };

    // Run after any in-flight completion finishes (success or failure), then
    // keep the chain alive without letting one failure reject later calls.
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async release(): Promise<void> {
    await this.context?.release?.();
  }
}
