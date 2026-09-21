-- Cada despesa (categoria do Conta Azul) passa a apontar pra uma categoria-mãe
-- do cliente (tabela categoria_mae). Ter mãe = conta como despesa operacional.
-- Linhas antigas ficam com mae_id NULL e continuam contando como despesa até o
-- master reabrir Ajustes e salvar de novo com a mãe escolhida.
ALTER TABLE categoria_despesa ADD COLUMN mae_id INTEGER REFERENCES categoria_mae(id);
