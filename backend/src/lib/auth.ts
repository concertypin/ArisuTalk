import { Hono } from "hono";
import { AuthenticatedBindings, UserType } from "../types";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

/**
 *
 * @returns Hono router with Clerk authentication and user role authorization middleware.
 * Use `c.get("user")` to access the authenticated user in route handlers.
 */
export function createAuthedHonoRouter() {
    return new Hono<AuthenticatedBindings>()
        .use("*", clerkMiddleware())
        .use("*", async (c, next) => {
            const auth = getAuth(c);
            if (!auth?.userId) {
                return c.text("Unauthorized!", 401);
            }
            if (c.req.method !== "GET") {
                const clerk = c.get("clerk");
                const user = await clerk.users.getUser(auth.userId);
                const role = user.publicMetadata.role;
                const userObj: UserType = {
                    authUid: user.id,
                    name: user.fullName || "User",
                    role: typeof role === "string" ? role : "user",
                };
                c.set("user", userObj);
                if (role !== "admin") {
                    return c.text("Forbidden!", 403);
                }
            }
            return next();
        });
}
