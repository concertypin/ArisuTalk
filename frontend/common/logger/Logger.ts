import adze, { setup } from "adze";

/**
 * Log level hierarchy (lower = more severe, always shown; higher = more verbose).
 * Based on adze's default level numbers.
 */
export const LOG_LEVELS = {
    error: 1,
    warn: 2,
    info: 3,
    log: 6,
    debug: 7,
    verbose: 8,
    trace: 8, // same as verbose
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Structured log event definitions for telemetry collection.
 * Each key is an event name, value is its typed payload.
 * These are not shown in DevTools by default - used for analytics only.
 */
export type StructuredLogLevel = {
    // ─── UI Events ───────────────────────────────────────────────
    /**
     * Modal dialog opened.
     */
    "modal.open": {
        /** App location where modal was triggered */
        location: string;
        /** Modal identifier (e.g., "LLMSettings") */
        modalName: string;
    };
    /**
     * Modal dialog closed.
     */
    "modal.close": {
        /** App location */
        location: string;
        /** Modal identifier */
        modalName: string;
    };
    /**
     * Page/view navigation.
     */
    "page.view": {
        /** Page name */
        pageName: string;
        /** Optional route params */
        params?: Record<string, string>;
    };
    /**
     * Generic UI interaction (clicks, etc).
     */
    "ui.click": {
        /** Component or button identifier */
        elementId: string;
        /** Action description */
        action?: string;
    };

    // ─── Settings ───────────────────────────────────────────────
    /**
     * Application setting changed.
     */
    "settings.change": {
        /** Setting key */
        key: string;
        /** New value (as string) */
        value: string;
    };

    // ─── Chat Events ────────────────────────────────────────────
    // ... (existing chat events)
    /**
     * User sent a message.
     */
    "chat.message.send": {
        /** Chat session ID */
        chatId: string;
        /** Length of the message in characters */
        messageLength: number;
    };
    /**
     * AI response received.
     */
    "chat.message.receive": {
        /** Chat session ID */
        chatId: string;
        /** LLM provider used */
        provider: string;
        /** Response latency in milliseconds */
        latencyMs: number;
    };
    /**
     * Chat session started.
     */
    "chat.session.start": {
        /** Chat session ID */
        chatId: string;
        /** Optional character ID */
        characterId?: string;
    };
    /**
     * Chat session ended.
     */
    "chat.session.end": {
        /** Chat session ID */
        chatId: string;
        /** Total message count */
        messageCount: number;
        /** Session duration in milliseconds */
        durationMs: number;
    };

    // ─── Character Events ───────────────────────────────────────
    /**
     * Character loaded.
     */
    "character.load": {
        /** Character ID */
        characterId: string;
        /** Load source */
        source: "local" | "import";
    };
    /**
     * Character import attempted.
     */
    "character.import": {
        /** Import format (e.g., "png", "json") */
        format: string;
        /** Whether import succeeded */
        success: boolean;
        /** Error message if failed */
        errorMessage?: string;
    };

    // ─── LLM Events ─────────────────────────────────────────────
    /**
     * LLM API request started.
     */
    "llm.request.start": {
        /** Provider name (e.g., "openai", "gemini") */
        provider: string;
        /** Model name */
        model?: string;
    };
    /**
     * LLM API request completed.
     */
    "llm.request.complete": {
        /** Provider name */
        provider: string;
        /** Tokens used (if available) */
        tokensUsed?: number;
        /** Request latency in milliseconds */
        latencyMs: number;
    };
    /**
     * LLM API request failed.
     */
    "llm.request.error": {
        /** Provider name */
        provider: string;
        /** Error type/code */
        errorType?: string;
        /** Error message */
        errorMessage: string;
    };

    // ─── Worker Events ──────────────────────────────────────────
    /**
     * Web Worker status change.
     */
    "worker.status": {
        /** Worker name */
        workerName: string;
        /** Status (ready, error, etc) */
        status: "ready" | "error" | "terminated";
        /** Optional details */
        message?: string;
    };

    // ─── Error Events ───────────────────────────────────────────
    /**
     * Uncaught exception.
     */
    "error.uncaught": {
        /** Error message */
        errorMessage: string;
        /** Stack trace */
        errorStack?: string;
    };
    /**
     * Error boundary triggered.
     */
    "error.boundary": {
        /** Component name */
        componentName: string;
        /** Error message */
        errorMessage: string;
    };

    // ─── Performance ────────────────────────────────────────────
    /**
     * Custom performance timing.
     */
    "perf.timing": {
        /** Operation name */
        operation: string;
        /** Duration in milliseconds */
        durationMs: number;
    };
};

/**
 * Log entry for standard log levels.
 */
export interface StandardLogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    data?: unknown[];
}

/**
 * Log entry for structured telemetry events.
 */
export interface StructuredLogEntry<K extends keyof StructuredLogLevel = keyof StructuredLogLevel> {
    level: K;
    message: string;
    timestamp: number;
    data: StructuredLogLevel[K];
}

/**
 * Union type for all log entries.
 */
export type AnyLogEntry = StandardLogEntry | StructuredLogEntry;

const STORAGE_KEY = "arisutalk:logLevel";
const DEFAULT_LOG_LEVEL: LogLevel = "info";

/**
 * Check if localStorage is available in the current context.
 * Workers don't have localStorage, so we need a runtime check.
 */
function hasLocalStorage(): boolean {
    try {
        return (
            typeof window !== "undefined" &&
            typeof window.localStorage !== "undefined" &&
            window.localStorage !== null
        );
    } catch {
        return false;
    }
}

/**
 * Get the current log level from localStorage, or return default.
 * Safe to call in workers where localStorage may not be available.
 */
function getStoredLogLevel(): LogLevel {
    if (!hasLocalStorage()) return DEFAULT_LOG_LEVEL;
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && stored in LOG_LEVELS) {
            return stored as LogLevel;
        }
    } catch {
        // localStorage access may throw in some contexts
    }
    return DEFAULT_LOG_LEVEL;
}

/**
 * Save log level to localStorage if available.
 */
function saveLogLevel(level: LogLevel): void {
    if (!hasLocalStorage()) return;
    try {
        window.localStorage.setItem(STORAGE_KEY, level);
    } catch {
        // localStorage access may throw in some contexts
    }
}

/**
 * Initialize adze with the stored log level.
 */
function initializeAdze(level: LogLevel): void {
    setup({
        activeLevel: LOG_LEVELS[level],
    });
}

// Initialize on module load
let currentLogLevel = getStoredLogLevel();
initializeAdze(currentLogLevel);

// Create a sealed logger instance with label
const baseLogger = adze.label("ArisuTalk");

/**
 * Callback type for log listeners.
 * Receives both standard and structured log entries.
 */
export type LogListener = (entry: AnyLogEntry) => void;

/**
 * Centralized logging system using adze.
 * Supports standard and verbose logging levels, event hooks for log collection,
 * and localStorage persistence for the active log level.
 */
export class Logger {
    private static listeners: Set<LogListener> = new Set();

    /**
     * Get the current active log level.
     */
    static getLevel(): LogLevel {
        return currentLogLevel;
    }

    /**
     * Set the active log level and persist to localStorage.
     * @param level The log level to set.
     */
    static setLevel(level: LogLevel): void {
        currentLogLevel = level;
        saveLogLevel(level);
        initializeAdze(level);
    }

    private static emit(level: LogLevel, ...args: unknown[]) {
        const firstArg = args[0];
        const message = typeof firstArg === "string" ? firstArg : "";
        const dataArgs = typeof firstArg === "string" ? args.slice(1) : args;
        const entry: StandardLogEntry = {
            level,
            message,
            timestamp: Date.now(),
            data: dataArgs.length > 0 ? dataArgs : undefined,
        };
        Logger.listeners.forEach((listener) => listener(entry));
    }

    /**
     * Emit a structured telemetry event.
     * These events are not logged to console - only sent to listeners.
     * @param event The event name (e.g., "chat.message.send")
     * @param data Type-safe event data
     */
    static structured<K extends keyof StructuredLogLevel>(
        event: K,
        data: StructuredLogLevel[K]
    ): void {
        const entry: StructuredLogEntry<K> = {
            level: event,
            message: event,
            timestamp: Date.now(),
            data,
        };
        Logger.listeners.forEach((listener) => listener(entry));
    }

    // Standard methods - compatible with console.* API
    static info(...args: unknown[]) {
        this.emit("info", ...args);
        const [msg, ...rest] = args;
        baseLogger.info(msg, ...rest);
    }
    static log(...args: unknown[]) {
        this.emit("log", ...args);
        const [msg, ...rest] = args;
        baseLogger.log(msg, ...rest);
    }
    static warn(...args: unknown[]) {
        this.emit("warn", ...args);
        const [msg, ...rest] = args;
        baseLogger.warn(msg, ...rest);
    }
    static error(...args: unknown[]) {
        this.emit("error", ...args);
        const [msg, ...rest] = args;
        baseLogger.error(msg, ...rest);
    }

    // Verbose methods
    static debug(...args: unknown[]) {
        this.emit("debug", ...args);
        const [msg, ...rest] = args;
        baseLogger.debug(msg, ...rest);
    }
    static trace(...args: unknown[]) {
        this.emit("trace", ...args);
        // Use adze's trace modifier which prints a stacktrace
        const [msg, ...rest] = args;
        baseLogger.trace.log(msg, ...rest);
    }
    static verbose(...args: unknown[]) {
        this.emit("verbose", ...args);
        const [msg, ...rest] = args;
        baseLogger.verbose(msg, ...rest);
    }

    /**
     * Attach a listener to capture all emitted logs.
     * @param listener Callback function receiving log entries.
     * @returns A cleanup function to remove the listener.
     */
    static onLog(listener: LogListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Remove a specific listener.
     * @param listener The listener to remove.
     */
    static offLog(listener: LogListener): void {
        this.listeners.delete(listener);
    }

    /**
     * Remove all listeners.
     */
    static clearListeners(): void {
        this.listeners.clear();
    }
}
