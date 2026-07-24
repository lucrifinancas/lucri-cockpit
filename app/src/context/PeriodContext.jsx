import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Seletor de período — versão funcional simplificada do padrão já usado no
// dashboard de redes sociais (4.DASHBOARD/2.0/period.js): presets + intervalo
// customizado, estado persistente. A UI aqui usa dois <input type="date"> em
// vez do calendário de 2 meses navegável do v1 social — mesma funcionalidade,
// picker mais simples. Portar o calendário completo depois se o usuário pedir.

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// "YYYY-MM" -> {start: primeiro dia, end: último dia} do mês.
function monthRange(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { start, end };
}

function resolveRange(preset, custom, month) {
  if (preset === "todos") return { start: null, end: null };
  if (preset === "7d") return { start: daysAgoISO(7), end: todayISO() };
  if (preset === "14d") return { start: daysAgoISO(14), end: todayISO() };
  if (preset === "30d") return { start: daysAgoISO(30), end: todayISO() };
  if (preset === "mes") {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    return { start, end: todayISO() };
  }
  if (preset === "mes-especifico") return monthRange(month || currentMonthValue());
  if (preset === "custom") return custom;
  return { start: null, end: null };
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
