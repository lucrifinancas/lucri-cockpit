// Esquema fixo, igual à migração 0014 (equivalência validada nos testes).
export const REGISTROS_SCHEMA = [
  "CREATE TABLE IF NOT EXISTS auditoria_categorias (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  evento_id TEXT NOT NULL UNIQUE,\n  cliente_id INTEGER NOT NULL REFERENCES clientes(id),\n  usuario_id INTEGER,\n  papel TEXT,\n  request_id TEXT NOT NULL,\n  versao TEXT,\n  acao TEXT NOT NULL,\n  antes_json TEXT NOT NULL CHECK (json_valid(antes_json)),\n  depois_json TEXT NOT NULL CHECK (json_valid(depois_json)),\n  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))\n)",
  "CREATE INDEX IF NOT EXISTS auditoria_categorias_cliente_id ON auditoria_categorias(cliente_id, id DESC)",
  "CREATE INDEX IF NOT EXISTS auditoria_categorias_data ON auditoria_categorias(criado_em)",
  "CREATE TABLE IF NOT EXISTS registros_erros (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  request_id TEXT NOT NULL,\n  origem TEXT NOT NULL CHECK (origem IN ('backend', 'frontend')),\n  codigo TEXT NOT NULL,\n  operacao TEXT NOT NULL,\n  metodo TEXT,\n  status INTEGER,\n  cliente_id INTEGER,\n  usuario_id INTEGER,\n  papel TEXT,\n  versao TEXT,\n  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))\n)",
  "CREATE INDEX IF NOT EXISTS registros_erros_cliente_id ON registros_erros(cliente_id, id DESC)",
  "CREATE INDEX IF NOT EXISTS registros_erros_data ON registros_erros(criado_em)"
];

const ready = new WeakMap();

// O vínculo D1 do Worker já permite SQL. Não exige ampliar o token de deploy
// com acesso à API administrativa do banco. Apenas DDL aditivo/idempotente.
export function prepararRegistros(db) {
  if (!ready.has(db)) {
    const pending = Promise.resolve().then(async () => {
      await db.batch(REGISTROS_SCHEMA.map(sql => db.prepare(sql)));
      const columns = await db.prepare("PRAGMA table_info(registros_erros)").all();
      if (!columns.results.some(column => column.name === "detalhes_json")) {
        try { await db.prepare("ALTER TABLE registros_erros ADD COLUMN detalhes_json TEXT").run(); }
        catch (error) {
          const current = await db.prepare("PRAGMA table_info(registros_erros)").all();
          if (!current.results.some(column => column.name === "detalhes_json")) throw error;
        }
      }
    })
      .catch(error => { ready.delete(db); throw error; });
    ready.set(db, pending);
  }
  return ready.get(db);
}
