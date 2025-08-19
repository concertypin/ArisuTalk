import { getLanguage } from './i18n.js';

export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

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

export function formatDateSeparator(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString(getLanguage(), options);
}
