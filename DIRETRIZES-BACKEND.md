# Diretrizes — Backend

Leia `README.md` primeiro para contexto geral do projeto.

O código do backend fica em `server/` (irmã da pasta `app/` do front) —
ver `server/README.md` pra estrutura sugerida.

## Responsabilidade do backend

O backend é a camada entre o Conta Azul e o front. O front nunca fala direto com a
API do Conta Azul — client secret e token de OAuth não podem existir no navegador.

Responsabilidades:
1. **Autenticação OAuth com o Conta Azul** (fluxo de authorization code, refresh token,
   armazenamento seguro do token — nunca no front, nunca em texto puro em log).
2. **Multi-tenant** — decidido: **1 conexão/conta Conta Azul por cliente** da Lucri
   (não é conta única segmentada por tag). O schema deve modelar cada cliente com
   suas próprias credenciais/tokens OAuth armazenados isoladamente, e o backend
   precisa saber, por requisição, para qual cliente buscar dado.
3. **Autenticação de usuários da própria aplicação** — dois perfis, ambos entram
   na v1 (MVP definido: as duas visões desde já):
   - `equipe_lucri` — acesso a todos os clientes atendidos, com seletor de qual
     cliente visualizar.
   - `cliente` — acesso só aos próprios dados (implícito pelo tenant do login,
     sem seletor). **1 login por cliente-empresa** — não precisa suportar
     múltiplos usuários por tenant, simplifica o relacionamento usuário↔cliente
     (pode ser 1:1 em vez de N:1).
   Modelar como roles/permissions desde o início.
4. **Normalização dos dados** do Conta Azul para os formatos que o front consome
   (evitar o front lidar com a forma bruta da API externa — isso muda se o Conta
   Azul mudar o contrato deles). V1 cobre 8 abas: HOME, AJUSTES, ENTRADAS, SAÍDAS,
   DESPESAS, CAIXA, BALANÇO, DRE — ver `DECISOES-E-ESCOPO.md`. Atenção especial a:
   - **SAÍDAS vs. DESPESAS são endpoints/modelos distintos** — SAÍDAS é toda
     movimentação de débito do caixa (inclui transferência, investimento, etc.);
     DESPESAS é só o subconjunto operacional (fixo + variável) que alimenta o DRE.
     Não tratar como o mesmo dado com filtro diferente — a fonte de categorização
     pode ser diferente (ver "Em aberto").
   - **BALANÇO e DRE** são relatórios contábeis estruturados (linhas/subtotais
     hierárquicos), não apenas listas de lançamentos — provavelmente exigem mais
     trabalho de normalização do que ENTRADAS/SAÍDAS/CAIXA.
   - **Saldo por conta bancária** — a HOME mostra (hover no card "Saldo em
     conta") o detalhamento por conta. O payload documentado de
     `GET /conta-financeira` não tem campo de saldo (ver
     `DADOS-CONTA-AZUL-API.md`) — confirmar se existe em outro
     campo/endpoint ou se precisa ser calculado, e normalizar cada conta
     já com `saldo` antes de expor pro front.
   **Endpoints também precisam suportar filtro por período** (presets + intervalo
   customizado — não só "mês atual"), já que o seletor de período completo foi
   confirmado para a v1.
5. **Cache/sincronização** — decidir se os dados são buscados on-demand ou
   sincronizados periodicamente (polling/webhook) para não estourar rate limit da
   API do Conta Azul. Fica mais relevante aqui porque são N conexões (uma por
   cliente), não uma só.
6. **Onboarding de cliente (admin)** — expor endpoints para a equipe Lucri
   cadastrar um cliente novo e conduzir o fluxo OAuth de autorização com o Conta
   Azul dele diretamente pela interface (ver seção abaixo). Isso é parte da v1,
   não um extra a mais.

## Onboarding de cliente (admin)

Decidido: cadastro de cliente novo e autorização da conexão Conta Azul acontecem
por **tela admin dentro do próprio dashboard**, não por cadastro manual no banco.
O backend precisa expor o fluxo completo: criar registro do cliente, iniciar o
OAuth redirect pro Conta Azul daquele cliente específico, receber o callback e
persistir o token vinculado ao cliente correto. Ver `DIRETRIZES-FRONTEND.md` para
a tela correspondente.

## Hospedagem/deploy (decidido)

- **Repositório:** GitHub.
- **Runtime:** Cloudflare (Workers) — **não** Node.js/Express tradicional.
  Isso importa pro código: bibliotecas que dependem de Node puro (ex.
  `express-session`, `connect-pg-simple`, qualquer coisa com filesystem)
  não rodam nesse runtime. Usar um framework compatível com Workers
  (ex. Hono) e sessão via cookie assinado/JWT em vez de session store
  tradicional.
- **Banco de dados:** **Cloudflare D1** (SQLite gerenciado pela própria
  Cloudflare) — guarda tanto os tokens OAuth por cliente (multi-tenant,
  ver acima) quanto usuários/sessões da aplicação. Não é Postgres — schema
  e queries devem respeitar o dialeto SQLite do D1 (sem tipos avançados de
  Postgres, `JSON`/`ARRAY` nativos etc.).
- Consequência prática: o fluxo OAuth do Conta Azul (guardar/renovar
  refresh token por cliente) e a autenticação de usuário da aplicação
  (item 3 acima) devem ser desenhados já pensando em D1 + Workers desde o
  início do schema, não como migração posterior.

## Isolamento da integração externa

Colocar toda a lógica específica do Conta Azul atrás de uma camada própria
(ex.: `contaazul/` como módulo isolado, com uma interface própria pro resto do
backend consumir). Isso é o que permite trocar de fonte de dados no futuro (outro
ERP, ou dado mockado em dev) sem tocar no resto da aplicação.

## Ambiente e segredos

- Credenciais do Conta Azul (client ID/secret, tokens) sempre via variáveis de
  ambiente — nunca commitadas.
- Enquanto o acesso à API não for confirmado pelo usuário, construir com um mock
  da resposta do Conta Azul por trás da mesma interface, pra frontend e backend
  avançarem em paralelo sem bloquear um no outro.

## Contrato com o frontend

Com a lista de abas da v1 já fechada (HOME, AJUSTES, ENTRADAS, SAÍDAS, DESPESAS,
CAIXA, BALANÇO, DRE), definir e documentar os endpoints (formato de request/
response) num arquivo `API-CONTRACT.md` dentro de `server/` o quanto antes — isso
desbloqueia o front trabalhar contra um mock fiel ao invés de dado inventado.
Pode avançar sem depender de nenhuma decisão pendente, exceto o formato exato de
DESPESAS/DRE (ver "Em aberto").

## Em aberto

Ver seção "Em aberto" do `DECISOES-E-ESCOPO.md`. Destaque para o backend:
- **Origem da categorização fixo/variável para DESPESAS/DRE** — ainda não se
  sabe se o Conta Azul já entrega essa categorização pronta ou se o dashboard
  precisa de um mapeamento próprio por cliente. Evitar fechar o schema de
  DESPESAS e DRE até confirmar.
- **Estrutura exata de BALANÇO e DRE** (quais linhas/contas, quantos níveis de
  subtotal) — ainda não detalhada, afeta diretamente o modelo de normalização
  desses dois endpoints.

Acesso à API do Conta Azul segue pendente, mas não bloqueia o início com
mock, nem os endpoints de ENTRADAS/SAÍDAS/CAIXA. Hospedagem/deploy já está
decidida (ver seção acima).
