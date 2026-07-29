// Traduz o formato bruto do Conta Azul pro formato que o resto do sistema
// usa — se um dia o Conta Azul mudar os nomes dos campos deles, só este
// arquivo precisa mudar.

export function normalizarLancamento(item, tipo) {
  const contraparte = tipo === "entrada" ? item.cliente : item.fornecedor;

  return {
    id: item.id,
    descricao: item.descricao,
    valor: item.total,
    valor_pago: item.pago,
    valor_em_aberto: item.nao_pago,
    status: item.status_traduzido,
    data_vencimento: item.data_vencimento,
    data_competencia: item.data_competencia,
    categoria: item.categorias?.[0]?.nome ?? null,
    contraparte: contraparte?.nome ?? null,
  };
}
