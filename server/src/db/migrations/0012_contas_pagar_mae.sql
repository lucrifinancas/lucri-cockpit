-- Quais categorias-mãe de DESPESA entram na página Contas a pagar, por
-- cliente (pedido do usuário, 07/10). Só o master escolhe, em Ajustes. Sem
-- nenhuma linha pro cliente, a página não mostra nada (decisão "B").
CREATE TABLE contas_pagar_mae (
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  mae_id INTEGER NOT NULL REFERENCES categoria_mae(id),
  PRIMARY KEY (cliente_id, mae_id)
);
