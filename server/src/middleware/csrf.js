import { origemPermitida } from "../auth/origem.js";

const METODOS_MUTANTES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// CORS só controla o que o NAVEGADOR deixa o front LER da resposta — não
// impede a rota de RODAR (um fetch cross-site com Content-Type: text/plain
// foge do preflight e chega inteiro no backend, só a leitura da resposta é
// bloqueada). Por isso toda escrita (POST/PUT/PATCH/DELETE) passa por essa
// checagem extra: a origem precisa estar na lista permitida (a mesma do
// CORS) e, se tiver corpo, precisar ser JSON de verdade — não é suficiente
// se declarar JSON, tem que ser aceito como tal.
// Ver RELATORIO-SEGURANCA-2026-09-24.md, achado 1.
export async function bloquearCsrf(c, next) {
  if (!METODOS_MUTANTES.has(c.req.method)) {
    return next();
  }

  const origin = c.req.header("Origin");
  const ehHttps = c.req.url.startsWith("https://");
  if (!origemPermitida(origin, c.env, ehHttps)) {
    return c.json({ erro: "Origem não permitida." }, 403);
  }

  const contentLength = c.req.header("Content-Length");
  const temCorpo = contentLength && contentLength !== "0";
  if (temCorpo) {
    const contentType = c.req.header("Content-Type") ?? "";
    if (!contentType.includes("application/json")) {
      return c.json({ erro: "Content-Type precisa ser application/json." }, 415);
    }
  }

  return next();
}
