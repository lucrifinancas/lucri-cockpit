// Middleware: bloqueia a rota se não houver sessão válida, ou se o papel do
// usuário não estiver na lista de papéis permitidos.

import { lerSessaoValida } from "./sessao.js";

export function exigirPapel(...papeisPermitidos) {
  return async (c, next) => {
    const sessao = await lerSessaoValida(c, c.env.JWT_SECRET, c.env.DB);
    if (!sessao) {
      return c.json({ erro: "Não autenticado." }, 401);
    }
    if (!papeisPermitidos.includes(sessao.papel)) {
      return c.json({ erro: "Sem permissão para esta ação." }, 403);
    }
    c.set("usuario", sessao); // deixa disponível pras próximas etapas da rota
    return await next();
  };
}

// Leitura financeira: equipe consulta qualquer empresa; cliente só a própria.
export function exigirLeituraCliente(parametro = "clienteId") {
  return async (c, next) => {
    return exigirPapel("master", "analista", "cliente")(c, async () => {
      const clienteId = Number(c.req.param(parametro));
      if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
        return c.json({ erro: "Cliente inválido." }, 400);
      }
      const usuario = c.get("usuario");
      if (usuario.papel === "cliente" && usuario.cliente_id !== clienteId) {
        return c.json({ erro: "Sem permissão para esta empresa." }, 403);
      }
      return next();
    });
  };
}
