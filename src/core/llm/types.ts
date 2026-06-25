/**
 * LLM engine abstraction.
 *
 * On device this is backed by llama.rn running a local GGUF model; tests use
 * a deterministic mock. All higher-level features (summarize, extract TODOs,
 * proofread, chat) depend only on this interface, never on llama.rn directly.
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateOptions {
  /** Sampling temperature. Lower is more deterministic. */
  temperature?: number;
  /** Hard cap on generated tokens. */
  maxTokens?: number;
  /** Stop sequences that end generation early. */
  stop?: string[];
  /**
   * Invoked with each chunk of text as it is produced. Concatenating every
   * chunk reproduces the final `text`. Engines that cannot stream may call
   * this once with the whole output, or not at all.
   */
  onToken?: (chunk: string) => void;
}

/** Why generation stopped, when the engine reports it. */
export type StopReason = 'eos' | 'length' | 'stop';

export interface GenerateResult {
  text: string;
  /**
   * Why generation ended, if known. `'length'` means the `maxTokens` cap was
   * reached and the output is likely cut off mid-thought.
   */
  stopReason?: StopReason;
  /** Convenience flag: true when generation stopped because of `maxTokens`. */
  truncated?: boolean;
}

export interface LlmEngine {
  /** Whether a model is loaded and ready to generate. */
  isReady(): boolean;
  /** Run a chat completion over the given messages. */
  generate(
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<GenerateResult>;
}
