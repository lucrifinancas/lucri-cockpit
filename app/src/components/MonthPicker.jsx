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

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => ref.current && !ref.current.contains(e.target) && setAberto(false);
    const esc = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const d = new Date();
  const atual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const [vAno, vMes] = (value || "").split("-").map(Number);
  const rotulo = value ? `${MESES_LONGOS[vMes - 1]} de ${vAno}` : "Escolher mês";

  return (
    <div className={`drp ${tema === "escuro" ? "drp-escuro" : ""}`} ref={ref}>
      <button
        type="button"
        className={`drp-trigger ${value ? "is-set" : ""}`}
        aria-label={ariaLabel}
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
        <div className="drp-panel drp-panel-mes" role="dialog" aria-label={ariaLabel}>
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
                    setAberto(false);
                  }}
                >
                  {nome}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function anoDe(value) {
  return value ? Number(value.slice(0, 4)) : new Date().getFullYear();
}
