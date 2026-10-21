-- Relatórios antigos (PDF) de cada cliente — apresentações pro cliente
-- sobre um período específico. Metadados aqui, o arquivo em si vai pro
-- Workers KV (ver src/routes/clientes.js). chave_kv é a chave do arquivo
-- lá dentro.
CREATE TABLE relatorios_cliente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  referencia TEXT NOT NULL, -- período de referência do relatório, texto livre (ex: "2025-01", "2024")
  chave_kv TEXT NOT NULL UNIQUE,
  nome_arquivo TEXT NOT NULL, -- nome original do arquivo, pra exibir/baixar com o nome certo
  tamanho_bytes INTEGER NOT NULL,
  enviado_por INTEGER REFERENCES usuarios(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_relatorios_cliente ON relatorios_cliente (cliente_id);
