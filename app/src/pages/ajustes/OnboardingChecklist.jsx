import { useEffect, useState } from "react";
import { apiFetch } from "../../api/client";
import { onboardingSteps } from "../../data/onboarding";

export default function OnboardingChecklist({ client, irPara }) {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!client.conta_azul_conectado) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCategories(null);
    apiFetch(`/api/clientes/${client.id}/categorias`)
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [client.id, client.conta_azul_conectado, attempt]);
  const steps = onboardingSteps(client, categories);
  return (
    <section className="aj-card" aria-label={`Configuração de ${client.nome}`}>
      <h3 className="aj-card-titulo">Configuração de {client.nome}</h3>
      <p className="aj-hint">{steps.filter((step) => step.complete).length} de 4 etapas concluídas. Confira conexão, classificação e acesso antes de entregar o painel.</p>
      <ol className="aj-onboarding">
        {steps.map((step) => (
          <li key={step.id}>
            <strong>{step.label} · {step.complete ? "Concluída" : "Pendente"}</strong>
            <p className="aj-hint">{step.id === "categorias" && loading ? "Verificando categorias…" : step.status}</p>
            {step.id !== "cadastro" && <button type="button" className="aj-btn-util" onClick={() => irPara(step.id)}>{step.complete ? "Revisar" : "Configurar"} {step.label.toLowerCase()}</button>}
          </li>
        ))}
      </ol>
      {error && <p className="aj-hint aj-erro" role="alert">Não foi possível verificar as categorias: {error}. <button type="button" className="aj-btn-util" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></p>}
    </section>
  );
}
