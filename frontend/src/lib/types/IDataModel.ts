/**
 * Represents application settings.
 */
export class Settings {
    /** application theme preference. */
    theme: "light" | "dark" | "system";
    /** Unique identifier for the user (device-specific). */
    userId: string;

    /**
     * Creates new Settings with defaults.
     */
    constructor() {
        this.theme = "system";
        this.userId = crypto.randomUUID();
    }
}
