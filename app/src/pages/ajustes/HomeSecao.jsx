import { useActiveClient } from "../../context/ClientContext";
import { HOME_CARDS, useHomeCardPrefs } from "../../hooks/useHomeCardPrefs";
import { ClienteAlvo, SecaoHeader } from "./comum";

// Cockpit → Home: quais KPIs aparecem no topo da Home desse cliente
// (preferência guardada neste navegador, ver useHomeCardPrefs).
export default function HomeSecao() {
  const { activeClientId } = useActiveClient();
  const { isVisible, setOverride } = useHomeCardPrefs(activeClientId);
  return (
    <>
      <SecaoHeader titulo="Personalizar Home" descricao="Escolha os indicadores que aparecem no topo da Home.">
        <ClienteAlvo />
      </SecaoHeader>
      <section className="aj-card">
        <ul className="aj-checklist">
          {HOME_CARDS.map((card) => (
            <li key={card.id}>
              <label>
                <input type="checkbox" checked={isVisible(card.id)} onChange={(e) => setOverride(card.id, e.target.checked)} />
                {card.label}
              </label>
            </li>
          ))}
        </ul>
        <p className="aj-hint">Salva na hora, neste navegador.</p>
      </section>
    </>
  );
}
