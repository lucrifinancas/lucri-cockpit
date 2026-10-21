import test from 'node:test';
import assert from 'node:assert/strict';
import { todayISO, resolveRange, previousRange, monthRange, formatRange } from '../src/data/period.js';

test('hoje segue São Paulo na virada do dia e do ano em UTC', () => {
  assert.equal(todayISO(new Date('2026-10-22T02:59:59Z')), '2026-10-21');
  assert.equal(todayISO(new Date('2026-10-22T03:00:00Z')), '2026-10-22');
  assert.equal(todayISO(new Date('2027-01-01T01:00:00Z')), '2026-12-31');
});
for (const days of [7, 14, 30]) {
  test(`${days} dias inclui hoje e mantém comparação adjacente com mesma duração`, () => {
    const now = new Date('2026-03-03T01:00:00Z');
    const range = resolveRange(`${days}d`, null, null, now);
    assert.equal(range.end, '2026-03-02');
    const duration = (r) => (Date.parse(r.end) - Date.parse(r.start)) / 86400000 + 1;
    assert.equal(duration(range), days);
    const previous = previousRange(range);
    assert.equal(duration(previous), days);
    assert.equal(Date.parse(range.start) - Date.parse(previous.end), 86400000);
  });
}
test('mês aberto usa hoje em São Paulo; mês fechado respeita ano bissexto', () => {
  assert.deepEqual(resolveRange('mes', null, null, new Date('2026-11-01T01:00:00Z')), { start: '2026-10-01', end: '2026-10-31' });
  assert.deepEqual(monthRange('2024-02'), { start: '2024-02-01', end: '2024-02-29' });
  assert.equal(monthRange('2026-02').end, '2026-02-28');
});
test('comparação atravessa mudança de ano e horário de verão sem alterar duração', () => {
  assert.deepEqual(previousRange({ start: '2026-01-01', end: '2026-01-07' }), { start: '2025-12-25', end: '2025-12-31' });
  assert.deepEqual(previousRange({ start: '2018-11-04', end: '2018-11-04' }), { start: '2018-11-03', end: '2018-11-03' });
});
test('personalizado preserva datas; todos não tem comparação; exibição tem anos completos', () => {
  const custom = { start: '2026-09-30', end: '2026-10-02' };
  assert.deepEqual(resolveRange('custom', custom), custom);
  assert.equal(previousRange(resolveRange('todos')), null);
  assert.equal(formatRange(custom), '30/09/2026 – 02/10/2026');
});
