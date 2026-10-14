import { CaretDown, CheckCircle, XCircle } from "@phosphor-icons/react";
import { useActiveClient } from "../../context/ClientContext";

// Cabeçalho de cada seção de Ajustes: título, explicação curta e ações à direita.
export function SecaoHeader({ titulo, descricao, icone: Icone, children }) {
  return (
    <header className="aj-secao-head">
      <div className="aj-secao-head-texto">
        {Icone && (
          <span className="aj-secao-icone" aria-hidden="true">
            <Icone size={20} weight="regular" />
          </span>
        )}
        <div>
          <h2 className="aj-secao-titulo">{titulo}</h2>
          {descricao && <p className="aj-secao-desc">{descricao}</p>}
        </div>
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

// Status da Conta Azul: ícone + texto (cor nunca sozinha).
export function StatusContaAzul({ conectado, detalhe }) {
  return conectado ? (
    <span className="aj-status aj-status-ok">
      <CheckCircle size={16} weight="fill" aria-hidden="true" /> Conectada{detalhe ? ` · ${detalhe}` : ""}
    </span>
  ) : (
    <span className="aj-status">
      <XCircle size={16} weight="regular" aria-hidden="true" /> Não conectada
    </span>
  );
}
