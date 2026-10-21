import test from 'node:test';
import assert from 'node:assert/strict';
import { situacaoDe, correspondeSituacao, valorDaSituacao } from '../src/data/contasPagar.js';

const items = [
  { id: 1, valor: 100, valor_pago: 100, valor_em_aberto: 0, data_vencimento: '2026-10-20' },
  { id: 2, valor: 200, valor_pago: 50, valor_em_aberto: 150, data_vencimento: '2026-10-20' },
  { id: 3, valor: 300, valor_pago: 0, valor_em_aberto: 300, data_vencimento: '2026-10-21' },
  { id: 4, valor: 400, valor_pago: 0, valor_em_aberto: 400, data_vencimento: '2026-10-22' },
].map((item) => ({ ...item, situacao: situacaoDe(item, '2026-10-21') }));

test('total pago inclui parciais e reconcilia com a lista correspondente', () => {
  const list = items.filter((item) => correspondeSituacao(item, 'pago'));
  assert.deepEqual(list.map((item) => item.id), [1, 2]);
  assert.equal(list.reduce((sum, item) => sum + valorDaSituacao(item, 'pago'), 0), 150);
  assert.equal(items.reduce((sum, item) => sum + item.valor_pago, 0), 150);
});
test('situação mantém vencido parcial e separa hoje, futuro e quitado', () => {
  assert.deepEqual(items.map((item) => item.situacao), ['pago', 'vencido', 'hoje', 'avencer']);
  const vencidos = items.filter((item) => correspondeSituacao(item, 'vencido'));
  assert.equal(vencidos.reduce((sum, item) => sum + valorDaSituacao(item, 'vencido'), 0), 150);
});
test('total do período usa valor integral e filtro todos preserva títulos', () => {
  assert.equal(items.filter((item) => correspondeSituacao(item, 'todos')).length, 4);
  assert.equal(items.reduce((sum, item) => sum + valorDaSituacao(item, 'todos'), 0), 1000);
});
