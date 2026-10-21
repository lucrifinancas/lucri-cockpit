import { Fragment, useState } from "react";
import { compareDreRows } from "../data/dreComparison";

const money = (value) => value == null ? "—" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const signed = (value) => value == null ? "—" : `${value > 0 ? "+ " : ""}${money(value)}`;
export default function DreComparisonTable({ dre, previousDre, revenue, currentLabel, previousLabel }) {
  const rows = compareDreRows(dre.linhas, previousDre?.linhas);
  const finalRow = rows.filter((row) => !row.previousOnly).at(-1);
  const hasFinalRow = finalRow?.totalizador && finalRow.current === dre.resultado_final;
  const [expanded, setExpanded] = useState(new Set());
  const groupKeys = [];
  function collect(items, parent = "") { for (const item of items) { const key = `${parent}/${item.key}`; if (item.children.length) { groupKeys.push(key); collect(item.children, key); } } }
  collect(rows);
  const allExpanded = groupKeys.length > 0 && groupKeys.every((key) => expanded.has(key));
  function toggle(key) { setExpanded((previous) => { const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next; }); }
  function render(items, parent = "", depth = 0) {
    return items.map((row) => {
      const key = `${parent}/${row.key}`, open = expanded.has(key);
      return <Fragment key={key}>
        <tr className={`${row.totalizador ? "dre-subtotal" : ""} ${row.previousOnly ? "dre-previous-only" : ""} ${hasFinalRow && depth === 0 && row.key === finalRow.key ? "dre-final-row" : ""}`}>
          <th scope="row" style={{ paddingLeft: `${22 + depth * 20}px` }}>
            {row.children.length ? <button type="button" className="dre-expand" aria-expanded={open} onClick={() => toggle(key)}><span aria-hidden="true">{open ? "⌄" : "›"}</span>{row.descricao}</button> : row.descricao}
            {row.previousOnly && <small>Somente no período anterior</small>}
          </th>
          <td>{money(row.current)}</td><td>{money(row.previous)}</td><td className={row.delta > 0 ? "dre-positive" : row.delta < 0 ? "dre-negative" : undefined}>{signed(row.delta)}</td>
          <td>{revenue > 0 && row.current != null ? `${(row.current / revenue * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%` : "—"}</td>
        </tr>
        {open && render(row.children, key, depth + 1)}
      </Fragment>;
    });
  }
  return <section className="dre-panel" aria-labelledby="dre-composition-title">
    <header className="dre-panel-head"><h2 id="dre-composition-title">Composição do resultado</h2>{groupKeys.length > 0 && <button type="button" className="dre-button" onClick={() => setExpanded(allExpanded ? new Set() : new Set(groupKeys))}>{allExpanded ? "Recolher grupos" : "Expandir grupos"}</button>}</header>
    <div className="dre-table-scroll" role="region" tabIndex={0} aria-label="DRE comparativo por grupo">
      <table className="dre-table"><thead><tr><th scope="col">Descrição</th><th scope="col">{currentLabel}</th><th scope="col">{previousLabel || "Período anterior"}</th><th scope="col">Variação R$</th><th scope="col">% da receita líquida</th></tr></thead>
        <tbody>{render(rows)}{!rows.length && <tr><td colSpan={5}>Nenhum grupo de DRE disponível na estrutura do Conta Azul.</td></tr>}</tbody>
        {!hasFinalRow && <tfoot><tr><th scope="row">Resultado final</th><td>{money(dre.resultado_final)}</td><td>{money(previousDre?.resultado_final)}</td><td>{previousDre ? signed(dre.resultado_final - previousDre.resultado_final) : "—"}</td><td>{revenue > 0 ? `${(dre.resultado_final / revenue * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%` : "—"}</td></tr></tfoot>}
      </table>
    </div>
  </section>;
}
