import { formatTimestamp } from '../src/core/notes/format';

describe('formatTimestamp', () => {
  test('shows 今日 + time for the same day', () => {
    const t = new Date(2026, 5, 22, 16, 23).getTime();
    expect(formatTimestamp(t, t)).toBe('今日 16:23');
  });

  test('zero-pads hours and minutes', () => {
    const t = new Date(2026, 5, 22, 9, 5).getTime();
    expect(formatTimestamp(t, t)).toBe('今日 09:05');
  });

  test('shows month/day + time within the same year', () => {
    const created = new Date(2026, 5, 22, 9, 5).getTime();
    const now = new Date(2026, 7, 1, 0, 0).getTime();
    expect(formatTimestamp(created, now)).toBe('6月22日 09:05');
  });

  test('shows full date for a previous year', () => {
    const created = new Date(2025, 11, 31, 23, 59).getTime();
    const now = new Date(2026, 0, 1, 0, 0).getTime();
    expect(formatTimestamp(created, now)).toBe('2025/12/31');
  });
});
