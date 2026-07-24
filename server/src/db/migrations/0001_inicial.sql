-- Cada linha = um cliente-empresa da Lucri (ex: "Nick Publicidade")
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Token OAuth do Conta Azul de cada cliente (1 conexão por cliente)
CREATE TABLE conexoes_contaazul (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Quem loga no dashboard: equipe Lucri (master/analista) ou o próprio cliente
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('master', 'analista', 'cliente')),
  cliente_id INTEGER REFERENCES clientes(id), -- só preenchido quando papel = 'cliente'
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
