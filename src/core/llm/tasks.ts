import { LlmEngine, ChatMessage } from './types';
import {
  buildSummaryPrompt,
  buildTodoPrompt,
  buildProofreadPrompt,
  buildChatPrompt,
  buildTranslatePrompt,
  buildTonePrompt,
  buildContinuePrompt,
  buildTitlePrompt,
  SummaryLength,
  ToneStyle,
  TargetLang,
} from './prompts';
import { parseTodos, cleanText } from './parse';

/**
 * Result of a text-producing AI task.
 *
 * `truncated` is true when the model hit its token cap, so the UI can warn the
 * user that the output may be incomplete and offer to re-run.
 */
export interface AiTextResult {
  text: string;
  truncated: boolean;
}

/** Per-call options shared by the text tasks. */
export interface TaskOptions {
  /**
   * Streamed partial output, chunk by chunk, as the model generates it. The
   * chunks are raw (not yet cleaned); the resolved `text` is the cleaned
   * final result.
   */
  onToken?: (chunk: string) => void;
}

/**
 * Token caps per task. Small on-device models ramble, so we bound output to
 * keep latency and memory predictable. Hitting the cap surfaces as
 * `truncated: true` rather than a silent cut-off.
 */
const SUMMARY_MAX_TOKENS: Record<SummaryLength, number> = {
  oneLine: 80,
  threeLines: 220,
  detailed: 768,
};
const TODO_MAX_TOKENS = 512;
const PROOFREAD_MAX_TOKENS = 1024;
const CHAT_MAX_TOKENS = 512;

/**
 * High-level AI features. Each composes a prompt, runs the engine and parses
 * the result. These are the functions the UI calls.
 */
export class NoteAi {
  constructor(private readonly engine: LlmEngine) {}

  private ensureInput(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error('Input text is empty.');
    }
    return trimmed;
  }

  async summarize(
    text: string,
    length: SummaryLength,
    opts: TaskOptions = {},
  ): Promise<AiTextResult> {
    const input = this.ensureInput(text);
    const result = await this.engine.generate(
      buildSummaryPrompt(input, length),
      {
        temperature: 0.3,
        maxTokens: SUMMARY_MAX_TOKENS[length],
        onToken: opts.onToken,
      },
    );
    return { text: cleanText(result.text), truncated: result.truncated ?? false };
  }

  async extractTodos(text: string): Promise<string[]> {
    const input = this.ensureInput(text);
    const { text: out } = await this.engine.generate(buildTodoPrompt(input), {
      temperature: 0.2,
      maxTokens: TODO_MAX_TOKENS,
    });
    return parseTodos(out);
  }

  async proofread(text: string, opts: TaskOptions = {}): Promise<AiTextResult> {
    const input = this.ensureInput(text);
    const result = await this.engine.generate(buildProofreadPrompt(input), {
      temperature: 0.3,
      maxTokens: PROOFREAD_MAX_TOKENS,
      onToken: opts.onToken,
    });
    return { text: cleanText(result.text), truncated: result.truncated ?? false };
  }

  async translate(
    text: string,
    target: TargetLang,
    opts: TaskOptions = {},
  ): Promise<AiTextResult> {
    const input = this.ensureInput(text);
    const result = await this.engine.generate(
      buildTranslatePrompt(input, target),
      { temperature: 0.3, maxTokens: 1024, onToken: opts.onToken },
    );
    return { text: cleanText(result.text), truncated: result.truncated ?? false };
  }

  async changeTone(
    text: string,
    tone: ToneStyle,
    opts: TaskOptions = {},
  ): Promise<AiTextResult> {
    const input = this.ensureInput(text);
    const result = await this.engine.generate(buildTonePrompt(input, tone), {
      temperature: 0.5,
      maxTokens: 1024,
      onToken: opts.onToken,
    });
    return { text: cleanText(result.text), truncated: result.truncated ?? false };
  }

  async continueText(
    text: string,
    opts: TaskOptions = {},
  ): Promise<AiTextResult> {
    const input = this.ensureInput(text);
    const result = await this.engine.generate(buildContinuePrompt(input), {
      temperature: 0.7,
      maxTokens: 512,
      onToken: opts.onToken,
    });
    return { text: cleanText(result.text), truncated: result.truncated ?? false };
  }

  /** Single-line title; no streaming (it's short). */
  async generateTitle(text: string): Promise<AiTextResult> {
    const input = this.ensureInput(text);
    const result = await this.engine.generate(buildTitlePrompt(input), {
      temperature: 0.4,
      maxTokens: 48,
    });
    const firstLine = cleanText(result.text).split('\n')[0] ?? '';
    return { text: firstLine, truncated: result.truncated ?? false };
  }

  async chat(
    history: ChatMessage[],
    userMessage: string,
    opts: TaskOptions = {},
  ): Promise<AiTextResult> {
    const message = this.ensureInput(userMessage);
    const result = await this.engine.generate(
      buildChatPrompt(history, message),
      {
        temperature: 0.7,
        maxTokens: CHAT_MAX_TOKENS,
        onToken: opts.onToken,
      },
    );
    return { text: result.text.trim(), truncated: result.truncated ?? false };
  }
}
