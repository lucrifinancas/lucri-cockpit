// Lista fechada: nunca registrar URL completa, query string ou segmentos livres.
const apiRoutes = [
  /^\/api\/central-acessos\/(?:usuarios|auditoria)$/,
  /^\/api\/central-acessos\/usuarios\/:usuarioId(?:\/redefinir-senha)?$/,
  /^\/api\/perfil$/, /^\/api\/admin\/(?:sessao|voltar)$/,
  /^\/api\/admin\/usuarios\/:usuarioId\/(?:perfil|acessar)$/,
  /^\/api\/clientes\/:id\/auditoria-acessos$/,
  /^\/api\/health$/, /^\/api\/auth\/(?:me|login|logout|alterar-senha|esqueci-senha|redefinir-senha)$/,
  /^\/api\/auth\/google\/(?:iniciar|callback)$/, /^\/api\/clientes$/,
  /^\/api\/clientes\/:id(?:\/(?:home|entradas|saidas|despesas|caixa|dre|balanco|historico-mensal|categorias|maes|maes-receita|contas-pagar-maes|auditoria-categorias|categorias-pai|convites|usuarios|login|relatorios))?$/,
  /^\/api\/clientes\/:id\/categorias\/(?:receitas|despesas)$/,
  /^\/api\/clientes\/:id\/(?:maes|maes-receita|convites|relatorios)\/:item(?:\/arquivo)?$/,
  /^\/api\/registros\/erros$/, /^\/api\/contaazul\/(?:iniciar|callback)$/,
  /^\/api\/contaazul\/autorizar\/:id$/,
];
const pages = new Set(['/', '/entradas', '/saidas', '/despesas', '/caixa', '/contas-a-pagar', '/balanco', '/dre', '/relatorios', '/ajustes', '/busca', '/redefinir-senha', '/ajuda', '/privacidade']);

export function normalizarOperacao(value) {
  const path = String(value ?? '').split(/[?#]/, 1)[0];
  if (pages.has(path)) return path;
  const normalized = path.replace(/^(\/api\/central-acessos\/usuarios)\/\d+/, '$1/:usuarioId').replace(/^(\/api\/admin\/usuarios)\/\d+/, '$1/:usuarioId').replace(/^(\/api\/clientes)\/\d+/, '$1/:id')
    .replace(/^(\/api\/contaazul\/autorizar)\/\d+$/, '$1/:id')
    .replace(/^(\/api\/clientes\/:id\/(?:maes|maes-receita|convites|relatorios))\/[^/]+/, '$1/:item');
  return apiRoutes.some(pattern => pattern.test(normalized)) ? normalized : '/desconhecida';
}

export function versaoSegura(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]{1,64}$/.test(value) ? value : null;
}

export function contextoAuditoria(c) {
  const user = c.get('usuario');
  return { usuarioId: user?.sub ?? null, papel: user?.papel ?? null,
    requestId: c.get('requestId'), versao: versaoSegura(c.req.header('X-App-Version') ?? c.req.query('versao_app')) };
}

export function clienteDaRequisicao(c) {
  const id = Number(c.req.path.match(/^\/api\/clientes\/(\d+)(?:\/|$)/)?.[1]);
  const user = c.get('usuario');
  return Number.isSafeInteger(id) && id > 0 && user &&
    (['master', 'analista'].includes(user.papel) || user.cliente_id === id) ? id : null;
}
