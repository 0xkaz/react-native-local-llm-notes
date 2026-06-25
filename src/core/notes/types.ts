export interface Note {
  id: string;
  title: string;
  body: string;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Epoch milliseconds. */
  updatedAt: number;
  /** Pinned notes sort to the top. */
  pinned?: boolean;
  /** Free-form tags for grouping/filtering. */
  tags?: string[];
  /** Soft-delete timestamp (epoch ms). null/undefined = active. */
  deletedAt?: number | null;
}

export interface NoteInput {
  title: string;
  body: string;
  tags?: string[];
}

/** Fields that can be patched on an existing note. */
export type NoteUpdate = Partial<{
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
}>;

/** Sort orders for the note list (pinned notes always come first). */
export type NoteSort = 'updated' | 'created' | 'title';

/** Injectable side-effects so the store stays deterministic in tests. */
export interface Clock {
  now(): number;
}

export interface IdGenerator {
  next(): string;
}
