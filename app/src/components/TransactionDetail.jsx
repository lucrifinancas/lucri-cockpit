import { useEffect, useRef } from "react";
import { fullDateLabel } from "../data/calendar";

const money = (value) => Number.isFinite(value) ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Não informado";
const date = (value) => value ? fullDateLabel(value) : "Não informada";

export default function TransactionDetail({ item, kind, status, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return (
    <dialog ref={ref} className="transaction-detail" aria-labelledby="transaction-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className="transaction-detail-head">
        <div><p className="section-eyebrow">{kind === "entrada" ? "Entrada" : "Saída"} · {status}</p><h2 id="transaction-detail-title">{kind === "entrada" ? "Detalhes do recebimento" : "Detalhes do pagamento"}</h2></div>
        <button type="button" className="transaction-button" onClick={onClose} aria-label="Fechar detalhes">Fechar ×</button>
      </header>
      <section className="transaction-detail-section">
        <h3>Informações do lançamento</h3>
        <dl className="transaction-fields">
          <div className="transaction-field-wide"><dt>Descrição</dt><dd>{item.descricao || "Não informada"}</dd></div>
          <div><dt>{kind === "entrada" ? "Cliente" : "Fornecedor"}</dt><dd>{item.contraparte || "Não informado"}</dd></div>
          <div><dt>Vencimento</dt><dd>{date(item.data_vencimento)}</dd></div>
          <div><dt>Competência</dt><dd>{date(item.data_competencia)}</dd></div>
          <div><dt>Categoria principal</dt><dd>{item.categoria_principal}</dd></div>
          <div><dt>Categoria no Conta Azul</dt><dd>{item.categoria_original || "Não informada"}</dd></div>
          <div><dt>Situação na origem</dt><dd>{item.status || "Não informada"}</dd></div>
        </dl>
      </section>
      <section className="transaction-detail-section">
        <h3>{kind === "entrada" ? "Resumo do recebimento" : "Resumo do pagamento"}</h3>
        <dl className="transaction-amounts">
          <div><dt>Total do título</dt><dd>{money(item.valor_total)}</dd></div>
          <div><dt>{kind === "entrada" ? "Recebido" : "Pago"}</dt><dd>{money(item.valor_pago)}</dd></div>
          <div><dt>{kind === "entrada" ? "A receber" : "A pagar"}</dt><dd>{money(item.valor_em_aberto)}</dd></div>
        </dl>
        <p className="section-empty">Os valores pagos incluem pagamentos parciais. O período da consulta considera o vencimento do título.</p>
      </section>
      <p className="pending-notice">Data de liquidação, conta bancária, forma de pagamento, juros, tarifas, observações e anexos não são fornecidos pela consulta atual. Consulte esses detalhes no Conta Azul.</p>
    </dialog>
  );
}
