CREATE TABLE IF NOT EXISTS usuario_perfis (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id),
    nome TEXT NOT NULL CHECK(length(nome) BETWEEN 1 AND 100),
    avatar_url TEXT CHECK(avatar_url IS NULL OR length(avatar_url) <= 180000),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

CREATE TABLE IF NOT EXISTS auditoria_acessos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ator_id INTEGER NOT NULL REFERENCES usuarios(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    cliente_id INTEGER REFERENCES clientes(id),
    acao TEXT NOT NULL CHECK(acao IN ('perfil_atualizado','acesso_iniciado','acesso_encerrado')),
    request_id TEXT NOT NULL,
    detalhes_json TEXT NOT NULL CHECK(json_valid(detalhes_json)),
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

CREATE INDEX IF NOT EXISTS auditoria_acessos_cliente ON auditoria_acessos(cliente_id, id DESC);
