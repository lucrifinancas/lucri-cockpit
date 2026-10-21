import { todayISO } from "../data/period";
import { useEffect, useRef, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import "./DateRangePicker.css";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// Seletor de mês no lugar do <input type="month"> nativo — mesmo visual do
// DateRangePicker (reaproveita o CSS dele): botão + painel com o ano e a
// grade dos 12 meses; um clique escolhe e fecha. Valor "AAAA-MM".
export default function MonthPicker({ value, onChange, ariaLabel, tema = "claro" }) {
  const [aberto, setAberto] = useState(false);
  const [ano, setAno] = useState(() => anoDe(value));
  const ref = useRef(null);

  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    if (!aberto) return;
    panelRef.current.showModal();
    (panelRef.current.querySelector('[aria-pressed="true"]') ?? panelRef.current.querySelector('.drp-mes'))?.focus();
  }, [aberto]);
  function fechar() {
    panelRef.current?.close();
    setAberto(false);
    triggerRef.current?.focus();
  }

  const atual = todayISO().slice(0, 7);
  const [vAno, vMes] = (value || "").split("-").map(Number);
  const rotulo = value ? `${MESES_LONGOS[vMes - 1]} de ${vAno}` : "Escolher mês";

  return (
    <div className={`drp ${tema === "escuro" ? "drp-escuro" : ""}`} ref={ref}>
      <button
        type="button"
        className={`drp-trigger ${value ? "is-set" : ""}`}
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-label={`${ariaLabel ?? "Mês"}: ${rotulo}`}
        aria-expanded={aberto}
        onClick={() => {
          setAno(anoDe(value));
          setAberto(!aberto);
        }}
      >
        <CalendarBlank size={16} aria-hidden="true" />
        <span className={value ? "" : "drp-placeholder"}>{rotulo}</span>
      </button>

      {aberto && (
        <dialog ref={panelRef} className="drp-panel drp-panel-mes" aria-label={ariaLabel ?? "Escolher mês"} onCancel={(event) => { event.preventDefault(); fechar(); }}>
          <div className="drp-head">
            <button type="button" className="drp-nav" aria-label="Ano anterior" onClick={() => setAno(ano - 1)}>
              <CaretLeft size={12} weight="bold" />
            </button>
            <div className="drp-title">{ano}</div>
            <button type="button" className="drp-nav" aria-label="Próximo ano" onClick={() => setAno(ano + 1)}>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
          <div className="drp-meses">
            {MESES.map((nome, i) => {
              const v = `${ano}-${String(i + 1).padStart(2, "0")}`;
              const cls = ["drp-mes"];
              if (v === value) cls.push("is-edge");
              if (v === atual) cls.push("is-today");
              return (
                <button
                  key={v}
                  type="button"
                  className={cls.join(" ")}
                  aria-label={`${MESES_LONGOS[i]} de ${ano}`}
                  aria-pressed={v === value}
                  onClick={() => {
                    onChange(v);
                    fechar();
                  }}
                >
                  {nome}
                </button>
              );
            })}
          </div>
          <div className="drp-footer"><button type="button" className="drp-link" onClick={fechar}>Cancelar</button></div>
        </dialog>
      )}
    </div>
  );
}

function anoDe(value) {
  return value ? Number(value.slice(0, 4)) : Number(todayISO().slice(0, 4));
}
