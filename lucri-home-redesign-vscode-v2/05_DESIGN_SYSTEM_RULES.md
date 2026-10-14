# Regras visuais obrigatórias — V2

## Tipografia do Cockpit

Usar **Inter**.

Motivo:
- o `index.html` vivo do Design System carrega Inter;
- o README do projeto define Inter no Cockpit;
- o próprio README registra `SYSTEM-DESIGNER-LUCRI.md` como desalinhado nesse ponto.

Não usar:
- Instrument Sans;
- Montserrat;
- Ancress;
na interface do Cockpit.

Ancress/Montserrat pertencem aos materiais institucionais/marketing do Manual da Marca.

---

## Cores

Nunca hardcode no CSS da Home.

Usar tokens existentes do Cockpit / Design System.

Papéis semânticos:

- Verde: ação principal, sucesso, receita positiva quando previsto pelo token.
- Azul: link, foco, informação e caixa/lucro.
- Coral/laranja de gráfico: despesa/alerta conforme token.
- Noite Profunda: estrutura.
- Branco/creme: superfícies.

### Proibido
- usar azul como CTA principal;
- usar laranja como fundo grande;
- usar gradiente como fundo;
- criar novas cores sem token.

---

## Cards

Para produto:

- fundo por token de superfície;
- borda sutil;
- sem sombra;
- raio do card = 16px, ou token equivalente do Cockpit se já traduzido;
- padding usando escala oficial;
- título em estilo body-strong;
- valor em estilo display-product;
- números com tabular nums.

### Não copiar da imagem conceitual
A imagem gerada mostra leve elevação visual em alguns pontos. Ignore isso.
No Lucri Cockpit, card de produto não recebe shadow.

---

## Controles

### Ação principal
- Verde
- pill
- texto escuro
- hover conforme DS
- press `scale(0.95)`

### Ação secundária
- transparente
- borda verde

### Utilitário
- superfície neutra
- raio de 8px
- nunca pill

---

## Gráficos

Usar somente tokens `--chart-*`.

Semântica:
- receita = verde;
- caixa/lucro = azul;
- despesa = coral;
- neutros = tokens neutros.

Não usar a paleta da imagem gerada como referência.

---

## Alertas e insights

O Design System determina:
- laranja = alerta/tag/erro;
- nunca texto corrido inteiro em laranja.

Portanto:
- usar ícone/badge/marker em tom de alerta;
- texto principal do insight permanece na cor de texto da interface;
- status positivo pode usar sinalização verde;
- informação pode usar azul.

---

## Superfícies

Hierarquia deve vir de alternância de superfícies, não de shadow.

Exemplo aceitável:
- página: `--bg-page`
- card: `--bg-panel`
- bloco secundário interno: `--bg-subtle` / equivalente

Usar apenas tokens que realmente existirem.

---

## Tema

Validar:
- `data-theme="light"`
- `data-theme="dark"`

Não introduzir literal de cor para “consertar” um tema.

---

## Acessibilidade

- foco visível em azul;
- informação de alta/queda com símbolo + valor;
- tooltips e ícones com rótulos quando necessário;
- não depender exclusivamente de cor;
- manter contraste adequado.
