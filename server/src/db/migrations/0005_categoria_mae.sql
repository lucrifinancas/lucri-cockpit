-- Lista de "categorias-mãe" (grupos como "Despesas Administrativas") de cada
-- cliente. O master cadastra a lista uma vez e depois só escolhe, em cada
-- grupo do Conta Azul, qual mãe é (o vínculo em si continua em
-- categoria_pai_nome, que guarda código da mãe -> nome). Cada cliente tem as
-- suas mães, por isso a lista é por cliente.
CREATE TABLE categoria_mae (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  nome TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (cliente_id, nome)
);
