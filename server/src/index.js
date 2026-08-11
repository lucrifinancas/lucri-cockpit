import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.js";
import { clientesRoutes } from "./routes/clientes.js";
import { contaazulOnboardingRoutes } from "./routes/contaazulOnboarding.js";
import { homeRoutes } from "./routes/home.js";
import { financeiroRoutes } from "./routes/financeiro.js";

const app = new Hono();

// Só o front oficial (definido em APP_URL) pode chamar essa API, e só ele
// pode mandar/receber o cookie de sessão (credentials). Localhost e IPs de
// rede local também são liberados pra permitir rodar o front em dev contra
// o backend publicado ou testar em outra máquina na mesma rede.
app.use(
  "*",
  cors({
    origin: (origin, c) =>
      origin === c.env.APP_URL ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+:\d+$/.test(
        origin
      )
        ? origin
        : "",
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
