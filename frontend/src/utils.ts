import { getLanguage } from "$root/i18n";
import type { Message } from "$types/chat";

interface MessageGroup {
    startIndex: number;
    endIndex: number;
    messages: Message[];
    lastMessageId: number | string;
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
): T & { cancel: () => void } {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const debounced = function (this: any, ...args: Parameters<T>) {
        const context = this;
        if (timeout !== null) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    } as T;

    (debounced as T & { cancel?: () => void }).cancel = function () {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced as T & { cancel: () => void };
}

export function findMessageGroup(
    messages: Message[],
    targetIndex: number,
    characterName: string,
): MessageGroup | null {
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

export function formatDateSeparator(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
    };
    return date.toLocaleDateString(getLanguage(), options);
}

export function formatTimestamp(
    timestamp: string | number | Date | null | undefined,
): string {
    if (!timestamp) return "";

    const now = new Date();
    const date = new Date(timestamp);

    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );

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
        return date.toLocaleDateString(lang, {
            month: "numeric",
            day: "numeric",
        });
    }
}
