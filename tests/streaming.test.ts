import { MockLlmEngine } from '../src/core/llm/MockLlmEngine';
import { NoteAi } from '../src/core/llm/tasks';
import { ChatMessage } from '../src/core/llm/types';

const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];

describe('MockLlmEngine streaming', () => {
  test('emits every chunk and the chunks reconstruct the full text', async () => {
    const engine = new MockLlmEngine(() => 'こんにちは');
    const chunks: string[] = [];
    const result = await engine.generate(messages, {
      onToken: (c) => chunks.push(c),
    });
    expect(chunks.join('')).toBe('こんにちは');
    expect(chunks).toHaveLength(5);
    expect(result.text).toBe('こんにちは');
    expect(result.truncated).toBe(false);
    expect(result.stopReason).toBe('eos');
  });

  test('truncates at maxTokens and reports the length stop reason', async () => {
    const engine = new MockLlmEngine(() => 'abcdef');
    const chunks: string[] = [];
    const result = await engine.generate(messages, {
      maxTokens: 3,
      onToken: (c) => chunks.push(c),
    });
    expect(result.text).toBe('abc');
    expect(result.truncated).toBe(true);
    expect(result.stopReason).toBe('length');
    expect(chunks).toEqual(['a', 'b', 'c']);
  });

  test('does not truncate when output fits the cap', async () => {
    const engine = new MockLlmEngine(() => 'abc');
    const result = await engine.generate(messages, { maxTokens: 10 });
    expect(result.truncated).toBe(false);
  });
});

describe('NoteAi streaming and truncation', () => {
  test('summarize forwards onToken and returns cleaned text', async () => {
    const engine = new MockLlmEngine(() => '- 要点');
    const chunks: string[] = [];
    const result = await new NoteAi(engine).summarize('本文', 'oneLine', {
      onToken: (c) => chunks.push(c),
    });
    expect(chunks.join('')).toBe('- 要点');
    expect(result.text).toBe('- 要点');
    expect(result.truncated).toBe(false);
  });

  test('summarize reports truncation when the cap is hit', async () => {
    // oneLine cap is 80 tokens; produce 100 to force truncation.
    const long = 'あ'.repeat(100);
    const engine = new MockLlmEngine(() => long);
    const result = await new NoteAi(engine).summarize('本文', 'oneLine');
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBe(80);
  });

  test('chat streams and returns a trimmed reply', async () => {
    const engine = new MockLlmEngine(() => '  返答  ');
    const chunks: string[] = [];
    const result = await new NoteAi(engine).chat([], 'やあ', {
      onToken: (c) => chunks.push(c),
    });
    expect(chunks.join('')).toBe('  返答  ');
    expect(result.text).toBe('返答');
  });
});
