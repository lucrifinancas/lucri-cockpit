// Mantém as duas bases da API: saídas totais e despesas classificadas.
// `despesas[].valor` já foi normalizado para valor_pago no hook financeiro.
export function buildSaidasView({ saidas, despesas = [] }, expensesOnly) {
  const lancamentos = expensesOnly
    ? despesas
    : (saidas?.lancamentos ?? []).map((item) => ({ ...item, valor: item.valor_pago }));
  return {
    lancamentos,
    total: expensesOnly
      ? despesas.reduce((sum, item) => sum + item.valor, 0)
      : saidas?.totais?.pago?.valor ?? 0,
  };
}

export function legacyExpensesLocation(search) {
  const params = new URLSearchParams(search);
  params.set('visao', 'despesas');
  return `/saidas?${params}`;
}
