// Login com Google — alternativa sem senha pra contas que o master já
// cadastrou (não cria conta nova sozinho, só autentica quem já existe).

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function gerarUrlAutorizacaoGoogle(env, state) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function obterUsuarioGoogle(env, code) {
  const respToken = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!respToken.ok) {
    throw new Error(`Falha ao trocar code do Google: ${respToken.status} ${await respToken.text()}`);
  }
  const tokens = await respToken.json();

  const respUsuario = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!respUsuario.ok) {
    throw new Error(`Falha ao buscar dados do usuário Google: ${respUsuario.status}`);
  }
  const dados = await respUsuario.json();

  return {
    email: dados.email,
    nome: dados.name,
    emailVerificado: dados.email_verified,
  };
}
