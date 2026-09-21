// Chamadas à API de dados do Conta Azul (separado de oauth.js, que cuida só
// da autenticação). Sempre recebe um access_token já válido — quem decide
// se precisa renovar é quem chama estas funções.

const BASE_URL = "https://api-v2.contaazul.com/v1";
const TAMANHO_PAGINA = 200; // maior página aceita nos testes; suficiente pra não precisar paginar na prática

// Cache das respostas do Conta Azul (Cache API do Cloudflare), pra não bater
// na API deles — que leva de 0,5 a 2 s por chamada — a cada abertura de tela
// ou troca de período. A chave inclui um hash do access_token, então cada
// cliente tem o seu cache e um cliente nunca enxerga dado de outro. Só guarda
// respostas de sucesso. Dado novo no Conta Azul pode levar até este tempo pra
// aparecer no dashboard.
const CACHE_TTL_SEGUNDOS = 180;

async function chaveCache(url, accessToken) {
  const bytes = new TextEncoder().encode(accessToken);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const id = [...new Uint8Array(hash)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
  return new Request(`https://cache.lucri.internal/${id}?u=${encodeURIComponent(url.toString())}`);
}

// `cache: false` pra dado que precisa ser "de agora" (ex.: saldo em conta).
async function chamarApi(path, accessToken, params = {}, { cache = true } = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [chave, valor] of Object.entries(params)) {
    url.searchParams.set(chave, valor);
  }

  const usaCache = cache && typeof caches !== "undefined";
  const chave = usaCache ? await chaveCache(url, accessToken) : null;
  if (usaCache) {
    const guardado = await caches.default.match(chave);
    if (guardado) return guardado.json();
  }

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error(`Conta Azul ${path} falhou: ${resp.status} ${await resp.text()}`);
  }

  const dados = await resp.json();
  if (usaCache) {
    await caches.default.put(
      chave,
      new Response(JSON.stringify(dados), {
        headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_TTL_SEGUNDOS}` },
      })
    );
  }
  return dados;
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
  const dados = await chamarApi(`/conta-financeira/${contaId}/saldo-atual`, accessToken, {}, { cache: false });
  return dados.saldo_atual;
}

// Estrutura oficial de DRE do cliente (grupos, subgrupos e quais categorias
// financeiras pertencem a cada um) — configurada no próprio Conta Azul,
// normalmente pelo contador da empresa. Não é uma lista paginada, é uma
// árvore só, por isso não usa chamarApiPaginado.
export function buscarEstruturaDre(accessToken) {
  return chamarApi("/financeiro/categorias-dre", accessToken);
}
