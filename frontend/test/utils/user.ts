/**
 * @fileoverview Small helpers on top of `@testing-library/user-event`.
 */
import type { UserEvent } from "@testing-library/user-event";

/**
 * Replaces the content of a text field, like a browser form fill: the old value is cleared and the
 * new text is inserted in one go. Unlike `user.type`, the text is not parsed for key descriptors,
 * so values such as JSON (`{"a": 1}`) and `[` are inserted literally.
 * @param user - A `userEvent.setup()` instance.
 * @param element - The input, textarea or contenteditable to fill.
 * @param text - The new value. An empty string only clears the field.
 */
export async function fillText(user: UserEvent, element: HTMLElement, text: string): Promise<void> {
    await user.clear(element);
    if (text !== "") await user.paste(text);
}
