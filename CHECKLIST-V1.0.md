# Checklist — Lucri Cockpit v1.0

Consolidado em 11/08/2026 a partir de `DECISOES-E-ESCOPO.md`,
`DEMANDAS-PARA-FINALIZAR.md`, `CHECKLIST-FRONTEND.md` e do que foi resolvido
nesta sessão. v1.0 = as 8 abas do escopo fechado (`DECISOES-E-ESCOPO.md`)
funcionando com dado real: Home, Ajustes, Entradas, Saídas, Despesas, Caixa,
Balanço, DRE.

**Atualizado em 11/09/2026** — revisão contra os commits de 10/09 (dado real
em Entradas/Saídas/Despesas/Caixa) e o trabalho de hoje na Home. As seções
"🟡 Telas não roteadas" e o CI/CD do backend do checklist original (11/08)
já foram resolvidos — ver "✅ Pronto" abaixo.

---

## ✅ Pronto

- [x] Auth completo (login, sessão, trocar senha, papéis master/analista/cliente)
- [x] Login com Google (12/08) — alternativa sem senha, só autentica e-mail
  já cadastrado. Falta só o botão no front — ver `API-CONTRACT.md`.
- [x] **Autocadastro de cliente por convite + Google (22/09)** — master
  reserva o e-mail (`POST /api/clientes/:id/convites`), a pessoa entra
  com Google e a conta é criada na hora, vinculada ao cliente certo,
  nome/sobrenome preenchidos automaticamente. Ver `API-CONTRACT.md`.
  Falta o front: botão de login Google + tela do master pra gerenciar
  convites.
- [x] Onboarding de cliente (cadastro, OAuth Conta Azul, criar login de cliente)
- [x] **Saldo em conta bancária (12/08)** — resolvido, endpoint próprio
  achado fora da doc oficial (`/conta-financeira/:id/saldo-atual`).
  `GET /home` já retorna `saldo` por conta + `saldo_total`.
- [x] **HOME** 100% real: Entradas, Saídas, Despesas (total e por categoria),
  Contas vencidas, Inadimplência, Receitas x Despesas histórico, Resultado
  histórico, Vencidas por mês, Saldo em Conta
- [x] **AJUSTES**: perfil, trocar senha, tema, conexões Conta Azul por
  cliente, cards visíveis na Home, cadastro de cliente, categorias de
  despesa (marcação manual, só master)
- [x] Backend: entradas, saídas, despesas, caixa, home, categorias,
  historico-mensal — todos com dado real, regime de caixa
- [x] Erro 409 `conta_azul_desconectada` tratado com mensagem amigável (Home)
- [x] Bug de paginação do Conta Azul corrigido (listas > 10 itens)
- [x] Bug de regime de caixa corrigido (valor vs. valor_pago)
- [x] CI/CD do backend (25/08) — GitHub Actions publica sozinho a cada
  push em `server/`, resolve o bug de "código no repo, não no ar" (achado
  na mesma sessão)
- [x] **DRE (25/08)** — `GET /api/clientes/:id/dre`, usa a estrutura
  oficial `financeiro/categorias-dre` do próprio Conta Azul (configurada
  pelo contador da empresa) em vez de regra própria. Falta só o front
  renderizar (tabela contábil hierárquica) — ver `PENDENCIAS-FRONTEND.md`.
- [x] **Esqueci minha senha por e-mail (22/09)** — `POST
  /api/auth/esqueci-senha` + `POST /api/auth/redefinir-senha`, token de
  60 min, e-mail enviado via API do Resend (ver `GUIA-RESEND-EMAIL.md`).
  Backend 100% configurado em produção. Falta só a tela `/redefinir-senha`
  no front.
- [x] **BALANÇO simplificado (22/09)** — `GET /api/clientes/:id/balanco`,
  ativo circulante (disponível + realizável) vs. passivo circulante, sem
  Patrimônio Líquido (decisão fechada com dev + contadora — ela não usa o
  Balanço do Conta Azul, e a API não expõe saldo patrimonial de qualquer
  forma). Resolve o bloqueador "Estrutura do BALANÇO" abaixo. Falta o
  front renderizar + avisar na tela que não é balanço contábil completo.
- [x] **Deploy automático do backend (CI/CD, 25/08)** — `.github/workflows/
  deploy-backend.yml` publica o `server/` sozinho a cada push em `main`,
  igual o front já faz com Cloudflare Pages.
- [x] **Limpar cliente de teste** — "Cliente Teste Playwright" (id 3)
  removido do banco de produção (12/08).
- [x] **ENTRADAS e SAÍDAS roteadas (10/09)** — já buscavam dado real
  (`useFinanceData`), só faltava saltar do `UnderConstructionPage`.
  Validado ponta a ponta contra produção (Nick Publicidade).
- [x] **DESPESAS e CAIXA reescritas pro schema real e roteadas (10/09)** —
  o mock antigo ia quebrar em runtime (Despesas classificava por
  "fixa/variável", conceito abandonado; Caixa tratava `entradas`/`saidas`
  como array quando já são `{lancamentos, totais}`). Reescritas no mesmo
  padrão de Entradas/Saídas.
- [x] **Saldo em conta renderizado na Home (10/09)** — o endpoint já
  existia desde 12/08, só faltava o front ligar. StatCard com breakdown
  por banco.
- [x] **Bug: Receitas por categoria podia somar >100% do total (10/09)** —
  `pago` por lançamento individual as vezes diverge do agregado
  `totais.pago.valor` pro mesmo período; ajuste proporcional.
- [x] **Bug: clipping do "R$" no eixo Y dos gráficos de barra (10/09)**.
- [x] **Delta "vs. período anterior" nos StatCards de Entradas/Saídas/Contas
  vencidas + faixas de atraso (Ageing) da inadimplência na Home (11/09)** —
  ainda não commitado nesta máquina.

---

## 🔴 Bloqueadores de v1.0 (faltam decisão + implementação)

- [ ] **Criar login do cliente na tela de Ajustes** — `handleAddClient` só
  cadastra o registro do cliente (`POST /api/clientes`, nome); não existe
  formulário de e-mail + senha inicial (`POST /api/clientes/:id/login`,
  só `master`) mencionado em `CHECKLIST-FRONTEND.md`. Pode estar
  superado pelo fluxo de convite + Google (22/09, ver `PENDENCIAS-FRONTEND.md`)
  — confirmar antes de construir os dois.

## ✳️ Achados novos de 23/09 (não bloqueiam v1.0, mas valem registro)

- [x] **Despesa passou a contar automático (23/09)** — antes só contava
  categoria marcada manualmente, e ninguém tinha marcado nenhuma ainda em
  produção (Despesas estava zerada pra todo mundo). Agora é automático por
  `tipo=DESPESA` do Conta Azul, com override manual por categoria pra
  exceção.
- [x] **Categoria master trocou de "por grupo do Conta Azul" pra "por
  despesa individual" (23/09)** — o agrupamento do Conta Azul mistura
  categorias sem relação dentro do mesmo grupo (ex: exame médico dentro de
  "Confraternizações"). Ajustes → Categorias de Despesa agora deixa
  escolher a categoria master ativa e marcar várias despesas de uma vez
  pra ela, em vez de 1 dropdown por grupo do Conta Azul.
- [ ] **Empréstimo pago e Antecipação de Lucros contam como despesa,
  mas não deveriam** — comparei `tipo=DESPESA` contra a árvore oficial de
  DRE do Conta Azul (Nick Publicidade, 120 categorias): `Antecipação de
  Lucros`, `Empréstimos de Bancos`, `Empréstimos de Outras Instituições` e
  `Empréstimos de Sócios` são movimentação de caixa/patrimônio, não custo
  operacional (só o juro do empréstimo é despesa de verdade, e esse —
  `Juros pagos` — nem está mapeado na DRE do contador ainda). É uma regra
  genérica (vale pra qualquer cliente), mas decisão adiada — ver mensagem
  do Augusto de 23/09.

## ✳️ Achados novos de 10/09 (não bloqueiam v1.0, mas valem registro)

- [ ] **NF-e e Contratos continuam bloqueados** (`/notas-fiscais`,
  `/contratos` retornam 400) — testados parâmetros de um projeto
  open-source de terceiro, nenhum resolveu. Não essencial pro v1.0.
- 🟡 **Limitação confirmada do Conta Azul**: contas a receber/pagar só
  filtram por `data_vencimento_de/ate` — não existe filtro por data de
  pagamento/recebimento/baixa/liquidação/competência. Título que vence
  num mês e é pago em outro não reconcilia 100% com o relatório nativo
  "Análise de recebimentos" deles. Não é bug nosso, é limitação da API
  pública — ver `ESCOPO-VISIBILIDADE-CONTA-AZUL.md` pro mapa completo.

## 🎯 Próximo

Divisão combinada em 11/09: back fica com o usuário, front continua aqui.
Lista completa (contrato de API, formato de resposta, exemplo de JSON) em
`PENDENCIAS-FRONTEND.md`, consolidado pelo dev em 22/09.

- [ ] **DRE — construir a tela**: backend pronto desde 25/08, árvore
  oficial do Conta Azul com subtotais em cascata. Falta o componente de
  tabela contábil hierárquica.
- [ ] **BALANÇO simplificado — construir a tela**: backend pronto (22/09),
  provavelmente o mesmo componente de tabela hierárquica do DRE, só mais
  simples (Ativo/Passivo, sem os níveis de subtotal do DRE). Avisar na
  tela que não é balanço contábil completo (decisão fechada com a
  contadora).
- [ ] **Esqueci minha senha — 2 telas**: pedir e-mail (chama
  `POST /api/auth/esqueci-senha`) e `/redefinir-senha?token=...` (chama
  `POST /api/auth/redefinir-senha`).
- [ ] **Login com Google + convites**: botão "Entrar com Google" na tela
  de login, e seção "Convites de acesso" em Ajustes (listar/criar/cancelar
  convite, só master).
- [ ] **Criar login do cliente** (front + back): pode estar superado pelo
  fluxo de convite + Google acima — confirmar antes de construir os dois.

## ⚪ Fora de escopo v1.0 / adiado (não bloqueia)

- [ ] Token do Conta Azul intermitente (Nick Publicidade) — já teve episódio
  antes, se resolveu sozinho; 409 tratado no front se acontecer de novo

---

## Referência

- Escopo fechado: `DECISOES-E-ESCOPO.md`
- Contrato de API: `API-CONTRACT.md`
- Pendências de frontend (DRE, Balanço, esqueci senha, login Google/convites): `PENDENCIAS-FRONTEND.md`
- Guia do Resend (e-mail transacional): `GUIA-RESEND-EMAIL.md`
- Histórico de bugs achados: `RELATORIO-BUGS-BACKEND-2026-08-11.md`
- Regras Conta Azul (competência/caixa/extrato): `RESUMO-DOCUMENTACAO-CONTAAZUL-2026-08-11.md`
