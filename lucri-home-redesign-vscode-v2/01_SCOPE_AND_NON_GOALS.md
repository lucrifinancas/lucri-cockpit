# Escopo e não-escopo

## Alterar

Somente a Home financeira e, quando necessário, componentes reutilizáveis que já pertencem à Home.

A nova Home deve:

1. reorganizar KPIs principais;
2. destacar `Resultado do mês`;
3. adicionar bloco de `Saúde Financeira`;
4. manter o andamento de contas a pagar e a receber;
5. manter histórico de receitas x despesas;
6. manter histórico de lucro/prejuízo;
7. resumir categorias em vez de exibir tabelas muito longas na Home;
8. adicionar `Alertas e insights`;
9. reduzir espaços vazios quando não há dados;
10. usar estados vazios inteligentes.

## Não alterar

- rotas existentes;
- páginas Entradas, Saídas, Despesas, Caixa, Balanço, DRE e Ajustes;
- autenticação;
- regras de papel;
- seleção de cliente;
- integração com Conta Azul;
- contrato da API;
- backend;
- persistência do período;
- comportamento do tema;
- cálculos existentes sem motivo;
- componentes compartilhados que já funcionam, salvo ajustes compatíveis com o Design System.

## Regra de segurança de implementação

Não remover informação existente sem confirmar que ela:
1. foi movida para outro bloco da Home; ou
2. continua acessível em uma aba específica.

A Home é um resumo. As páginas específicas continuam sendo a fonte de aprofundamento.
