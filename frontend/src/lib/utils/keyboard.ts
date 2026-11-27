/**
 * @fileoverview Keyboard event helpers.
 */

/**
 * Whether a key event belongs to an IME composition (Korean, Japanese, Chinese input).
 * Safari fires the Enter that commits a composition after `compositionend`, with `isComposing`
 * false and `keyCode` 229, so both signals are checked.
 * @param event - The keyboard event.
 * @returns `true` while the key press is part of a composition.
 */
export function isComposing(event: KeyboardEvent): boolean {
    // keyCode is deprecated, but it is the only signal Safari gives for this Enter.
    // oxlint-disable-next-line typescript/no-deprecated
    return event.isComposing || event.keyCode === 229;
}
