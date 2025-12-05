import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { describeRoute, openAPIRouteHandler } from "hono-openapi";
import { cors } from "@/lib/cors";
import type { Bindings } from "@/platform";
import blobRoutes from "@/routes/blob";
import dataRoutes from "@/routes/data";

await import("consola")
    .then((i) => {
        //use consola for logging if available
        // biome-ignore lint/suspicious/noGlobalAssign: Enhance console with consola
        console = { ...i.default, ...console };
    })
    .catch(); // Ignore errors (e.g., production build)

let app = new Hono<Bindings>();
app = app.use(logger(), cors);

app = app.get(
    "/",
    describeRoute({
        summary: "Root endpoint",
        description:
            "Returns a friendly greeting. Can be used as a health check.",
        tags: ["General"],
        responses: {
            200: {
                description: "Greeting message",
                content: {
                    "text/plain": { schema: { type: "string" } },
                },
            },
        },
    }),
    (c) => c.text("Oh hi"),
);

// Mount API routes under /api
app = app.route("/api", dataRoutes);
app = app.route("/api", blobRoutes);

const jwtAuthScheme = Object.entries({
    ClerkUser:
        "Clerk User JWT for authentication. It should be included in the Authorization header as a Bearer token.",
    ClerkTrusted:
        "Clerk Service JWT for trusted user. This is used for private A/B testing. It includes user's permissions and roles.",
    ClerkAdmin:
        "Clerk Admin JWT for administrative tasks. This token has elevated privileges and should be handled securely.",
}).map(([key, desc]) => [
    key,
    {
        description: desc,
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
    },
]);

app = app.get(
    "/openapi.json",
    openAPIRouteHandler(app, {
        includeEmptyPaths: true,
        documentation: {
            components: {
                securitySchemes: {
                    ...Object.fromEntries(jwtAuthScheme),
                },
            },
            info: {
                title: "ArisuTalk Phonebook API",
                version: "1.0.0",
                description:
                    "API for managing Data items in ArisuTalk Phonebook",
            },
        },
    }),
);
app = app.get(
    "/docs",
    Scalar({
        title: "ArisuTalk Phonebook API",
        url: "/openapi.json",
    }),
);
export default app;
