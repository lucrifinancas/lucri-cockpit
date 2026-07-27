import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.js";
import { clientesRoutes } from "./routes/clientes.js";
import { contaazulOnboardingRoutes } from "./routes/contaazulOnboarding.js";
import { homeRoutes } from "./routes/home.js";

const app = new Hono();

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

export default app;
