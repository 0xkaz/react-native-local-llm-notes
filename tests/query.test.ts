import { searchNotes, sortNotes } from '../src/core/notes/query';
import { Note } from '../src/core/notes/types';

function note(p: Partial<Note>): Note {
  return {
    id: p.id ?? 'x',
    title: p.title ?? '',
    body: p.body ?? '',
    createdAt: p.createdAt ?? 0,
    updatedAt: p.updatedAt ?? 0,
    pinned: p.pinned,
    tags: p.tags,
    deletedAt: p.deletedAt,
  };
}

describe('searchNotes', () => {
  const notes = [
    note({ id: '1', title: 'Meeting', body: 'discuss roadmap', tags: ['work'] }),
    note({ id: '2', title: '買い物', body: '牛乳とパン', tags: ['private'] }),
  ];

  test('empty query returns all (unchanged order)', () => {
    expect(searchNotes(notes, '  ').map((n) => n.id)).toEqual(['1', '2']);
  });

  test('matches title/body case-insensitively', () => {
    expect(searchNotes(notes, 'ROADMAP').map((n) => n.id)).toEqual(['1']);
    expect(searchNotes(notes, '牛乳').map((n) => n.id)).toEqual(['2']);
  });

  test('matches tags', () => {
    expect(searchNotes(notes, 'work').map((n) => n.id)).toEqual(['1']);
  });

  test('no match returns empty', () => {
    expect(searchNotes(notes, 'zzz')).toEqual([]);
  });
});

describe('sortNotes', () => {
  const a = note({ id: 'a', title: 'Banana', createdAt: 1, updatedAt: 30 });
  const b = note({ id: 'b', title: 'Apple', createdAt: 2, updatedAt: 20 });
  const c = note({ id: 'c', title: 'Cherry', createdAt: 3, updatedAt: 10 });

  test('updated: newest first', () => {
    expect(sortNotes([c, b, a], 'updated').map((n) => n.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  test('created: newest first', () => {
    expect(sortNotes([a, b, c], 'created').map((n) => n.id)).toEqual([
      'c',
      'b',
      'a',
    ]);
  });

  test('title: ascending', () => {
    expect(sortNotes([a, b, c], 'title').map((n) => n.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  test('pinned always first, regardless of order', () => {
    const pinnedC = { ...c, pinned: true };
    expect(sortNotes([a, b, pinnedC], 'updated').map((n) => n.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  test('does not mutate the input', () => {
    const input = [c, b, a];
    sortNotes(input, 'updated');
    expect(input.map((n) => n.id)).toEqual(['c', 'b', 'a']);
  });
});
