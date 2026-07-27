export async function salvarConexao(db, clienteId, { accessToken, refreshToken, expiraEm }) {
  // Se já existe uma conexão pra esse cliente, substitui (evita duplicar).
  await db
    .prepare("DELETE FROM conexoes_contaazul WHERE cliente_id = ?")
    .bind(clienteId)
    .run();

  return db
    .prepare(
      `INSERT INTO conexoes_contaazul (cliente_id, access_token, refresh_token, expira_em)
       VALUES (?, ?, ?, ?) RETURNING *`
    )
    .bind(clienteId, accessToken, refreshToken, expiraEm)
    .first();
}

export async function buscarConexaoPorCliente(db, clienteId) {
  return db
    .prepare("SELECT * FROM conexoes_contaazul WHERE cliente_id = ?")
    .bind(clienteId)
    .first();
}

export async function atualizarTokens(db, clienteId, { accessToken, refreshToken, expiraEm }) {
  await db
    .prepare(
      `UPDATE conexoes_contaazul
       SET access_token = ?, refresh_token = ?, expira_em = ?, atualizado_em = datetime('now')
       WHERE cliente_id = ?`
    )
    .bind(accessToken, refreshToken, expiraEm, clienteId)
    .run();
}

export async function criarAutorizacaoPendente(db, state, clienteId) {
  await db
    .prepare("INSERT INTO contaazul_autorizacoes_pendentes (state, cliente_id) VALUES (?, ?)")
    .bind(state, clienteId)
    .run();
}

export async function consumirAutorizacaoPendente(db, state) {
  const pendente = await db
    .prepare("SELECT * FROM contaazul_autorizacoes_pendentes WHERE state = ?")
    .bind(state)
    .first();

  if (!pendente) return null;

  await db
    .prepare("DELETE FROM contaazul_autorizacoes_pendentes WHERE state = ?")
    .bind(state)
    .run();

  return pendente;
}
