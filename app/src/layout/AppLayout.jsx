import { NavLink, Outlet } from "react-router-dom";
import {
  House,
  ArrowCircleDown,
  ArrowCircleUp,
  Receipt,
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
  { to: "/", label: "Home", end: true, icon: House },
  { to: "/entradas", label: "Entradas", icon: ArrowCircleDown },
  { to: "/saidas", label: "Saídas", icon: ArrowCircleUp },
  { to: "/despesas", label: "Despesas", icon: Receipt },
  { to: "/caixa", label: "Caixa", icon: Vault },
  { to: "/balanco", label: "Balanço", icon: Scales },
  { to: "/dre", label: "DRE", icon: FileText },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { clients, activeClientId, activeClient, canSwitchClient, setSelectedClientId } = useActiveClient();
  const profile = useLocalProfile(user?.email);

  return (
    <div className="app-shell">
      <header className="topnav">
        <div className="topnav-brand">
          <img src={logoSymbol} alt="" className="topnav-logo" />
          <span className="topnav-name">Lucri Cockpit</span>
          <span className="topnav-version">Beta 1.5</span>
        </div>

        <nav className="topnav-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "topnav-link" + (isActive ? " active" : "")}
            >
              <item.icon size={18} weight="light" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topnav-actions">
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
              <strong>{activeClient?.name ?? "Sua empresa"}</strong>
            )}
          </div>

          <PeriodSelector />

          <div className="topnav-user">
            <ClientAvatar client={{ name: profile.name, logoUrl: profile.avatarUrl }} size={32} />
            <div className="topnav-user-text">
              <strong>{profile.name}</strong>
              <span>{ROLE_LABELS[user?.papel] ?? user?.papel}</span>
            </div>
          </div>

          <NavLink
            to="/ajustes"
            className={({ isActive }) => "topnav-iconbtn" + (isActive ? " active" : "")}
            title="Ajustes"
          >
            <GearSix size={18} weight="light" />
          </NavLink>
          <button className="topnav-iconbtn" onClick={logout} title="Sair">
            <SignOut size={18} weight="light" />
          </button>
        </div>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
