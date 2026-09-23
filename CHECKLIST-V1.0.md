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
  já cadastrado (não cria conta nova). Falta só o botão no front — ver
  `API-CONTRACT.md`.
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
  renderizar (tabela contábil hierárquica) — ver bloco "Próximo" abaixo.
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

- [ ] **Estrutura do BALANÇO** — decidir linhas/subtotais (ativo circulante/
  não circulante, passivo, PL) antes de fixar layout ou construir endpoint.
  Confirmado em 10/09 (`ESCOPO-VISIBILIDADE-CONTA-AZUL.md`): ainda não
  verificamos se existe um `financeiro/categorias-balanco` ou equivalente
  no Conta Azul, no mesmo espírito do que resolveu o DRE — **próximo passo
  óbvio antes de desenhar a tela**.
- [ ] **Criar login do cliente na tela de Ajustes** — `handleAddClient` só
  cadastra o registro do cliente (`POST /api/clientes`, nome); não existe
  formulário de e-mail + senha inicial (`POST /api/clientes/:id/login`,
  só `master`) mencionado em `CHECKLIST-FRONTEND.md`. Segue sem UI.

## 🟢 Configuração pendente (não é código, é ação manual)

- [ ] **Marcar categorias de Despesa por cliente** — o backend/front estão
  prontos, mas não dá pra confirmar de código se alguém já marcou alguma
  categoria pra algum cliente (Ajustes → Categorias de Despesa). Sem isso,
  Despesas aparece zerada pra esse cliente. Verificar pelo menos pra Nick
  Publicidade.

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

- [ ] **DRE — construir a tela** (frontend, desbloqueado): backend pronto
  desde 25/08 (`GET /api/clientes/:id/dre`, árvore oficial do Conta Azul
  com subtotais em cascata). Falta só o componente de tabela contábil
  hierárquica (`linhas`/`subitens`) mencionado em `CHECKLIST-FRONTEND.md`.
  Candidato óbvio a próxima tela — não depende de nenhuma decisão pendente.
- [ ] **BALANÇO — checar `financeiro/categorias-balanco` no Conta Azul**
  (backend): mesma estratégia que resolveu o DRE. Sem isso, a tela
  continua sem poder ser desenhada.
- [ ] **Criar login do cliente** (front + back): decidir se entra no
  formulário de Ajustes agora ou fica pra depois do v1.0 — hoje cadastro
  de cliente e criação de login são passos manuais separados sem UI pro
  segundo.

## ⚪ Fora de escopo v1.0 / adiado (não bloqueia)

- [ ] Esqueci minha senha por e-mail (ver `GUIA-MAKE-RESET-SENHA.md`) —
  troca de senha estando logado já existe
- [ ] Token do Conta Azul intermitente (Nick Publicidade) — já teve episódio
  antes, se resolveu sozinho; 409 tratado no front se acontecer de novo

---

## Referência

- Escopo fechado: `DECISOES-E-ESCOPO.md`
- Contrato de API: `API-CONTRACT.md`
- Histórico de bugs achados: `RELATORIO-BUGS-BACKEND-2026-08-11.md`
- Regras Conta Azul (competência/caixa/extrato): `RESUMO-DOCUMENTACAO-CONTAAZUL-2026-08-11.md`
