# Decisões e escopo — Lucri Cockpit

Log técnico de decisões fechadas e pendências em aberto do projeto. Antes
reunidas no `README.md`, movidas pra cá pra manter o README como vitrine
do projeto — este arquivo é a referência técnica de escopo pros devs.

## Decisões fechadas

- **MVP:** as duas visões (interna e cliente final) entram desde já — não faseado.
- **Modelo de tenant:** cada cliente da Lucri tem sua própria conexão/conta no
  Conta Azul (não é conta única segmentada por tag).
- **Abas da v1 (escopo final, confirmado):**
  - **HOME** — visão geral/resumo.
  - **AJUSTES** — configurações (conexões, perfil, tema, onboarding de cliente).
  - **ENTRADAS** — receitas/recebimentos.
  - **SAÍDAS** — visão bruta de tudo que sai do caixa (inclui transferências,
    investimentos, qualquer débito — não é só custo operacional).
  - **DESPESAS** — subconjunto operacional das saídas, especificamente o que
    compõe o resultado/DRE (custo fixo + variável).
  - **CAIXA** — fluxo de caixa (entradas x saídas consolidadas, saldo, projeção).
  - **BALANÇO** — balanço patrimonial (ativo, passivo, patrimônio líquido).
  - **DRE** — demonstrativo de resultado completo.

  SAÍDAS e DESPESAS são telas distintas: SAÍDAS é a visão bruta de caixa,
  DESPESAS é a categoria operacional que alimenta o DRE.
- **Seletor de período:** completo (presets + intervalo customizado), não só
  "mês atual" — padrão já mockado no front, default é o mês vigente.
- **Multiusuário por cliente:** não — 1 login por cliente-empresa, sem múltiplas
  pessoas da mesma empresa acessando (simplifica o modelo de auth).
- **Onboarding de cliente novo:** feito por **tela admin dentro do próprio
  dashboard** — a equipe Lucri cadastra o cliente e autoriza a conexão OAuth com
  o Conta Azul direto pela interface (não é cadastro manual no banco). Isso é
  parte da v1, não um extra.
- **Hospedagem/deploy:** GitHub (repositório) + Cloudflare (Pages pro front,
  Workers pro backend, D1 como banco de dados) — ver `DIRETRIZES-BACKEND.md`
  para as implicações técnicas (runtime não é Node/Express tradicional).
- **Beta 1 (escopo desta fase):** só **HOME** e **AJUSTES** — as demais abas já
  têm páginas com dado mockado prontas em `app/src/pages/`, mas não roteadas
  de propósito; ficam pra próxima fase.

## Em aberto — não decidido ainda

**Atualizado em 22/09** — a maior parte desta seção já foi resolvida desde a
versão original (24/07); ver `CHECKLIST-V1.0.md` pro status corrente.

- ~~Credenciais/acesso da API do Conta Azul~~ — **resolvido.** Integração real
  em produção desde 10/09 (Home, Entradas, Saídas, Despesas, Caixa, DRE);
  front/back não dependem mais de mock.
- ~~Origem da categorização fixo/variável para DESPESAS/DRE~~ — **resolvido
  (11/08 e 25/08).** DESPESAS usa marcação manual por categoria (Ajustes →
  Categorias de Despesa, ver `API-CONTRACT.md`); DRE usa a árvore oficial
  `entrada_dre`/`categorias-dre` do próprio Conta Azul.
- ~~Saldo por conta bancária~~ — **resolvido (12/08).** Endpoint próprio
  `GET /conta-financeira/:id/saldo-atual`, exposto em `GET /api/clientes/:id/home`
  (`saldo` por conta + `saldo_total`).
- **Estrutura exata do BALANÇO** — ainda em aberto, único item real
  pendente desta lista. Vale checar primeiro se existe um
  `financeiro/categorias-balanco` ou equivalente no Conta Azul, no mesmo
  espírito do que resolveu o DRE, antes de fixar layout ou endpoint.
