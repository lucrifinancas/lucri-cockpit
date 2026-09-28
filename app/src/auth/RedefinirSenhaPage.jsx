import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import logo from "../assets/lucri-logo.png";
import "./LoginPage.css";

// Destino do link que o e-mail de "esqueci minha senha" manda
// (`{APP_URL}/redefinir-senha?token=...`, ver API-CONTRACT.md). Mesmo
// visual do login, mas sem o painel de destaque — é uma tela de trânsito,
// não precisa vender o produto de novo.
export default function RedefinirSenhaPage() {
  const { redefinirSenha } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [senhaNova, setSenhaNova] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await redefinirSenha({ token, senhaNova });
      setSucesso(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell login-shell-single">
        <form className="login-form-pane" onSubmit={handleSubmit}>
          <img src={logo} alt="Lucri" className="login-logo" />
          <h1>Redefinir senha</h1>

          {!token && (
            <p className="login-error">
              Link inválido — falta o token de redefinição. Peça um novo link
              na tela de login.
            </p>
          )}

          {token && erro && <p className="login-error">{erro}</p>}

          {token && sucesso && (
            <p className="login-hint">
              Senha redefinida com sucesso. Já pode fazer login com a senha
              nova.
            </p>
          )}

          {token && !sucesso && (
            <>
              <label className="login-field">
                Nova senha
                <input
                  type="password"
                  value={senhaNova}
                  onChange={(e) => setSenhaNova(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Salvando..." : "Redefinir senha"}
              </button>
            </>
          )}

          <Link className="login-link" to="/">
            Voltar pro login
          </Link>
        </form>
      </div>
    </div>
  );
}
