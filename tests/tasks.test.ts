import { NoteAi } from '../src/core/llm/tasks';
import { MockLlmEngine } from '../src/core/llm/MockLlmEngine';
import { ChatMessage } from '../src/core/llm/types';

describe('NoteAi', () => {
  test('summarize returns cleaned engine output', async () => {
    const engine = new MockLlmEngine(() => '- 点1\n\n- 点2');
    const ai = new NoteAi(engine);
    expect((await ai.summarize('長い本文', 'threeLines')).text).toBe(
      '- 点1\n- 点2',
    );
  });

  test('summarize forwards the requested length into the prompt', async () => {
    let seen: ChatMessage[] = [];
    const engine = new MockLlmEngine((messages) => {
      seen = messages;
      return 'ok';
    });
    await new NoteAi(engine).summarize('本文', 'oneLine');
    expect(seen.some((m) => m.content.includes('single line'))).toBe(true);
  });

  test('extractTodos parses bullets into an array', async () => {
    const engine = new MockLlmEngine(() => '- A\n- B');
    expect(await new NoteAi(engine).extractTodos('本文')).toEqual(['A', 'B']);
  });

  test('proofread returns rewritten text', async () => {
    const engine = new MockLlmEngine(() => '校正後の文章');
    expect((await new NoteAi(engine).proofread('誤字脱字')).text).toBe(
      '校正後の文章',
    );
  });

  test('chat appends history and returns the reply', async () => {
    let seen: ChatMessage[] = [];
    const engine = new MockLlmEngine((messages) => {
      seen = messages;
      return '返答';
    });
    const history: ChatMessage[] = [
      { role: 'user', content: '前の質問' },
      { role: 'assistant', content: '前の返答' },
    ];
    const reply = await new NoteAi(engine).chat(history, '次の質問');
    expect(reply.text).toBe('返答');
    expect(seen[seen.length - 1]).toEqual({ role: 'user', content: '次の質問' });
    expect(seen[0].role).toBe('system');
  });

  test('translate forwards the target language and returns text', async () => {
    let seen: ChatMessage[] = [];
    const engine = new MockLlmEngine((messages) => {
      seen = messages;
      return 'Hello';
    });
    const r = await new NoteAi(engine).translate('こんにちは', 'en');
    expect(r.text).toBe('Hello');
    expect(seen.some((m) => m.content.includes('English'))).toBe(true);
  });

  test('changeTone, continueText and generateTitle return cleaned text', async () => {
    const ai = new NoteAi(new MockLlmEngine(() => '  result  '));
    expect((await ai.changeTone('x', 'formal')).text).toBe('result');
    expect((await ai.continueText('x')).text).toBe('result');
    expect((await ai.generateTitle('x')).text).toBe('result');
  });

  test('generateTitle returns only the first line', async () => {
    const ai = new NoteAi(new MockLlmEngine(() => 'My Title\nextra junk'));
    expect((await ai.generateTitle('body')).text).toBe('My Title');
  });

  test('rejects empty input', async () => {
    const ai = new NoteAi(new MockLlmEngine());
    await expect(ai.summarize('   ', 'oneLine')).rejects.toThrow('empty');
  });

  test('propagates not-ready engine errors', async () => {
    const ai = new NoteAi(new MockLlmEngine(undefined, false));
    await expect(ai.proofread('本文')).rejects.toThrow('not ready');
  });
});
