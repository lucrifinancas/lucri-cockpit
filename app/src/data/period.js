const DAY_MS = 86400000;

// Hoje no fuso do negócio, independente do fuso configurado no navegador.
export function todayISO(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

// UTC é usado apenas para aritmética de datas civis, sem hora local/DST.
export function addDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function monthRange(month) {
  const [year, number] = month.split('-').map(Number);
  return { start: `${month}-01`, end: new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10) };
}

export function resolveRange(preset, custom, month, now = new Date()) {
  const today = todayISO(now);
  if (['7d', '14d', '30d'].includes(preset)) {
    return { start: addDays(today, -(Number.parseInt(preset, 10) - 1)), end: today };
  }
  if (preset === 'mes') return { start: `${today.slice(0, 7)}-01`, end: today };
  if (preset === 'mes-especifico') return monthRange(month || today.slice(0, 7));
  if (preset === 'custom') return custom;
  return { start: null, end: null };
}

export function previousRange({ start, end }) {
  if (!start || !end || start > end) return null;
  const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS) + 1;
  return { start: addDays(start, -days), end: addDays(start, -1) };
}

export function formatRange({ start, end }) {
  if (!start || !end) return 'Todos os dados';
  const br = (date) => date.split('-').reverse().join('/');
  return `${br(start)} – ${br(end)}`;
}
