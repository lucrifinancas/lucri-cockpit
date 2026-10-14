# Design System Lucri

**Versão 1.0 — fechado em 2026-09-17.** Fonte de verdade pra qualquer peça nova da Lucri: carrossel, LP, Typeform, Lucri Cockpit, Dashboard, e qualquer interface futura.

## Visão geral

Sistema de disciplina emprestada, cor e voz próprias: uma cor de ação só, uma sombra só, superfícies alternadas fazendo o papel de divisor de seção, escala de espaçamento em base 8px, grammar de raio sem misturar níveis. Cor, tipografia e conteúdo são 100% Lucri.

O sistema cobre dois domínios:
- **Marketing** — carrossel Instagram, LP, Typeform, materiais institucionais.
- **Produto** — Lucri Cockpit, Dashboard, qualquer tela interativa real.

## Princípios

1. **Uma cor por papel, nunca dividido.** Verde é a única cor de ação/CTA. Azul é só link/citação/foco — nunca disputa com o verde. Laranja é só alerta/tag/erro — nunca fundo, nunca texto corrido.
2. **Uma sombra em todo o sistema.** Reservada pro frame do slide (marketing). Em produto, hierarquia vem de troca de superfície (claro ↔ escuro ↔ creme), nunca de elevação artificial em card/botão/texto.
3. **Uma família tipográfica.** Instrument Sans em tudo — título e corpo, marketing e produto. Ancress Bold é a única exceção, reservada a logo e materiais institucionais onde o ambiente de renderização é controlado (LP, propostas, contratos).
4. **Gradiente é detalhe, nunca fundo.** Linha, barra, ícone, realce pontual — nunca cobre uma seção ou slide inteiro.
5. **Grammar de raio não se mistura.** Cada nível de raio tem um papel fixo; usar o raio errado quebra a leitura do sistema tanto quanto usar a cor errada.
6. **Pressão é `scale(0.95)`, sempre.** Único estado de interação documentado neste sistema, em qualquer elemento clicável de produto real (não se aplica ao carrossel, que exporta como imagem estática).

---

## Foundations

### Cor

| Token | Valor | Uso |
|---|---|---|
| `{color.bg-dark}` | `#010116` Noite Profunda | Fundo escuro padrão |
| `{color.bg-dark-alt}` | `#0E1B14` Verde-escuro | Variar entre duas superfícies escuras seguidas |
| `{color.bg-light}` | `#FFFFFF` Branco Puro | Fundo claro padrão |
| `{color.bg-light-alt}` | `#F7F7F2` Creme | Variar entre duas superfícies claras seguidas |
| `{color.green}` | `#00EB85` | Ação/CTA sobre fundo claro |
| `{color.green-onDark}` | `#2AE8A4` | Ação/CTA sobre fundo escuro |
| `{color.blue}` | `#00D0F5` Céu Azul | Link, citação, foco de input — nunca CTA principal |
| `{color.alert}` | `#E8622C` | Kicker, tag, aviso, erro — nunca fundo, nunca texto corrido |
| `{color.gradient-brand}` | `#00D0F5 → #00EB85` | Só símbolo da logo / detalhe pontual — nunca fundo |
| `{color.gradient-slide}` | `#0E4A34 → #12B886` | Detalhe pontual no carrossel (barra, tarja) — nunca fundo inteiro |

### Tipografia

Duas camadas: tokens de marca (`{font.*}`) pra materiais fechados/institucionais, e uma escala de UI (`{type.*}`) pra telas de produto. Mesma família em ambas.

| Token | Fonte | Tamanho | Peso | Uso |
|---|---|---|---|---|
| `{font.family}` | Instrument Sans | — | 400–700 | Única família — título e corpo, marketing e produto |
| `{font.institutional}` | Ancress Bold | — | Bold | Só logo e materiais institucionais (LP, propostas) |
| `{type.display-carousel}` | Instrument Sans | 33–40px | 700, tracking -1px | Headline do carrossel |
| `{type.display-product}` | Instrument Sans | 22–28px | 700, tracking -0.02em | Título de página/seção em telas de produto |
| `{type.body}` | Instrument Sans | 15px | 400 | Texto corrido em produto |
| `{type.body-strong}` | Instrument Sans | 15px | 600 | Ênfase inline, labels de card |
| `{type.lead}` | Instrument Sans | 12.5–15px | 400/600 | Lead/teaser do carrossel |
| `{type.caption}` | Instrument Sans | 13px | 400 | Legendas, metadados, texto secundário |
| `{type.nav-link}` | Instrument Sans | 13px | 500 | Item de menu/sidebar, link de navegação |
| `{type.button}` | Instrument Sans | 14px | 600 | Texto de botão |
| `{type.eyebrow}` | Instrument Sans | 11px | 700, uppercase, tracking 3px | Kicker/rótulo pequeno acima de título |

**Regra:** peso 500 nunca aparece em texto corrido — só no `{type.nav-link}`, que é rótulo, não leitura. Ladder de leitura fica 400/600/700, evitando o meio-termo.

### Forma & Elevação

| Token | Valor | Uso |
|---|---|---|
| `{radius.frame}` | 22px | Frame do slide (carrossel) |
| `{radius.box}` | `0 16px 16px 0` | Boxes de destaque do carrossel (assimétrico, reto do lado da borda de accent) |
| `{radius.card}` | 16px | Card de produto (Dashboard/Cockpit) |
| `{radius.control}` | 8px | Botão utilitário, input, item de sidebar — grammar "utilitário", nunca pill |
| `{radius.pill}` | 9999px | Botão de ação (marketing e produto) — a única forma que sinaliza "ação principal" |
| `{shadow.frame}` | `0 14px 40px rgba(1,1,22,.28)` | **Única sombra do sistema inteiro**, só no frame do slide — nunca em card, botão ou texto |

Se em qualquer componente futuro surgir vontade de aplicar sombra em card/botão, a resposta é não — resolve trocando de superfície (claro↔escuro↔creme), não com elevação artificial.

### Espaçamento

Base 8px.

| Token | Valor | Uso |
|---|---|---|
| `{spacing.xxs}` | 4px | Ajustes finos (gap ícone-check) |
| `{spacing.xs}` | 8px | Gap entre linhas de check |
| `{spacing.sm}` | 12–14px | Padding interno de botão |
| `{spacing.md}` | 16–18px | Gap kicker→headline, headline→lead |
| `{spacing.lg}` | 24px | Padding de card/box |
| `{spacing.xl}` | 32px | Respiro entre blocos de produto |
| `{spacing.xxl}` | 48px | Respiro entre seções de produto |
| `{spacing.section}` | 80px | Padding de seção full-bleed / frame do slide |

---

## Componentes

### Marketing (Carrossel, LP, Typeform)

**`{component.eyebrow}`** — rótulo pequeno acima do título. `{type.eyebrow}`, cor laranja ou verde conforme contexto (kicker/alerta vs. destaque).

**`{component.headline}`** — `{type.display-carousel}`, tracking apertado obrigatório em qualquer título ≥ 23px. Highlight inline (`<em>` verde) muda de tom conforme o fundo: `{color.green}` sobre claro, `{color.green-onDark}` sobre escuro.

**`{component.lead}`** — `{type.lead}`, nunca menor que 12.5px real.

**`{component.box}`** — fundo tintado + borda esquerda 4px colorida, `{radius.box}`. Assinatura própria da Lucri.

**`{component.button-cta}`** — botão de ação do carrossel/LP ("Link na bio"). `{radius.pill}`, `{color.green}`/`{color.green-onDark}`, `{type.button}`.
- **Estados** (só na LP, onde é interativo de verdade): padrão → hover escurece 8% → pressão `scale(0.95)`. No carrossel (imagem estática) só existe o estado padrão.
- **Acessibilidade**: texto do botão nunca é só ícone — sempre rótulo visível. Contraste texto/fundo verde testado ≥ 4.5:1 com `{color.bg-dark}` como cor de texto.

**`{component.progress-footer}`** — barra de progresso fina + chevron, indicando "slide X de Y". Única área do sistema autorizada a ser densa.

**`{component.logo-mark}`** — wordmark "lucri" simples, sem ícone, repetido em todo slide.

**`{component.accent-bar}`** — 36–52px × 4–5px, `border-radius: 3px`, `{color.green}` (ou `{color.gradient-slide}` no tema `grad`, nunca como fundo). Respiro entre headline e CTA/teaser.

### Produto (Lucri Cockpit, Dashboard)

**`{component.global-nav}`** — barra superior fixa. Fundo `{color.bg-dark}`, altura 56px. Texto branco em `{type.nav-link}`. Logo à esquerda, ações do usuário à direita. Sem sombra, sem borda.

**`{component.sidebar}`** — menu lateral fixo.
- Fundo `{color.bg-dark}` (mesma superfície do `{component.global-nav}`, formando um bloco escuro contínuo)
- Largura 240px expandida / 72px colapsada (só ícone)
- Item: `{type.nav-link}`, padding 12px 16px, `{radius.control}` no item ativo
- **Estados**: padrão (`{color.bg-light-alt}`) → hover (fundo branco a 6%) → ativo (fundo `{color.green}` a ~12% + barra vertical sólida `{color.green}` de 3px na borda esquerda, ícone/texto branco puro)
- **Acessibilidade**: item ativo sinalizado por cor E barra lateral (nunca só cor). Ícone mantém `aria-label` com o nome completo. Navegável por teclado, anel de foco `{color.blue}` visível.

**`{component.button-primary}`** — ação principal em produto. `{color.green}`/`{color.green-onDark}`, texto `{color.bg-dark}`, `{radius.pill}`, padding 10px 20px, `{type.button}`.
- **Estados**: padrão → hover (escurece 8%) → pressão `scale(0.95)` → disabled (opacidade 40%, `not-allowed`)
- **Acessibilidade**: anel de foco 2px `{color.blue}`, `outline-offset` 2px.

**`{component.button-secondary}`** — fundo transparente, borda 1px `{color.green}`/`{color.green-onDark}`. Mesmos estados e foco do `{component.button-primary}`.

**`{component.button-utility}`** — ações secundárias ("editar", "filtrar"). Fundo `{color.bg-light-alt}`/`{color.bg-dark-alt}`, `{radius.control}` (nunca pill).

**`{component.card}`** — card de métrica/conteúdo. Fundo `{color.bg-light}`/`{color.bg-dark-alt}`, borda 1px sutil (nunca sombra), `{radius.card}`, padding `{spacing.lg}`. Título `{type.body-strong}`, valor em `{type.display-product}`, variação em `{color.green}` (alta) / `{color.alert}` (queda).
- **Acessibilidade**: variação nunca comunicada só por cor — sempre com símbolo (▲/▼) + valor numérico.

**`{component.input}`** — fundo `{color.bg-light}`, borda 1px sutil, `{radius.control}`. `{type.body}`, padding 10px 14px, altura 40px.
- **Estados**: padrão → foco (borda `{color.blue}`) → erro (borda `{color.alert}` + mensagem em `{type.caption}`) → disabled
- **Acessibilidade**: todo input tem `<label>` associado; erro anunciado via `aria-describedby`.

---

## Regras não-negociáveis

1. Gradiente nunca é fundo de seção/slide inteiro — só logo e detalhe pontual.
2. Uma sombra só no sistema inteiro — nunca em card, botão ou texto.
3. Uma família tipográfica só (Instrument Sans) — nunca misturar.
4. Azul é só accent/link/foco — nunca CTA principal.
5. Laranja é só alerta/tag — nunca fundo, nunca texto corrido.
6. Raio não se mistura entre grammars — pill é ação, `{radius.control}` é utilitário, `{radius.card}` é conteúdo, `{radius.box}` é assinatura exclusiva de marketing.

---

## Governança

**Dono do documento:** Augusto. Mudança de token (cor, tipografia, forma, espaçamento) passa por ele antes de virar código.

- **Token novo:** editar a tabela correspondente em Foundations, registrando o motivo da mudança.
- **Componente novo:** mesmo formato dos existentes — specs visuais, Estados, Acessibilidade.
- **Versionamento:** a versão só sobe quando um princípio ou regra não-negociável muda. Adição que não quebra nada só atualiza a data.
- **Antes de implementar num projeto:** confirmar se todo valor novo já existe como token aqui antes de inventar direto no CSS do projeto.
