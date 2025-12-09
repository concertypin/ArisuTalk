import { type Context, Hono, type Next } from "hono";
import { cors as corsHono } from "hono/cors";

/**
 * Allowed origins for CORS
 * It allows CORS requests from these origins
 * Keep in mind that ports are ignored in wildcard subdomains,
 * which means that all ports from the origin are allowed
 * Wildcards are not a regex
 */
const allowedOrigins = [
	"arisutalk.moe",
	"spark.arisutalk.moe",
	"localhost:5173",
	"localhost:5174",
	"127.0.0.1:5173",
	"127.0.0.1:5174",
];

/**
 * CORS middleware for Hono.
 * Handles CORS with dynamic origin resolution based on allowed origins.
 * @see allowedOrigins
 * @example new Hono().use("*", cors);
 * @returns Hono middleware that handles CORS with dynamic origin resolution
 */
export async function cors<Ctx extends Context>(c: Ctx, next: Next) {
	return corsHono({
		origin: allowedOrigins.flatMap((i) => ["http://" + i, "https://" + i]),
		credentials: true,
		allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS".split(","),
	})(c, next);
}
