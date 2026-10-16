-- Relatórios antigos (PDF) de cada cliente — apresentações pro cliente
-- sobre um período específico. Metadados aqui, o arquivo em si vai pro R2
-- (bucket lucri-cockpit-relatorios, ver src/routes/clientes.js). r2_key é
-- o caminho do arquivo dentro do bucket.
CREATE TABLE relatorios_cliente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  referencia TEXT NOT NULL, -- período de referência do relatório, texto livre (ex: "2025-01", "2024")
  r2_key TEXT NOT NULL UNIQUE,
  nome_arquivo TEXT NOT NULL, -- nome original do arquivo, pra exibir/baixar com o nome certo
  tamanho_bytes INTEGER NOT NULL,
  enviado_por INTEGER REFERENCES usuarios(id),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_relatorios_cliente ON relatorios_cliente (cliente_id);
