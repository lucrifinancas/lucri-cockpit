// Uma única fonte de verdade pra "essa origem pode falar com a API" — usada
// tanto pelo CORS (o que o navegador deixa o front LER) quanto pelo guard de
// CSRF (o que o backend deixa EXECUTAR). Antes essa lista vivia só dentro do
// cors() do index.js, e localhost/rede local ficavam liberados mesmo em
// produção. Ver RELATORIO-SEGURANCA-2026-09-24.md, achados 1 e 5.
const LOCALHOST = /^http:\/\/localhost:\d+$/;
const REDE_LOCAL = /^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+:\d+$/;

export function origemPermitida(origin, env, ehHttps) {
  if (!origin) return false;
  if (origin === env.APP_URL) return true;

  // Localhost/rede local só valem em desenvolvimento (requisição chegando
  // via http). Em produção (https), mesmo que alguém finja falar de
  // localhost no cabeçalho Origin, não é aceito — só a origem oficial.
  if (ehHttps) return false;

  return LOCALHOST.test(origin) || REDE_LOCAL.test(origin);
}
