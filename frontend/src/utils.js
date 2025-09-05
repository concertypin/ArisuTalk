import { getLanguage } from "./i18n.js";

export function debounce(func, delay) {
  let timeout;
  const debounced = function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };

  debounced.cancel = function () {
    clearTimeout(timeout);
  };

  return debounced;
}

export function findMessageGroup(messages, targetIndex, characterName) {
  if (targetIndex < 0 || targetIndex >= messages.length) {
    return null;
  }

  const targetMessage = messages[targetIndex];
  const targetSender = targetMessage.isMe
    ? "user"
    : targetMessage.sender || characterName;

  let startIndex = targetIndex;
  let endIndex = targetIndex;

  // Find the start of the group
  while (startIndex > 0) {
    const prevMessage = messages[startIndex - 1];
    const prevSender = prevMessage.isMe
      ? "user"
      : prevMessage.sender || characterName;
    if (prevSender !== targetSender) break;
    startIndex--;
  }

  // Find the end of the group
  while (endIndex < messages.length - 1) {
    const nextMessage = messages[endIndex + 1];
    const nextSender = nextMessage.isMe
      ? "user"
      : nextMessage.sender || characterName;
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

export function formatDateSeparator(dateString) {
  const date = new Date(dateString);
  /**
   * @type {Intl.DateTimeFormatOptions}
   */
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString(getLanguage(), options);
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const now = new Date();
  const date = new Date(timestamp);

  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = nowDay.getTime() - dateDay.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);

  const lang = getLanguage();

  if (diffDays < 1) {
    // Today
    return date.toLocaleTimeString(lang, {
      hour: "numeric",
      minute: "2-digit",
    });
  } else if (diffDays < 7) {
    // Within a week
    return date.toLocaleDateString(lang, { weekday: "long" });
  } else {
    // More than a week ago
    return date.toLocaleDateString(lang, { month: "numeric", day: "numeric" });
  }
}
