import test from 'node:test';
import assert from 'node:assert/strict';
import { listarHistoricoMensal } from '../src/db/historicoMensal.js';

test('distingue mês calculado com zero de mês sem cálculo e mantém escopo da consulta', async () => {
  let bound;
  const DB = { prepare(sql) {
    assert.match(sql, /WHERE cliente_id = \?/);
    return {
      bind(...args) { bound = args; return this; },
      async all() { return { results: [{ mes: '2026-09', receitas: 0, despesas: 0, vencidas: 0 }] }; },
    };
  } };
  const result = await listarHistoricoMensal(DB, 7, ['2026-09', '2026-10']);
  assert.deepEqual(bound, [7, '2026-09', '2026-10']);
  assert.equal(result[0].disponivel, true);
  assert.equal(result[1].disponivel, false);
  assert.equal(result[1].mes, '2026-10');
});
