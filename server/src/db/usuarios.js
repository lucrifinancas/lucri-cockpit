// Consultas relacionadas à tabela "usuarios".

export async function buscarUsuarioPorEmail(db, email) {
  const resultado = await db
    .prepare("SELECT * FROM usuarios WHERE email = ?")
    .bind(email)
    .first();
  return resultado ?? null;
}

export async function buscarUsuarioPorId(db, id) {
  return db.prepare("SELECT * FROM usuarios WHERE id = ?").bind(id).first();
}

// Também incrementa sessao_versao — é isso que faz qualquer sessão (JWT)
// emitida antes dessa troca parar de funcionar, mesmo sem ter expirado (ver
// lerSessaoValida em auth/sessao.js e RELATORIO-SEGURANCA-2026-09-24.md,
// achado 2). Cobre trocar senha estando logado e redefinir por e-mail — as
// duas chamam esta mesma função.
export async function atualizarSenha(db, usuarioId, novoHash) {
  await db
    .prepare("UPDATE usuarios SET senha_hash = ?, sessao_versao = sessao_versao + 1 WHERE id = ?")
    .bind(novoHash, usuarioId)
    .run();
}

async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Cria um token de redefinição de senha, válido por `minutosValidade`. Só o
// hash do token vai pro banco — o valor original só existe no e-mail que a
// pessoa recebe, então um vazamento de leitura do banco não entrega tokens
// usáveis (ver RELATORIO-SEGURANCA-2026-09-24.md, "Outros pontos").
export async function criarTokenReset(db, usuarioId, token, minutosValidade) {
  const tokenHash = await hashToken(token);
  await db
    .prepare(
      `INSERT INTO reset_senha_tokens (token_hash, usuario_id, expira_em)
       VALUES (?, ?, datetime('now', '+' || ? || ' minutes'))`
    )
    .bind(tokenHash, usuarioId, minutosValidade)
    .run();
}

// Confere e apaga o token na mesma consulta (DELETE ... RETURNING) — duas
// tentativas simultâneas com o mesmo token nunca conseguem as duas passar,
// diferente do SELECT+DELETE separado de antes. Devolve o usuário dono do
// token, ou null se o token não existir, já tiver sido usado ou tiver
// expirado.
export async function consumirTokenReset(db, token) {
  const tokenHash = await hashToken(token);
  const linha = await db
    .prepare(
      `DELETE FROM reset_senha_tokens
       WHERE token_hash = ? AND expira_em > datetime('now')
       RETURNING usuario_id`
    )
    .bind(tokenHash)
    .first();
  if (!linha) return null;

  return buscarUsuarioPorId(db, linha.usuario_id);
}

export async function apagarTokensResetDoUsuario(db, usuarioId) {
  await db.prepare("DELETE FROM reset_senha_tokens WHERE usuario_id = ?").bind(usuarioId).run();
}

export async function criarUsuarioCliente(db, clienteId, email, senhaHash) {
  return db
    .prepare(
      `INSERT INTO usuarios (email, senha_hash, papel, cliente_id)
       VALUES (?, ?, 'cliente', ?)
       RETURNING id, email, papel, cliente_id, sessao_versao, criado_em`
    )
    .bind(email, senhaHash, clienteId)
    .first();
}

// Cria a conta "cliente" no momento em que a pessoa aceita um convite
// entrando com Google — não tem senha própria (só entra via Google, até
// pedir uma redefinição de senha algum dia, se quiser). `senhaHash` aqui é
// só um valor aleatório que ninguém consegue digitar, pra satisfazer a
// coluna NOT NULL sem criar uma senha de verdade.
export async function criarUsuarioClienteGoogle(db, clienteId, email, nome, sobrenome, senhaHashAleatorio) {
  return db
    .prepare(
      `INSERT INTO usuarios (email, senha_hash, papel, cliente_id, nome, sobrenome)
       VALUES (?, ?, 'cliente', ?, ?, ?)
       RETURNING id, email, papel, cliente_id, nome, sobrenome, sessao_versao, criado_em`
    )
    .bind(email, senhaHashAleatorio, clienteId, nome, sobrenome)
    .first();
}
