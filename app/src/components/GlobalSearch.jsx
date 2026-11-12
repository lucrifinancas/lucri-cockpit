import { MagnifyingGlass } from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useActiveClient } from "../context/ClientContext";
import { useConfirmLeave } from "../hooks/usePendingChanges";
import "./GlobalSearch.css";

export default function GlobalSearch() {
  const { activeClientId } = useActiveClient();
  const { pathname, search } = useLocation();
  const query = pathname === "/busca" ? new URLSearchParams(search).get("q") ?? "" : "";
  return <SearchForm key={`${activeClientId}-${query}-${pathname}`} initialQuery={query} />;
}

function SearchForm({ initialQuery }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();
  const confirmLeave = useConfirmLeave();
  const { activeClientId } = useActiveClient();
  function submit(event) {
    event.preventDefault();
    if (query.trim().length < 2 || !activeClientId || !confirmLeave()) return;
    navigate(`/busca?${new URLSearchParams({ q: query.trim() })}`);
  }
  return (
    <form className="global-search" role="search" aria-label="Busca geral de lançamentos" onSubmit={submit}>
      <label htmlFor="global-search-input">Buscar lançamentos</label>
      <div className="global-search-control">
        <MagnifyingGlass size={18} aria-hidden="true" />
        <input id="global-search-input" type="search" minLength={2} maxLength={200} required value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Descrição, categoria ou pessoa" disabled={!activeClientId} />
        <button type="submit" disabled={!activeClientId || query.trim().length < 2}>Buscar</button>
      </div>
      <span className="global-search-hint">Na empresa e no período selecionados</span>
    </form>
  );
}
