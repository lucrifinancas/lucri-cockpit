import { Hono } from "hono";
import { exigirPapel } from "../auth/guard.js";
import { obterAccessTokenValido } from "../contaazul/tokenManager.js";

export const debugRoutes = new Hono();

// TEMPORÁRIO — testando os parâmetros prováveis de NF-e/Contratos achados
// num projeto terceiro (douglac/contaazul-mcp), já que nosso token dava 400
// genérico sem dizer quais campos faltavam. Remover depois de resolvido.
debugRoutes.get("/:clienteId/debug-nfe-contratos", exigirPapel("master"), async (c) => {
  const clienteId = Number(c.req.param("clienteId"));
  const accessToken = await obterAccessTokenValido(c.env.DB, c.env, clienteId);
  if (!accessToken) {
    return c.json({ erro: "Cliente ainda não conectou o Conta Azul." }, 404);
  }

  const BASE_URL = "https://api-v2.contaazul.com/v1";

  const tentativas = [
    {
      nome: "notas-fiscais (sem params)",
      path: "/notas-fiscais",
      params: { tamanho_pagina: "10", pagina: "1" },
    },
    {
      nome: "notas-fiscais (data_emissao)",
      path: "/notas-fiscais",
      params: {
        tamanho_pagina: "10",
        pagina: "1",
        data_emissao_inicio: "2025-01-01",
        data_emissao_fim: "2026-09-10",
      },
    },
    {
      nome: "contratos (sem params)",
      path: "/contratos",
      params: { tamanho_pagina: "10", pagina: "1" },
    },
    {
      nome: "contratos (com status)",
      path: "/contratos",
      params: { tamanho_pagina: "10", pagina: "1", status: "ATIVO" },
    },
  ];

  const resultados = [];
  for (const tentativa of tentativas) {
    const url = new URL(`${BASE_URL}${tentativa.path}`);
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
        amostra: resp.ok ? corpo.itens?.[0] ?? null : null,
        erro: resp.ok ? null : corpo,
      });
    } catch (err) {
      resultados.push({ tentativa: tentativa.nome, erro: err.message });
    }
  }

  return c.json({ resultados });
});
