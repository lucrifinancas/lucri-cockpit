# PROMPT FINAL PARA O AGENTE DO VS CODE — V2

Leia primeiro o `README.md` da raiz do projeto.

Depois leia, nesta ordem:

1. `design-system-source/index.html`
2. `design-system-source/SYSTEM-DESIGNER-LUCRI.md`
3. `design-system-source/MANUAL-DA-MARCA-LUCRI.md`
4. `00_READ_FIRST.md`
5. `01_SCOPE_AND_NON_GOALS.md`
6. `02_HOME_REDESIGN_SPEC.md`
7. `03_COMPONENTS_MAP.md`
8. `04_DATA_MAPPING.md`
9. `05_DESIGN_SYSTEM_RULES.md`
10. `06_RESPONSIVE_BEHAVIOR.md`
11. `07_ACCEPTANCE_CRITERIA.md`
12. `09_SUGGESTED_FILE_CHANGES.md`
13. `10_HEALTH_SCORE_PROPOSAL.md`

## SUA TAREFA

Redesenhar SOMENTE a Home do Lucri Cockpit para uma central de saúde financeira.

A imagem `reference/home-financeira-conceito.png` é referência apenas de composição.

## IMPORTANTE: NÃO COPIE O VISUAL DA IMAGEM

Não copie:
- sombras;
- cores;
- tipografia;
- raios;
- gradientes;
- botões.

A imagem não é Design System.

## TIPOGRAFIA

Embora `SYSTEM-DESIGNER-LUCRI.md` declare Instrument Sans, o README do projeto informa que esse trecho está desatualizado.

Para o Cockpit, use **Inter**, conforme:
- `design-system-source/index.html`;
- configuração atual do projeto;
- README.

Não migre a aplicação para Instrument Sans.

## REGRAS VISUAIS

- cards sem sombra;
- borda sutil;
- raio conforme token de card;
- verde é única cor de ação principal;
- azul é link/foco/informação;
- laranja é alerta/tag/erro;
- gradiente apenas detalhe;
- tabular nums em valores financeiros;
- símbolo + número em variações;
- usar tokens, nunca cores literais.

## RESTRIÇÕES DE ARQUITETURA

1. React 19 + Vite.
2. Não usar HTML puro.
3. Não chamar Conta Azul direto.
4. Não usar `fetch` em página/componente.
5. API somente por `apiFetch` + hooks.
6. Não alterar contratos de API.
7. Não alterar autenticação.
8. Não alterar rotas.
9. Não alterar outras páginas, salvo componente compartilhado realmente necessário.
10. Não duplicar componente por papel.
11. Respeitar `ClientContext`, `PeriodContext` e `ThemeContext`.
12. Antes de criar componente, procurar equivalente existente.
13. Não inventar dados.
14. Se um dado não existe no contrato atual, não simular.

## HOME ESPERADA

### Linha de KPIs
- Saldo em conta
- Resultado do mês
- Receitas
- Despesas
- Contas vencidas
- Inadimplência

### Saúde Financeira
- score
- classificação
- interpretação
- receita
- despesa
- resultado
- saldo

### Operacional
- andamento contas a pagar
- andamento contas a receber

### Histórico
- receitas x despesas
- lucro/prejuízo

### Categorias
- principais receitas
- principais despesas

### Fechamento
- top 5 gastos
- alertas e insights

## ESTADOS VAZIOS

Se todos os dados de um gráfico forem zero:
- não renderizar um gráfico grande vazio;
- usar estado vazio compatível com o Design System.

## PROCESSO OBRIGATÓRIO

Antes de editar:
1. faça inventário dos componentes da Home;
2. identifique o que será reutilizado;
3. confira a estrutura real da API nos hooks;
4. liste eventuais métricas não disponíveis.

Depois:
5. implemente;
6. rode `npm run build`;
7. rode `npm run lint`;
8. corrija regressões;
9. teste tema claro e escuro;
10. teste master, analista e cliente;
11. entregue resumo dos arquivos alterados.

Não refatore o projeto inteiro.
Não “modernize” componentes fora do escopo.
Não crie um novo Design System dentro da Home.
