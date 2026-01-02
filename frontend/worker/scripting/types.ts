export interface ExecutionOptions {
    /**
     * Timeout in milliseconds for script execution.
     * @default 1000
     */
    timeout?: number;

    /**
     * Whether to allow network access.
     * @default false
     */
    allowNetwork?: boolean;
}

export interface ExecutionResult {
    /**
     * The result of the script execution (if any).
     */
    result?: unknown;

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
