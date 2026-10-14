import { ArrowCircleDown, ArrowCircleUp, HandCoins, Percent, TrendUp, Wallet } from "@phosphor-icons/react";
import { useActiveClient } from "../../context/ClientContext";
import { HOME_CARDS, useHomeCardPrefs } from "../../hooks/useHomeCardPrefs";
import { ClienteAlvo, SecaoHeader } from "./comum";

// Cockpit → Home: quais KPIs aparecem no topo da Home desse cliente
// (preferência guardada neste navegador, ver useHomeCardPrefs).
// Mesmo ícone do card na Home.
const ICONE_CARD = { saldoConta: Wallet, resultado: TrendUp, entradas: ArrowCircleDown, despesas: ArrowCircleUp, contasVencidas: HandCoins, inadimplencia: Percent };

export default function HomeSecao({ icone }) {
  const { activeClientId } = useActiveClient();
  const { isVisible, setOverride } = useHomeCardPrefs(activeClientId);
  return (
    <>
      <SecaoHeader icone={icone} titulo="Personalizar Home" descricao="Escolha os indicadores que aparecem no topo da Home.">
        <ClienteAlvo />
      </SecaoHeader>
      <section className="aj-card">
        <ul className="aj-checklist">
          {HOME_CARDS.map((card) => {
            const Icone = ICONE_CARD[card.id];
            return (
            <li key={card.id}>
              <label>
                <input type="checkbox" checked={isVisible(card.id)} onChange={(e) => setOverride(card.id, e.target.checked)} />
                {Icone && <Icone size={17} className="aj-check-icone" aria-hidden="true" />}
                {card.label}
              </label>
            </li>
            );
          })}
        </ul>
        <p className="aj-hint">Salva na hora, neste navegador.</p>
      </section>
    </>
  );
}
