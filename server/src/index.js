import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.js";
import { clientesRoutes } from "./routes/clientes.js";
import { contaazulOnboardingRoutes } from "./routes/contaazulOnboarding.js";
import { homeRoutes } from "./routes/home.js";
import { financeiroRoutes } from "./routes/financeiro.js";
import { ContaAzulDesconectadaError } from "./contaazul/errors.js";

const app = new Hono();

// Tratamento central de erros — qualquer rota que jogue esse erro específico
// vira uma resposta clara (409), em vez de um 500 genérico que o front não
// consegue diferenciar de um bug qualquer.
app.onError((erro, c) => {
  if (erro instanceof ContaAzulDesconectadaError) {
    return c.json({ erro: "conta_azul_desconectada" }, 409);
  }
  console.error(erro);
  return c.json({ erro: "Erro interno do servidor." }, 500);
});

// Só o front oficial (definido em APP_URL) pode chamar essa API, e só ele
// pode mandar/receber o cookie de sessão (credentials).
app.use(
  "*",
  cors({
    origin: (origin, c) => (origin === c.env.APP_URL ? origin : ""),
    credentials: true,
  })
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", servico: "lucri-cockpit-server" });
});

app.route("/api/auth", authRoutes);
app.route("/api/clientes", clientesRoutes);
app.route("/api/contaazul", contaazulOnboardingRoutes);
app.route("/api/clientes", homeRoutes);
app.route("/api/clientes", financeiroRoutes);

export default app;
