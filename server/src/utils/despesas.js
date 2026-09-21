// Regra das despesas do dashboard: só entram as categorias marcadas (que têm
// mãe), e cada lançamento vem agrupado pela mãe do cliente, com a despesa
// (subcategoria do Conta Azul) preservada pra abrir dentro da mãe.
//
// `marcadas`: Map(categoria_id -> { mae_id, mae_nome }) — ver
// listarMaesPorCategoria. Linhas antigas, sem mãe, continuam entrando com o
// nome da própria categoria (comportamento de antes) até serem reeditadas.
export function classificarDespesas(lancamentos, marcadas) {
  return lancamentos
    .filter((item) => item.categoria_id && marcadas.has(item.categoria_id))
    .map((item) => {
      const { mae_nome: mae } = marcadas.get(item.categoria_id);
      return { ...item, subcategoria: item.categoria, mae: mae ?? null, categoria: mae ?? item.categoria };
    });
}
