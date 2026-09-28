import { useEffect, useRef, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import "./DateRangePicker.css";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

const pad = (n) => String(n).padStart(2, "0");
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const fmtCurto = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");

// Calendário de intervalo no lugar do <input type="date"> nativo (visual do
// navegador, não estilizável) — mesmo desenho do seletor do Dashboard 2.0
// (period.js/style.css de lá): dois meses lado a lado, 1º clique marca o
// início, 2º marca o fim e já aplica. Datas trafegam como "AAAA-MM-DD",
// igual ao resto do app. `mesInicial` ("AAAA-MM-DD") decide qual mês abre
// quando ainda não tem nada escolhido.
// `tema="escuro"`: botão pra barra de navegação escura (o painel continua
// claro). `limpavel={false}` esconde o X — ex. no seletor de período do
// topo, onde "sem datas" não é um estado válido.
export default function DateRangePicker({ de, ate, onChange, mesInicial, placeholder = "Qualquer data", ariaLabel, tema = "claro", limpavel = true }) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState(null); // início escolhido, esperando o fim
  const [hover, setHover] = useState(null);
  const [base, setBase] = useState(() => mesBase(de || mesInicial));
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => ref.current && !ref.current.contains(e.target) && fechar();
    const esc = (e) => e.key === "Escape" && fechar();
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function abrir() {
    setBase(mesBase(de || mesInicial));
    setRascunho(null);
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    setRascunho(null);
    setHover(null);
  }

  function escolher(iso) {
    if (!rascunho) {
      setRascunho(iso);
      return;
    }
    const [ini, fim] = rascunho <= iso ? [rascunho, iso] : [iso, rascunho];
    onChange({ de: ini, ate: fim });
    fechar();
  }

  // Intervalo que aparece pintado: o rascunho (com hover como fim
  // provisório) enquanto escolhe, senão o valor já aplicado.
  let ini = de, fim = ate;
  if (rascunho) {
    const outro = hover ?? rascunho;
    [ini, fim] = rascunho <= outro ? [rascunho, outro] : [outro, rascunho];
  }

  const d = new Date();
  const hoje = toIso(d.getFullYear(), d.getMonth(), d.getDate());
  const meses = [base, new Date(base.getFullYear(), base.getMonth() + 1, 1)];
  const temValor = de || ate;
  const rotulo = temValor ? `${fmtCurto(de) || "…"} → ${fmtCurto(ate) || "…"}` : placeholder;

  return (
    <div className={`drp ${tema === "escuro" ? "drp-escuro" : ""}`} ref={ref}>
      <button
        type="button"
        className={`drp-trigger ${temValor ? "is-set" : ""}`}
        aria-label={ariaLabel}
        aria-expanded={aberto}
        onClick={() => (aberto ? fechar() : abrir())}
      >
        <CalendarBlank size={16} aria-hidden="true" />
        <span className={temValor ? "" : "drp-placeholder"}>{rotulo}</span>
      </button>
      {limpavel && temValor && (
        <button type="button" className="drp-clear" aria-label="Limpar datas" onClick={() => onChange({ de: "", ate: "" })}>
          <X size={12} weight="bold" />
        </button>
      )}

      {aberto && (
        <div className="drp-panel" role="dialog" aria-label={ariaLabel}>
          <div className="drp-months">
            {meses.map((m, i) => {
              const y = m.getFullYear(), mo = m.getMonth();
              const vazios = new Date(y, mo, 1).getDay();
              const total = new Date(y, mo + 1, 0).getDate();
              return (
                <div key={i}>
                  <div className="drp-head">
                    <button type="button" className={`drp-nav ${i === 0 ? "" : "hidden"}`} aria-label="Mês anterior" onClick={() => setBase(new Date(y, mo - 1, 1))}>
                      <CaretLeft size={12} weight="bold" />
                    </button>
                    <div className="drp-title">{MESES[mo]} {y}</div>
                    <button type="button" className={`drp-nav ${i === 1 ? "" : "hidden"}`} aria-label="Próximo mês" onClick={() => setBase(new Date(y, mo, 1))}>
                      <CaretRight size={12} weight="bold" />
                    </button>
                  </div>
                  <div className="drp-dow">
                    {DIAS.map((l, k) => <span key={k}>{l}</span>)}
                  </div>
                  <div className="drp-days" onMouseLeave={() => setHover(null)}>
                    {Array.from({ length: vazios }, (_, k) => <span key={`v${k}`} />)}
                    {Array.from({ length: total }, (_, k) => {
                      const iso = toIso(y, mo, k + 1);
                      const cls = ["drp-day"];
                      if (iso === hoje) cls.push("is-today");
                      if (iso === ini || iso === fim) cls.push("is-edge");
                      else if (ini && fim && iso > ini && iso < fim) cls.push("is-range");
                      return (
                        <button key={iso} type="button" className={cls.join(" ")} onClick={() => escolher(iso)} onMouseEnter={() => rascunho && setHover(iso)}>
                          {k + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="drp-footer">
            <span>{rascunho ? "Agora escolha a data final" : "Clique na data inicial"}</span>
            <button type="button" className="drp-link" onClick={fechar}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function mesBase(iso) {
  if (iso) return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, 1);
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
