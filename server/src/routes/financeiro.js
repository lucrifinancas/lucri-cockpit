import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { obterAccessTokenValido } from "../contaazul/tokenManager.js";
import { resolverPeriodo } from "../utils/periodo.js";
import { buscarContasAPagar, buscarContasAReceber } from "../contaazul/api.js";
import { normalizarLancamento } from "../contaazul/normalizar.js";
import { listarCategoriaIdsDespesa } from "../db/categoriaDespesa.js";

export const financeiroRoutes = new Hono();

financeiroRoutes.get("/:clienteId/entradas", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const { de, ate } = resolverPeriodo(c);

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const dados = await buscarContasAReceber(accessToken, { de, ate });

  return c.json({
    periodo: { de, ate },
    totais: dados.totais,
    lancamentos: dados.itens.map((item) => normalizarLancamento(item, "entrada")),
  });
});

financeiroRoutes.get("/:clienteId/saidas", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const { de, ate } = resolverPeriodo(c);

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const dados = await buscarContasAPagar(accessToken, { de, ate });

  return c.json({
    periodo: { de, ate },
    totais: dados.totais,
    lancamentos: dados.itens.map((item) => normalizarLancamento(item, "saida")),
  });
});

financeiroRoutes.get("/:clienteId/despesas", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const { de, ate } = resolverPeriodo(c);

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const [dados, categoriaIdsDespesa] = await Promise.all([
    buscarContasAPagar(accessToken, { de, ate }),
    listarCategoriaIdsDespesa(c.env.DB, clienteId),
  ]);

  const lancamentos = dados.itens
    .map((item) => normalizarLancamento(item, "saida"))
    .filter((item) => item.categoria_id && categoriaIdsDespesa.has(item.categoria_id));

  // Os `totais` do Conta Azul são de TODAS as saídas, não só das marcadas
  // como despesa — precisamos somar por conta própria a partir do filtro.
  const totalPago = lancamentos.reduce((soma, item) => soma + item.valor_pago, 0);

  return c.json({
    periodo: { de, ate },
    total_pago: totalPago,
    lancamentos,
  });
});

financeiroRoutes.get("/:clienteId/caixa", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const { de, ate } = resolverPeriodo(c);

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const [entradas, saidas] = await Promise.all([
    buscarContasAReceber(accessToken, { de, ate }),
    buscarContasAPagar(accessToken, { de, ate }),
  ]);

  const totalEntradasPago = entradas.totais.pago.valor;
  const totalSaidasPago = saidas.totais.pago.valor;

  return c.json({
    periodo: { de, ate },
    entradas: entradas.totais,
    saidas: saidas.totais,
    saldo_periodo: totalEntradasPago - totalSaidasPago,
  });
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function chaveMes(dataISO) {
  return dataISO.slice(0, 7); // "2026-08-15" -> "2026-08"
}

// Contas a receber vencidas, somadas por mês de vencimento — busca contas a
// receber numa janela larga (últimos N meses) numa chamada só, em vez de
// 1 chamada por mês, e agrupa localmente.
//
// NOTA: só cobre "vencidas por mês" por enquanto. Receitas x Despesas e
// Resultado histórico (lucro/prejuízo) dependem de Despesas, que outra
// pessoa está construindo em paralelo (categorização manual de categoria,
// ver DEMANDAS-PARA-FINALIZAR.md item 4) — não duplicar aqui, esperar
// aquilo terminar e então estender este endpoint com receitas/despesas.
financeiroRoutes.get("/:clienteId/historico-mensal", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const meses = Math.min(Math.max(Number(c.req.query("meses")) || 12, 1), 24);

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const hoje = new Date();
  const primeiroMes = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);
  const de = primeiroMes.toISOString().slice(0, 10);
  const ate = hoje.toISOString().slice(0, 10);
  const hojeISO = ate;

  const contasAReceber = await buscarContasAReceber(accessToken, { de, ate });

  const buckets = new Map();
  for (const item of contasAReceber.itens) {
    if ((item.nao_pago ?? 0) <= 0 || item.data_vencimento >= hojeISO) continue;
    const chave = chaveMes(item.data_vencimento);
    buckets.set(chave, (buckets.get(chave) ?? 0) + item.nao_pago);
  }

  const mesesLista = Array.from({ length: meses }, (_, i) => {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1 - i), 1);
    const chave = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
    return {
      mes: chave,
      label: MESES[ref.getMonth()],
      vencidas: buckets.get(chave) ?? 0,
    };
  });

  return c.json({ meses: mesesLista });
});
