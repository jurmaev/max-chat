const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const dayWithYearFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });

const startOfDay = (ts: number) => new Date(ts).setHours(0, 0, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

export const formatTime = (ts: number) => timeFormat.format(ts);

export const dayKey = (ts: number) => startOfDay(ts);

export function formatDay(ts: number): string {
  const diff = startOfDay(Date.now()) - startOfDay(ts);
  if (diff === 0) return 'Сегодня';
  if (diff === DAY) return 'Вчера';
  return new Date(ts).getFullYear() === new Date().getFullYear()
    ? dayFormat.format(ts)
    : dayWithYearFormat.format(ts);
}

/** Время для списка чатов: сегодня — часы, раньше — дата. */
export function formatListTime(ts: number): string {
  return startOfDay(ts) === startOfDay(Date.now()) ? formatTime(ts) : shortDateFormat.format(ts);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (/^\+?\d/.test(parts[0])) return name.replace(/\D/g, '').slice(-2);
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}
