# Checklist — Frontend (v1)

Baseado em `DIRETRIZES-FRONTEND.md` e no progresso atual do backend. Marcar
conforme for concluindo — itens com ⏳ dependem de algo que o backend ainda
vai entregar.

## Setup

- [ ] Puxar (`git pull`) as últimas mudanças do repositório (backend já tem
  esqueleto rodando, banco de dados criado)
- [ ] Criar seu usuário de login (`master`) rodando localmente:
  `node scripts/criar-usuario.mjs SEU_EMAIL master SUA_SENHA remoto`
  (dentro da pasta `server/`, com o `wrangler` autenticado na conta Cloudflare
  da Lucri)

## Estrutura base

- [ ] Roteamento com guard por papel (`master`/`analista` vs `cliente`) desde
  o início — ver seção "Duas visões, uma base de componentes"
- [ ] Camada de dados isolada (`src/api/` ou equivalente) — nenhum componente
  de tela deve chamar fetch diretamente; tudo passa por hooks/services
  próprios, prontos pra trocar mock por dado real sem reescrever telas
- [ ] Aplicar identidade visual (cores/fontes do manual de marca) na base de
  layout (sidebar, tema escuro por padrão)

## Telas (sidebar)

- [ ] **HOME** — layout provisório (conteúdo final ainda não fechado, ver
  "Em aberto")
- [ ] **AJUSTES** — configurações + status das conexões Conta Azul por
  cliente + tema
- [ ] **AJUSTES → onboarding de cliente** (endpoints já prontos e testados,
  ver `API-CONTRACT.md`):
  - [ ] Cadastrar cliente novo (`POST /api/clientes`) — visível pra
    `master`/`analista`
  - [ ] Botão "Conectar Conta Azul" — chama `GET /api/contaazul/autorizar/:id`
    e redireciona o navegador pra URL retornada (não é fetch comum, é
    navegação de página inteira)
  - [ ] Ler `?contaazul=sucesso`/`erro` na URL ao carregar Ajustes (é pra
    onde o backend redireciona depois do OAuth) e mostrar aviso
  - [ ] Criar login do cliente (`POST /api/clientes/:id/login`) — **só
    `master`** pode; formulário de e-mail + senha inicial, que precisa ser
    repassada ao cliente por fora do sistema (WhatsApp, etc — não existe
    envio automático ainda)
- [ ] **AJUSTES → Meu perfil**: campo de trocar a própria senha
  (`POST /api/auth/alterar-senha`) — pede senha atual + nova senha
- [ ] **ENTRADAS** — pode começar com dado mockado
- [ ] **SAÍDAS** — pode começar com dado mockado (visão bruta, não confundir
  com DESPESAS)
- [ ] **DESPESAS** — pode começar com dado mockado, mas **não fixar o layout
  final** até a categorização fixo/variável ser confirmada (ver "Em aberto")
- [ ] **CAIXA** — pode começar com dado mockado
- [ ] **BALANÇO** — **aguardar definição de estrutura** antes de fixar layout
  (relatório contábil hierárquico, não cards soltos)
- [ ] **DRE** — mesma observação do BALANÇO ⏳

## Componentes transversais

- [ ] Seletor de período (presets + intervalo customizado, estado
  persistente) — usado em toda tela de métrica
- [ ] Seletor de cliente no topo (só na visão `master`/`analista` — cliente
  final não vê esse seletor, já que seu login é vinculado a 1 único tenant)
- [ ] Toggle de tema

## Backend — status atual (tudo testado com dados reais)

- [x] `API-CONTRACT.md` — formato de request/response de cada endpoint
- [x] Login/sessão, `/me`, logout, trocar senha
- [x] Onboarding de cliente (cadastro + OAuth Conta Azul + criar login do
  cliente)
- [x] HOME, ENTRADAS, SAÍDAS, CAIXA — dados reais do Conta Azul
- [ ] DESPESAS, DRE, BALANÇO — bloqueados (ver "Em aberto")

**Beta 1 (foco atual): só HOME e AJUSTES precisam sair do mock.** Ver
`GUIA-INTEGRACAO-DADOS-REAIS.md` — passo a passo arquivo por arquivo do que
trocar, incluindo duas lacunas de dado (saldo por conta, classificação
recorrente/pontual) que não têm origem real ainda.

## 🐛 Correções pendentes (achadas no relatório de bugs de 11/08)

- [x] **Totais somando valor errado** — corrigido em `00fb1bd`.
  `SaidasPage.jsx`, `EntradasPage.jsx` e a Home agora somam `valor_pago`
  por lançamento e usam `totais.pago.valor` (não `totais.todos`) nos cards
  agregados. Ver seção "⚠️ Regime de caixa" no topo do `API-CONTRACT.md`.
- [x] **Tratar erro `409 conta_azul_desconectada`** — corrigido em `00fb1bd`.
  A Home captura esse caso e mostra "A conexão desse cliente com o Conta
  Azul caiu — precisa reconectar", com link pra Ajustes (mesma UI do caso
  "nunca conectou").

## Em aberto — não fixar layout ainda

- Conteúdo definitivo da HOME
- Estrutura de linhas/subtotais de BALANÇO e DRE
- **Gráfico "Contas a receber vencidas por mês"** — já é dado real (11/08,
  `GET /historico-mensal`).
- **"Receitas x Despesas — Histórico mensal" e "Resultado histórico
  (lucro/prejuízo)"** — continuam mockados. A categorização de DESPESAS já
  saiu do papel (backend + front, 11/08), mas o endpoint
  `/historico-mensal` só agrega "vencidas" por mês ainda — falta estender
  pra somar receita/despesa por mês também (o endpoint já busca contas a
  receber numa janela larga, só falta fazer o mesmo pra contas a pagar
  filtradas por categoria de despesa e juntar no mesmo agrupamento).
