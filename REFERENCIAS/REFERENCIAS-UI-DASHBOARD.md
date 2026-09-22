# Referências de UI/UX — Dashboards Lucri (Cockpit + Dashboard de Métricas)

Levantamento feito em 2026-08-20 a partir da análise do site [RankLayer](https://www.ranklayer.app/pt),
comparando com o LucriCockpit (`app/`, financeiro) e o Lucri Dashboard (`../4.DASHBOARD/app/`,
métricas de redes sociais). Objetivo: achar referências de produto real (não landing page) pra
melhorar os dois dashboards internos.

## Padrões de dashboard SaaS em 2026 (achados na pesquisa)

Seis padrões recorrentes nos melhores SaaS de dashboard atualmente:

- **Single-metric focus** (Stripe, Vercel) — abre na 1 métrica que todo mundo quer ver primeiro,
  e ela continua acessível conforme você navega.
- **Progressive disclosure** (Linear, Notion) — não mostra tudo de cara, mas deixa fácil aprofundar.
- **Data-heavy analytics** (Amplitude, Datadog) — densidade alta é ok, desde que organizada
  (grid, agrupamento, cor consistente).
- **Hierarquia visual forte** (HubSpot, Figma).
- **Confiança fintech** (Mercury, Ramp, Brex) — quanto menos elementos disputando atenção, mais
  confiável o produto parece. Relevante direto pro Cockpit.
- **Dark-mode-first tooling** (Raycast, Sentry, Supabase).

Trend de 2026: dashboards "AI-native" (Attio, Hex, Cursor) que resumem/priorizam em vez de forçar
o usuário a montar gráfico.

## Onde procurar mais (telas reais, não conceito)

- [SaaSFrame — categoria Dashboard](https://www.saasframe.io/categories/dashboard) e
  [categoria Analytics](https://www.saasframe.io/categories/analytics) — screenshots reais de
  produtos em produção.
- [Mobbin](https://mobbin.com) — fluxos completos de apps reais, tela por tela.
- [SaaSUI — inspiração de dashboard](https://www.saasui.design/best-saas-dashboard-ui-inspiration)
- [Muzli — 50 Best Dashboard Design Examples 2026](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/)
- [925 Studios — 35 SaaS Dashboard Examples/Trends/Patterns](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)
- [Pixelean — 20 SaaS dashboard examples that actually work](https://pixelean.com/blog/20-saas-dashboard-design-examples-that-actually-work-2026/)
- [AdminLTE.IO — 22 Best SaaS Dashboard Templates & UI Design Examples 2026](https://adminlte.io/blog/saas-admin-dashboard-templates/)
- Dribbble é mais visual/conceito puro — usar por último, não é produto funcionando.

### Por que essas referências específicas, pro nosso caso

**Pra LucriCockpit (financeiro, cliente final):**

- **Mercury, Ramp, Brex** — o padrão de "confiança fintech": pouca coisa competindo por atenção,
  hierarquia muito limpa, números grandes e âncora visual clara. É o oposto de "card salada" — a
  ideia é que quanto menos elementos disputando atenção, mais confiável o produto parece.
- **Stripe** — abre direto no número que o usuário mais quer ver (receita), e esse número continua
  acessível conforme você navega pra outras telas. É literalmente o que falta na Home do Cockpit:
  hoje ela mostra 4 StatCards + 5 seções de gráfico empilhadas verticalmente, sem hierarquia de
  "isso é o que importa AGORA vs. isso é detalhe".

**Pra Lucri Dashboard (métricas sociais, uso interno):**

- **Amplitude, Datadog** — padrão de analytics denso: mais dado por tela é ok, desde que a
  densidade seja organizada (grid, agrupamento, cor consistente), não solta.
- **Linear, Notion** — "progressive disclosure": não mostra tudo de cara, mas deixa fácil
  aprofundar. Relevante pro command bar (⌘K) que vocês já têm — é o mesmo padrão do Linear.

## Apex Dashboard (referência que o usuário mais gostou)

Template Next.js 16 + shadcn/ui + Recharts (`colorlib/apex-dashboard`,
[demo](https://apex-shadcn.dashboardpack.com/docs)). Tem 5 variações de layout — a mais relevante
pra nós é a **Finance** (`/finance`), que faz o mesmo trabalho que a Home do Cockpit.

### Comparação direta: Apex Finance vs. Home do Cockpit

| | Apex Finance | Cockpit hoje (`src/pages/HomePage.jsx`) |
|---|---|---|
| KPIs no topo | Cash on hand, Net margin, Overdue, Burn rate — **cada um com Δ% vs. período anterior** | Entradas, Saídas, Contas vencidas, Inadimplência — **sem Δ%** |
| Gráfico de fluxo | Cash flow (entrada/saída do saldo) | Não existe (saldo em conta ainda oculto, Conta Azul não expõe) |
| Gráfico de resultado | Profit & Loss (receita/custo/margem) | Resultado histórico (equivalente) |
| Vencidos | Tabela de **Receivables** por fatura (nº, cliente, valor, vencimento, status) + tabela de **Ageing** (Current / 1-30 / 31-60 / 61-90 / 90+ dias) | Só o agregado (`totalAReceberNoMes`, `inadimplenciaPct`), sem detalhe por título nem por faixa de atraso |

## Ações concretas identificadas pro Cockpit

1. **`StatCard.jsx` já suporta `delta`** (seta ▲/▼, "vs. período anterior", cor invertível pra
   métricas onde subir é ruim) — mas nenhuma chamada em `HomePage.jsx` está passando esse prop.
   É o padrão nº1 do Apex/Stripe e já está pronto no componente, só falta calcular o delta contra
   o período anterior (provavelmente dá pra puxar de `useHistoricoMensal`) e plugar nos 4 StatCards
   da Home.
2. **Falta o padrão de "Ageing"** pra inadimplência — hoje é só um número solto
   (`inadimplenciaPct`). Quebrar em faixas de atraso (0-30/31-60/61-90/90+) dá ao dono da empresa
   a informação de "vale cobrar esse cliente agora ou não" — pensar nisso quando desenhar o
   detalhamento de vencidos (ligado ao gap de DESPESAS/DRE/BALANÇO ainda travado no
   `CHECKLIST-FRONTEND.md`).
3. **Home sem hierarquia entre métricas** — os 4 StatCards têm o mesmo peso visual. Padrão
   Stripe/Vercel seria destacar 1 métrica-âncora (ex: saldo ou resultado do mês) maior que as
   outras.

### O que o Cockpit já acerta (não mexer)

Estados vazio/erro/loading já são tratados como parte do design, não afterthought — o caso
`error === "conta_azul_desconectada"` já mostra um aviso claro com CTA pra reconectar em Ajustes.
Isso já está no padrão certo; só vale manter a mesma disciplina nas telas que ainda faltam
(Despesas/DRE/Balanço).

## Ações concretas pro Lucri Dashboard (métricas sociais)

**Status em 2026-08-23: concluído.** Os 4 padrões abaixo já estão implementados em `4.DASHBOARD/app` —
nada pendente pro Dashboard 2.0 neste levantamento.

- ✅ "Data-heavy analytics" (Amplitude/Datadog) e "progressive disclosure" (⌘K, mesmo espírito do
  Linear) — já existiam.
- ✅ Δ% vs. período anterior — já existia (`setKpi()` em app.js, replicado em todas as páginas de
  rede e no relatório). O gap que este doc registrava aqui estava desatualizado.
- ✅ Métrica-âncora (single-metric focus, Stripe/Vercel) — não existia na Home (só no relatório);
  implementado em 2026-08-23: "Alcance total" virou hero card com sparkline (curva suave, altura
  fluida) e seletor de janela 7d/15d/30d. Ver [[referencias-ui-dashboard-lucri]] pro detalhe.

## Resumo do RankLayer (contexto original da conversa)

RankLayer é uma landing page de conversão (SaaS de GEO/SEO local), não um dashboard — comparação
direta é limitada. Pontos fortes que vale reaproveitar *se* algum dia a Lucri fizer uma landing
pro Cockpit como produto: estrutura problema → solução → prova social → preço, e depoimentos com
número específico em vez de genérico.

