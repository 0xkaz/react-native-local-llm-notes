import { Language } from '../settings/types';

const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Human-friendly timestamp for note lists. Pure and locale-table-free (so it is
 * deterministic under test). Defaults to Japanese; pass `'en'` for English.
 *   ja: "今日 HH:MM" / "M月D日 HH:MM" / "YYYY/M/D"
 *   en: "Today HH:MM" / "Mon D HH:MM" / "YYYY/M/D"
 */
export function formatTimestamp(
  ms: number,
  now: number = Date.now(),
  lang: Language = 'ja',
): string {
  const d = new Date(ms);
  const n = new Date(now);
  const pad = (x: number): string => String(x).padStart(2, '0');
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const sameDay =
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate();
  if (sameDay) return lang === 'en' ? `Today ${hm}` : `今日 ${hm}`;

  if (d.getFullYear() === n.getFullYear()) {
    return lang === 'en'
      ? `${EN_MONTHS[d.getMonth()]} ${d.getDate()} ${hm}`
      : `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
