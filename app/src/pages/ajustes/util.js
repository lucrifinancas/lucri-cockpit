// Texto do botão salvar com estado (Salvar → Salvando... → Salvo!).
export const rotuloSalvar = (salvando, salvo, padrao = "Salvar alterações") => (salvando ? "Salvando..." : salvo ? "Salvo!" : padrao);

export const fmtData = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T") + "Z");
  return isNaN(d) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};
