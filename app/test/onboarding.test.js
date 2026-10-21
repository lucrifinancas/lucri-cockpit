import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryProgress, onboardingSteps } from '../src/data/onboarding.js';

const client = { id: 7, nome: 'Empresa', conta_azul_conectado: false, usuarios: 0, convites: 0 };
test('cadastro isolado não conclui conexão, categorias ou acesso', () => {
  assert.deepEqual(onboardingSteps(client).map((step) => step.complete), [true, false, false, false]);
});
test('convite autorizado não equivale a usuário com acesso', () => {
  const steps = onboardingSteps({ ...client, convites: 1 });
  assert.equal(steps[3].complete, false);
  assert.match(steps[3].status, /aguardando primeiro acesso/);
  assert.equal(onboardingSteps({ ...client, usuarios: 1 })[3].complete, true);
});
test('categorias consideram o mapeamento específico de receitas e despesas', () => {
  const categories = [
    { tipo: 'DESPESA', mae_id: 1 },
    { tipo: 'RECEITA', mae_id: 1, mae_receita_id: null },
    { tipo: 'OUTRO', mae_id: null },
  ];
  assert.deepEqual(categoryProgress(categories), { total: 2, classified: 1, complete: false });
  categories[1].mae_receita_id = 2;
  assert.equal(categoryProgress(categories).complete, true);
});
test('lista vazia e consulta não realizada não concluem classificação', () => {
  assert.equal(categoryProgress([]).complete, false);
  assert.equal(onboardingSteps({ ...client, conta_azul_conectado: true })[2].complete, false);
});
test('checklist completo exige todas as etapas verificáveis', () => {
  const steps = onboardingSteps({ ...client, conta_azul_conectado: true, usuarios: 1 }, [{ tipo: 'RECEITA', mae_receita_id: 5 }]);
  assert.equal(steps.filter((step) => step.complete).length, 4);
  assert.match(steps[1].status, /verificar o acesso/);
});
