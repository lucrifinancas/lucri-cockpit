# Mapeamento de dados

## Regras gerais

- Front nunca chama Conta Azul diretamente.
- Todo acesso passa por `apiFetch`.
- Componentes não chamam `fetch`.
- Usar hooks existentes.
- Respeitar `PeriodContext`.
- Respeitar `ClientContext`.
- Não assumir estrutura de mock.

## KPIs

### Saldo em conta
Usar a mesma fonte atual da Home/Caixa.

### Receitas
Usar o total de entradas/receitas já adotado no dashboard atual.

### Despesas
Usar o total operacional de Despesas, não Saídas brutas, salvo se a Home atual já definir diferente.

### Resultado
`receitas - despesas`

### Contas vencidas
Somatório dos valores a receber vencidos.

### Inadimplência
Preferência:
`contas vencidas / total a receber * 100`

Se o backend já fornece esse indicador, usar o valor oficial do contrato.

## Delta versus período anterior

Usar:
- `computeDelta`
- `previousRange`

Não reimplementar cálculo se os helpers atuais já resolvem.

## Categorias

Usar `groupByCategoria` quando compatível com a resposta real.

## Histórico

Usar `useHistoricoMensal` como fonte principal se já atende aos gráficos.

## Saúde financeira

Criar helper separado, por exemplo:
`src/data/financialHealth.js`

Não misturar regra de score dentro do JSX.
