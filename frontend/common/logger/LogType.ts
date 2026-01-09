type StructuredLogUI = {
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
};
type StructuredLogSettings = {
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
};
type StructuredLogCharacter = {
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
};
type StructuredLogLLM = {
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
};
type StructuredLogWorker = {
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
};
type StructuredLogError = {
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
};
type StructuredLogPerf = {
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
 * Structured log event definitions for telemetry collection.
 * Each key is an event name, value is its typed payload.
 * These are not shown in DevTools by default - used for analytics only.
 */

export type StructuredLogLevel = StructuredLogUI &
    StructuredLogSettings &
    StructuredLogCharacter &
    StructuredLogLLM &
    StructuredLogWorker &
    StructuredLogError &
    StructuredLogPerf;
