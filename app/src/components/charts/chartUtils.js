export const numberFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
export const currencyFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Acabamento comum dos gráficos da Home: grade suave e tracejada, eixos
// discretos em tinta "muted", meses abreviados ("Set").
export const GRID_PROPS = { stroke: "var(--border-subtle)", strokeDasharray: "3 4", strokeOpacity: 0.8 };
export const TICK = { fill: "var(--text-muted)", fontSize: 11 };
export const mesCurto = (m) => (typeof m === "string" ? m.slice(0, 3) : m);
