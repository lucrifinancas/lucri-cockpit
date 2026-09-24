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

const VALIDADE_MINUTOS = 10;

export async function criarAutorizacaoPendente(db, state, clienteId) {
  await db.batch([
    // Limpeza oportunista de state antigo nunca usado, junto com a
    // inserção — evita acumular linha "morta" pra sempre na tabela.
    db.prepare(`DELETE FROM contaazul_autorizacoes_pendentes WHERE criado_em <= datetime('now', '-${VALIDADE_MINUTOS} minutes')`),
    db.prepare("INSERT INTO contaazul_autorizacoes_pendentes (state, cliente_id) VALUES (?, ?)").bind(state, clienteId),
  ]);
}

// Confere validade e apaga na mesma consulta (DELETE ... RETURNING) — state
// só pode ser consumido uma vez, e um link antigo (mais de 10 min) não
// funciona mais mesmo que alguém consiga um code OAuth válido pra usar com
// ele. Ver RELATORIO-SEGURANCA-2026-09-24.md, achado 6.
export async function consumirAutorizacaoPendente(db, state) {
  const pendente = await db
    .prepare(
      `DELETE FROM contaazul_autorizacoes_pendentes
       WHERE state = ? AND criado_em > datetime('now', '-${VALIDADE_MINUTOS} minutes')
       RETURNING *`
    )
    .bind(state)
    .first();

  return pendente ?? null;
}
