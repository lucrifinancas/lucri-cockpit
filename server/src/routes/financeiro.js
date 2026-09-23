import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { obterAccessTokenValido } from "../contaazul/tokenManager.js";
import { resolverPeriodo } from "../utils/periodo.js";
import {
  buscarContasAPagar,
  buscarContasAReceber,
  buscarEstruturaDre,
  buscarCategorias,
  buscarContasBancarias,
  buscarSaldoConta,
} from "../contaazul/api.js";
import { normalizarLancamento } from "../contaazul/normalizar.js";
import { montarDre } from "../contaazul/dre.js";
import { listarOverridesDespesa, listarMaesPorCategoria } from "../db/categoriaDespesa.js";
import { classificarDespesas, idsDeDespesa } from "../utils/despesas.js";
import { ultimosMeses } from "../contaazul/historico.js";
import { listarHistoricoMensal } from "../db/historicoMensal.js";

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

  const [dados, categorias, maePorCategoria, overridesDespesa] = await Promise.all([
    buscarContasAPagar(accessToken, { de, ate }),
    buscarCategorias(accessToken),
    listarMaesPorCategoria(c.env.DB, clienteId),
    listarOverridesDespesa(c.env.DB, clienteId),
  ]);

  // A categoria master é escolhida pelo master por despesa individual em
  // Ajustes (não pelo agrupamento do Conta Azul, que mistura categorias sem
  // relação entre si). Despesa ainda sem categoria master cai em "Sem mãe".

  // Toda categoria de despesa conta, agrupada pela categoria master (ex:
  // "Despesas Administrativas"), com a despesa original em `subcategoria`.
  // Sem categoria master: "Sem mãe".
  const lancamentos = classificarDespesas(
    dados.itens.map((item) => normalizarLancamento(item, "saida")),
    idsDeDespesa(categorias.itens, overridesDespesa),
    maePorCategoria
  );

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

// DRE completo, usando a estrutura oficial (grupos/subgrupos) que já vem
// configurada no Conta Azul pra esse cliente — não é uma regra nossa,
// é a árvore contábil de verdade, com cada categoria já encaixada no
// lugar certo (ver DECISOES-E-ESCOPO.md e API-CONTRACT.md).
financeiroRoutes.get("/:clienteId/dre", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const { de, ate } = resolverPeriodo(c);

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const [estrutura, contasAPagar, contasAReceber] = await Promise.all([
    buscarEstruturaDre(accessToken),
    buscarContasAPagar(accessToken, { de, ate }),
    buscarContasAReceber(accessToken, { de, ate }),
  ]);

  // Cada categoria já entra com o sinal certo: contas a receber somam
  // positivo, contas a pagar somam negativo — regime de caixa (valor_pago).
  const valorPorCategoria = new Map();
  for (const item of contasAPagar.itens) {
    const l = normalizarLancamento(item, "saida");
    if (!l.categoria_id) continue;
    valorPorCategoria.set(l.categoria_id, (valorPorCategoria.get(l.categoria_id) ?? 0) - l.valor_pago);
  }
  for (const item of contasAReceber.itens) {
    const l = normalizarLancamento(item, "entrada");
    if (!l.categoria_id) continue;
    valorPorCategoria.set(l.categoria_id, (valorPorCategoria.get(l.categoria_id) ?? 0) + l.valor_pago);
  }

  const dre = montarDre(estrutura, valorPorCategoria);

  return c.json({ periodo: { de, ate }, ...dre });
});

// Balanço SIMPLIFICADO (financeiro) — não é um balanço patrimonial contábil
// completo. Decisão fechada em 22/09 depois de conversa com o dev e a
// contadora: ela não usa o Balanço vindo do Conta Azul (o dela vem de outro
// sistema contábil), e a própria API não expõe saldo patrimonial (imobilizado,
// capital social, lucros acumulados) — só saldo bancário e contas a pagar/
// receber. Então aqui só dá pra montar: Ativo circulante disponível (saldo
// bancário) + realizável (a receber em aberto) vs. Passivo circulante
// (a pagar em aberto). Sem Patrimônio Líquido real (ver API-CONTRACT.md).
//
// Diferente de /dre e /caixa, não tem "período" escolhido pelo usuário — é
// uma foto de agora, soma de tudo que ainda está em aberto. Busca numa
// janela larga (2 anos pra trás, 1 ano pra frente) pra não perder título
// antigo em atraso nem título futuro já lançado, já que o endpoint do Conta
// Azul exige um intervalo de data de vencimento pra filtrar.
financeiroRoutes.get("/:clienteId/balanco", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const hoje = new Date();
  const de = new Date(hoje.getFullYear() - 2, hoje.getMonth(), hoje.getDate()).toISOString().slice(0, 10);
  const ate = new Date(hoje.getFullYear() + 1, hoje.getMonth(), hoje.getDate()).toISOString().slice(0, 10);

  const [contasAPagar, contasAReceber, contasBancarias] = await Promise.all([
    buscarContasAPagar(accessToken, { de, ate }),
    buscarContasAReceber(accessToken, { de, ate }),
    buscarContasBancarias(accessToken),
  ]);

  const contasAtivas = contasBancarias.itens.filter((conta) => conta.ativo);
  const saldos = await Promise.all(contasAtivas.map((conta) => buscarSaldoConta(accessToken, conta.id)));
  const disponivel = saldos.reduce((soma, saldo) => soma + saldo, 0);

  const realizavel = contasAReceber.itens.reduce((soma, item) => soma + (item.nao_pago ?? 0), 0);
  const passivoCirculante = contasAPagar.itens.reduce((soma, item) => soma + (item.nao_pago ?? 0), 0);

  return c.json({
    gerado_em: hoje.toISOString().slice(0, 10),
    ativo: {
      disponivel,
      realizavel,
      total: disponivel + realizavel,
    },
    passivo_circulante: passivoCirculante,
    saldo: disponivel + realizavel - passivoCirculante,
  });
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Histórico dos últimos N meses — Receitas x Despesas, Resultado
// (lucro/prejuízo) e Contas a receber vencidas. Lê de `historico_mensal`
// (pré-computado por src/cron/historico.js), não mais ao vivo na Conta
// Azul: buscar 12 meses de contas a pagar/receber numa invocação só
// estourava o limite de subrequisições do Worker pra cliente com bastante
// lançamento (ver CHECKLIST-V1.0.md, achado de 23/09). Só os últimos 12
// meses têm cron rodando; pedir mais que isso devolve zero nos meses mais
// antigos em vez de calcular na hora.
financeiroRoutes.get("/:clienteId/historico-mensal", exigirPapel("master", "analista"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const meses = Math.min(Math.max(Number(c.req.query("meses")) || 12, 1), 24);

  const mesesChaves = ultimosMeses(meses);
  const historico = await listarHistoricoMensal(c.env.DB, clienteId, mesesChaves);

  const mesesLista = historico.map((h) => {
    const [, mesNum] = h.mes.split("-").map(Number);
    return {
      mes: h.mes,
      label: MESES[mesNum - 1],
      receitas: h.receitas,
      despesas: h.despesas,
      resultado: h.receitas - h.despesas,
      vencidas: h.vencidas,
    };
  });

  return c.json({ meses: mesesLista });
});
