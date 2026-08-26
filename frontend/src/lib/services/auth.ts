/**
 * @fileoverview Clerk authentication service.
 *
 * Provides the Clerk publishable key and re-exports the context hook
 * so components can access reactive auth state inside the ClerkProvider tree.
 *
 * Usage in a Svelte component:
 * ```svelte
 * <script lang="ts">
 *   import { useClerkContext } from "@/lib/services/auth";
 *   const ctx = useClerkContext();
 *   // ctx.isLoaded, ctx.auth.userId, ctx.session, ctx.user, …
 * </script>
 * ```
 *
 * @module
 */

import { useClerkContext } from "svelte-clerk/client";

/**
 * Clerk publishable key from environment variables.
 * Used as the `publishableKey` prop on `<ClerkProvider>`.
 */
export const CLERK_PUBLISHABLE_KEY: string = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";

export { useClerkContext };
