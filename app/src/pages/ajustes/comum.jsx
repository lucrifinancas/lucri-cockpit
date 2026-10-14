import { CaretDown } from "@phosphor-icons/react";
import { useActiveClient } from "../../context/ClientContext";

// Cabeçalho de cada seção de Ajustes: título, explicação curta e ações à direita.
export function SecaoHeader({ titulo, descricao, children }) {
  return (
    <header className="aj-secao-head">
      <div>
        <h2 className="aj-secao-titulo">{titulo}</h2>
        {descricao && <p className="aj-secao-desc">{descricao}</p>}
      </div>
      {children && <div className="aj-secao-acoes">{children}</div>}
    </header>
  );
}

// "Configurando: [cliente ▾]" — seções que valem por cliente (acessos,
// categorias, contas a pagar, home) deixam claro de quem é e deixam trocar
// ali mesmo (é o mesmo cliente ativo da barra de cima).
export function ClienteAlvo() {
  const { clients, activeClientId, canSwitchClient, setSelectedClientId, activeClient } = useActiveClient();
  return (
    <div className="aj-cliente-alvo">
      <span>Configurando</span>
      {canSwitchClient ? (
        <span className="aj-select">
          <select aria-label="Cliente" value={activeClientId ?? ""} onChange={(e) => setSelectedClientId(Number(e.target.value))}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <CaretDown size={12} weight="bold" aria-hidden="true" />
        </span>
      ) : (
        <strong>{activeClient?.name}</strong>
      )}
    </div>
  );
}
