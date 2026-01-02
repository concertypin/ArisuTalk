export interface ExecutionOptions {
    /**
     * Timeout in milliseconds for script execution.
     * @default 5000
     */
    timeout?: number;

    /**
     * Whether to allow network access.
     * @default false
     */
    allowNetwork?: boolean;

    /**
     * Character ID for storage isolation.
     * Each character gets its own storage namespace.
     */
    characterId?: string;

    /**
     * Context data passed to the script.
     */
    context?: ScriptContext;
}

export interface ScriptContext {
    /**
     * The message being processed.
     */
    message: {
        content: string;
        role: "user" | "assistant" | "system";
        metadata: Record<string, unknown>;
    };

    /**
     * Information about the current persona.
     */
    persona?: {
        name: string;
        id: string;
    };
}

export interface ExecutionResult {
    /**
     * The result of the script execution (if any).
     */
    result?: unknown;

    /**
     * The modified context (if the script modified it).
     */
    modifiedContext?: ScriptContext;

    /**
     * Captured stdout/console.log output.
     */
    logs: string[];

    /**
     * Error message if execution failed.
     */
    error?: string;
}

export interface ScriptingWorkerApi {
    /**
     * Executes a piece of JavaScript code in the QuickJS sandbox.
     * @param code The JS code to execute.
     * @param options Execution options.
     */
    execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>;
}
