import { NoteStore } from '../src/core/notes/NoteStore';
import { MemoryStorage } from '../src/core/storage/MemoryStorage';
import { Clock, IdGenerator } from '../src/core/notes/types';

class FakeClock implements Clock {
  private t = 1000;
  now(): number {
    return this.t;
  }
  advance(ms: number): void {
    this.t += ms;
  }
}

class SeqIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

function makeStore() {
  const clock = new FakeClock();
  return {
    clock,
    store: new NoteStore(new MemoryStorage(), clock, new SeqIds()),
  };
}

describe('NoteStore', () => {
  test('starts empty', async () => {
    const { store } = makeStore();
    expect(await store.list()).toEqual([]);
  });

  test('create assigns id and timestamps, trims title', async () => {
    const { store } = makeStore();
    const note = await store.create({ title: '  Title  ', body: 'b' });
    expect(note.id).toBe('id-1');
    expect(note.title).toBe('Title');
    expect(note.createdAt).toBe(1000);
    expect(note.updatedAt).toBe(1000);
  });

  test('get returns the note or null', async () => {
    const { store } = makeStore();
    const note = await store.create({ title: 't', body: 'b' });
    expect(await store.get(note.id)).toEqual(note);
    expect(await store.get('missing')).toBeNull();
  });

  test('update bumps updatedAt and patches fields', async () => {
    const { store, clock } = makeStore();
    const note = await store.create({ title: 't', body: 'b' });
    clock.advance(500);
    const updated = await store.update(note.id, { body: 'b2' });
    expect(updated.body).toBe('b2');
    expect(updated.title).toBe('t');
    expect(updated.updatedAt).toBe(1500);
    expect(updated.createdAt).toBe(1000);
  });

  test('update throws for unknown id', async () => {
    const { store } = makeStore();
    await expect(store.update('nope', { title: 'x' })).rejects.toThrow(
      'Note not found',
    );
  });

  test('list is sorted by updatedAt descending', async () => {
    const { store, clock } = makeStore();
    const a = await store.create({ title: 'a', body: '' });
    clock.advance(10);
    const b = await store.create({ title: 'b', body: '' });
    clock.advance(10);
    await store.update(a.id, { body: 'touched' });
    const ids = (await store.list()).map((n) => n.id);
    expect(ids).toEqual([a.id, b.id]);
  });

  test('remove deletes and reports success', async () => {
    const { store } = makeStore();
    const note = await store.create({ title: 't', body: '' });
    expect(await store.remove(note.id)).toBe(true);
    expect(await store.remove(note.id)).toBe(false);
    expect(await store.list()).toEqual([]);
  });

  test('persists across store instances on shared storage', async () => {
    const storage = new MemoryStorage();
    const clock = new FakeClock();
    const s1 = new NoteStore(storage, clock, new SeqIds());
    await s1.create({ title: 'kept', body: '' });
    const s2 = new NoteStore(storage, clock, new SeqIds());
    expect((await s2.list()).map((n) => n.title)).toEqual(['kept']);
  });

  test('remove soft-deletes: gone from list, present in trash', async () => {
    const { store } = makeStore();
    const note = await store.create({ title: 't', body: '' });
    await store.remove(note.id);
    expect(await store.list()).toEqual([]);
    expect((await store.listTrashed()).map((n) => n.id)).toEqual([note.id]);
    // still retrievable by id
    expect((await store.get(note.id))?.deletedAt).toBeGreaterThan(0);
  });

  test('restore brings a trashed note back', async () => {
    const { store } = makeStore();
    const note = await store.create({ title: 't', body: '' });
    await store.remove(note.id);
    expect(await store.restore(note.id)).toBe(true);
    expect((await store.list()).map((n) => n.id)).toEqual([note.id]);
    expect(await store.listTrashed()).toEqual([]);
    expect(await store.restore(note.id)).toBe(false); // not trashed anymore
  });

  test('purge permanently deletes; emptyTrash clears trash only', async () => {
    const { store } = makeStore();
    const a = await store.create({ title: 'a', body: '' });
    const b = await store.create({ title: 'b', body: '' });
    await store.remove(a.id);
    expect(await store.purge(a.id)).toBe(true);
    expect(await store.get(a.id)).toBeNull();
    await store.remove(b.id);
    await store.emptyTrash();
    expect(await store.listTrashed()).toEqual([]);
    expect(await store.get(b.id)).toBeNull();
  });

  test('create normalizes tags; update sets pinned and tags', async () => {
    const { store } = makeStore();
    const note = await store.create({
      title: 't',
      body: '',
      tags: [' work ', 'work', '', 'urgent'],
    });
    expect(note.tags).toEqual(['work', 'urgent']);
    const up = await store.update(note.id, { pinned: true, tags: ['done'] });
    expect(up.pinned).toBe(true);
    expect(up.tags).toEqual(['done']);
  });

  test('setPinned toggles pinned WITHOUT bumping updatedAt', async () => {
    const { store, clock } = makeStore();
    const note = await store.create({ title: 't', body: '' });
    clock.advance(500);
    const pinned = await store.setPinned(note.id, true);
    expect(pinned.pinned).toBe(true);
    expect(pinned.updatedAt).toBe(1000); // unchanged despite clock advance
    const unpinned = await store.setPinned(note.id, false);
    expect(unpinned.pinned).toBe(false);
    expect(unpinned.updatedAt).toBe(1000);
  });

  test('pinned notes sort to the top of the list', async () => {
    const { store, clock } = makeStore();
    const a = await store.create({ title: 'a', body: '' });
    clock.advance(10);
    const b = await store.create({ title: 'b', body: '' });
    await store.update(a.id, { pinned: true });
    const ids = (await store.list()).map((n) => n.id);
    expect(ids[0]).toBe(a.id); // pinned first despite older updatedAt order
    expect(ids).toContain(b.id);
  });
});
