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
