import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { BASE_URL } from "../api/client";
import logo from "../assets/lucri-logo.png";
import logoLockup from "../assets/lucri-cockpit-lockup-transparent.png";
import "./LoginPage.css";

const SLIDE_INTERVAL_MS = 5000;

// Mensagens pro parâmetro `?google=<código>` que o callback do backend
// devolve em caso de erro (ver API-CONTRACT.md). Sem entrada = erro
// genérico.
const ERROS_GOOGLE = {
  email_nao_verificado: "Seu e-mail do Google ainda não foi verificado. Verifica na sua conta Google e tenta de novo.",
  conta_nao_encontrada: "Não existe conta nem convite pra esse e-mail. Fala com quem te convidou.",
  erro: "Não deu pra entrar com o Google agora. Tenta de novo.",
};

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
  const { login, esqueciSenha } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modo, setModo] = useState("login"); // "login" | "esqueci"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [esqueciEnviado, setEsqueciEnviado] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Volta do callback do Google com erro (?google=<código>) — mostra a
  // mensagem e limpa a URL pra não reaparecer num F5.
  useEffect(() => {
    const codigo = searchParams.get("google");
    if (!codigo) return;
    setErro(ERROS_GOOGLE[codigo] ?? ERROS_GOOGLE.erro);
    setSearchParams((prev) => {
      const novo = new URLSearchParams(prev);
      novo.delete("google");
      return novo;
    });
  }, [searchParams, setSearchParams]);

  function handleGoogleLogin() {
    window.location.href = `${BASE_URL}/api/auth/google/iniciar`;
  }

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

  async function handleEsqueciSubmit(e) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await esqueciSenha({ email });
      setEsqueciEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  function voltarParaLogin() {
    setModo("login");
    setErro(null);
    setEsqueciEnviado(false);
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        {modo === "login" ? (
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

            <div className="login-divider">ou</div>

            <button type="button" className="login-google" onClick={handleGoogleLogin}>
              <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"/>
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6c-2 1.5-4.6 2.4-7.6 2.4-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.9 39.6 16.4 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C40.3 36.9 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
              </svg>
              Entrar com Google
            </button>

            <button type="button" className="login-link" onClick={() => setModo("esqueci")}>
              Esqueci minha senha
            </button>
          </form>
        ) : (
          <form className="login-form-pane" onSubmit={handleEsqueciSubmit}>
            <img src={logo} alt="Lucri" className="login-logo" />
            <h1>Esqueci minha senha</h1>

            {erro && <p className="login-error">{erro}</p>}

            {esqueciEnviado ? (
              <p className="login-hint">
                Se esse e-mail tiver cadastro, você vai receber um link pra
                redefinir a senha em instantes. Confere a caixa de entrada
                (e o spam).
              </p>
            ) : (
              <>
                <p className="login-hint">
                  Digite o e-mail da sua conta — a gente manda um link pra
                  você criar uma senha nova.
                </p>
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
                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </>
            )}

            <button type="button" className="login-link" onClick={voltarParaLogin}>
              Voltar pro login
            </button>
          </form>
        )}

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
