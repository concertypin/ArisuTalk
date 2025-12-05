import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import type { AuthenticatedBindings, UserType } from "@/environmentTypes";

const authLevels = ["admin", "trusted", "known", "visitor"] as const;
/**
 * - "admin": Full access to all routes.
 * - "trusted": Special access to certain routes.
 * - "known": Regular authenticated user access.
 * - "visitor": Base user with minimal access. User starts here.
 * - "optional": No authentication required, allows wrong credentials.
 */
export type AuthLevel = (typeof authLevels)[number] | "optional";
/**
 *
 * @param authLevel The required authentication level for the routes in this router.
 * @returns Hono router with Clerk authentication and user role authorization middleware.
 * Use `c.get("user")` to access the authenticated user in route handlers.
 * `c.get("user")` will always be set, even if the user is not authenticated. In which case, it will be a guest user with role "anonymous".
 */
export function createAuthedHonoRouter(authLevel: AuthLevel = "known") {
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

            const rawRole = user.publicMetadata.role;
            const normalizedRole =
                typeof rawRole === "string" &&
                (authLevels as readonly string[]).includes(rawRole)
                    ? rawRole
                    : "visitor";

            const userObj: UserType = {
                authUid: user.id,
                name: user.fullName || "User",
                role: normalizedRole,
            };
            // do not log user identifiers in production
            c.set("user", userObj);

            // Check if the user's role meets the required auth level
            if (authLevel === "optional") return next();
            else if (
                (authLevels as readonly string[]).indexOf(normalizedRole) <=
                authLevels.indexOf(authLevel)
            )
                return next();
            else return c.text("Forbidden!", 403);
        });
}
