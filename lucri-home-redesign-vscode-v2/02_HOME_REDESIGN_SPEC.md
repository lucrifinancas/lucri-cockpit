# Especificação da nova Home

## 1. Cabeçalho

Título:
`Home Financeira`

Subtítulo:
`Visão consolidada do caixa, desempenho e saúde financeira da empresa.`

Manter no topo:
- seletor de cliente apenas para `master` e `analista`;
- seletor de período;
- usuário logado;
- navegação existente.

Adicionar, se já houver dado disponível:
- status discreto de sincronização com Conta Azul;
- horário da última atualização.

Não inventar endpoint se esse dado ainda não existir.

---

## 2. KPIs principais

Ordem sugerida:

1. Saldo em conta
2. Resultado do mês
3. Receitas
4. Despesas
5. Contas vencidas
6. Inadimplência do mês

### Conteúdo de cada KPI

- título;
- valor principal;
- variação versus período anterior, quando aplicável;
- ícone;
- estado semântico.

### Regra visual

Usar o componente `StatCard` existente se ele suportar a necessidade.
Antes de criar nova variação, adaptar `StatCard` com props reutilizáveis.

Não duplicar estilos de KPI.

### Resultado do mês

Fórmula:
`receitas - despesas`

Usar a mesma definição de receita/despesa já adotada pela Home atual.
Não misturar `Saídas` brutas com `Despesas` operacionais se o cálculo atual usa despesas.

---

## 3. Saúde Financeira

Criar um card de destaque maior.

Conteúdo:
- score de 0 a 100;
- classificação textual;
- resumo automático;
- pequenos KPIs de apoio.

Exemplo:
- Receitas
- Despesas
- Resultado
- Saldo em conta

### Classificações sugeridas

- 80–100: Boa
- 60–79: Atenção
- 0–59: Crítica

Esses limiares podem ser isolados em helper para fácil ajuste.

### Importante

O score não deve parecer contábil/oficial.
Mostrar tooltip ou texto de apoio:
`Indicador gerencial calculado a partir dos dados financeiros do período.`

### Score v1 sugerido

Usar 4 componentes com pesos simples:

- Resultado do período: 35%
- Saldo / cobertura de despesas: 25%
- Inadimplência: 20%
- Contas vencidas: 20%

Normalizar cada componente para 0–100.

Se a equipe preferir não fixar a fórmula agora, implementar o componente preparado para receber `score`, `status` e `insight` calculados por helper separado.

---

## 4. Andamento financeiro

Manter os dois blocos atuais:

### Contas a pagar — andamento
- pago;
- a vencer;
- total;
- percentual.

### Contas a receber — andamento
- recebido;
- a vencer;
- total;
- percentual.

Usar barras de progresso já compatíveis com o Design System.

Evitar repetir informação de forma redundante.

---

## 5. Histórico mensal

### Receitas x Despesas — Histórico mensal

Manter como gráfico principal.

Preferência:
- últimos 12 meses;
- Receitas = `--chart-revenue`;
- Despesas = `--chart-expense`;
- tooltip;
- legenda;
- números com formatação BRL.

### Resultado histórico (lucro/prejuízo)

Manter como gráfico separado.

- positivo: cor de caixa/lucro;
- negativo: cor de despesa;
- zero: neutro.

Usar a infraestrutura atual de `recharts` e helpers de `chartUtils.js`.

---

## 6. Categorias

Substituir blocos densos da Home por resumos.

### Principais receitas por categoria
- donut;
- top 4 ou 5;
- valor;
- participação.

### Principais despesas por categoria
- donut;
- top 4 ou 5;
- valor;
- participação.

Restante:
`Outros`

Se a categoria vier vazia ou sem nome, usar o mesmo fallback já adotado pela aplicação.
Não inventar nomenclatura inconsistente.

---

## 7. Top gastos do mês

Gráfico horizontal com no máximo 5 categorias.

Ordenar por valor decrescente.

Mostrar:
- categoria;
- valor.

Não mostrar 10 itens na Home.
A análise completa continua em Despesas.

---

## 8. Alertas e insights

Novo bloco.

Objetivo: transformar dados em leitura gerencial.

Exemplos de regras:

- `despesas > receitas`
  - `Despesas estão X% acima das receitas no período.`

- `contas_vencidas == 0`
  - `Nenhuma conta vencida no período.`

- `saldo / despesas < 0.20`
  - `Saldo atual cobre apenas X% das despesas do período.`

- maior categoria de despesa > 35%
  - `A categoria {nome} concentra X% das despesas.`

- inadimplência > 10%
  - `Inadimplência acima de 10% exige atenção.`

### Regras

- no máximo 4 insights na Home;
- priorizar severidade;
- não usar linguagem alarmista;
- não gerar interpretação sem dados;
- cada insight deve ser derivado de regra determinística, não de texto aleatório.

---

## 9. Estados vazios

Não renderizar gráficos enormes com todos os valores iguais a zero.

Exemplo:

Em vez de um gráfico de contas vencidas vazio:
`Nenhuma conta vencida no período selecionado.`

Pode mostrar:
- ícone;
- valor R$ 0;
- mensagem curta;
- link para histórico, se existir.

Estados vazios devem usar os padrões do Design System.
