/**
 * @fileoverview Small helpers on top of `@testing-library/user-event`.
 */
import type { UserEvent } from "@testing-library/user-event";

/**
 * Replaces a field's content with `text`, inserted literally (`user.type` parses `{` and `[`).
 */
export async function fillText(user: UserEvent, element: HTMLElement, text: string): Promise<void> {
    await user.clear(element);
    if (text !== "") await user.paste(text);
}
