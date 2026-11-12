ALTER TABLE usuarios ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1));

CREATE TABLE IF NOT EXISTS auditoria_usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ator_id INTEGER NOT NULL REFERENCES usuarios(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  acao TEXT NOT NULL,
  detalhes_json TEXT NOT NULL CHECK(json_valid(detalhes_json)),
  request_id TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
