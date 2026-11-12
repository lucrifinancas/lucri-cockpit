export const AUDIT_LABELS = {
  mapeamento_despesas: 'Classificação de despesas', mapeamento_receitas: 'Classificação de receitas',
  grupo_despesa_criado: 'Grupo de despesas criado', grupo_receita_criado: 'Grupo de receitas criado',
  grupo_despesa_removido: 'Grupo de despesas removido', grupo_receita_removido: 'Grupo de receitas removido',
  grupos_contas_pagar: 'Grupos de contas a pagar',
  nomes_categorias_pai: 'Nomes das categorias de origem',
};

function mappingLabel(item, expense) {
  const group = item?.mae_nome ?? (item?.mae_id ? `Grupo #${item.mae_id}` : 'Sem categoria');
  return expense ? `${group} · ${!item ? 'Regra automática' : item.is_despesa ? 'Conta como despesa' : 'Fora das despesas'}` : group;
}

export function auditChanges(record) {
  if (record.acao.startsWith('mapeamento_')) {
    const before = new Map((record.antes ?? []).map(item => [item.categoria_id, item]));
    const after = new Map((record.depois ?? []).map(item => [item.categoria_id, item]));
    return [...new Set([...before.keys(), ...after.keys()])].flatMap(id => {
      const previous = before.get(id), next = after.get(id);
      const state = item => item ? [item.mae_id, item.mae_nome, item.is_despesa] : null;
      return JSON.stringify(state(previous)) === JSON.stringify(state(next)) ? [] : [{
        id, nome: next?.categoria_nome ?? previous?.categoria_nome ?? id,
        antes: mappingLabel(previous, record.acao === 'mapeamento_despesas'),
        depois: mappingLabel(next, record.acao === 'mapeamento_despesas'),
      }];
    });
  }
  if (record.acao === 'grupos_contas_pagar' || record.acao === 'nomes_categorias_pai') {
    const before = new Map((record.antes ?? []).map(item => [item.id, item]));
    const after = new Map((record.depois ?? []).map(item => [item.id, item]));
    return [...new Set([...before.keys(), ...after.keys()])].filter(id => record.acao === 'nomes_categorias_pai' ? before.get(id)?.nome !== after.get(id)?.nome : before.has(id) !== after.has(id)).map(id => ({
      id, nome: (after.get(id) ?? before.get(id)).nome,
      antes: record.acao === 'nomes_categorias_pai' ? before.get(id)?.nome ?? 'Sem nome' : before.has(id) ? 'Incluído em contas a pagar' : 'Fora de contas a pagar',
      depois: record.acao === 'nomes_categorias_pai' ? after.get(id)?.nome ?? 'Sem nome' : after.has(id) ? 'Incluído em contas a pagar' : 'Fora de contas a pagar',
    }));
  }
  return [{ id: record.evento_id, nome: record.depois?.nome ?? record.antes?.nome ?? 'Grupo',
    antes: record.antes?.nome ?? 'Não existia', depois: record.depois?.nome ?? 'Removido' }];
}
