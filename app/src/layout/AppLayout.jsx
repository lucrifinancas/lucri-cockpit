import { useConfirmLeave } from "../hooks/usePendingChanges";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  House,
  ArrowCircleDown,
  ArrowCircleUp,
  Invoice,
  Vault,
  Scales,
  FileText,
  GearSix,
  SignOut,
  CaretDown,
} from "@phosphor-icons/react";
import logoSymbol from "../assets/lucri-logo.png";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS } from "../auth/roles";
import { useActiveClient } from "../context/ClientContext";
import { useLocalProfile } from "../hooks/useLocalProfile";
import PeriodSelector from "../components/PeriodSelector";
import ClientAvatar from "../components/ClientAvatar";
import "./AppLayout.css";

const NAV_ITEMS = [
  { to: "/", label: "Visão geral", end: true, icon: House },
  { to: "/entradas", label: "Entradas", icon: ArrowCircleDown },
  { to: "/saidas", label: "Saídas", icon: ArrowCircleUp },
  { to: "/contas-a-pagar", label: "Contas a pagar", icon: Invoice },
  { to: "/caixa", label: "Caixa", icon: Vault },
  { to: "/balanco", label: "Balanço", icon: Scales },
  { to: "/dre", label: "DRE", icon: FileText },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const confirmLeave = useConfirmLeave();
  const { user, logout } = useAuth();
  const {
    clients,
    loadingClients,
    clientsError,
    activeClientId,
    activeClient,
    canSwitchClient,
    setSelectedClientId,
  } = useActiveClient();
  const profile = useLocalProfile(user?.email);

  return (
    <div className="app-shell">
      <header className="topnav">
        <div className="topnav-brand">
          <img src={logoSymbol} alt="" className="topnav-logo" />
          <span className="topnav-name">Lucri Cockpit</span>
          <span className="topnav-version">Beta 1.5</span>
        </div>

        <nav className="topnav-nav" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                "topnav-link" + (!["/", "/entradas", "/contas-a-pagar"].includes(item.to) ? " topnav-secondary" : "") + (isActive ? " active" : "")
              }
            >
              <item.icon size={18} weight="light" />
              <span className={["/", "/contas-a-pagar"].includes(item.to) ? "topnav-label-full" : undefined}>{item.label}</span>
              {item.to === "/" && <span className="topnav-label-short">Visão geral</span>}
              {item.to === "/contas-a-pagar" && <span className="topnav-label-short">A pagar</span>}
            </NavLink>
          ))}
          <details className="topnav-more">
            <summary>Mais</summary>
            <div className="topnav-more-list">
              {NAV_ITEMS.filter((item) => !["/", "/entradas", "/contas-a-pagar"].includes(item.to)).map((item) => (
                <NavLink key={item.to} to={item.to} onClick={(event) => event.currentTarget.closest("details").removeAttribute("open")}>{item.label}</NavLink>
              ))}
            </div>
          </details>
        </nav>

        <div className="topnav-actions">
          <div
            className="topnav-user"
            title={`${profile.name} · ${ROLE_LABELS[user?.papel] ?? user?.papel ?? ""}`}
          >
            <ClientAvatar
              client={{ name: profile.name, logoUrl: profile.avatarUrl }}
              size={32}
            />
            <div className="topnav-user-text">
              <strong>{profile.name}</strong>
              <span>{ROLE_LABELS[user?.papel] ?? user?.papel}</span>
            </div>
          </div>

          <NavLink
            to="/ajustes"
            className={({ isActive }) =>
              "topnav-iconbtn" + (isActive ? " active" : "")
            }
            aria-label="Ajustes"
            title="Ajustes"
          >
            <GearSix size={18} weight="light" />
          </NavLink>
          <button className="topnav-iconbtn" onClick={() => { if (confirmLeave()) logout(); }} aria-label="Sair" title="Sair">
            <SignOut size={18} weight="light" />
          </button>
        </div>
      </header>

      <section className="app-context" aria-label="Empresa e período">
        <div className="context-company">
          <span className="context-label">Empresa</span>
          <div className="topnav-client">
            <ClientAvatar client={activeClient} size={28} />
            {canSwitchClient ? (
              <div className="select-wrap">
                <select
                  aria-label="Cliente ativo"
                  value={activeClientId ?? ""}
                  onChange={(e) => setSelectedClientId(Number(e.target.value))}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <CaretDown size={14} weight="bold" className="select-caret" />
              </div>
            ) : (
              <strong>{activeClient?.name ?? (loadingClients ? "Carregando empresa…" : "Empresa indisponível")}</strong>
            )}
          </div>
        </div>
        {clientsError && <span role="alert">Não foi possível identificar a empresa. Atualize a página para tentar novamente.</span>}
        <div className="context-period">
          <span className="context-label">Período de análise</span>
          {pathname === "/balanco" ? <span>Posição atual</span> : <PeriodSelector />}
        </div>
      </section>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
