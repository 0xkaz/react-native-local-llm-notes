import { ChatStore } from '../src/core/chat/ChatStore';
import { MemoryStorage } from '../src/core/storage/MemoryStorage';

describe('ChatStore', () => {
  test('starts empty', async () => {
    expect(await new ChatStore(new MemoryStorage()).load()).toEqual([]);
  });

  test('append adds a message and returns the full history', async () => {
    const store = new ChatStore(new MemoryStorage());
    const out = await store.append({ role: 'user', content: 'hi' });
    expect(out).toEqual([{ role: 'user', content: 'hi' }]);
  });

  test('appendExchange stores a user/assistant pair in order', async () => {
    const store = new ChatStore(new MemoryStorage());
    const out = await store.appendExchange('質問', '返答');
    expect(out).toEqual([
      { role: 'user', content: '質問' },
      { role: 'assistant', content: '返答' },
    ]);
  });

  test('trims to maxMessages, keeping the most recent', async () => {
    const store = new ChatStore(new MemoryStorage(), 2);
    await store.append({ role: 'user', content: 'a' });
    await store.append({ role: 'assistant', content: 'b' });
    const out = await store.append({ role: 'user', content: 'c' });
    expect(out.map((m) => m.content)).toEqual(['b', 'c']);
  });

  test('clear empties the history', async () => {
    const store = new ChatStore(new MemoryStorage());
    await store.append({ role: 'user', content: 'x' });
    await store.clear();
    expect(await store.load()).toEqual([]);
  });

  test('falls back to empty on corrupt data', async () => {
    const storage = new MemoryStorage();
    await storage.setItem('chat/history/v1', '{bad');
    expect(await new ChatStore(storage).load()).toEqual([]);
  });
});
