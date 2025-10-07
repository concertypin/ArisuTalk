import { Hono } from "hono";
import { Bindings } from "platform";
import dataRoutes from "routes/data";
import { Scalar } from "@scalar/hono-api-reference";
import { openAPIRouteHandler } from "hono-openapi";
import { cors } from "lib/cors";

let app = new Hono<Bindings>();

app = app.use("*", cors);

app = app.get("/", (c) => c.text("Oh hi"));

// Mount API routes under /api
app = app.route("/api", dataRoutes);

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

app.get(
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
    })
);
app = app.get(
    "/docs",
    Scalar({
        title: "ArisuTalk Phonebook API",
        url: "/openapi.json",
    })
);
export default app;
