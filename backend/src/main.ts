import { Hono } from "hono";
import { Bindings } from "./platform";
import dataRoutes from "./routes/data";
import { Scalar } from "@scalar/hono-api-reference";
import { openAPIRouteHandler } from "hono-openapi";
import { tr } from "zod/locales";

let app = new Hono<Bindings>();

app = app.get("/", (c) => c.text("Oh hi"));

// Mount API routes under /api
//rapp = app.route("/api", dataRoutes);
app.get(
    "/openapi.json",
    openAPIRouteHandler(dataRoutes, {
        includeEmptyPaths: true,
        documentation: {
            info: {
                title: "ArisuTalk Phonebook API",
                version: "1.0.0",
                description:
                    "API for managing Data items in ArisuTalk Phonebook",
            },
        },
    })
);
app.get(
    "/docs",
    Scalar({
        title: "ArisuTalk Phonebook API",
        url: "/openapi.json",
    })
);
export default app;
