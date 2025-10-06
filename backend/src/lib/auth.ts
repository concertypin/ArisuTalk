import { Hono } from "hono";
import { AuthenticatedBindings, UserType } from "../types";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

const authLevels = ["admin", "trusted", "user", "anonymous"] as const;
export type AuthLevel = (typeof authLevels)[number] | "optional";
/**
 *
 * @returns Hono router with Clerk authentication and user role authorization middleware.
 * Use `c.get("user")` to access the authenticated user in route handlers.
 */
export function createAuthedHonoRouter(authLevel: AuthLevel = "user") {
    return new Hono<AuthenticatedBindings>()
        .use("*", (c, next) => {
            if (!c.env.SECRET_CLERK_SECRET_KEY) {
                throw new Error("SECRET_CLERK_SECRET_KEY is not set");
            }
            return clerkMiddleware({
                secretKey: c.env.SECRET_CLERK_SECRET_KEY,
                publishableKey: c.env.ENV_CLERK_PUBLIC_KEY,
            })(c, next);
        })
        .use("*", async (c, next) => {
            console.log(`Auth level required: ${authLevel}`);
            const auth = getAuth(c);
            if (!auth?.userId) {
                if (authLevel === "optional") {
                    c.set("user", {
                        authUid: "OPTIONAL_AND_NOT_PASSED",
                        name: "Guest",
                        role: "anonymous",
                    });
                    return next();
                } else return c.text("Unauthorized!", 401);
            }
            const clerk = c.get("clerk");
            const user = await clerk.users.getUser(auth.userId);

            const role = user.publicMetadata.role as string | undefined | null;
            const userObj: UserType = {
                authUid: user.id,
                name: user.fullName || "User",
                role: typeof role === "string" ? role : "anonymous",
            };
            console.log(`User role: ${userObj.role}, id: ${userObj.authUid}`);
            c.set("user", userObj);

            // Check if the user's role meets the required auth level
            if (authLevel === "optional") return next();
            if (role && (authLevels as readonly string[]).includes(role))
                if (
                    (authLevels as readonly string[]).indexOf(role) <=
                    authLevels.indexOf(authLevel)
                )
                    return next();
            return c.text("Forbidden!", 403);
        });
}
