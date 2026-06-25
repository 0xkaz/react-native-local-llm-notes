import { ChatMessage } from './types';

/**
 * Prompt templates for the note assistant.
 *
 * Each builder returns a full message array (system + user) so the engine layer
 * stays generic. Instructions are explicit about output shape because small
 * on-device models (1.5B–3B) follow tight formats more reliably. The system
 * prompt tells the model to reply in the same language as the input, so the
 * features work for both English and Japanese notes; builders that change the
 * language (translate) override that explicitly.
 */

export type SummaryLength = 'oneLine' | 'threeLines' | 'detailed';
export type ToneStyle = 'formal' | 'casual';
export type TargetLang = 'en' | 'ja';

const SUMMARY_INSTRUCTION: Record<SummaryLength, string> = {
  oneLine: 'Summarize the content in a single line.',
  threeLines:
    'Summarize the content as up to 3 bullet points. Start each line with "- ".',
  detailed:
    'Summarize the content in detail as a paragraph, without omitting key points.',
};

const ASSISTANT_SYSTEM =
  'You are a capable note-taking assistant. Follow the requested format ' +
  'exactly, keep the output concise, and reply in the same language as the ' +
  'input text. Do not add any preamble, notes, or apologies.';

function prompt(instruction: string, text: string): ChatMessage[] {
  return [
    { role: 'system', content: ASSISTANT_SYSTEM },
    { role: 'user', content: `${instruction}\n\n---\n${text}` },
  ];
}

export function buildSummaryPrompt(
  text: string,
  length: SummaryLength,
): ChatMessage[] {
  return prompt(SUMMARY_INSTRUCTION[length], text);
}

export function buildTodoPrompt(text: string): ChatMessage[] {
  return prompt(
    'Extract the actionable TODO items from the text. List each on its own ' +
      'line starting with "- ", and output nothing else. If there are none, ' +
      'output only "(none)".',
    text,
  );
}

export function buildProofreadPrompt(text: string): ChatMessage[] {
  return prompt(
    'Proofread and rewrite the text: fix typos, grammar and politeness while ' +
      'preserving the meaning, making it natural and readable. Output only the ' +
      'corrected text.',
    text,
  );
}

export function buildTranslatePrompt(
  text: string,
  target: TargetLang,
): ChatMessage[] {
  const lang = target === 'ja' ? 'natural Japanese' : 'natural English';
  return [
    { role: 'system', content: ASSISTANT_SYSTEM },
    {
      role: 'user',
      content: `Translate the following text into ${lang}. Output only the translation.\n\n---\n${text}`,
    },
  ];
}

export function buildTonePrompt(text: string, tone: ToneStyle): ChatMessage[] {
  const desc =
    tone === 'formal'
      ? 'a more formal, polite tone'
      : 'a more casual, friendly tone';
  return prompt(
    `Rewrite the text in ${desc}, preserving the meaning. Output only the rewritten text.`,
    text,
  );
}

export function buildContinuePrompt(text: string): ChatMessage[] {
  return prompt(
    'Continue writing the text naturally. Output only the continuation; do not ' +
      'repeat the original text.',
    text,
  );
}

export function buildTitlePrompt(text: string): ChatMessage[] {
  return prompt(
    'Generate a concise title (at most about 6 words) for the note. Output ' +
      'only the title, with no surrounding quotes or trailing punctuation.',
    text,
  );
}

export function buildChatPrompt(
  history: ChatMessage[],
  userMessage: string,
): ChatMessage[] {
  const hasSystem = history.some((m) => m.role === 'system');
  const head: ChatMessage[] = hasSystem
    ? []
    : [{ role: 'system', content: ASSISTANT_SYSTEM }];
  return [...head, ...history, { role: 'user', content: userMessage }];
}
