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

- **Credenciais/acesso da API do Conta Azul** — já confirmado e mapeado em
  `DADOS-CONTA-AZUL-API.md`. Falta só a integração real (front/back seguem
  em dado mockado no formato correto).
- **Origem da categorização fixo/variável para DESPESAS/DRE** — o Conta Azul
  já traz `entrada_dre` pronto por categoria (ver `DADOS-CONTA-AZUL-API.md`),
  então não deve precisar de tela própria de mapeamento — mas vale confirmar
  antes de fechar o schema de DESPESAS/DRE de vez.
- **Estrutura exata do BALANÇO e do DRE** — ainda não detalhamos quais linhas/
  contas entram em cada um (ex: BALANÇO com ativo circulante/não circulante
  detalhado? DRE com quantos níveis de subtotal?). Layout dessas duas telas deve
  esperar essa definição.
- **Saldo por conta bancária** — o payload documentado de `GET /conta-financeira`
  não tem campo de saldo; confirmar com o Conta Azul se existe em outro
  campo/endpoint ou se precisa ser calculado.

Enquanto o acesso ao Conta Azul não é integrado de fato, front e back seguem
com dado mockado no formato real, mantendo a camada de dados isolada
(repositório/service layer no back, hooks de fetch no front) pra trocar por
integração real sem reescrever telas.
