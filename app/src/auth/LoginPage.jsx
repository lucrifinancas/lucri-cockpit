import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import logo from "../assets/lucri-logo.png";
import logoLockup from "../assets/lucri-cockpit-lockup-transparent.png";
import "./LoginPage.css";

const SLIDE_INTERVAL_MS = 5000;

// 4 slides do painel de destaque do login — 1 por "motivo pra confiar na
// Lucri" (financeiro, Instagram, vencimentos, relatório automático). Mesmo
// par de cards (back/front) em todos, só muda o conteúdo.
const SLIDES = [
  {
    cardBack: { label: "Saldo em conta", value: "R$ 37.244,12", dot: true, barPct: 68, barColor: "var(--lucri-mint)" },
    cardFront: {
      label: "Entradas do mês",
      value: "R$ 70.670,87",
      rows: [
        { label: "Recorrentes", value: "84%" },
        { label: "Pontuais", value: "6%" },
      ],
    },
    headline: "Clareza financeira pra decidir sem achismo",
    text: "A Lucri centraliza receitas, despesas e caixa dos seus clientes em um só painel — visão completa pra tomar decisão com segurança.",
  },
  {
    cardBack: { label: "Instagram", value: "@lucrifinancas", dot: true, barPct: 100, barColor: "var(--lucri-sky)" },
    cardFront: {
      label: "Novo conteúdo toda semana",
      value: "12,4K seguidores",
      rows: [
        { label: "Posts por semana", value: "3" },
        { label: "Dicas de gestão", value: "✓" },
      ],
    },
    headline: "Segue a Lucri no Instagram",
    text: "Dicas de gestão financeira, bastidores e novidades do produto toda semana — @lucrifinancas.",
  },
  {
    cardBack: { label: "Contas a vencer", value: "R$ 2.690,01", dot: true, barPct: 42, barColor: "var(--chart-despesa)" },
    cardFront: {
      label: "Status dos vencimentos",
      value: "92% em dia",
      rows: [
        { label: "Em dia", value: "92%" },
        { label: "Atrasado", value: "8%" },
      ],
    },
    headline: "Nunca mais perca um vencimento",
    text: "Contas a pagar e a receber organizadas por status, com alerta antes do prazo — direto do Conta Azul.",
  },
  {
    cardBack: { label: "Resultado do mês", value: "R$ 22.861,34", dot: true, barPct: 75, barColor: "var(--lucri-mint)" },
    cardFront: {
      label: "DRE automático",
      value: "Pronto a cada mês",
      rows: [
        { label: "Receita", value: "R$ 70.670,87" },
        { label: "Despesa", value: "R$ 32.265,41" },
      ],
    },
    headline: "Relatório pronto, sem trabalho manual",
    text: "DRE e Balanço gerados automaticamente a partir dos dados do Conta Azul — sem planilha, sem retrabalho.",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[slideIndex];

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await login({ email, senha });
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <form className="login-form-pane" onSubmit={handleSubmit}>
          <img src={logo} alt="Lucri" className="login-logo" />
          <h1>Entrar no dashboard</h1>

          {erro && <p className="login-error">{erro}</p>}

          <label className="login-field">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="login-field">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="login-showcase-pane">
          <div className="login-showcase-cards">
            <div className="login-preview-card login-preview-card-back">
              <div className="login-preview-card-header">
                <span>{slide.cardBack.label}</span>
                {slide.cardBack.dot && <span className="login-preview-dot" />}
              </div>
              <strong className="login-preview-value">{slide.cardBack.value}</strong>
              <div className="login-preview-bar">
                <span style={{ width: `${slide.cardBack.barPct}%`, background: slide.cardBack.barColor }} />
              </div>
            </div>

            <div className="login-preview-card login-preview-card-front">
              <div className="login-preview-card-header">
                <span>{slide.cardFront.label}</span>
              </div>
              <strong className="login-preview-value">{slide.cardFront.value}</strong>
              {slide.cardFront.rows.map((row) => (
                <div className="login-preview-row" key={row.label}>
                  <span>{row.label}</span>
                  <span className="login-preview-pill">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <img src={logoLockup} alt="Lucri Cockpit" className="login-showcase-logo" />
          <h2>{slide.headline}</h2>
          <p>{slide.text}</p>

          <div className="login-showcase-dots">
            {SLIDES.map((s, i) => (
              <span
                key={s.headline}
                className={i === slideIndex ? "active" : ""}
                onClick={() => setSlideIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
