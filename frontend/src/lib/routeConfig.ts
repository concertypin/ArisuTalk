/**
 * @fileoverview Route registry for the application.
 * Centralizes all route definitions to keep App.svelte clean.
 */

import type { Component } from "svelte";

/**
 * Type definition for a lazy-loaded route component.
 * Returns a promise resolving to a module with a default export (the Svelte component).
 */
export type RouteLoader = () => Promise<{ default: Component }>;

/**
 * Registry of all application routes.
 * Keys are hash paths (e.g. '/' or '/chat').
 * Values are lazy-load functions for components.
 */
export const routes: Record<string, RouteLoader> = {
    "/": () => import("../routes/Home.svelte"),
    // Add new routes here as the app grows
};
