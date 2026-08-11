// Dado mockado — troca pelo fetch real assim que o backend/API do Conta Azul
// existir. Forma pensada para bater com o formato que os hooks de src/api vão
// consumir (ver DIRETRIZES-FRONTEND.md > Camada de dados).

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashSeed(clientId) {
  const s = String(clientId ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function daysBack(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const ENTRADA_TIPOS = [
  "recorrente",
  "recorrente",
  "recorrente",
  "recorrente",
  "recorrente",
  "recorrente",
  "recorrente",
  "recorrente",
  "pontual",
  "outro",
];

const ENTRADA_DESCRICOES = {
  recorrente: ["Recebimento de serviço", "Repasse de cartão"],
  pontual: ["Recebimento de venda avulsa"],
  outro: ["Rendimento financeiro"],
};

const SAIDA_DESCRICOES = ["Transferência entre contas", "Aporte em investimento", "Pagamento a fornecedor"];
const DESPESA_FIXA_DESCRICOES = ["Aluguel", "Folha de pagamento", "Software/assinaturas"];
const DESPESA_VARIAVEL_DESCRICOES = ["Matéria-prima", "Frete", "Comissão de vendas"];

// Categorias de despesa — placeholder de VALORES (nomes ainda inventados),
// mas agora na FORMA real que a API do Conta Azul devolve em `GET
// /categorias` (ver DADOS-CONTA-AZUL-API.md): `tipo` RECEITA/DESPESA e
// `entradaDre` já vem pronto de lá, não precisamos calcular DRE na mão.
export const DESPESA_CATEGORIAS = [
  { nome: "Fornecedores", tipo: "DESPESA", entradaDre: "CUSTOS_VARIAVEIS" },
  { nome: "Folha/Pró-labore", tipo: "DESPESA", entradaDre: "DESPESAS_ADMINISTRATIVAS" },
  { nome: "Aluguel/Cond.", tipo: "DESPESA", entradaDre: "DESPESAS_ADMINISTRATIVAS" },
  { nome: "Impostos", tipo: "DESPESA", entradaDre: "IMPOSTOS" },
  { nome: "Marketing", tipo: "DESPESA", entradaDre: "DESPESAS_COMERCIAIS" },
  { nome: "Software/Assinaturas", tipo: "DESPESA", entradaDre: "DESPESAS_ADMINISTRATIVAS" },
  { nome: "Manutenção", tipo: "DESPESA", entradaDre: "DESPESAS_ADMINISTRATIVAS" },
  { nome: "Outros", tipo: "DESPESA", entradaDre: "OUTRAS_DESPESAS" },
];

// Contas bancárias — placeholder na forma de `GET /conta-financeira`.
const CONTAS_BANCARIAS_NOMES = [
  { banco: "SICREDI", nome: "Sicredi - Conta Corrente" },
  { banco: "NUBANK", nome: "Nubank - PJ" },
  { banco: "INTER", nome: "Inter - Reserva" },
];

// Paleta categórica (N cores distintas) pros gráficos "por categoria" — os
// tokens --chart-* são semânticos (receita/despesa/caixa/saldo), não servem
// pra distinguir N categorias, então esta paleta cicla variações da marca.
export const CATEGORY_PALETTE = [
  "#00d0f5",
  "#00eb85",
  "#8a8ba0",
  "#ff6b4a",
  "#7c6bff",
  "#ffb84a",
  "#4ad9ff",
  "#5ce8a8",
];

export function generateFinanceData(clientId, { days = 90 } = {}) {
  const rand = seededRandom(hashSeed(clientId));

  const entradas = Array.from({ length: 24 }, (_, i) => {
    const tipo = ENTRADA_TIPOS[i % ENTRADA_TIPOS.length];
    const descricoes = ENTRADA_DESCRICOES[tipo];
    return {
      id: `entrada-${i}`,
      data: daysBack(Math.floor(rand() * days)),
      descricao: descricoes[i % descricoes.length],
      tipo,
      valor: Math.round((800 + rand() * 4200) * 100) / 100,
    };
  });

  const saidas = Array.from({ length: 18 }, (_, i) => ({
    id: `saida-${i}`,
    data: daysBack(Math.floor(rand() * days)),
    descricao: SAIDA_DESCRICOES[i % SAIDA_DESCRICOES.length],
    valor: Math.round((300 + rand() * 2600) * 100) / 100,
  }));

  const despesas = [
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `despesa-fixa-${i}`,
      data: daysBack(Math.floor(rand() * days)),
      descricao: DESPESA_FIXA_DESCRICOES[i % DESPESA_FIXA_DESCRICOES.length],
      tipo: "fixa",
      categoria: DESPESA_CATEGORIAS[Math.floor(rand() * DESPESA_CATEGORIAS.length)],
      valor: Math.round((400 + rand() * 3200) * 100) / 100,
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `despesa-variavel-${i}`,
      data: daysBack(Math.floor(rand() * days)),
      descricao: DESPESA_VARIAVEL_DESCRICOES[i % DESPESA_VARIAVEL_DESCRICOES.length],
      tipo: "variavel",
      categoria: DESPESA_CATEGORIAS[Math.floor(rand() * DESPESA_CATEGORIAS.length)],
      valor: Math.round((150 + rand() * 1800) * 100) / 100,
    })),
  ];

  // Status na forma real do Conta Azul (`status_traduzido` do endpoint de
  // contas a pagar/receber): PAGO, VENCIDO, VENCE_HOJE, PENDENTE — antes só
  // tinha vencida/em_aberto binário, mais pobre que o real.
  function statusConta() {
    const r = rand();
    if (r > 0.85) return "VENCIDO";
    if (r > 0.75) return "VENCE_HOJE";
    if (r > 0.4) return "PENDENTE";
    return "PAGO";
  }

  const contasAPagar = Array.from({ length: 5 }, (_, i) => ({
    id: `pagar-${i}`,
    vencimento: daysBack(-Math.floor(rand() * 20)),
    descricao: `Fornecedor ${i + 1}`,
    valor: Math.round((200 + rand() * 2500) * 100) / 100,
    status: statusConta(),
  }));

  const contasAReceber = Array.from({ length: 5 }, (_, i) => ({
    id: `receber-${i}`,
    vencimento: daysBack(-Math.floor(rand() * 20)),
    descricao: `Cliente ${i + 1}`,
    valor: Math.round((300 + rand() * 3000) * 100) / 100,
    status: statusConta(),
  }));

  const contasBancarias = CONTAS_BANCARIAS_NOMES.map((c, i) => ({
    id: `conta-${i}`,
    ...c,
    saldo: Math.round((3000 + rand() * 25000) * 100) / 100,
  }));

  return { entradas, saidas, despesas, contasAPagar, contasAReceber, contasBancarias };
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Histórico mensal fixo (não depende do seletor de período) — mesmo padrão dos
// slides "Histórico" dos relatórios: sempre os últimos N meses.
export function generateMonthlyHistory(clientId, months = 12) {
  const rand = seededRandom(hashSeed(clientId) + 7919);
  const now = new Date();

  return Array.from({ length: months }, (_, i) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const receitas = Math.round(11000 + rand() * 14000);
    const despesas = Math.round(10000 + rand() * 13000);
    return { month: MESES[ref.getMonth()], receitas, despesas };
  });
}

// Últimos N meses de contas a receber vencidas, somadas por mês de
// vencimento — histórico fixo (mesmo espírito de generateMonthlyHistory),
// já que o mock de `contasAReceber` só cobre uma janela curta ao redor de
// hoje e não dá pra agrupar 12 meses reais a partir dele.
export function generateOverdueByMonth(clientId, months = 12) {
  const rand = seededRandom(hashSeed(clientId) + 104729);
  const now = new Date();

  return Array.from({ length: months }, (_, i) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const valor = Math.round(rand() * 6000);
    return { month: MESES[ref.getMonth()], valor };
  });
}

// Agrupa itens com campo `categoria` somando `valor` por categoria, ordenado
// do maior pro menor. `categoria` pode ser string (forma real do Conta Azul
// em /entradas e /saidas) ou objeto `{nome,tipo,entradaDre}` (mock de
// despesas, ver DADOS-CONTA-AZUL-API.md).
export function groupByCategoria(items) {
  const totals = new Map();
  for (const item of items) {
    const key = typeof item.categoria === "string" ? item.categoria : (item.categoria?.nome ?? "Outros");
    totals.set(key, (totals.get(key) ?? 0) + item.valor);
  }
  return Array.from(totals, ([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
}

export function sumSaldoContas(contasBancarias) {
  return contasBancarias.reduce((acc, c) => acc + c.saldo, 0);
}

export function sumValores(items) {
  return items.reduce((acc, item) => acc + item.valor, 0);
}

export function filterByPeriod(items, { start, end }) {
  if (!start || !end) return items;
  return items.filter((item) => {
    const dataRef = item.data ?? item.vencimento;
    return dataRef >= start && dataRef <= end;
  });
}

// Intervalo imediatamente anterior a `range`, com a mesma duração — usado
// pra comparar "período atual vs. período anterior".
function previousRange({ start, end }) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationDays = Math.round((endDate - startDate) / 86400000) + 1;

  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (durationDays - 1));

  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
  };
}

// Variação % de um total (calculado por `totalFn`) entre o período atual e
// o período imediatamente anterior. Sem período anterior comparável (ex:
// preset "Todos os dados", sem start/end) retorna null — não inventa número
// sem baseline. `totalFn(range)` deve retornar o total pro range recebido
// (ex: soma de entradas, ou entradas - saídas pro saldo).
export function periodDelta(totalFn, range) {
  const { start, end } = range;
  if (!start || !end) return null;

  const prevRange = previousRange(range);
  const currentTotal = totalFn(range);
  const prevTotal = totalFn(prevRange);

  if (prevTotal === 0) return null;

  const pct = ((currentTotal - prevTotal) / prevTotal) * 100;
  return { pct, direction: pct >= 0 ? "up" : "down" };
}
