import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.js";
import { authGoogleRoutes } from "./routes/authGoogle.js";
import { clientesRoutes } from "./routes/clientes.js";
import { contaazulOnboardingRoutes } from "./routes/contaazulOnboarding.js";
import { homeRoutes } from "./routes/home.js";
import { financeiroRoutes } from "./routes/financeiro.js";
import { ContaAzulDesconectadaError } from "./contaazul/errors.js";
import { recalcularHistoricoPendente } from "./cron/historico.js";
import { origemPermitida } from "./auth/origem.js";
import { bloquearCsrf } from "./middleware/csrf.js";
import { observarRequisicao } from "./middleware/observabilidade.js";
import { registrosRoutes, auditoriaRoutes } from "./routes/registros.js";
import { limparRegistros } from "./db/registros.js";
import { perfisRoutes } from './routes/perfis.js';
import { centralAcessosRoutes } from './routes/centralAcessos.js';

const app = new Hono();
app.use('*', observarRequisicao);

// Tratamento central de erros — qualquer rota que jogue esse erro específico
// vira uma resposta clara (409), em vez de um 500 genérico que o front não
// consegue diferenciar de um bug qualquer.
app.onError((erro, c) => {
  if (erro instanceof ContaAzulDesconectadaError) {
    c.set('codigoErro', 'CONTA_AZUL_DESCONECTADA');
    return c.json({ erro: "conta_azul_desconectada", request_id: c.get('requestId') }, 409);
  }
  c.set('codigoErro', 'ERRO_INTERNO');
  return c.json({ erro: "Erro interno do servidor.", request_id: c.get('requestId') }, 500);
});

// Só o front oficial (definido em APP_URL) pode chamar essa API, e só ele
// pode mandar/receber o cookie de sessão (credentials). Localhost e IPs de
// rede local também são liberados, mas só em desenvolvimento (backend
// rodando em localhost/rede local) — em produção ninguém além da origem
// oficial passa, mesmo que finja ser localhost no cabeçalho Origin. Ver
// RELATORIO-SEGURANCA-2026-09-24.md, achado 5.
app.use(
  "*",
  cors({
    origin: (origin, c) => (origemPermitida(origin, c) ? origin : ""),
    credentials: true,
    allowHeaders: ["Content-Type", "X-App-Version"],
    exposeHeaders: ["X-Request-ID"],
  })
);

// CORS só impede o NAVEGADOR de ler a resposta — não impede a rota de
// rodar. Esta camada extra bloqueia a escrita em si (POST/PUT/PATCH/DELETE)
// vinda de fora da lista de origens permitidas. Ver
// RELATORIO-SEGURANCA-2026-09-24.md, achado 1.
app.use("*", bloquearCsrf);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", servico: "lucri-cockpit-server" });
});

app.route("/api/auth", authRoutes);
app.route("/api/auth/google", authGoogleRoutes);
app.route("/api/clientes", clientesRoutes);
app.route("/api/contaazul", contaazulOnboardingRoutes);
app.route("/api/clientes", homeRoutes);
app.route("/api/clientes", financeiroRoutes);
app.route('/api/registros', registrosRoutes);
app.route('/api/clientes', auditoriaRoutes);
app.route('/api', perfisRoutes);
app.route('/api/central-acessos', centralAcessosRoutes);

export default {
  fetch: app.fetch,
  // Recalcula histórico mensal pendente em fatias pequenas (ver
  // cron/historico.js e o schedule em wrangler.toml) — não bloqueia
  // requisições HTTP, roda em paralelo via waitUntil.
  scheduled(event, env, ctx) {
    ctx.waitUntil(recalcularHistoricoPendente(env));
    ctx.waitUntil(limparRegistros(env.DB));
  },
};
