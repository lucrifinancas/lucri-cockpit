import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularSaude, PESOS, FATORES } from '../src/data/financialHealth.js';

const base = { receitas: 1000, despesas: 500, saldo: 1000, inadimplenciaPct: 0, vencidas: 0, aReceberEmAberto: 0 };
test('sem movimentos não calcula nota mesmo com saldo disponível', () => {
  for (const saldo of [0, 1000, -1000]) {
    const result = calcularSaude({ ...base, receitas: 0, despesas: 0, saldo });
    assert.equal(result.score, null);
    assert.equal(result.partes, null);
    assert.equal(result.status, 'Sem dados suficientes');
  }
});
test('dados incompletos ou não finitos não geram nota', () => {
  for (const key of Object.keys(base)) {
    for (const value of [undefined, null, NaN, Infinity]) {
      assert.equal(calcularSaude({ ...base, [key]: value }).score, null);
    }
  }
});
test('fórmula vigente mantém pesos e nota de cenário saudável', () => {
  assert.equal(Object.values(PESOS).reduce((sum, peso) => sum + peso, 0), 1);
  assert.deepEqual(FATORES.map((item) => item.id).sort(), Object.keys(PESOS).sort());
  const result = calcularSaude(base);
  assert.equal(result.score, 100);
  assert.equal(result.status, 'Boa');
});
test('faixas de cobertura seguem os limites publicados', () => {
  for (const [saldo, expected] of [[500, 100], [250, 75], [125, 50], [1, 25], [0, 0], [-10, 0]]) {
    assert.equal(calcularSaude({ ...base, saldo }).partes.cobertura, expected);
  }
});
test('faixas de recebimentos seguem os limites publicados', () => {
  for (const [inadimplenciaPct, expected] of [[0, 100], [5, 80], [10, 60], [20, 30], [21, 0]]) {
    assert.equal(calcularSaude({ ...base, inadimplenciaPct }).partes.inadimplencia, expected);
  }
  for (const [vencidas, expected] of [[0, 100], [10, 70], [25, 40], [26, 0]]) {
    assert.equal(calcularSaude({ ...base, vencidas, aReceberEmAberto: 100 }).partes.vencidas, expected);
  }
});
test('receita zero com despesa e resultado equilibrado têm diagnóstico coerente', () => {
  const negativo = calcularSaude({ ...base, receitas: 0 });
  assert.equal(negativo.partes.resultado, 0);
  assert.match(negativo.headline, /está negativo/);
  const equilibrado = calcularSaude({ ...base, receitas: 500 });
  assert.equal(equilibrado.partes.resultado, 100);
  assert.match(equilibrado.headline, /equilibradas/);
  const semDespesas = calcularSaude({ ...base, despesas: 0 });
  assert.match(semDespesas.summary, /nenhuma despesa/);
});
test('score corresponde à soma ponderada arredondada', () => {
  const result = calcularSaude({ ...base, receitas: 200, saldo: 150, inadimplenciaPct: 15, vencidas: 25, aReceberEmAberto: 100 });
  const expected = Math.round(Object.entries(PESOS).reduce((sum, [key, weight]) => sum + result.partes[key] * weight, 0));
  assert.equal(result.score, expected);
  assert.ok(result.score >= 0 && result.score <= 100);
});
