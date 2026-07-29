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

export async function criarUsuarioCliente(db, clienteId, email, senhaHash) {
  return db
    .prepare(
      `INSERT INTO usuarios (email, senha_hash, papel, cliente_id)
       VALUES (?, ?, 'cliente', ?) RETURNING id, email, papel, cliente_id, criado_em`
    )
    .bind(email, senhaHash, clienteId)
    .first();
}
