// Convite de acesso: o master reserva um e-mail pra um cliente, sem senha —
// quem aceita o convite é a própria pessoa, entrando com Google (ver
// server/src/routes/authGoogle.js).

export async function listarConvites(db, clienteId) {
  const { results } = await db
    .prepare("SELECT id, email, criado_em FROM convites_cliente WHERE cliente_id = ? ORDER BY criado_em DESC")
    .bind(clienteId)
    .all();
  return results;
}

// Devolve o convite criado, ou null se já existir um convite com esse e-mail
// (em qualquer cliente — e-mail só pode estar reservado uma vez) ou se já
// existir um usuário com esse e-mail.
export async function criarConvite(db, clienteId, email) {
  const jaConvidado = await db.prepare("SELECT id FROM convites_cliente WHERE email = ?").bind(email).first();
  if (jaConvidado) return null;

  const jaUsuario = await db.prepare("SELECT id FROM usuarios WHERE email = ?").bind(email).first();
  if (jaUsuario) return null;

  const { meta } = await db
    .prepare("INSERT INTO convites_cliente (email, cliente_id) VALUES (?, ?)")
    .bind(email, clienteId)
    .run();
  return { id: meta.last_row_id, email, cliente_id: clienteId };
}

// "nao_encontrado" ou "ok".
export async function removerConvite(db, clienteId, conviteId) {
  const resultado = await db
    .prepare("DELETE FROM convites_cliente WHERE id = ? AND cliente_id = ?")
    .bind(conviteId, clienteId)
    .run();
  return resultado.meta.changes > 0 ? "ok" : "nao_encontrado";
}

export async function buscarConvitePorEmail(db, email) {
  const resultado = await db.prepare("SELECT * FROM convites_cliente WHERE email = ?").bind(email).first();
  return resultado ?? null;
}

export async function apagarConvitePorEmail(db, email) {
  await db.prepare("DELETE FROM convites_cliente WHERE email = ?").bind(email).run();
}
