# Dashboard Financeiro — Lucri

Painel financeiro da Lucri, dois times trabalhando em paralelo (1 dev back, 1 dev front).
Este documento é o ponto de entrada — leia antes de abrir `DIRETRIZES-BACKEND.md` ou
`DIRETRIZES-FRONTEND.md`.

Não confundir com o dashboard de métricas de redes sociais (`4.DASHBOARD/2.0/`) — são
projetos separados, sem código compartilhado.

## O que é

Painel que mostra os números financeiros dos clientes que a Lucri atende (BPO Financeiro,
Controladoria, Consultoria), alimentado pela API do Conta Azul.

**Dois públicos, um produto:**
- **Visão interna (equipe Lucri)** — acompanha todos os clientes atendidos.
- **Visão do cliente final** — cada empresário-cliente loga e vê só os próprios números.

## Stack decidida

- **Front:** React + Vite (SPA)
- **Back:** a definir pelo dev de back — ver `DIRETRIZES-BACKEND.md`
- **Fonte de dados:** API do Conta Azul (OAuth)

## Identidade visual

Já existe manual de marca pronto — usar as cores e fontes oficiais, não inventar paleta nova:
`../1.MANUAL DA MARCA/MANUAL-DA-MARCA-LUCRI.md`

| Cor | Hex |
|---|---|
| Noite Profunda (fundo) | `#010116` |
| Verde Menta (destaque/CTA) | `#00EB85` |
| Céu Azul (accent/links) | `#00D0F5` |
| Branco Puro (texto em fundo escuro) | `#FFFFFF` |

Fontes: **Ancress** (títulos) + **Montserrat** (corpo/UI).

## Decisões fechadas

- **MVP:** as duas visões (interna e cliente final) entram desde já — não faseado.
- **Modelo de tenant:** cada cliente da Lucri tem sua própria conexão/conta no
  Conta Azul (não é conta única segmentada por tag).
- **Abas da v1 (escopo final, confirmado):**
  - **HOME** — visão geral/resumo (ver proposta de conteúdo mais abaixo neste doc).
  - **AJUSTES** — configurações (conexões, dados do cliente, tema — padrão a
    definir com o front, na linha do `ajustes.html` do dashboard de redes sociais).
  - **ENTRADAS** — receitas/recebimentos.
  - **SAÍDAS** — visão bruta de tudo que sai do caixa (inclui transferências,
    investimentos, qualquer débito — não é só custo operacional).
  - **DESPESAS** — subconjunto operacional das saídas, especificamente o que
    compõe o resultado/DRE (custo fixo + variável).
  - **CAIXA** — fluxo de caixa (entradas x saídas consolidadas, saldo, projeção).
  - **BALANÇO** — balanço patrimonial (ativo, passivo, patrimônio líquido).
  - **DRE** — demonstrativo de resultado completo.

  Isso substitui a lista anterior de 3 métricas — **DRE volta a entrar na v1**
  (antes tinha ficado de fora). SAÍDAS e DESPESAS são telas distintas: SAÍDAS é a
  visão bruta de caixa, DESPESAS é a categoria operacional que alimenta o DRE.
- **Seletor de período:** sim, completo (presets + intervalo customizado) — igual
  ao padrão já usado no dashboard de redes sociais (`4.DASHBOARD/2.0/period.js`),
  não só "mês atual".
- **Multiusuário por cliente:** não — 1 login por cliente-empresa, sem múltiplas
  pessoas da mesma empresa acessando (simplifica o modelo de auth).
- **Onboarding de cliente novo:** feito por **tela admin dentro do próprio
  dashboard** — a equipe Lucri cadastra o cliente e autoriza a conexão OAuth com
  o Conta Azul direto pela interface (não é cadastro manual no banco). Isso é
  parte da v1, não um extra.
- **Hospedagem/deploy:** GitHub (repositório) + Cloudflare (Workers pro backend,
  D1 como banco de dados) — ver `DIRETRIZES-BACKEND.md` para as implicações
  técnicas (runtime não é Node/Express tradicional).

## Em aberto — não decidido ainda

- **Credenciais/acesso da API do Conta Azul** — usuário ainda vai solicitar o
  acesso de desenvolvedor. Até isso chegar, construir com mock por trás da mesma
  interface (ver `DIRETRIZES-BACKEND.md`).
- **Origem da categorização fixo/variável para DESPESAS/DRE** — ainda não se sabe
  se o Conta Azul já traz essa categorização pronta nas contas dos clientes, ou
  se o dashboard vai precisar de uma tela própria para mapear categorias em
  fixo/variável, cliente por cliente. **Isso pode mudar o modelo de dados do
  backend e as telas de DESPESAS e DRE no front — verificar antes de fechar
  esse schema.**
- **Estrutura exata do BALANÇO e do DRE** — ainda não detalhamos quais linhas/
  contas entram em cada um (ex: BALANÇO com ativo circulante/não circulante
  detalhado? DRE com quantos níveis de subtotal?). Layout dessas duas telas deve
  esperar essa definição.

Enquanto o acesso ao Conta Azul não chega, trabalhar com dado mockado e manter a
camada de dados isolada (repositório/service layer no back, hooks de fetch no
front) pra trocar por integração real sem reescrever telas.
