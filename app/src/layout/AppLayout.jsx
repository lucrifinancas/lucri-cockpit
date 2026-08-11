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
  CaretDown,
} from "@phosphor-icons/react";
import logoLockup from "../assets/lucri-cockpit-lockup-transparent.png";
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
  { to: "/ajustes", label: "Ajustes", icon: GearSix },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { clients, activeClientId, activeClient, canSwitchClient, setSelectedClientId } = useActiveClient();
  const profile = useLocalProfile(user?.email);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logoLockup} alt="Lucri Cockpit" className="sidebar-logo" />
          <span className="sidebar-version">Beta 1.0</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              <item.icon size={20} weight="regular" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={logout}>
          Sair
        </button>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="app-header-client">
            <ClientAvatar client={activeClient} />
            {canSwitchClient ? (
              <div className="select-wrap">
                <select
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

          <div className="app-header-user">
            <ClientAvatar client={{ name: profile.name, logoUrl: profile.avatarUrl }} size={36} />
            <div className="app-header-user-text">
              <strong>{profile.name}</strong>
              <span>{ROLE_LABELS[user?.papel] ?? user?.papel}</span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
