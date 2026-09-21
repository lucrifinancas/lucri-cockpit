# Diretrizes — Frontend

Leia `README.md` primeiro para contexto geral do projeto.

_Atualizado em 21/09/2026 com base no código de `app/src/`. Onde algo não foi
conferido no código, está marcado com "(verificar)"._

## Stack

React 19 + Vite (SPA), `react-router-dom` 7 (rotas), `recharts` (gráficos),
`@phosphor-icons/react` (ícones), `oxlint` (lint). Não usar HTML puro — decisão
explícita do usuário, diferente do dashboard de redes sociais (`../4.DASHBOARD/`),
que é multi-página HTML.

Comandos (dentro de `app/`): `npm run dev`, `npm run build`, `npm run lint`.

## Identidade visual

Seguir à risca o manual de marca — não inventar cor, fonte ou espaçamento fora dele:
`../1.MANUAL DA MARCA/MANUAL-DA-MARCA-LUCRI.md` (tokens em
`../1.MANUAL DA MARCA/SYSTEM-DESIGNER-LUCRI.md`).

Os tokens do Cockpit ficam em `app/src/styles/tokens.css` — **usar sempre as
variáveis (`--bg-panel`, `--text-primary`, `--cta`…), nunca cor solta** no CSS
de componente/página.

- **Tema claro é o padrão** (fundo branco, como os relatórios mensais que a
  Lucri já manda pros clientes — decisão explícita do usuário). O tema escuro
  existe como opção (`data-theme="dark"`, `context/ThemeContext.jsx`), mesma
  marca com as superfícies invertidas.
- Cores de identidade: Noite Profunda `#010116` (texto no tema claro), Verde
  Menta `#00EB85` (CTA/destaque), Céu Azul `#00D0F5` (accent/links), Branco
  Puro `#FFFFFF`. Estas **não mudam entre os temas**.
- Gradiente (`#00D0F5` → `#00EB85`): só como detalhe pontual (ícone, linha,
  borda de destaque) — nunca cobrindo uma seção inteira.
- Cores de gráfico (`--chart-*`): receita em verde, caixa/lucro em azul-céu,
  despesa em coral `#FF6B4A` (fora da paleta da marca, só pra gráfico, igual
  aos relatórios).
- Tipografia: **Inter em tudo** (títulos e corpo), como no `index.html` do
  Design System, carregada por Google Fonts em `app/index.html`. Números em
  tabelas e KPIs com `font-variant-numeric: tabular-nums`. A Ancress não é
  usada no Cockpit.
- Raios: `--radius-md` 12px, `--radius-lg` 20px, `--radius-pill` 999px.

## Duas visões, uma base de componentes

O produto tem visão interna (equipe Lucri, vê todos os clientes) e visão do
cliente final (vê só os próprios dados). As duas entram desde a v1, não é faseado.

Papéis (`src/auth/roles.js`, espelham o CHECK da tabela `usuarios` do backend):

- `master` e `analista` — equipe Lucri (`isInternalRole`). Mesmo acesso de
  visualização, escolhem qual cliente ver. **Só `master` cadastra cliente novo**
  e cria o login do cliente.
- `cliente` — empresário-cliente, vê só o próprio tenant, sem seletor de cliente.

Regras:
- Roteamento com guard por papel (`auth/AuthContext.jsx`, `auth/LoginPage.jsx`).
- Componentes de visualização (cards, gráficos, tabelas) desacoplados de qual
  perfil está logado — a diferença entre as visões é *quais dados* chegam e
  *que seletor de cliente* aparece (`context/ClientContext.jsx`), não um conjunto
  de componentes duplicado.

## Estrutura de `app/src/`

| Pasta | O que tem |
|---|---|
| `pages/` | Uma página por aba (Home, Entradas, Saídas, Despesas, Caixa, Balanço, DRE, Ajustes) |
| `components/` | `StatCard`, `DataTable`, `EntradasSummaryTable`, `PeriodSelector`, `ClientAvatar` |
| `components/charts/` | `ComparisonBarChart`, `HistoryBarChart`, `HorizontalBarChart`, `ProportionDonut` (+ `chartUtils.js`) |
| `context/` | `PeriodContext`, `ClientContext`, `ThemeContext` |
| `hooks/` | `useFinanceData`, `useHistoricoMensal`, `useHomeCardPrefs`, `useLocalProfile` |
| `api/` | `client.js` (`apiFetch`) — único ponto de chamada ao backend |
| `auth/` | Login, papéis, contexto de sessão |
| `layout/` | `AppLayout` (sidebar + área de conteúdo) |
| `styles/` | `tokens.css` (tokens), `page.css` (base das páginas) |
| `data/` | `mockFinance.js` — **nome legado**: hoje guarda os helpers de cálculo (`sumValores`, `groupByCategoria`, `computeDelta`, `previousRange`, paleta de categorias) |

Antes de criar componente novo, ver se um desses já resolve.

## Telas da v1

Abas (sidebar), mesmas nas duas visões, variando o escopo de dado. **As 8 abas
já estão roteadas** em `App.jsx` (`/`, `/entradas`, `/saidas`, `/despesas`,
`/caixa`, `/balanco`, `/dre`, `/ajustes`):

- **HOME** — resumo geral: seletor de cliente no topo (só visão interna) + blocos
  das outras abas resumidos. Cards personalizáveis (`useHomeCardPrefs`).
  Conteúdo definitivo ainda não fechado.
- **AJUSTES** — conexões (status da integração Conta Azul por cliente), tema,
  categorias, troca de senha e a tela admin de onboarding de cliente
  (cadastro → "Conectar Conta Azul" → criar login do cliente).
- **ENTRADAS** — receitas/recebimentos.
- **SAÍDAS** — visão bruta de tudo que sai do caixa (inclui transferência,
  investimento — não é só custo operacional).
- **DESPESAS** — subconjunto operacional das saídas (fixo + variável), o que
  compõe o DRE. **Tela distinta de SAÍDAS**, não uma variação de filtro.
- **CAIXA** — fluxo de caixa consolidado (entradas x saídas, saldo, projeção).
- **BALANÇO** — hoje só mostra um aviso "em aberto": estrutura (linhas de
  ativo/passivo/PL) ainda não definida.
- **DRE** — hoje só mostra um aviso apontando pro endpoint
  `GET /api/clientes/:id/dre`, que o backend já entrega com a estrutura oficial
  do Conta Azul (grupos, subgrupos, totalizadores em cascata).

BALANÇO e DRE são relatórios estruturados (linhas/subtotais): o caminho é um
componente de **tabela contábil hierárquica** reutilizável entre os dois, em vez
de cards soltos.

**Seletor de período** (`context/PeriodContext.jsx`, `components/PeriodSelector.jsx`):
presets + intervalo customizado, estado persistente, **abre sempre no mês
vigente** (não em "todos"). Toda tela de métrica reage à mudança de período.

## Camada de dados

Nunca chamar a API do Conta Azul direto do front — sempre via backend próprio
(ver `DIRETRIZES-BACKEND.md`). Todo fetch passa por `src/api/client.js`
(`apiFetch`) e pelos hooks (`hooks/`); nenhum componente de tela chama `fetch`
direto. O formato das respostas está em `API-CONTRACT.md`.

O front já foi trocado de dado mockado para a API real (verificar quais telas
ainda dependem de dado local antes de assumir). Ao ligar uma tela nova, seguir
o contrato, não o que o mock devolvia.

## Referências de padrão

**A base de padrão visual e de componentes é o Design System da Lucri:**
`../1.MANUAL DA MARCA/index.html` (abrir no navegador, de preferência com Live
Server — é a documentação viva). Antes de criar ou estilizar um componente,
ver como ele está resolvido lá e reproduzir em React; não inventar variação.

O que o `index.html` documenta (cada seção tem o código de referência):
- **Cores** — verde = ação principal, azul = links/foco/informação, Noite
  Profunda = estrutura, laranja = atenção.
- **Tipografia** — escala e números com `tabular-nums`.
- **Botões e inputs** — primary (só a ação mais importante do contexto),
  secondary, tertiary, destructive; campos, checkbox, radio e switch.
- **Navegação e overlays** — tabs, controle segmentado, menu, modal.
- **Dados financeiros** — KPIs, tabela, barras, badges e alertas
  (`good`/`bad`/`info`), a referência direta pra cards e tabelas do Cockpit.

Arquivos-fonte (copiar o valor, não redesenhar):
- `../1.MANUAL DA MARCA/css/tokens.css` — cores (escalas 50–900), espaçamento,
  raios, sombras, durações e easing, mais o tema escuro.
- `../1.MANUAL DA MARCA/css/components.css` — o CSS de cada componente.
- `../1.MANUAL DA MARCA/SYSTEM-DESIGNER-LUCRI.md` — as regras por trás
  (fonte de verdade, fechada em 17/09/2026).

O `app/src/styles/tokens.css` do Cockpit é a tradução desses tokens pro React.
Se um token divergir do design system, **o design system vence**: corrigir o
Cockpit, não o contrário.

**Atenção — tipografia:** o Cockpit segue o `index.html` (**Inter**). O
`SYSTEM-DESIGNER-LUCRI.md` ainda fala em **Instrument Sans** (com Ancress Bold só
pra logo e material institucional), então esse arquivo está desalinhado do
`index.html` e precisa ser corrigido lá.

Outras referências (só de comportamento, não de implementação): o dashboard de
redes sociais (`../4.DASHBOARD/app/`, HTML puro) e `REFERENCIAS-UI-DASHBOARD.md`.

## Em aberto

Ver seção "Em aberto" do `DECISOES-E-ESCOPO.md`. Destaque para o front:
- **BALANÇO:** estrutura exata de linhas/subtotais — não fixar o layout até a
  definição chegar (checar se há endpoint de categorias de balanço no Conta Azul,
  como resolveu o DRE).
- **DRE:** falta construir a tabela a partir do endpoint que já existe.
- **HOME:** conteúdo definitivo ainda não fechado.
- **`SYSTEM-DESIGNER-LUCRI.md`** cita Instrument Sans, mas o `index.html` do
  Design System usa Inter — alinhar o documento.
- Se a categorização fixo/variável de DESPESAS exigir tela de mapeamento própria
  (provavelmente não, o Conta Azul já traz `entrada_dre`), isso adiciona uma tela
  de configuração por cliente.

Hospedagem decidida: GitHub + Cloudflare (Pages pro front, Workers + D1 pro
backend) — ver `DECISOES-E-ESCOPO.md`.
