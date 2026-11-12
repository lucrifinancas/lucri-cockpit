-- Auditoria é gravada na mesma transação das alterações de categorias.
-- Nenhuma tabela de registros armazena corpos HTTP, tokens ou valores financeiros.
CREATE TABLE IF NOT EXISTS auditoria_categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evento_id TEXT NOT NULL UNIQUE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  usuario_id INTEGER,
  papel TEXT,
  request_id TEXT NOT NULL,
  versao TEXT,
  acao TEXT NOT NULL,
  antes_json TEXT NOT NULL CHECK (json_valid(antes_json)),
  depois_json TEXT NOT NULL CHECK (json_valid(depois_json)),
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS auditoria_categorias_cliente_id ON auditoria_categorias(cliente_id, id DESC);
CREATE INDEX IF NOT EXISTS auditoria_categorias_data ON auditoria_categorias(criado_em);

CREATE TABLE IF NOT EXISTS registros_erros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  origem TEXT NOT NULL CHECK (origem IN ('backend', 'frontend')),
  codigo TEXT NOT NULL,
  operacao TEXT NOT NULL,
  metodo TEXT,
  status INTEGER,
  cliente_id INTEGER,
  usuario_id INTEGER,
  papel TEXT,
  versao TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS registros_erros_cliente_id ON registros_erros(cliente_id, id DESC);
CREATE INDEX IF NOT EXISTS registros_erros_data ON registros_erros(criado_em);
