/**
 * Parsers that turn raw LLM text into structured results.
 *
 * Small models drift from the requested format, so these are deliberately
 * lenient: they accept several bullet styles and strip common noise.
 */

const BULLET_PREFIX = /^\s*(?:[-*•]|\d+[.)]|・)\s*/;
const EMPTY_MARKERS = new Set(['(なし)', '（なし）', 'なし', 'none', '(none)']);

/** Split LLM output into trimmed, non-empty lines. */
export function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Remove a leading bullet/number marker from a single line. */
export function stripBullet(line: string): string {
  return line.replace(BULLET_PREFIX, '').trim();
}

/**
 * Parse a bulleted TODO list. Returns [] when the model reported "none" or
 * produced nothing usable. Duplicates are removed, order is preserved.
 */
export function parseTodos(text: string): string[] {
  const lines = toLines(text);
  const todos: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const item = stripBullet(line);
    if (item.length === 0) continue;
    if (EMPTY_MARKERS.has(item.toLowerCase())) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    todos.push(item);
  }
  return todos;
}

/** Collapse stray blank lines and trim a free-text result (summary/proofread). */
export function cleanText(text: string): string {
  return toLines(text).join('\n');
}
