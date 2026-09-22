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

export async function atualizarSenha(db, usuarioId, novoHash) {
  await db
    .prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?")
    .bind(novoHash, usuarioId)
    .run();
}

// Cria um token de redefinição de senha, válido por `minutosValidade`.
export async function criarTokenReset(db, usuarioId, token, minutosValidade) {
  await db
    .prepare(
      `INSERT INTO reset_senha_tokens (token, usuario_id, expira_em)
       VALUES (?, ?, datetime('now', '+' || ? || ' minutes'))`
    )
    .bind(token, usuarioId, minutosValidade)
    .run();
}

// Devolve o usuário dono do token, só se ele existir e ainda não tiver
// expirado — senão null.
export async function buscarUsuarioPorTokenReset(db, token) {
  const resultado = await db
    .prepare(
      `SELECT u.* FROM reset_senha_tokens t
       JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.token = ? AND t.expira_em > datetime('now')`
    )
    .bind(token)
    .first();
  return resultado ?? null;
}

// Apaga o token depois de usado (ou ao pedir um novo, pra não acumular).
export async function apagarTokenReset(db, token) {
  await db.prepare("DELETE FROM reset_senha_tokens WHERE token = ?").bind(token).run();
}

export async function apagarTokensResetDoUsuario(db, usuarioId) {
  await db.prepare("DELETE FROM reset_senha_tokens WHERE usuario_id = ?").bind(usuarioId).run();
}

export async function criarUsuarioCliente(db, clienteId, email, senhaHash) {
  return db
    .prepare(
      `INSERT INTO usuarios (email, senha_hash, papel, cliente_id)
       VALUES (?, ?, 'cliente', ?) RETURNING id, email, papel, cliente_id, criado_em`
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
       VALUES (?, ?, 'cliente', ?, ?, ?) RETURNING id, email, papel, cliente_id, nome, sobrenome, criado_em`
    )
    .bind(email, senhaHashAleatorio, clienteId, nome, sobrenome)
    .first();
}
