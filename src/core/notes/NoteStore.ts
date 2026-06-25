import { KeyValueStorage } from '../storage/types';
import {
  Note,
  NoteInput,
  NoteUpdate,
  NoteSort,
  Clock,
  IdGenerator,
} from './types';
import { sortNotes, isTrashed } from './query';

const STORAGE_KEY = 'notes/v1';

/**
 * CRUD for notes, persisted as a single JSON array under one storage key.
 *
 * Deletion is soft: `remove` sets `deletedAt` so notes go to the trash and can
 * be restored or purged. `list` returns active notes (pinned first); use
 * `listTrashed` for the trash. Clock and IdGenerator are injected so behaviour
 * is fully deterministic under test.
 */
export class NoteStore {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  private async readAll(): Promise<Note[]> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Note[]) : [];
    } catch {
      return [];
    }
  }

  private async writeAll(notes: Note[]): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  /** Active (non-trashed) notes, pinned first, then by `order`. */
  async list(order: NoteSort = 'updated'): Promise<Note[]> {
    const active = (await this.readAll()).filter((n) => !isTrashed(n));
    return sortNotes(active, order);
  }

  /** Trashed notes, most recently deleted first. */
  async listTrashed(): Promise<Note[]> {
    const trashed = (await this.readAll()).filter(isTrashed);
    return trashed.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  }

  async get(id: string): Promise<Note | null> {
    const notes = await this.readAll();
    return notes.find((n) => n.id === id) ?? null;
  }

  async create(input: NoteInput): Promise<Note> {
    const now = this.clock.now();
    const note: Note = {
      id: this.ids.next(),
      title: input.title.trim(),
      body: input.body,
      tags: normalizeTags(input.tags),
      pinned: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const notes = await this.readAll();
    notes.push(note);
    await this.writeAll(notes);
    return note;
  }

  async update(id: string, patch: NoteUpdate): Promise<Note> {
    const notes = await this.readAll();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`Note not found: ${id}`);
    }
    const current = notes[index];
    const next: Note = {
      ...current,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      body: patch.body !== undefined ? patch.body : current.body,
      tags: patch.tags !== undefined ? normalizeTags(patch.tags) : current.tags,
      pinned: patch.pinned !== undefined ? patch.pinned : current.pinned,
      updatedAt: this.clock.now(),
    };
    notes[index] = next;
    await this.writeAll(notes);
    return next;
  }

  /**
   * Toggle the pinned flag WITHOUT bumping `updatedAt` — pinning is not a
   * content edit, so it must not reorder notes by recency.
   */
  async setPinned(id: string, pinned: boolean): Promise<Note> {
    const notes = await this.readAll();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`Note not found: ${id}`);
    }
    notes[index] = { ...notes[index], pinned };
    await this.writeAll(notes);
    return notes[index];
  }

  /** Soft-delete: move to trash. Returns false if missing or already trashed. */
  async remove(id: string): Promise<boolean> {
    const notes = await this.readAll();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1 || isTrashed(notes[index])) return false;
    notes[index] = { ...notes[index], deletedAt: this.clock.now() };
    await this.writeAll(notes);
    return true;
  }

  /** Restore a trashed note. Returns false if missing or not trashed. */
  async restore(id: string): Promise<boolean> {
    const notes = await this.readAll();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1 || !isTrashed(notes[index])) return false;
    notes[index] = { ...notes[index], deletedAt: null, updatedAt: this.clock.now() };
    await this.writeAll(notes);
    return true;
  }

  /** Permanently delete one note (from trash or active). */
  async purge(id: string): Promise<boolean> {
    const notes = await this.readAll();
    const next = notes.filter((n) => n.id !== id);
    if (next.length === notes.length) return false;
    await this.writeAll(next);
    return true;
  }

  /** Permanently delete all trashed notes. */
  async emptyTrash(): Promise<void> {
    const kept = (await this.readAll()).filter((n) => !isTrashed(n));
    await this.writeAll(kept);
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEY);
  }
}

/** Trim, drop empties, de-duplicate (order-preserving). */
function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim();
    if (t.length > 0 && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}
