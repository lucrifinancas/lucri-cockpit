import { addDays } from './period.js';

export function moveCalendarDate(iso, key, shift = false) {
  const date = new Date(`${iso}T00:00:00Z`);
  const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -date.getUTCDay(), End: 6 - date.getUTCDay() };
  if (key in offsets) return addDays(iso, offsets[key]);
  if (key === 'PageUp' || key === 'PageDown') {
    const offset = (key === 'PageUp' ? -1 : 1) * (shift ? 12 : 1);
    const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
    const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    first.setUTCDate(Math.min(date.getUTCDate(), lastDay));
    return first.toISOString().slice(0, 10);
  }
  return null;
}

export function fullDateLabel(iso) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
