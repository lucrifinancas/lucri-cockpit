// Chamadas à API de dados do Conta Azul (separado de oauth.js, que cuida só
// da autenticação). Sempre recebe um access_token já válido — quem decide
// se precisa renovar é quem chama estas funções.

const BASE_URL = "https://api-v2.contaazul.com/v1";
const TAMANHO_PAGINA = 200; // maior página aceita nos testes; suficiente pra não precisar paginar na prática

async function chamarApi(path, accessToken, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [chave, valor] of Object.entries(params)) {
    url.searchParams.set(chave, valor);
  }

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error(`Conta Azul ${path} falhou: ${resp.status} ${await resp.text()}`);
  }

  return resp.json();
}

// O Conta Azul pagina as listas por padrão (10 itens por página, mesmo
// quando `itens_totais` é maior) — sem isso, listas com mais de 10
// lançamentos ficavam silenciosamente cortadas. Busca todas as páginas
// necessárias e junta num só resultado, mantendo os outros campos
// (ex.: `totais`) da primeira resposta.
async function chamarApiPaginado(path, accessToken, params = {}) {
  const primeira = await chamarApi(path, accessToken, { ...params, tamanho_pagina: TAMANHO_PAGINA, pagina: 1 });

  const itens = [...primeira.itens];
  let pagina = 2;
  while (itens.length < primeira.itens_totais) {
    const proxima = await chamarApi(path, accessToken, { ...params, tamanho_pagina: TAMANHO_PAGINA, pagina });
    if (!proxima.itens?.length) break; // segurança contra loop infinito se a API parar de devolver itens
    itens.push(...proxima.itens);
    pagina++;
  }

  return { ...primeira, itens };
}

export function buscarContasAPagar(accessToken, { de, ate }) {
  return chamarApiPaginado("/financeiro/eventos-financeiros/contas-a-pagar/buscar", accessToken, {
    data_vencimento_de: de,
    data_vencimento_ate: ate,
  });
}

export function buscarContasAReceber(accessToken, { de, ate }) {
  return chamarApiPaginado("/financeiro/eventos-financeiros/contas-a-receber/buscar", accessToken, {
    data_vencimento_de: de,
    data_vencimento_ate: ate,
  });
}

export function buscarContasBancarias(accessToken) {
  return chamarApiPaginado("/conta-financeira", accessToken);
}

export function buscarCategorias(accessToken) {
  return chamarApiPaginado("/categorias", accessToken);
}

export async function buscarSaldoConta(accessToken, contaId) {
  const dados = await chamarApi(`/conta-financeira/${contaId}/saldo-atual`, accessToken);
  return dados.saldo_atual;
}
