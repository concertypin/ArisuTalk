import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MessageInput from "@/components/chat/MessageInput.svelte";

const emojiModule = vi.hoisted(() => ({
    /** How many times the mocked emoji module was evaluated, i.e. how often the data was requested. */
    evaluations: 0,
}));

vi.mock("unicode-emoji-json/data-by-group.json", () => {
    emojiModule.evaluations += 1;
    return { default: [] };
});

// Own file: the picker's loading is module-scoped, so another test opening it breaks "never requested".
test("emoji data is not requested while the picker stays closed", async () => {
    const user = userEvent.setup();
    render(MessageInput, { props: { onSubmit: vi.fn() } });
    await user.type(screen.getByRole("textbox"), "typing without opening the picker");

    expect(emojiModule.evaluations).toBe(0);
});
