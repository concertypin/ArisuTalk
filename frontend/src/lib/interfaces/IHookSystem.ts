/**
 * Context object passed to scripts.
 * It will contain character object, settings, etc... to be used by scripts.
 * Since it allows dynamic properties(even added by scripts), we can't define a strict interface.
 */
export interface ScriptContext {
    // Script can access properties dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * Function signature for a hook handler.
 * @param context - The context object providing data to the hook.
 * @returns Optional modified context or promise resolving to it.
 */
export type HookHandler = (
    context: ScriptContext
) => Promise<ScriptContext | void> | ScriptContext | void;

/**
 * Interface for the extensibility/hook system.
 * Allows registering and triggering hooks for custom behavior (plugins, scripts).
 */
export interface IHookSystem {
    /**
     * Registers a new hook handler.
     * @param hookName - The name of the hook event (e.g., 'onMessageReceived').
     * @param handler - The function to execute when the hook is triggered.
     * @param priority - execution priority (default: 0). Higher runs earlier.
     */
    register(hookName: string, handler: HookHandler, priority?: number): void;

    /**
     * Unregisters an existing hook handler.
     * @param hookName - The name of the hook event.
     * @param handler - The handler function to remove.
     */
    unregister(hookName: string, handler: HookHandler): void;

    /**
     * Triggers a specific hook event.
     * @param hookName - The name of the hook event to trigger.
     * @param context - The initial context to pass to the handlers.
     * @returns Promise resolving to the final modified context.
     */
    trigger(hookName: string, context: ScriptContext): Promise<ScriptContext>;
}
