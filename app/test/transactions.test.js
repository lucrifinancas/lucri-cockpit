import test from 'node:test';
import assert from 'node:assert/strict';
import { transactionItems, filterTransactions, matchesTransaction, transactionTotal } from '../src/data/transactions.js';

const titles = [
  { id: 1, descricao: 'Venda paga', valor: 100, valor_pago: 100, valor_em_aberto: 0, data_vencimento: '2026-10-01', categoria: 'Serviços', contraparte: 'Ana' },
  { id: 2, descricao: 'Venda parcial', valor: 200, valor_pago: 50, valor_em_aberto: 150, data_vencimento: '2026-10-20', categoria: 'Serviços', contraparte: 'Bruno' },
  { id: 3, descricao: 'Venda de hoje', valor: 300, valor_pago: 0, valor_em_aberto: 300, data_vencimento: '2026-10-21', categoria: 'Loja', contraparte: 'Ana' },
  { id: 4, descricao: 'Venda futura', valor: 400, valor_pago: 0, valor_em_aberto: 400, data_vencimento: '2026-10-22', categoria: 'Loja', contraparte: 'Ana' },
];
const items = transactionItems({ entradas: { lancamentos: titles } }, 'entrada', false, '2026-10-21');
test('cartões reconciliam total, realizado e valores em aberto por vencimento', () => {
  assert.equal(transactionTotal(items, 'todos'), 1000);
  assert.equal(transactionTotal(items, 'pago'), 150);
  assert.equal(transactionTotal(items, 'vencido'), 150);
  assert.equal(transactionTotal(items, 'hoje'), 300);
  assert.equal(transactionTotal(items, 'avencer'), 400);
  assert.equal(['pago', 'vencido', 'hoje', 'avencer'].reduce((sum, key) => sum + transactionTotal(items, key), 0), transactionTotal(items, 'todos'));
});
test('recebidos inclui parcial, que continua vencido quanto ao saldo restante', () => {
  assert.deepEqual(items.filter((item) => matchesTransaction(item, 'pago')).map((item) => item.id), [1, 2]);
  assert.deepEqual(items.filter((item) => matchesTransaction(item, 'vencido')).map((item) => item.id), [2]);
});
test('busca, categoria e pessoa compõem o mesmo recorte dos totais', () => {
  const filtered = filterTransactions(items, { search: 'VENDA', category: 'Serviços', counterpart: 'Bruno' });
  assert.deepEqual(filtered.map((item) => item.id), [2]);
  assert.equal(transactionTotal(filtered, 'pago'), 50);
  assert.equal(transactionTotal(filtered, 'todos'), 200);
});
test('despesa preserva total do título e valor pago como valores separados', () => {
  const expense = { ...titles[1], valor: 50, valor_titulo: 200, categoria: 'Operacionais', subcategoria: 'Serviços', mae: 'Operacionais' };
  const list = transactionItems({ saidas: { lancamentos: titles }, despesas: [expense] }, 'saida', true, '2026-10-21');
  assert.equal(list.length, 1);
  assert.equal(list[0].valor_total, 200);
  assert.equal(transactionTotal(list, 'pago'), 50);
  assert.equal(list[0].categoria_original, 'Serviços');
  assert.equal(list[0].categoria_principal, 'Operacionais');
  assert.equal(expense.valor, 50);
});
test('total desconhecido não é substituído pelo valor pago', () => {
  const list = transactionItems({ despesas: [{ ...titles[1], valor: 50 }] }, 'saida', true, '2026-10-21');
  assert.equal(transactionTotal(list, 'todos'), null);
  assert.equal(transactionTotal(list, 'pago'), 50);
});
test('consulta vazia tem totais zero e filtro sem resultados não reaproveita valores', () => {
  assert.equal(transactionTotal([], 'todos'), 0);
  assert.deepEqual(filterTransactions(items, { search: 'inexistente' }), []);
});
