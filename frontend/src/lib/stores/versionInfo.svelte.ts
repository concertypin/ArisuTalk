/**
 * @fileoverview Version information store using Svelte 5 Runes.
 * Reads build-time environment variables for version, commit, and channel info.
 */

export interface VersionInfo {
    /** Version name (e.g. "1.0.0") — from VITE_VERSION_NAME or package.json. */
    version: string;
    /** Deployment channel — "spark", "dev", or "prod". */
    channel: string;
    /** Short commit hash, if available. */
    commit: string;
    /** URL to the GitHub releases page. */
    url: string;
}

function readVersionInfo(): VersionInfo {
    return {
        version: import.meta.env.VITE_VERSION_NAME ?? "0.0.0",
        channel: import.meta.env.VITE_VERSION_CHANNEL ?? "dev",
        commit: import.meta.env.VITE_COMMIT_HASH ?? "",
        url:
            import.meta.env.VITE_VERSION_URL ?? "https://github.com/concertypin/ArisuTalk/releases",
    };
}

/**
 * Reactive version information store.
 * Provides version, channel, commit hash, and GitHub URL.
 */
class VersionInfoStore {
    value = $state<VersionInfo>(readVersionInfo());

    /**
     * Get a display label combining the app name and channel.
     * Example: "ArisuTalk (dev)", "ArisuTalk (prod)"
     */
    get displayLabel(): string {
        const base = "ArisuTalk";
        return this.value.channel === "prod" ? base : `${base} (${this.value.channel})`;
    }
}

export const versionInfo = new VersionInfoStore();
