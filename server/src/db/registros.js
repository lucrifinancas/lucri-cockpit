export async function registrarErro(db, event) {
  await db.prepare(`INSERT INTO registros_erros
    (request_id, origem, codigo, operacao, metodo, status, cliente_id, usuario_id, papel, versao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(event.requestId, event.origem, event.codigo, event.operacao, event.metodo ?? null,
      event.status ?? null, event.clienteId ?? null, event.usuarioId ?? null, event.papel ?? null, event.versao ?? null).run();
}

export async function listarRegistros(db, tipo, { clienteId = null, antes = null, limite = 25 } = {}) {
  const table = tipo === 'auditoria' ? 'auditoria_categorias' : 'registros_erros';
  const where = [];
  const args = [];
  if (clienteId !== null) { where.push('r.cliente_id = ?'); args.push(clienteId); }
  if (antes !== null) { where.push('r.id < ?'); args.push(antes); }
  const { results } = await db.prepare(`SELECT r.*, u.email AS usuario_email FROM ${table} r
    LEFT JOIN usuarios u ON u.id = r.usuario_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY r.id DESC LIMIT ?`)
    .bind(...args, limite + 1).all();
  const items = results.slice(0, limite).map(row => {
    if (tipo !== 'auditoria') return row;
    const { antes_json, depois_json, ...rest } = row;
    return { ...rest, antes: JSON.parse(antes_json), depois: JSON.parse(depois_json) };
  });
  return { itens: items, proximo: results.length > limite ? items.at(-1).id : null };
}

export async function limparRegistros(db) {
  await db.batch([
    db.prepare("DELETE FROM registros_erros WHERE criado_em < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')"),
    db.prepare("DELETE FROM auditoria_categorias WHERE criado_em < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-365 days')"),
  ]);
}
