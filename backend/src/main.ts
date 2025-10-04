import { Hono } from "hono";
import { Bindings } from "./platform";
import dataRoutes from "./routes/data";

const app = new Hono<Bindings>();

app.get("/", (c) => c.text("Oh hi"));

// Mount API routes under /api
app.route("/api", dataRoutes);

export default app;
