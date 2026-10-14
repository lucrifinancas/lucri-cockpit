import { MoonStars, Sun } from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { SecaoHeader } from "./comum";

const OPCOES = [
  { id: "light", label: "Claro", Icone: Sun },
  { id: "dark", label: "Escuro", Icone: MoonStars },
];

// Minha conta → Aparência: tema em controle segmentado (vale pra todo o Cockpit).
export default function AparenciaSecao() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <SecaoHeader titulo="Aparência" descricao="Preferências visuais deste navegador." />
      <section className="aj-card">
        <h3 className="aj-card-titulo">Tema</h3>
        <div className="aj-segmentado" role="radiogroup" aria-label="Tema">
          {OPCOES.map(({ id, label, Icone }) => (
            <button key={id} type="button" role="radio" aria-checked={theme === id} className={theme === id ? "ativo" : ""} onClick={() => setTheme(id)}>
              <Icone size={16} weight={theme === id ? "fill" : "regular"} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
