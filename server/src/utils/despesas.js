// Regra das despesas do dashboard: toda categoria do Conta Azul do tipo DESPESA
// conta, agrupada pela mãe do grupo dela (o master nomeia cada grupo em
// Ajustes); a despesa original (subcategoria) fica guardada pra abrir dentro da
// mãe. Categoria de um grupo ainda sem nome cai em "Sem mãe" — aparece na Home
// em vez de sumir, pra o total nunca ficar errado em silêncio.
//
// `idsDespesa`: Set com os ids das categorias do tipo DESPESA.
// `maePorCategoria`: Map(categoria_id -> { mae_nome }), com `mae_nome` nulo
// quando o grupo da categoria ainda não foi nomeado.
export const SEM_MAE = "Sem mãe";

export function classificarDespesas(lancamentos, idsDespesa, maePorCategoria) {
  return lancamentos
    .filter((item) => item.categoria_id && idsDespesa.has(item.categoria_id))
    .map((item) => {
      const mae = maePorCategoria.get(item.categoria_id)?.mae_nome ?? null;
      return { ...item, subcategoria: item.categoria, mae, categoria: mae ?? SEM_MAE };
    });
}

// Automático por padrão (tipo=DESPESA do Conta Azul), mas o master pode
// sobrescrever categoria a categoria em Ajustes (`overrides`, vindo de
// categoria_despesa — ver categoriaDespesa.js). Sem nenhum override salvo
// pro cliente, o comportamento é idêntico a antes.
export function idsDeDespesa(categorias, overrides = new Map()) {
  const ids = new Set();
  for (const cat of categorias) {
    const override = overrides.get(cat.id);
    const conta = override !== undefined ? override : cat.tipo === "DESPESA";
    if (conta) ids.add(cat.id);
  }
  return ids;
}
