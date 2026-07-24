import "./EntradasSummaryTable.css";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function EntradasSummaryTable({ rows, total, totalLabel = "Total" }) {
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
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className="num">{fmt.format(row.value)}</td>
              <td className="num">
                <div className="participacao-cell">
                  <span>{total > 0 ? ((row.value / total) * 100).toFixed(1) : "0.0"}%</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${total > 0 ? (row.value / total) * 100 : 0}%`, background: row.color }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
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
