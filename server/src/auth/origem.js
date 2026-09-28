// Uma única fonte de verdade pra "essa origem pode falar com a API" — usada
// tanto pelo CORS (o que o navegador deixa o front LER) quanto pelo guard de
// CSRF (o que o backend deixa EXECUTAR). Antes essa lista vivia só dentro do
// cors() do index.js, e localhost/rede local ficavam liberados mesmo em
// produção. Ver RELATORIO-SEGURANCA-2026-09-24.md, achados 1 e 5.
const LOCALHOST = /^http:\/\/localhost:\d+$/;
const REDE_LOCAL = /^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+:\d+$/;
const HOST_LOCAL = /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

// Desenvolvimento = o próprio backend está rodando em localhost/rede local
// (wrangler dev). Olha o HOST da requisição, não o protocolo: o endereço
// publicado (workers.dev) também atende em http puro, e antes disso bastava
// chamar a API por http:// pra ela se comportar como se fosse dev.
export function ehDesenvolvimento(c) {
  return HOST_LOCAL.test(new URL(c.req.url).hostname);
}

export function origemPermitida(origin, c) {
  if (!origin) return false;
  if (origin === c.env.APP_URL) return true;

  // Localhost/rede local só valem em desenvolvimento. Em produção, mesmo que
  // alguém finja falar de localhost no cabeçalho Origin, não é aceito — só
  // a origem oficial.
  if (!ehDesenvolvimento(c)) return false;

  return LOCALHOST.test(origin) || REDE_LOCAL.test(origin);
}
