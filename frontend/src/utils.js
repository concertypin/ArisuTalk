import { getLanguage } from './i18n.js';
import './types.js';

/**
 * Creates a debounced function that delays invoking `func` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @template {(...args: any[]) => any} T
 * @param {T} func - The function to debounce.
 * @param {number} delay - The number of milliseconds to delay.
 * @returns {(...args: Parameters<T>) => void} A new debounced function.
 */
export function debounce(func, delay) {
  /**
   * @type {number}
   */
  let timeout;
  /**
   * @this {any} todo: Declare this type
   */
  return function (/** @type {any} */ ...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

/**
 * Finds a contiguous group of messages sent by the same sender (either "user" or the specified character).
 * 
 * @param {import('./types.js').Message[]} messages - The array of message objects. Each message should have an `isMe` boolean and an `id`.
 * @param {number} targetIndex - The index of the target message in the messages array.
 * @param {string} characterName - The name of the character (used as sender when `isMe` is false).
 * @returns {{startIndex: number, endIndex: number, messages: import('./types.js').Message[], lastMessageId: number} | null} An object containing:
 *   - {number} startIndex: The index of the first message in the group.
 *   - {number} endIndex: The index of the last message in the group.
 *   - {Message[]} messages: The array of messages in the group.
 *   - {string|number} lastMessageId: The id of the last message in the group.
 *   Returns `null` if the targetIndex is out of bounds.
 */
export function findMessageGroup(messages, targetIndex, characterName) {
  if (targetIndex < 0 || targetIndex >= messages.length) {
    return null;
  }

  const targetMessage = messages[targetIndex];
  const targetSender = targetMessage.isMe ? "user" : characterName;

  let startIndex = targetIndex;
  let endIndex = targetIndex;

  // Find the start of the group
  while (startIndex > 0) {
    const prevMessage = messages[startIndex - 1];
    const prevSender = prevMessage.isMe ? "user" : characterName;
    if (prevSender !== targetSender) break;
    startIndex--;
  }

  // Find the end of the group
  while (endIndex < messages.length - 1) {
    const nextMessage = messages[endIndex + 1];
    const nextSender = nextMessage.isMe ? "user" : characterName;
    if (nextSender !== targetSender) break;
    endIndex++;
  }

  return {
    startIndex,
    endIndex,
    messages: messages.slice(startIndex, endIndex + 1),
    lastMessageId: messages[endIndex].id,
  };
}

/**
 * Formats a date string into a localized, human-readable date separator.
 *
 * The formatted string includes the weekday, day, month, and year,
 * using the language returned by `getLanguage()`.
 *
 * @param {string} dateString - The date string to format (ISO format recommended).
 * @returns {string} The formatted date separator.
 */
export function formatDateSeparator(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };

  //@ts-ignore todo: Why does this not work? 
  return date.toLocaleDateString(getLanguage(), options);
}
