# Lucri Cockpit — Home Financeira Redesign V2

## LEIA NESTA ORDEM

1. `README.md` da raiz do projeto.
2. `design-system-source/index.html`
3. `design-system-source/SYSTEM-DESIGNER-LUCRI.md`
4. `design-system-source/MANUAL-DA-MARCA-LUCRI.md`
5. `app/src/styles/tokens.css`
6. `app/src/styles/page.css`
7. Home atual e componentes relacionados.
8. Os demais arquivos desta pasta de especificação.

---

## REGRA DE PRECEDÊNCIA

Há uma divergência tipográfica entre os materiais:

- `index.html` do Design System usa **Inter**.
- `SYSTEM-DESIGNER-LUCRI.md` ainda declara **Instrument Sans**.
- o README do projeto informa explicitamente que, para o Cockpit, **Inter é a fonte vigente** e que o `SYSTEM-DESIGNER-LUCRI.md` está desalinhado nessa parte.

### Portanto, PARA O LUCRI COCKPIT:
**usar Inter em toda a interface.**

Não migrar o Cockpit para Instrument Sans nesta tarefa.

O Manual da Marca usa Ancress/Montserrat para materiais institucionais/marketing; isso não deve ser transplantado para a UI do Cockpit.

---

## FONTE DE VERDADE VISUAL PARA PRODUTO

Para esta tarefa, interpretar os documentos assim:

### 1. Comportamento e componentes
`SYSTEM-DESIGNER-LUCRI.md`

### 2. Implementação visual viva
`index.html` + CSS referenciado pelo projeto

### 3. Tokens efetivos do Cockpit
`app/src/styles/tokens.css`

### 4. Marca e tom
`MANUAL-DA-MARCA-LUCRI.md`

Se um token do Cockpit divergir do Design System oficial, corrigir o Cockpit para o Design System — mas não fazer refatoração ampla fora da Home sem necessidade.

---

## REGRAS NÃO NEGOCIÁVEIS EXTRAÍDAS DO DESIGN SYSTEM

- Verde = ação principal.
- Azul = link, foco e informação; nunca CTA principal.
- Laranja = alerta/tag/erro; nunca fundo de seção nem texto corrido.
- Gradiente = detalhe pontual; nunca fundo.
- Cards de produto NÃO usam sombra.
- Hierarquia de produto vem de superfícies e bordas, não elevação.
- Card de produto: raio de 16px.
- Controle utilitário: raio de 8px.
- Pill: reservado para ações principais.
- Press state: `scale(0.95)` em elementos clicáveis.
- KPIs e valores financeiros: `font-variant-numeric: tabular-nums`.
- Variações positivas/negativas nunca dependem só de cor: usar símbolo + número.
- Tema claro é o padrão; tema escuro deve continuar funcionando.

---

## O PAPEL DA IMAGEM DE REFERÊNCIA

`reference/home-financeira-conceito.png` serve SOMENTE para:
- hierarquia;
- ordem dos blocos;
- densidade;
- proporção;
- leitura rápida.

NÃO copiar da imagem:
- sombras;
- cores;
- raios;
- tipografia;
- gradientes;
- tratamento de botões;
- estados de interação.

Se imagem e Design System entrarem em conflito, o Design System vence.

---

## OBJETIVO

Transformar a Home em uma **central de saúde financeira**, mantendo:
- dados reais;
- arquitetura atual;
- integração com Conta Azul;
- filtros;
- papéis;
- rotas;
- páginas existentes;
- hooks e contratos de API.

Não é uma reconstrução do app.
