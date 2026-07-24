// Tudo que fala com a API do Conta Azul fica isolado aqui — se um dia
// trocarmos de ERP ou o Conta Azul mudar o contrato deles, é só mexer neste
// arquivo, sem afetar o resto do backend.

const AUTH_URL = "https://auth.contaazul.com/login";
const TOKEN_URL = "https://auth.contaazul.com/oauth2/token";
const SCOPE = "openid profile aws.cognito.signin.user.admin";

export function gerarUrlAutorizacao(env, state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.CONTA_AZUL_CLIENT_ID,
    redirect_uri: env.CONTA_AZUL_REDIRECT_URI,
    scope: SCOPE,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function trocarCodePorToken(env, code) {
  const basic = btoa(`${env.CONTA_AZUL_CLIENT_ID}:${env.CONTA_AZUL_CLIENT_SECRET}`);

  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.CONTA_AZUL_REDIRECT_URI,
      client_id: env.CONTA_AZUL_CLIENT_ID,
      client_secret: env.CONTA_AZUL_CLIENT_SECRET,
    }),
  });

  if (!resp.ok) {
    const texto = await resp.text();
    throw new Error(`Falha ao trocar code por token: ${resp.status} ${texto}`);
  }

  const dados = await resp.json();
  return {
    accessToken: dados.access_token,
    refreshToken: dados.refresh_token,
    expiraEm: new Date(Date.now() + dados.expires_in * 1000).toISOString(),
  };
}

export async function renovarToken(env, refreshToken) {
  const basic = btoa(`${env.CONTA_AZUL_CLIENT_ID}:${env.CONTA_AZUL_CLIENT_SECRET}`);

  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.CONTA_AZUL_CLIENT_ID,
      client_secret: env.CONTA_AZUL_CLIENT_SECRET,
    }),
  });

  if (!resp.ok) {
    const texto = await resp.text();
    throw new Error(`Falha ao renovar token: ${resp.status} ${texto}`);
  }

  const dados = await resp.json();
  return {
    accessToken: dados.access_token,
    refreshToken: dados.refresh_token ?? refreshToken, // Conta Azul pode ou não devolver um novo refresh_token
    expiraEm: new Date(Date.now() + dados.expires_in * 1000).toISOString(),
  };
}
