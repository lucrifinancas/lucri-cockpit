# Diretrizes — Frontend

Leia `README.md` primeiro para contexto geral do projeto.

## Stack

React + Vite (SPA). Não usar HTML puro — decisão explícita do usuário, diferente
do dashboard de redes sociais (`4.DASHBOARD/2.0/`), que é multi-página HTML.

## Identidade visual

Seguir à risca o manual de marca — não inventar cor, fonte ou espaçamento fora dele:
`../1.MANUAL DA MARCA/MANUAL-DA-MARCA-LUCRI.md`

- Fundo padrão: Noite Profunda `#010116` (sólido — nunca gradiente como fundo).
- Destaque/CTA: Verde Menta `#00EB85`.
- Accent/links: Céu Azul `#00D0F5`.
- Texto em fundo escuro: Branco Puro `#FFFFFF`.
- Gradiente (`#00D0F5` → `#00EB85`): só como detalhe pontual (ícone, linha,
  borda de destaque) — nunca cobrindo uma seção inteira.
- Títulos: Ancress Bold/Regular. Corpo/UI: Montserrat (Regular/SemiBold/Bold).

## Duas visões, uma base de componentes

O produto tem visão interna (equipe Lucri, vê todos os clientes) e visão do
cliente final (vê só os próprios dados). MVP definido: **as duas entram desde já**,
não é faseado. Montar:

- Roteamento com guard por role (`equipe_lucri` vs `cliente`) desde o início.
- Componentes de visualização (cards, gráficos, tabelas) desacoplados de qual
  perfil está logado — a diferença entre as visões é *quais dados* chegam e
  *que seletor de cliente* aparece (equipe Lucri escolhe qual cliente ver, já que
  cada cliente é uma conexão própria no Conta Azul; cliente final não tem esse
  seletor, vê só o próprio tenant), não um conjunto de componentes duplicado.

## Telas da v1

Escopo final de abas (sidebar), mesmas nas duas visões, variando o escopo de dado:
- **HOME** — resumo geral. Proposta inicial: seletor de cliente no topo (só na
  visão interna) + os blocos das outras abas resumidos (saldo de caixa, situação
  de entradas/saídas do período, contas a vencer). Ainda não fechado, ver
  conversa anterior no histórico do projeto.
- **AJUSTES** — configurações: conexões (status da integração Conta Azul por
  cliente), tema, e a tela admin de onboarding de cliente (só `equipe_lucri`).
- **ENTRADAS** — receitas/recebimentos.
- **SAÍDAS** — visão bruta de tudo que sai do caixa (inclui transferência,
  investimento — não é só custo operacional).
- **DESPESAS** — subconjunto operacional das saídas (fixo + variável), o que
  compõe o DRE. **Tela distinta de SAÍDAS**, não uma variação de filtro da mesma.
- **CAIXA** — fluxo de caixa consolidado (entradas x saídas, saldo, projeção).
- **BALANÇO** — balanço patrimonial. Layout ainda não detalhado (ver "Em aberto").
- **DRE** — demonstrativo de resultado completo. Layout ainda não detalhado
  (ver "Em aberto").

Consultar `API-CONTRACT.md` (a ser criado pelo back) para o formato exato de
cada uma antes de fixar os componentes de card/gráfico — em especial BALANÇO e
DRE, que são relatórios estruturados (linhas/subtotais), prováveis candidatos a
um componente de "tabela contábil hierárquica" reutilizável entre os dois, em
vez de cards soltos como as demais abas.

**Seletor de período confirmado como completo** (presets + intervalo customizado,
estado persistente) — não é "só mês atual". Toda tela de métrica reage à mudança
de período, igual ao padrão do dashboard de redes sociais (ver seção de
referências abaixo).

**Tela admin de onboarding** (só visível pra `equipe_lucri`): cadastrar cliente
novo e conduzir a autorização OAuth com o Conta Azul dele. Faz parte da v1, não
é um extra — ver `DIRETRIZES-BACKEND.md` para os endpoints correspondentes.

## Camada de dados

Nunca chamar a API do Conta Azul direto do front — sempre via backend próprio
(ver `DIRETRIZES-BACKEND.md`). Isolar todo fetch em hooks/services próprios
(ex. `src/api/`), para trocar mock por integração real sem tocar nos componentes
de tela.

Enquanto o contrato do backend (`API-CONTRACT.md`) não existir, construir contra
dado mockado local, mas já na mesma forma dos hooks que vão chamar a API depois.

## Referências úteis de padrão (não copiar código, só o padrão)

O dashboard de redes sociais (`4.DASHBOARD/2.0/`) já resolveu alguns problemas de
UX que provavelmente se repetem aqui — vale olhar como referência de comportamento,
não de implementação (lá é HTML puro, aqui é React):
- Seletor de período (`2.0/dashboard/period.js`) — presets + intervalo customizado,
  estado persistente.
- Toggle de tema (`2.0/dashboard/shell.js`).

## Em aberto

Ver seção "Em aberto" do `DECISOES-E-ESCOPO.md`. Destaque para o front:
- Se a categorização fixo/variável de DESPESAS exigir uma tela de mapeamento
  própria (ainda não confirmado), isso adiciona uma tela extra de configuração
  por cliente — evitar fixar o layout de DESPESAS/DRE até isso ser esclarecido.
- Estrutura exata de linhas/subtotais de BALANÇO e DRE — evitar fixar esses
  layouts até a definição chegar.
- Conteúdo definitivo da HOME ainda não fechado (proposta acima é ponto de
  partida, não confirmado).

Acesso à API do Conta Azul e hospedagem/deploy seguem pendentes, mas não
impedem começar com dado mockado nas abas já claras (ENTRADAS, SAÍDAS, CAIXA,
AJUSTES).
