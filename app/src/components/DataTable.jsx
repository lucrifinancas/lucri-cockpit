import { categoryLabel } from "../data/labels";
import { useState } from "react";
import { sortRows, pageRows, sumRows } from "../data/table";
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
  net = false,
  title = "Lançamentos",
  emptyMessage = "Nenhum lançamento no período selecionado.",
}) {
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const filterKey = JSON.stringify([rows.map((row) => row.id), search?.value, sort]);
  const page = pageRows(sortRows(rows, sort.key, sort.direction), pagination.key === filterKey ? pagination.page : 1);
  const hasValues = columns.some((column) => column.key === "valor");
  function orderBy(key) {
    setSort((previous) => ({ key, direction: previous.key === key && previous.direction === "asc" ? "desc" : "asc" }));
  }
  return (
    <section className="data-table-wrap" aria-label={title}>
      <div className="data-table-toolbar">
        <div className="data-table-heading">
          <h2>{title}</h2>
          <span>
            {rows.length} registro{rows.length === 1 ? "" : "s"}
          </span>
          {hasValues && <span>{net ? "Movimentação líquida filtrada" : "Subtotal filtrado"}: {fmt.format(sumRows(rows, net))}</span>}
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
                  aria-sort={sort.key === col.key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={col.key === "valor" ? "num" : undefined}
                  key={col.key}
                >
                  <button type="button" className="data-table-sort" onClick={() => orderBy(col.key)} aria-label={`Ordenar por ${col.label}`}>
                    {col.label} {sort.key === col.key ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}
                  </button>
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
            {page.rows.map((row) => (
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
                        : ["categoria", "mae"].includes(col.key) ? categoryLabel(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page.pages > 1 && (
        <nav className="data-table-pagination" aria-label={`Paginação de ${title.toLowerCase()}`}>
          <button type="button" disabled={page.current === 1} onClick={() => setPagination({ key: filterKey, page: page.current - 1 })}>Anterior</button>
          <span>Página {page.current} de {page.pages} · {rows.length} registros</span>
          <button type="button" disabled={page.current === page.pages} onClick={() => setPagination({ key: filterKey, page: page.current + 1 })}>Próximo</button>
        </nav>
      )}
    </section>
  );
}
