import { createContext, useContext, useEffect, useState } from "react";

// Tema claro/escuro — persistido em localStorage, aplicado via atributo
// `data-theme` na tag <html> (tokens.css reage a esse atributo). Fica fora
// do AuthProvider porque a tela de login também deve respeitar o tema.
const STORAGE_KEY = "lucri-dash.theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de ThemeProvider");
  return ctx;
}
