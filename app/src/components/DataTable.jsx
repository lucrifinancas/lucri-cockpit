import { MagnifyingGlass } from "@phosphor-icons/react";
import "./DataTable.css";

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dataBR = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value ?? "")
    ? value.split("-").reverse().join("/")
    : value;

export default function DataTable({
  columns,
  rows,
  search,
  title = "Lançamentos",
  emptyMessage = "Nenhum lançamento no período selecionado.",
}) {
  return (
    <section className="data-table-wrap" aria-label={title}>
      <div className="data-table-toolbar">
        <div className="data-table-heading">
          <h2>{title}</h2>
          <span>
            {rows.length} registro{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        {search && (
          <label className="data-table-search">
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label={`Buscar em ${title.toLowerCase()}`}
              placeholder={search.placeholder}
              value={search.value}
              onChange={search.onChange}
            />
          </label>
        )}
      </div>
      <div
        className="data-table-scroll"
        tabIndex={0}
        role="region"
        aria-label={`Tabela de ${title.toLowerCase()}`}
      >
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  scope="col"
                  className={col.key === "valor" ? "num" : undefined}
                  key={col.key}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={
                      col.key === "valor"
                        ? "num"
                        : col.key === "data"
                          ? "date"
                          : undefined
                    }
                  >
                    {col.key === "valor"
                      ? fmt.format(row.valor)
                      : col.key === "data"
                        ? dataBR(row[col.key])
                        : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
