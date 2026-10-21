import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyHistory, historyForRequest, parseHistory } from '../src/data/history.js';

const month = { mes: '2026-10', label: 'out', receitas: 100, despesas: 50, resultado: 50, vencidas: 10, disponivel: true };
test('troca de empresa ou nova tentativa oculta imediatamente dados anteriores', () => {
  const state = { key: '[7,12,0]', data: [month], loading: false, error: null };
  assert.equal(historyForRequest(state, '[7,12,0]'), state);
  assert.deepEqual(historyForRequest(state, '[8,12,0]'), emptyHistory);
  assert.deepEqual(historyForRequest(state, '[7,12,1]'), emptyHistory);
});
test('resposta válida vazia difere de resposta inválida', () => {
  assert.deepEqual(parseHistory({ meses: [] }), []);
  for (const response of [null, {}, { meses: null }, { meses: [null] }, { meses: [{ ...month, receitas: null }] }]) {
    assert.throws(() => parseHistory(response), /inválida/);
  }
});
test('preserva mês sem cálculo e zero real como estados distintos', () => {
  const pending = { mes: '2026-09', label: 'set', disponivel: false };
  const zero = { ...month, receitas: 0, despesas: 0, resultado: 0, vencidas: 0 };
  assert.deepEqual(parseHistory({ meses: [pending, zero] }), [pending, zero]);
});
test('aceita contrato anterior para deploy independente do frontend', () => {
  const { disponivel, ...legacy } = month;
  assert.equal(disponivel, true);
  assert.deepEqual(parseHistory({ meses: [legacy] }), [legacy]);
});
