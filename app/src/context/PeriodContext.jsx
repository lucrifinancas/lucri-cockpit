import { todayISO, resolveRange } from "../data/period";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Seletor de período — versão funcional simplificada do padrão já usado no
// dashboard de redes sociais (4.DASHBOARD/2.0/period.js): presets + intervalo
// customizado, estado persistente. Intervalo customizado e "mês específico"
// usam DateRangePicker/MonthPicker (mesmo desenho do calendário do
// dashboard social), não os <input type="date"/"month"> nativos.

const STORAGE_KEY = "lucri-dash.period";

export const PRESETS = [
  { id: "todos", label: "Todos os dados" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "14d", label: "Últimos 14 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "mes", label: "Este mês" },
  { id: "mes-especifico", label: "Mês específico" },
  { id: "custom", label: "Personalizado" },
];

function currentMonthValue() {
  return todayISO().slice(0, 7);
}

const PeriodContext = createContext(null);

export function PeriodProvider({ children }) {
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed ?? { preset: "mes", custom: { start: null, end: null }, month: currentMonthValue() };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const range = useMemo(() => resolveRange(state.preset, state.custom, state.month), [state]);

  function setPreset(preset) {
    setState((prev) => ({ ...prev, preset }));
  }

  function setCustomRange(custom) {
    setState((prev) => ({ ...prev, preset: "custom", custom }));
  }

  function setMonth(month) {
    setState((prev) => ({ ...prev, preset: "mes-especifico", month }));
  }

  const value = useMemo(
    () => ({
      preset: state.preset,
      custom: state.custom,
      month: state.month ?? currentMonthValue(),
      range,
      setPreset,
      setCustomRange,
      setMonth,
    }),
    [state, range]
  );

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod precisa estar dentro de PeriodProvider");
  return ctx;
}
