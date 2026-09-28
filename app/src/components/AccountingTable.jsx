import "./AccountingTable.css";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Tabela contábil hierárquica genérica: cada linha pode ter `subitens`
// (indentados, fonte menor) e/ou `totalizador: true` (negrito, separador
// em cima — é a linha de subtotal, nunca tem `subitens`). Usada pelo DRE
// (linhas vêm prontas da API) e pelo Balanço (montadas à mão, só 2 seções
// sem os vários níveis do DRE — ver API-CONTRACT.md pros dois formatos).
export default function AccountingTable({ linhas }) {
  return (
    <table className="accounting-table">
      <tbody>
        {linhas.map((linha, i) => (
          <AccountingRow key={linha.codigo ?? `${linha.descricao}-${i}`} linha={linha} />
        ))}
      </tbody>
    </table>
  );
}

function AccountingRow({ linha }) {
  if (linha.totalizador) {
    return (
      <tr className="accounting-row accounting-row-total">
        <td className="accounting-desc">{linha.descricao}</td>
        <td className="accounting-valor">{fmt.format(linha.valor)}</td>
      </tr>
    );
  }

  return (
    <>
      <tr className="accounting-row accounting-row-grupo">
        <td className="accounting-desc">
          {linha.codigo && <span className="accounting-codigo">{linha.codigo}</span>}
          {linha.descricao}
        </td>
        <td className="accounting-valor">{fmt.format(linha.valor)}</td>
      </tr>
      {linha.subitens?.map((sub, i) => (
        <tr className="accounting-row accounting-row-sub" key={sub.codigo ?? `${sub.descricao}-${i}`}>
          <td className="accounting-desc">
            {sub.codigo && <span className="accounting-codigo">{sub.codigo}</span>}
            {sub.descricao}
          </td>
          <td className="accounting-valor">{fmt.format(sub.valor)}</td>
        </tr>
      ))}
    </>
  );
}
