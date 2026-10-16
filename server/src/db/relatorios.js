// Metadados dos relatórios antigos (PDF) de cada cliente — o arquivo em si
// mora no Workers KV (ver routes/clientes.js), aqui só o que descreve ele.

export async function listarRelatorios(db, clienteId) {
  const { results } = await db
    .prepare(
      `SELECT r.id, r.referencia, r.nome_arquivo, r.tamanho_bytes,
              r.criado_em, u.email AS enviado_por_email
       FROM relatorios_cliente r
       LEFT JOIN usuarios u ON u.id = r.enviado_por
       WHERE r.cliente_id = ?
       ORDER BY r.referencia DESC, r.criado_em DESC`
    )
    .bind(clienteId)
    .all();
  return results;
}

export async function buscarRelatorio(db, clienteId, relatorioId) {
  const resultado = await db
    .prepare("SELECT * FROM relatorios_cliente WHERE id = ? AND cliente_id = ?")
    .bind(relatorioId, clienteId)
    .first();
  return resultado ?? null;
}

export async function criarRelatorio(db, clienteId, dados) {
  return db
    .prepare(
      `INSERT INTO relatorios_cliente
         (cliente_id, referencia, chave_kv, nome_arquivo, tamanho_bytes, enviado_por)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, referencia, nome_arquivo, tamanho_bytes, criado_em`
    )
    .bind(clienteId, dados.referencia, dados.chaveKv, dados.nomeArquivo, dados.tamanhoBytes, dados.enviadoPor)
    .first();
}

export async function apagarRelatorio(db, clienteId, relatorioId) {
  const resultado = await db
    .prepare("DELETE FROM relatorios_cliente WHERE id = ? AND cliente_id = ? RETURNING chave_kv")
    .bind(relatorioId, clienteId)
    .first();
  return resultado ?? null;
}
