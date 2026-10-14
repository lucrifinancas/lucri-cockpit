# MANUAL DE LEITURA — PASTA VS CODE

## Objetivo deste arquivo

Este arquivo existe para orientar qualquer agente de código, IA ou desenvolvedor que abrir esta pasta.

**Não comece alterando arquivos.**
Primeiro entenda o projeto, depois entenda o Design System, depois entenda a proposta da nova Home.

---

# 1. ORDEM OBRIGATÓRIA DE LEITURA

Leia os arquivos exatamente nesta ordem:

## ETAPA 1 — ENTENDER O PROJETO

### 1. `README.md`
Leia primeiro o README da raiz do projeto.

Você precisa entender:
- stack;
- arquitetura;
- rotas;
- autenticação;
- papéis;
- hooks;
- integração com Conta Azul;
- estrutura de `app/src/`;
- regras de acesso;
- regras de tema;
- decisões já tomadas.

**Não implemente nada antes de terminar esta leitura.**

---

# 2. ENTENDER O DESIGN SYSTEM

Depois do README, leia:

### 2. `design-system-source/index.html`

Este arquivo é a referência visual viva do Design System.

Observe principalmente:
- tipografia;
- componentes;
- cards;
- KPIs;
- tabelas;
- botões;
- inputs;
- navegação;
- estados;
- dados financeiros.

### 3. `design-system-source/SYSTEM-DESIGNER-LUCRI.md`

Leia as regras estruturais do sistema.

Preste atenção em:
- uso de cores;
- raios;
- espaçamento;
- sombras;
- ações;
- cards;
- navegação;
- acessibilidade;
- regras não negociáveis.

### 4. `design-system-source/MANUAL-DA-MARCA-LUCRI.md`

Use este documento para entender:
- identidade da Lucri;
- posicionamento;
- tom;
- cores institucionais;
- uso da marca.

**Não aplique automaticamente regras de marketing na interface do Cockpit.**

---

# 3. REGRA IMPORTANTE SOBRE TIPOGRAFIA

Existe uma divergência entre os arquivos.

- `index.html` usa **Inter**.
- `SYSTEM-DESIGNER-LUCRI.md` ainda cita **Instrument Sans**.
- `MANUAL-DA-MARCA-LUCRI.md` cita **Ancress + Montserrat** para materiais de marca.

## Para o Lucri Cockpit:

**USE INTER.**

Não altere o Cockpit para Instrument Sans.
Não use Ancress ou Montserrat na interface do produto.

---

# 4. LER AS REGRAS DESTA IMPLEMENTAÇÃO

Depois do Design System, leia:

### 5. `00_READ_FIRST.md`

Este arquivo define:
- prioridade entre documentos;
- regras principais;
- o papel da imagem de referência;
- o que pode e o que não pode ser copiado.

### 6. `01_SCOPE_AND_NON_GOALS.md`

Leia para entender o escopo.

Você vai alterar:
- a Home;
- componentes diretamente relacionados à Home;
- helpers necessários para esta nova Home.

Você NÃO deve sair alterando:
- autenticação;
- backend;
- rotas;
- outras páginas;
- API;
- integrações.

### 7. `02_HOME_REDESIGN_SPEC.md`

Este é o documento principal da nova Home.

Leia com atenção:
- KPIs;
- Saúde Financeira;
- Contas a pagar;
- Contas a receber;
- Histórico;
- Categorias;
- Top gastos;
- Alertas;
- Estados vazios.

### 8. `03_COMPONENTS_MAP.md`

Antes de criar qualquer componente novo, compare com os componentes já existentes.

A regra é:

**REUTILIZAR PRIMEIRO. CRIAR SÓ QUANDO NECESSÁRIO.**

### 9. `04_DATA_MAPPING.md`

Leia antes de mexer com dados.

Entenda:
- de onde cada indicador vem;
- quais cálculos já existem;
- como usar os hooks;
- quais helpers podem ser reaproveitados.

### 10. `05_DESIGN_SYSTEM_RULES.md`

Este arquivo é obrigatório antes de escrever CSS.

Regras principais:
- sem cor hardcoded;
- sem sombra em card;
- usar tokens;
- verde = ação;
- azul = informação/foco/link;
- laranja = alerta;
- gradiente só como detalhe;
- números com `tabular-nums`.

### 11. `06_RESPONSIVE_BEHAVIOR.md`

Leia antes de finalizar layout.

A Home precisa funcionar em:
- desktop amplo;
- desktop médio;
- tablet;
- mobile.

### 12. `07_ACCEPTANCE_CRITERIA.md`

Este é o checklist final.

Não considere a tarefa pronta sem validar cada item.

### 13. `09_SUGGESTED_FILE_CHANGES.md`

Use como orientação para saber quais arquivos provavelmente serão alterados.

Não trate como obrigação.

### 14. `10_HEALTH_SCORE_PROPOSAL.md`

Leia antes de implementar Saúde Financeira.

A fórmula está separada propositalmente.

Não coloque cálculo de score dentro do JSX.

### 15. `11_DESIGN_RECONCILIATION.md`

Leia para entender divergências já identificadas entre:
- Manual da Marca;
- Design System;
- Cockpit;
- imagem conceitual.

---

# 5. SÓ DEPOIS DISSO ANALISE O CÓDIGO

Agora sim entre no código atual.

Comece por:

- `app/src/pages/`
- `app/src/components/`
- `app/src/components/charts/`
- `app/src/hooks/`
- `app/src/context/`
- `app/src/styles/tokens.css`
- `app/src/styles/page.css`

Antes de editar, responda internamente:

1. Qual arquivo monta a Home atual?
2. Quais componentes ela já reutiliza?
3. Quais gráficos já existem?
4. Quais dados já vêm da API?
5. Quais métricas já têm helper?
6. Quais blocos realmente precisam ser novos?
7. Alguma alteração pode afetar outras páginas?

---

# 6. REGRAS DE IMPLEMENTAÇÃO

Durante o desenvolvimento:

## Nunca faça

- não chamar Conta Azul direto;
- não usar `fetch` dentro de componente;
- não hardcodar cor;
- não criar segundo Design System;
- não copiar literalmente o visual da imagem;
- não colocar sombra em card;
- não criar componente duplicado por papel;
- não inventar endpoint;
- não inventar dado;
- não alterar backend sem necessidade;
- não refatorar outras páginas sem motivo.

## Sempre faça

- usar `apiFetch`;
- usar hooks;
- usar tokens;
- reutilizar componentes;
- respeitar `PeriodContext`;
- respeitar `ClientContext`;
- respeitar `ThemeContext`;
- preservar master, analista e cliente;
- validar tema claro;
- validar tema escuro;
- validar responsividade.

---

# 7. PAPEL DA IMAGEM DE REFERÊNCIA

Arquivo:

`reference/home-financeira-conceito.png`

Use a imagem apenas para entender:

- ordem dos blocos;
- hierarquia;
- proporção;
- densidade;
- leitura rápida.

## Não copie da imagem:

- cor;
- sombra;
- tipografia;
- raio;
- gradiente;
- botões;
- estilo visual literal.

**Se a imagem conflitar com o Design System, o Design System vence.**

---

# 8. COMO A NOVA HOME DEVE FICAR

A leitura ideal da Home deve acontecer nesta ordem:

## 1. O que está acontecendo agora?
- Saldo
- Resultado
- Receitas
- Despesas
- Contas vencidas
- Inadimplência

## 2. A empresa está financeiramente saudável?
- Saúde Financeira
- score
- interpretação
- sinais principais

## 3. O operacional está em dia?
- Contas a pagar
- Contas a receber

## 4. Como a empresa vem performando?
- Receitas x Despesas
- Lucro/Prejuízo

## 5. Para onde está indo o dinheiro?
- Categorias
- Top gastos

## 6. O que merece atenção?
- Alertas
- Insights

---

# 9. ANTES DE ALTERAR QUALQUER ARQUIVO

Faça primeiro um pequeno plano contendo:

## Reutilizar
Liste componentes existentes que serão mantidos.

## Adaptar
Liste componentes existentes que precisam de ajustes.

## Criar
Liste somente os novos componentes realmente necessários.

## Dados
Liste quais dados já existem e quais precisam de cálculo.

## Riscos
Liste possíveis impactos em outras páginas.

Só depois disso comece a implementação.

---

# 10. VALIDAÇÃO FINAL

Antes de encerrar a tarefa:

Execute:

```bash
npm run build
npm run lint
```

Depois valide:

- Home em master;
- Home em analista;
- Home em cliente;
- seletor de cliente;
- seletor de período;
- tema claro;
- tema escuro;
- gráficos;
- estados vazios;
- valores;
- responsividade;
- ausência de regressões.

---

# 11. ENTREGA DO AGENTE

Ao finalizar, informe:

1. arquivos alterados;
2. componentes reutilizados;
3. componentes novos;
4. helpers novos;
5. alterações visuais;
6. alterações de dados;
7. itens não implementados;
8. possíveis pendências;
9. resultado de build;
10. resultado de lint.

---

# REGRA FINAL

**Não transforme esta tarefa em um redesign completo do Lucri Cockpit.**

O objetivo é:

**melhorar a Home atual sem quebrar a base existente.**
