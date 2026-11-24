import { test, expect, describe, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
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
        const user = userEvent.setup();
        emojiModule.fail = true;
        const logged = vi.spyOn(Logger, "error").mockImplementation(() => {});
        render(MessageInput, { props: { onSubmit: vi.fn() } });

        await user.click(screen.getByRole("button", { name: "Pick emoji" }));
        await waitFor(() => expect(logged).toHaveBeenCalledTimes(1));
        await user.click(screen.getByRole("button", { name: "Close" }));
        await user.click(screen.getByRole("button", { name: "Pick emoji" }));

        // A cached rejection would never be attempted (and so never logged) a second time.
        // A new attempt is what proves the failure was not remembered.
        await waitFor(() => expect(logged).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole("button", { name: GRINNING })).not.toBeInTheDocument();
        logged.mockRestore();
    });
});
