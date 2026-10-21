import test from 'node:test';
import assert from 'node:assert/strict';
import { sortRows, pageRows, sumRows } from '../src/data/table.js';

test('ordena valores numericamente sem modificar a origem', () => {
  const rows = [{ id: 1, valor: 100 }, { id: 2, valor: 20 }, { id: 3, valor: 3 }];
  assert.deepEqual(sortRows(rows, 'valor', 'asc').map((row) => row.id), [3, 2, 1]);
  assert.deepEqual(sortRows(rows, 'valor', 'desc').map((row) => row.id), [1, 2, 3]);
  assert.deepEqual(rows.map((row) => row.id), [1, 2, 3]);
});
test('ordena datas civis e trata texto ausente', () => {
  const rows = [{ data: '2027-01-01' }, { data: '2026-12-31' }];
  assert.equal(sortRows(rows, 'data')[0].data, '2026-12-31');
  assert.equal(sortRows([{ descricao: 'Água' }, {}], 'descricao')[0].descricao, undefined);
});
test('paginação limita última página e trata resultado vazio', () => {
  const rows = Array.from({ length: 23 }, (_, id) => ({ id, valor: 1 }));
  const last = pageRows(rows, 99);
  assert.equal(last.current, 3);
  assert.equal(last.rows.length, 3);
  assert.equal(pageRows([], 2).current, 1);
  assert.equal(pageRows([], 2).rows.length, 0);
  assert.equal(sumRows(rows), 23, 'subtotal cobre todos os resultados, não só uma página');
});
test('subtotal do Caixa subtrai saídas e mantém negativos', () => {
  const rows = [{ direcao: 'Entrada', valor: 100 }, { direcao: 'Saída', valor: 120 }];
  assert.equal(sumRows(rows, true), -20);
  assert.equal(sumRows(rows), 220);
});
