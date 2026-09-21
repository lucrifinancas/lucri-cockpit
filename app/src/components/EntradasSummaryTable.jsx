import { Fragment, useState } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import "./EntradasSummaryTable.css";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function pct(value, total) {
  return total > 0 ? (value / total) * 100 : 0;
}

// `rows`: { label, value, color, children? }. Uma linha com `children`
// ({ label, value }[]) vira expansível — usado nas despesas, onde a linha é a
// categoria-mãe e os filhos são as despesas dentro dela.
export default function EntradasSummaryTable({ rows, total, totalLabel = "Total" }) {
  const [abertas, setAbertas] = useState(() => new Set());

  function toggle(label) {
    setAbertas((prev) => {
      const novo = new Set(prev);
      if (novo.has(label)) novo.delete(label);
      else novo.add(label);
      return novo;
    });
  }

  return (
    <div className="entradas-summary-table">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th className="num">Valor</th>
            <th className="num">Participação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expansivel = row.children?.length > 0;
            const aberta = expansivel && abertas.has(row.label);
            const Caret = aberta ? CaretDown : CaretRight;
            return (
              <Fragment key={row.label}>
                <tr
                  className={expansivel ? "row-expansivel" : undefined}
                  onClick={expansivel ? () => toggle(row.label) : undefined}
                  aria-expanded={expansivel ? aberta : undefined}
                >
                  <td>
                    <span className="row-label">
                      {expansivel && <Caret size={14} weight="bold" className="row-caret" />}
                      {row.label}
                    </span>
                  </td>
                  <td className="num">{fmt.format(row.value)}</td>
                  <td className="num">
                    <div className="participacao-cell">
                      <span>{pct(row.value, total).toFixed(1)}%</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct(row.value, total)}%`, background: row.color }} />
                      </div>
                    </div>
                  </td>
                </tr>
                {aberta &&
                  row.children.map((filho) => (
                    <tr key={`${row.label}/${filho.label}`} className="row-filho">
                      <td>{filho.label}</td>
                      <td className="num">{fmt.format(filho.value)}</td>
                      <td className="num">{pct(filho.value, total).toFixed(1)}%</td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}
          <tr className="total-row">
            <td>{totalLabel}</td>
            <td className="num">{fmt.format(total)}</td>
            <td className="num">100.0%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
