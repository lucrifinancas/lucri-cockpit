# Reconciliação dos documentos de marca

## Divergência encontrada: tipografia

### `index.html`
Usa Inter 400/500/600/700 e descreve:
`Inter como família única`.

### `SYSTEM-DESIGNER-LUCRI.md`
Declara Instrument Sans como família de produto.

### `MANUAL-DA-MARCA-LUCRI.md`
Declara Ancress + Montserrat, voltadas à identidade institucional e marketing.

### Decisão para esta tarefa
O Cockpit continua com **Inter**.

Essa decisão segue o README fornecido pelo projeto, que já documenta explicitamente o desalinhamento e define o `index.html` como referência viva para o produto.

---

## Divergência de elevação

O conceito visual gerado tem aparência de cards levemente elevados.

O Design System de produto proíbe sombra em cards.

### Decisão
Implementar:
- superfícies;
- bordas;
- contraste;
- espaçamento;
sem box-shadow.

---

## Raio

O System Designer define:
- card: 16px;
- control: 8px;
- pill: ação.

Se os tokens traduzidos do Cockpit tiverem nomes diferentes, usar o equivalente existente em `app/src/styles/tokens.css`.

---

## Aplicação do Manual da Marca

Usar o Manual para:
- essência;
- voz;
- posicionamento;
- cores institucionais.

Não transportar automaticamente regras de carrossel/LP para produto.
