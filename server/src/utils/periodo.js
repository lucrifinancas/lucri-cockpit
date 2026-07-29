// Resolve o período (de/até) de uma requisição: usa o que vier na URL,
// ou cai no mês atual como padrão.

export function resolverPeriodo(c) {
  const de = c.req.query("de");
  const ate = c.req.query("ate");
  if (de && ate) return { de, ate };

  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const formatar = (d) => d.toISOString().slice(0, 10);
  return { de: formatar(primeiroDia), ate: formatar(ultimoDia) };
}
