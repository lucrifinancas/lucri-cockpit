import { Hono } from "hono";
import { authRoutes } from "./routes/auth.js";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({ status: "ok", servico: "lucri-cockpit-server" });
});

app.route("/api/auth", authRoutes);

export default app;
