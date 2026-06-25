import { Note, NoteSort } from './types';

/** True if the note is in the trash (soft-deleted). */
export function isTrashed(note: Note): boolean {
  return note.deletedAt != null;
}

/**
 * Case-insensitive search over title, body and tags. An empty/whitespace query
 * returns the list unchanged (order preserved).
 */
export function searchNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return notes;
  return notes.filter((n) => {
    const haystack = [n.title, n.body, ...(n.tags ?? [])]
      .join('\n')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * Sort notes: pinned first, then by the chosen order. 'updated'/'created' are
 * newest-first; 'title' is locale ascending. Returns a new array.
 */
export function sortNotes(notes: Note[], order: NoteSort = 'updated'): Note[] {
  const byOrder = (a: Note, b: Note): number => {
    switch (order) {
      case 'created':
        return b.createdAt - a.createdAt;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'updated':
      default:
        return b.updatedAt - a.updatedAt;
    }
  };
  return [...notes].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap; // pinned first
    return byOrder(a, b);
  });
}
