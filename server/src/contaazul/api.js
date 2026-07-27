// Chamadas à API de dados do Conta Azul (separado de oauth.js, que cuida só
// da autenticação). Sempre recebe um access_token já válido — quem decide
// se precisa renovar é quem chama estas funções.

const BASE_URL = "https://api-v2.contaazul.com/v1";

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

export function buscarContasAPagar(accessToken, { de, ate }) {
  return chamarApi("/financeiro/eventos-financeiros/contas-a-pagar/buscar", accessToken, {
    data_vencimento_de: de,
    data_vencimento_ate: ate,
  });
}

export function buscarContasAReceber(accessToken, { de, ate }) {
  return chamarApi("/financeiro/eventos-financeiros/contas-a-receber/buscar", accessToken, {
    data_vencimento_de: de,
    data_vencimento_ate: ate,
  });
}

export function buscarContasBancarias(accessToken) {
  return chamarApi("/conta-financeira", accessToken);
}
