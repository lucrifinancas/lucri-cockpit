import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { obterAccessTokenValido } from "../contaazul/tokenManager.js";

export const debugRoutes = new Hono();

// TEMPORÁRIO — investigação da divergência entre nosso /entradas (filtra
// por data_vencimento) e o relatório nativo "Análise de recebimentos" do
// Conta Azul. Testa o mesmo endpoint com parâmetros de data alternativos
// pra descobrir se existe filtro por data de pagamento. Remover depois de
// resolvido (ver conversa com o Diogo, sessão 2026-09-10).
debugRoutes.get("/:clienteId/debug-filtro-data", exigirPapel("master"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const de = c.req.query("de");
  const ate = c.req.query("ate");

  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const BASE_URL = "https://api-v2.contaazul.com/v1";
  const path = "/financeiro/eventos-financeiros/contas-a-receber/buscar";

  // Candidatos de nome de parâmetro pra filtrar por data de pagamento —
  // não documentados, tentativa/erro contra a API real.
  const tentativas = [
    { nome: "data_vencimento (atual)", params: { data_vencimento_de: de, data_vencimento_ate: ate } },
    { nome: "data_pagamento", params: { data_pagamento_de: de, data_pagamento_ate: ate } },
    { nome: "data_recebimento", params: { data_recebimento_de: de, data_recebimento_ate: ate } },
    { nome: "data_baixa", params: { data_baixa_de: de, data_baixa_ate: ate } },
    { nome: "data_liquidacao", params: { data_liquidacao_de: de, data_liquidacao_ate: ate } },
    { nome: "data_competencia", params: { data_competencia_de: de, data_competencia_ate: ate } },
  ];

  const resultados = [];
  for (const tentativa of tentativas) {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("tamanho_pagina", "200");
    url.searchParams.set("pagina", "1");
    for (const [k, v] of Object.entries(tentativa.params)) url.searchParams.set(k, v);

    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const status = resp.status;
      const corpo = resp.ok ? await resp.json() : await resp.text();
      resultados.push({
        tentativa: tentativa.nome,
        params: tentativa.params,
        status,
        itens_totais: resp.ok ? corpo.itens_totais : null,
        totais: resp.ok ? corpo.totais : null,
        erro: resp.ok ? null : corpo,
      });
    } catch (err) {
      resultados.push({ tentativa: tentativa.nome, params: tentativa.params, erro: err.message });
    }
  }

  return c.json({ periodo: { de, ate }, resultados });
});
