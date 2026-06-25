import { parseTodos, cleanText, stripBullet, toLines } from '../src/core/llm/parse';

describe('parse helpers', () => {
  test('toLines trims and drops blanks', () => {
    expect(toLines('  a \n\n b  \n')).toEqual(['a', 'b']);
  });

  test('stripBullet removes various markers', () => {
    expect(stripBullet('- item')).toBe('item');
    expect(stripBullet('* item')).toBe('item');
    expect(stripBullet('・item')).toBe('item');
    expect(stripBullet('1. item')).toBe('item');
    expect(stripBullet('2) item')).toBe('item');
    expect(stripBullet('plain')).toBe('plain');
  });
});

describe('parseTodos', () => {
  test('parses bulleted list', () => {
    const out = parseTodos('- 資料を作成\n- 会議を設定\n- レビュー依頼');
    expect(out).toEqual(['資料を作成', '会議を設定', 'レビュー依頼']);
  });

  test('handles mixed bullet styles and noise', () => {
    const out = parseTodos('1. A\n\n・B\n* A');
    expect(out).toEqual(['A', 'B']);
  });

  test('returns empty array for "none" markers', () => {
    expect(parseTodos('(なし)')).toEqual([]);
    expect(parseTodos('none')).toEqual([]);
    expect(parseTodos('')).toEqual([]);
  });
});

describe('cleanText', () => {
  test('collapses stray blank lines', () => {
    expect(cleanText('line1\n\n\nline2\n')).toBe('line1\nline2');
  });
});
