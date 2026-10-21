import test from 'node:test';
import assert from 'node:assert/strict';
import { dreComparisonRange, parseDre, compareDreRows, netRevenue, dreMargin, dreReading } from '../src/data/dreComparison.js';

const current = { resultado_final: 28000, linhas: [
  { codigo: '1', descricao: 'Receitas', valor: 110000, subitens: [{ codigo: '1.1', descricao: 'Vendas', valor: 110000 }] },
  { codigo: '2', descricao: 'Deduções', valor: -10000 },
  { codigo: '3', descricao: 'Receita Líquida', totalizador: true, valor: 100000 },
  { codigo: '4', descricao: 'Custos', valor: -40000 },
  { codigo: '5', descricao: 'Despesas operacionais', valor: -30000 },
  { codigo: '6', descricao: 'Resultado financeiro', valor: -2000 },
] };
const previous = { resultado_final: 21000, linhas: current.linhas.map((row) => ({ ...row, valor: ({ 1: 100000, 2: -10000, 3: 90000, 4: -36000, 5: -30000, 6: -3000 })[row.codigo] })) };
test('mês fechado compara com mês calendário anterior, inclusive fevereiro', () => {
  assert.deepEqual(dreComparisonRange({ start: '2026-09-01', end: '2026-09-30' }, 'mes-especifico'), { start: '2026-08-01', end: '2026-08-31' });
  assert.deepEqual(dreComparisonRange({ start: '2024-03-01', end: '2024-03-31' }, 'mes'), { start: '2024-02-01', end: '2024-02-29' });
});
test('mês aberto e intervalos personalizados usam janela anterior com mesma duração', () => {
  assert.deepEqual(dreComparisonRange({ start: '2026-10-01', end: '2026-10-21' }, 'mes'), { start: '2026-09-10', end: '2026-09-30' });
  assert.equal(dreComparisonRange({ start: null, end: null }, 'todos'), null);
});
test('comparação usa código da linha e não posição no array', () => {
  const result = compareDreRows(current.linhas, [...previous.linhas].reverse());
  assert.equal(result[0].previous, 100000);
  assert.equal(result[0].delta, 10000);
  assert.equal(result[3].delta, -4000);
  assert.equal(result[0].children[0].previous, 110000);
});
test('linhas ausentes ou novas não viram zero nem geram variação inventada', () => {
  const rows = compareDreRows([{ codigo: 'a', descricao: 'Nova', valor: 10 }], [{ codigo: 'b', descricao: 'Antiga', valor: 20 }]);
  assert.equal(rows[0].previous, null);
  assert.equal(rows[0].delta, null);
  assert.equal(rows[1].current, null);
  assert.equal(rows[1].previousOnly, true);
  assert.equal(rows[1].delta, null);
});
test('grupos diferentes não misturam subitens com o mesmo código', () => {
  const rows = [{ codigo: 'a', descricao: 'A', valor: 1, subitens: [{ codigo: '1', descricao: 'Sub', valor: 1 }] }, { codigo: 'b', descricao: 'B', valor: 2, subitens: [{ codigo: '1', descricao: 'Sub', valor: 2 }] }];
  const result = compareDreRows(rows, rows);
  assert.equal(result[0].children[0].previous, 1);
  assert.equal(result[1].children[0].previous, 2);
});
test('receita líquida vem do subtotal oficial e margem exige base positiva', () => {
  assert.equal(netRevenue(current), 100000);
  assert.ok(Math.abs(dreMargin(current.resultado_final, netRevenue(current)) - 28) < 1e-10);
  assert.equal(netRevenue({ linhas: [{ descricao: 'Receita bruta', valor: 1000 }] }), null);
  assert.equal(dreMargin(100, 0), null);
  assert.equal(dreMargin(100, -500), null);
  assert.equal(dreMargin(undefined, 500), null);
});
test('leitura automática descreve números sem atribuir causa não demonstrada', () => {
  const reading = dreReading(current, previous);
  assert.match(reading.text, /aumentou R\$\s7\.000,00/);
  assert.match(reading.text, /receita líquida aumentou/);
  assert.match(reading.attention, /Receitas/);
  assert.match(dreReading(current, null).text, /quando houver dados/);
});
test('resposta malformada ou valores ausentes são erros de consulta', () => {
  assert.equal(parseDre(current), current);
  assert.throws(() => parseDre({ ...current, resultado_final: null }), /inválida/);
  assert.throws(() => parseDre({ ...current, linhas: [{ descricao: 'Receita', valor: null }] }), /inválida/);
});
