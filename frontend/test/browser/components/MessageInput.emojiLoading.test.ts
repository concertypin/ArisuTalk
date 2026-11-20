import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { Logger } from "@common/logger/Logger";
import MessageInput from "@/components/chat/MessageInput.svelte";

const GRINNING = "😀";

const emojiModule = vi.hoisted(() => ({
    /** When set, evaluating the module fails, like a failed chunk download would. */
    fail: false,
}));

vi.mock("unicode-emoji-json/data-by-group.json", () => {
    return {
        get default() {
            if (emojiModule.fail) throw new Error("simulated load failure");
            return [
                {
                    name: "Smileys",
                    slug: "smileys",
                    emojis: [
                        {
                            emoji: "😀",
                            skin_tone_support: false,
                            name: "grinning face",
                            slug: "grinning_face",
                            unicode_version: "6.1",
                            emoji_version: "1.0",
                        },
                    ],
                },
            ];
        },
    };
});

// The picker's loading state lives in module scope on purpose (one download for every picker).
// The "never requested while closed" case is in MessageInput.emojiClosed.test.ts so that this file's
// opening of the picker cannot affect it.
describe("emoji data loading", () => {
    test("a failed load is not cached: reopening the picker attempts it again", async () => {
        emojiModule.fail = true;
        const logged = vi.spyOn(Logger, "error").mockImplementation(() => {});
        const screen = render(MessageInput, { onSubmit: vi.fn() });

        await screen.getByRole("button", { name: "Pick emoji" }).click();
        await vi.waitFor(() => expect(logged).toHaveBeenCalledTimes(1));
        await screen.getByRole("button", { name: "Close", exact: true }).click();
        await screen.getByRole("button", { name: "Pick emoji" }).click();

        // A cached rejection would never be attempted (and so never logged) a second time.
        // The browser keeps a module that failed while evaluating, so success on retry cannot be
        // simulated here; a new attempt is what proves the failure was not remembered.
        await vi.waitFor(() => expect(logged).toHaveBeenCalledTimes(2));
        await expect
            .element(screen.getByRole("button", { name: GRINNING }))
            .not.toBeInTheDocument();
        logged.mockRestore();
    });
});
