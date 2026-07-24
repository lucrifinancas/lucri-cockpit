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
- [ ] **AJUSTES → onboarding de cliente** (só visível pra `master`/`analista`)
  — tela de cadastrar cliente novo e iniciar a autorização OAuth ⏳ (depende
  do endpoint de onboarding no backend)
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

## Aguardando o backend (não bloqueia começar, mas fixar API contract antes de fechar componentes de dado)

- [ ] `API-CONTRACT.md` — formato de request/response de cada endpoint
- [ ] Endpoint de login (autenticação de usuário da aplicação)
- [ ] Endpoint de onboarding de cliente (cadastro + OAuth Conta Azul)
- [ ] Endpoints de dados reais por aba (hoje só banco de usuários e conexões
  existem; dados do Conta Azul ainda não têm rota própria no backend)

## Em aberto — não fixar layout ainda

- Conteúdo definitivo da HOME
- Categorização fixo/variável de DESPESAS (pode virar tela extra de
  mapeamento por cliente)
- Estrutura de linhas/subtotais de BALANÇO e DRE
