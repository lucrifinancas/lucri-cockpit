// Middleware: bloqueia a rota se não houver sessão válida, ou se o papel do
// usuário não estiver na lista de papéis permitidos.

import { lerSessao } from "./sessao.js";

export function exigirPapel(...papeisPermitidos) {
  return async (c, next) => {
    const sessao = await lerSessao(c, c.env.JWT_SECRET);
    if (!sessao) {
      return c.json({ erro: "Não autenticado." }, 401);
    }
    if (!papeisPermitidos.includes(sessao.papel)) {
      return c.json({ erro: "Sem permissão para esta ação." }, 403);
    }
    c.set("usuario", sessao); // deixa disponível pras próximas etapas da rota
    await next();
  };
}
