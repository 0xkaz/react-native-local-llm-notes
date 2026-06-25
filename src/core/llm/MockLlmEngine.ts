import {
  LlmEngine,
  ChatMessage,
  GenerateOptions,
  GenerateResult,
} from './types';

export type Responder = (
  messages: ChatMessage[],
  options?: GenerateOptions,
) => string;

/**
 * Deterministic in-memory engine for tests and offline development.
 *
 * Pass a `responder` to control output for a given prompt, or rely on the
 * default which simply echoes the last user message. `ready` toggles
 * isReady() so callers can exercise the not-loaded path.
 */
export class MockLlmEngine implements LlmEngine {
  private readonly responder: Responder;
  public ready: boolean;

  constructor(responder?: Responder, ready = true) {
    this.responder =
      responder ??
      ((messages) => {
        const lastUser = [...messages]
          .reverse()
          .find((m) => m.role === 'user');
        return lastUser ? lastUser.content : '';
      });
    this.ready = ready;
  }

  isReady(): boolean {
    return this.ready;
  }

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    if (!this.ready) {
      throw new Error('Engine is not ready: no model loaded.');
    }
    const full = this.responder(messages, options);
    // Treat each Unicode code point as one "token" so maxTokens behaves
    // deterministically for both ASCII and Japanese text in tests.
    const tokens = Array.from(full);
    const { maxTokens, onToken } = options;
    const truncated = maxTokens != null && tokens.length > maxTokens;
    const emitted = truncated ? tokens.slice(0, maxTokens) : tokens;
    if (onToken) {
      for (const token of emitted) {
        onToken(token);
      }
    }
    return {
      text: emitted.join(''),
      truncated,
      stopReason: truncated ? 'length' : 'eos',
    };
  }
}
