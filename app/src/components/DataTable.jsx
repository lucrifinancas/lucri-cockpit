import "./DataTable.css";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function DataTable({ columns, rows }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="data-table-empty">
                Nenhum lançamento no período selecionado.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.key === "valor" ? fmt.format(row.valor) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
