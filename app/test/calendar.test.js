import test from 'node:test';
import assert from 'node:assert/strict';
import { moveCalendarDate, fullDateLabel } from '../src/data/calendar.js';

test('setas atravessam mês e ano e movem semanas completas', () => {
  assert.equal(moveCalendarDate('2026-12-31', 'ArrowRight'), '2027-01-01');
  assert.equal(moveCalendarDate('2026-03-01', 'ArrowLeft'), '2026-02-28');
  assert.equal(moveCalendarDate('2026-10-21', 'ArrowUp'), '2026-10-14');
  assert.equal(moveCalendarDate('2026-10-21', 'ArrowDown'), '2026-10-28');
});
test('Home e End vão para início e fim da semana', () => {
  assert.equal(moveCalendarDate('2026-10-21', 'Home'), '2026-10-18');
  assert.equal(moveCalendarDate('2026-10-21', 'End'), '2026-10-24');
});
test('PageUp e PageDown preservam dia possível em ano bissexto', () => {
  assert.equal(moveCalendarDate('2024-01-31', 'PageDown'), '2024-02-29');
  assert.equal(moveCalendarDate('2026-03-31', 'PageUp'), '2026-02-28');
  assert.equal(moveCalendarDate('2024-02-29', 'PageDown', true), '2025-02-28');
});
test('Tab e Enter mantêm comportamento nativo; nome contém dia, mês e ano', () => {
  assert.equal(moveCalendarDate('2026-10-21', 'Tab'), null);
  assert.equal(moveCalendarDate('2026-10-21', 'Enter'), null);
  assert.match(fullDateLabel('2026-10-21'), /quarta-feira.*21 de outubro de 2026/);
});
