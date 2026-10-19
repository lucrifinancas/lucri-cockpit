import { useSearchParams } from "react-router-dom";
import {
  CreditCard,
  House,
  Link as LinkIcone,
  Moon,
  Plugs,
  Sun,
  Tag,
  User,
  UserPlus,
  Users,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";
import { isInternalRole } from "../auth/roles";
import { useActiveClient } from "../context/ClientContext";
import { useTheme } from "../context/ThemeContext";
import PerfilSecao from "./ajustes/PerfilSecao";
import AparenciaSecao from "./ajustes/AparenciaSecao";
import ClientesSecao from "./ajustes/ClientesSecao";
import AcessosSecao from "./ajustes/AcessosSecao";
import IntegracoesSecao from "./ajustes/IntegracoesSecao";
import HomeSecao from "./ajustes/HomeSecao";
import CategoriasSecao from "./ajustes/CategoriasSecao";
import ContasPagarSecao from "./ajustes/ContasPagarSecao";
import "../styles/page.css";
import "./AjustesPage.css";

// Ajustes como central de configuração: menu interno à esquerda (Minha conta
// · Clientes · Cockpit) e uma seção por vez à direita. A seção fica na URL
// (?secao=categorias) pra dar pra voltar/compartilhar. Cada papel só vê o que
// pode usar (mesmas regras de antes: clientes/categorias só master; Home pra
// equipe; perfil e aparência pra todos).
const SECOES = {
  perfil: {
    label: "Perfil",
    Icone: User,
    Componente: PerfilSecao,
    pode: () => true,
  },
  aparencia: {
    label: "Aparência",
    Icone: Sun,
    Componente: AparenciaSecao,
    pode: () => true,
  },
  clientes: {
    label: "Clientes",
    Icone: Users,
    Componente: ClientesSecao,
    pode: (p) => p.master,
  },
  acessos: {
    label: "Acessos",
    Icone: UserPlus,
    Componente: AcessosSecao,
    pode: (p) => p.master && p.cliente,
  },
  integracoes: {
    label: "Integrações",
    Icone: LinkIcone,
    Componente: IntegracoesSecao,
    pode: (p) => p.master,
  },
  home: {
    label: "Home",
    Icone: House,
    Componente: HomeSecao,
    pode: (p) => p.equipe && p.cliente,
  },
  categorias: {
    label: "Categorias",
    Icone: Tag,
    Componente: CategoriasSecao,
    pode: (p) => p.master && p.cliente,
  },
  "contas-pagar": {
    label: "Contas a pagar",
    Icone: CreditCard,
    Componente: ContasPagarSecao,
    pode: (p) => p.master && p.cliente,
  },
};

const GRUPOS = [
  { titulo: "Minha conta", itens: ["perfil", "aparencia"] },
  { titulo: "Clientes", itens: ["clientes", "acessos", "integracoes"] },
  { titulo: "Cockpit", itens: ["home", "categorias", "contas-pagar"] },
];

export default function AjustesPage() {
  const { user } = useAuth();
  const { activeClientId } = useActiveClient();
  const { theme } = useTheme();
  const [params, setParams] = useSearchParams();
  const permissoes = {
    master: user?.papel === "master",
    equipe: isInternalRole(user?.papel),
    cliente: Boolean(activeClientId),
  };
  const contaAzul = params.get("contaazul");

  const pedida = params.get("secao") ?? (contaAzul ? "integracoes" : "perfil");
  const secao = SECOES[pedida]?.pode(permissoes) ? pedida : "perfil";
  const { Componente } = SECOES[secao];

  function irPara(id) {
    setParams({ secao: id });
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="page aj">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Ajustes</h1>
          <p className="page-description">
            Seu perfil, suas preferências e as configurações do cockpit.
          </p>
        </div>
      </header>
      <div className="aj-layout">
        <nav className="aj-nav" aria-label="Seções de Ajustes">
          {GRUPOS.map((g) => {
            const itens = g.itens.filter((id) => SECOES[id].pode(permissoes));
            if (!itens.length) return null;
            return (
              <div key={g.titulo} className="aj-nav-grupo">
                <p className="aj-nav-titulo">{g.titulo}</p>
                {itens.map((id) => {
                  const { label } = SECOES[id];
                  const Icone =
                    id === "aparencia" && theme === "dark"
                      ? Moon
                      : SECOES[id].Icone;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`aj-nav-item ${secao === id ? "ativo" : ""}`}
                      aria-current={secao === id ? "page" : undefined}
                      onClick={() => irPara(id)}
                    >
                      <Icone
                        size={17}
                        weight={secao === id ? "fill" : "regular"}
                        aria-hidden="true"
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="aj-conteudo">
          {contaAzul && (
            <p
              className={`aj-aviso ${contaAzul === "sucesso" ? "aj-aviso-ok" : "aj-aviso-erro"}`}
              role="status"
            >
              <Plugs size={18} aria-hidden="true" />
              {contaAzul === "sucesso"
                ? "Conta Azul conectada com sucesso."
                : "Não foi possível conectar a Conta Azul. Tente de novo."}
            </p>
          )}
          <Componente irPara={irPara} icone={SECOES[secao].Icone} />
        </div>
      </div>
    </div>
  );
}
