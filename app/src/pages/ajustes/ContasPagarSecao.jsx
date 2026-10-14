import { useEffect, useState } from "react";
import { apiFetch } from "../../api/client";
import { useActiveClient } from "../../context/ClientContext";
import { ClienteAlvo, SecaoHeader } from "./comum";
import { rotuloSalvar } from "./util";

// Cockpit → Contas a pagar: quais categorias master de despesa entram na
// página Contas a pagar (pedido do usuário, 07/10). Nenhuma = página vazia.
export default function ContasPagarSecao() {
  const { activeClientId } = useActiveClient();
  const [maes, setMaes] = useState([]);
  const [marcadas, setMarcadas] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!activeClientId) return;
    let cancelado = false;
    setLoading(true);
    setErro(null);
    Promise.all([apiFetch(`/api/clientes/${activeClientId}/maes`), apiFetch(`/api/clientes/${activeClientId}/contas-pagar-maes`)])
      .then(([todas, escolhidas]) => { if (!cancelado) { setMaes(todas); setMarcadas(new Set(escolhidas.map((m) => m.id))); } })
      .catch((e) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setLoading(false));
    return () => { cancelado = true; };
  }, [activeClientId]);

  function alternar(id) {
    setMarcadas((prev) => {
      const nova = new Set(prev);
      if (nova.has(id)) nova.delete(id); else nova.add(id);
      return nova;
    });
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await apiFetch(`/api/clientes/${activeClientId}/contas-pagar-maes`, { method: "PUT", body: JSON.stringify({ mae_ids: [...marcadas] }) });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <SecaoHeader titulo="Contas a pagar" descricao="O que deve aparecer na página Contas a pagar?">
        <ClienteAlvo />
      </SecaoHeader>
      <section className="aj-card">
        {loading && <p className="aj-hint">Carregando...</p>}
        {erro && <p className="aj-hint aj-erro">{erro}</p>}
        {!loading && maes.length === 0 && !erro && <p className="aj-hint">Cadastre as categorias master em Categorias → Despesas primeiro.</p>}
        {!loading && maes.length > 0 && (
          <>
            <ul className="aj-checklist aj-checklist-colunas">
              {maes.map((m) => (
                <li key={m.id}>
                  <label>
                    <input type="checkbox" checked={marcadas.has(m.id)} onChange={() => alternar(m.id)} />
                    {m.nome}
                  </label>
                </li>
              ))}
            </ul>
            <p className="aj-hint">
              Categorias não marcadas continuam em Despesas, só não aparecem em Contas a pagar.{" "}
              {marcadas.size === 0 ? <strong className="aj-erro">Nenhuma marcada: a página vai ficar vazia.</strong> : `${marcadas.size} de ${maes.length} marcadas.`}
            </p>
            <div className="aj-form-acoes">
              <button type="button" className="aj-btn-primario" onClick={salvar} disabled={salvando}>{rotuloSalvar(salvando, salvo)}</button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
