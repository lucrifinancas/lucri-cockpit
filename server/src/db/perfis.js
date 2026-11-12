// D1/SQLite: esquema aditivo, preparado pelo vínculo do Worker.
export const PERFIS_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS usuario_perfis (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id),
    nome TEXT NOT NULL CHECK(length(nome) BETWEEN 1 AND 100),
    avatar_url TEXT CHECK(avatar_url IS NULL OR length(avatar_url) <= 180000),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS auditoria_acessos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ator_id INTEGER NOT NULL REFERENCES usuarios(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    cliente_id INTEGER REFERENCES clientes(id),
    acao TEXT NOT NULL CHECK(acao IN ('perfil_atualizado','acesso_iniciado','acesso_encerrado')),
    request_id TEXT NOT NULL,
    detalhes_json TEXT NOT NULL CHECK(json_valid(detalhes_json)),
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  'CREATE INDEX IF NOT EXISTS auditoria_acessos_cliente ON auditoria_acessos(cliente_id, id DESC)',
];
const ready = new WeakMap();
export function prepararPerfis(db) {
  if (!ready.has(db)) ready.set(db, Promise.resolve().then(() => db.batch(PERFIS_SCHEMA.map(sql => db.prepare(sql))))
    .catch(error => { ready.delete(db); throw error; }));
  return ready.get(db);
}

export function perfilPublico(usuario, perfil) {
  return { name: perfil?.nome || [usuario.nome, usuario.sobrenome].filter(Boolean).join(' ') || usuario.email.split('@')[0], avatarUrl: perfil?.avatar_url ?? null };
}
export async function lerPerfil(db, usuario) {
  await prepararPerfis(db);
  const perfil = await db.prepare('SELECT nome, avatar_url FROM usuario_perfis WHERE usuario_id = ?').bind(usuario.id).first();
  return perfilPublico(usuario, perfil);
}
export function validarPerfil(body) {
  if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100) return 'Informe um nome de até 100 caracteres.';
  if (body.avatarUrl !== null) {
    if (typeof body.avatarUrl !== 'string' || body.avatarUrl.length > 180000) return 'A foto excede o tamanho permitido.';
    const match = body.avatarUrl.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return 'Use uma foto JPEG ou PNG.';
    try {
      const bytes = atob(match[2]);
      if (bytes.length > 128 * 1024 || (match[1] === 'jpeg' ? !bytes.startsWith('\xff\xd8\xff') : !bytes.startsWith('\x89PNG\r\n\x1a\n'))) return 'Foto inválida.';
    } catch { return 'Foto inválida.'; }
  }
  return null;
}
export async function registrarAcesso(db, { atorId, usuario, acao, requestId }) {
  await prepararPerfis(db);
  await db.prepare('INSERT INTO auditoria_acessos (ator_id, usuario_id, cliente_id, acao, request_id, detalhes_json) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(atorId, usuario.id, usuario.cliente_id ?? null, acao, requestId, '{}').run();
}
export async function salvarPerfil(db, usuario, atorId, perfil, requestId) {
  await prepararPerfis(db);
  // Snapshot e alteração na mesma transação. Fotos nunca entram no log.
  await db.batch([
    db.prepare(`INSERT INTO auditoria_acessos (ator_id, usuario_id, cliente_id, acao, request_id, detalhes_json)
      VALUES (?, ?, ?, 'perfil_atualizado', ?, json_object('nome_anterior',
        (SELECT nome FROM usuario_perfis WHERE usuario_id = ?), 'nome_novo', ?, 'foto_alterada',
        COALESCE((SELECT avatar_url IS NOT ? FROM usuario_perfis WHERE usuario_id = ?), ? IS NOT NULL)))`)
      .bind(atorId, usuario.id, usuario.cliente_id ?? null, requestId, usuario.id, perfil.name.trim(), perfil.avatarUrl, usuario.id, perfil.avatarUrl),
    db.prepare(`INSERT INTO usuario_perfis (usuario_id, nome, avatar_url) VALUES (?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET nome = excluded.nome, avatar_url = excluded.avatar_url, atualizado_em = datetime('now')`)
      .bind(usuario.id, perfil.name.trim(), perfil.avatarUrl),
  ]);
  return { name: perfil.name.trim(), avatarUrl: perfil.avatarUrl };
}
