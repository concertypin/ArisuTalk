import { onTestFinished } from "vitest";

/**
 * Records every `submit` event of the page for the current test, and stops after it.
 * @returns The events, in the order they were dispatched.
 */
export function recordSubmitEvents(): SubmitEvent[] {
    const events: SubmitEvent[] = [];
    const record = (event: SubmitEvent) => events.push(event);
    document.addEventListener("submit", record);
    onTestFinished(() => document.removeEventListener("submit", record));
    return events;
}
