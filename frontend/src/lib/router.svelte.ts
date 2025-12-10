/**
 * @fileoverview Hash-based router using Svelte 5 runes.
 * Supports lazy loading via dynamic imports.
 */

import type { Component } from "svelte";

/** Route definition with lazy component loading */
export interface Route {
    /** Hash path without the # prefix */
    path: string;
    /** Lazy component loader */
    component: () => Promise<{ default: Component }>;
}

/** Router state using Svelte 5 runes */
let currentPath = $state(getHashPath());

/**
 * Extract path from window.location.hash
 */
function getHashPath(): string {
    const hash = window.location.hash.slice(1); // Remove #
    return hash || "/";
}

/**
 * Initialize router listeners
 */
export function initRouter(): void {
    window.addEventListener("hashchange", () => {
        currentPath = getHashPath();
    });
}

/**
 * Get current route path (reactive)
 */
export function getCurrentPath(): string {
    return currentPath;
}

/**
 * Navigate to a new path
 */
export function navigate(path: string): void {
    window.location.hash = path;
}

/**
 * Check if current path matches
 */
export function isActive(path: string): boolean {
    return currentPath === path;
}
