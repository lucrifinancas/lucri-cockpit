import { prepararPerfis } from './perfis.js';
export const CENTRAL_SCHEMA = `CREATE TABLE IF NOT EXISTS auditoria_usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ator_id INTEGER NOT NULL REFERENCES usuarios(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  acao TEXT NOT NULL,
  detalhes_json TEXT NOT NULL CHECK(json_valid(detalhes_json)),
  request_id TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
)`;
const ready = new WeakMap();
export function prepararCentral(db) {
  if (!ready.has(db)) ready.set(db, (async () => {
    await prepararPerfis(db);
    const columns = await db.prepare('PRAGMA table_info(usuarios)').all();
    if (!columns.results.some(c => c.name === 'ativo')) {
      try { await db.prepare('ALTER TABLE usuarios ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1))').run(); }
      catch (error) {
        const again = await db.prepare('PRAGMA table_info(usuarios)').all();
        if (!again.results.some(c => c.name === 'ativo')) throw error;
      }
    }
    await db.prepare(CENTRAL_SCHEMA).run();
  })().catch(error => { ready.delete(db); throw error; }));
  return ready.get(db);
}
export const snapshotUsuario = `SELECT json_object('papel', papel, 'cliente_id', cliente_id, 'ativo', ativo) FROM usuarios WHERE id = ?`;
export function eventoUsuario(db, ator, alvo, acao, detalhes, requestId) {
  return db.prepare('INSERT INTO auditoria_usuarios (ator_id, usuario_id, acao, detalhes_json, request_id) VALUES (?, ?, ?, ?, ?)')
    .bind(ator, alvo, acao, JSON.stringify(detalhes), requestId);
}
