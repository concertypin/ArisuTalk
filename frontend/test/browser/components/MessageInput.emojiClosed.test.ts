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

// This lives in its own file: the picker's loading state is module-scoped and shared by every test of
// a file, so "never requested" only holds when nothing else in the file has opened the picker. Vitest
// gives each test file a fresh module registry, which keeps this independent of test order.
test("emoji data is not requested while the picker stays closed", async () => {
    const user = userEvent.setup();
    render(MessageInput, { props: { onSubmit: vi.fn() } });
    await user.type(screen.getByRole("textbox"), "typing without opening the picker");

    expect(emojiModule.evaluations).toBe(0);
});
