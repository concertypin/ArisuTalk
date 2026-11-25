import { test, expect, describe, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import { createTestCharacter } from "@test/utils/character";
import CharacterHooksSettings from "@/features/character/components/settingsSubpage/CharacterHooksSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

describe("CharacterHooksSettings Component", () => {
    let mockCharacter: Character;
    let onChangeSpy: Mock<(character: Character | null) => void>;

    beforeEach(() => {
        onChangeSpy = vi.fn(() => {});
        mockCharacter = createTestCharacter();
    });

    test("renders runtime settings correctly", async () => {
        const user = userEvent.setup();
        mockCharacter = createTestCharacter({
            executables: { runtimeSetting: { timeout: 30000 } },
        });

        render(CharacterHooksSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        // Expand Runtime Settings - DaisyUI collapse uses a hidden checkbox
        await user.click(screen.getByRole("checkbox"));

        const memInput = screen.getByLabelText(/Memory \(MB\)/i);
        const timeoutInput = screen.getByLabelText(/Timeout \(ms\)/i);

        expect(memInput).toBeInTheDocument();
        expect(memInput).toHaveValue(null);
        expect(timeoutInput).toHaveValue(30000);
    });

    test("updates runtime settings", async () => {
        const user = userEvent.setup();
        render(CharacterHooksSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        // Expand Runtime Settings - DaisyUI collapse uses a hidden checkbox
        await user.click(screen.getByRole("checkbox"));

        const memInput = screen.getByLabelText(/Memory \(MB\)/i);
        expect(memInput).toBeInTheDocument();

        await fillText(user, memInput, "1024");
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                executables: expect.objectContaining({
                    runtimeSetting: expect.objectContaining({
                        mem: 1024,
                    }),
                }),
            })
        );
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    test("switches between hook tabs", async () => {
        const user = userEvent.setup();
        mockCharacter.executables.replaceHooks.input = [
            {
                input: "hi",
                output: "hello",
                meta: {
                    type: "string",
                    caseSensitive: false,
                    priority: 0,
                    isInputPatternScripted: false,
                    isOutputScripted: false,
                },
            },
        ];

        render(CharacterHooksSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        expect(screen.getByText("No display hooks.")).toBeInTheDocument();

        const tab = screen.getByRole("tab", { name: /Input/i });
        await user.click(tab);

        expect(screen.getByText("hi → hello")).toBeInTheDocument();
    });

    test("adds a new hook", async () => {
        const user = userEvent.setup();
        render(CharacterHooksSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await user.click(screen.getByRole("button", { name: /Add Hook/i }));

        expect(onChangeSpy).toHaveBeenCalled();
        const calledArg = onChangeSpy.mock.calls[0][0];
        expect(calledArg?.executables.replaceHooks.display).toHaveLength(1);
    });

    test("edits a hook", async () => {
        const user = userEvent.setup();
        mockCharacter.executables.replaceHooks.display = [
            {
                input: "foo",
                output: "bar",
                meta: {
                    type: "string",
                    caseSensitive: false,
                    priority: 0,
                    isInputPatternScripted: false,
                    isOutputScripted: false,
                },
            },
        ];

        render(CharacterHooksSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await user.click(screen.getByText("foo → bar"));

        const inputField = screen.getByLabelText("Input Pattern");
        expect(inputField).toBeInTheDocument();
        await fillText(user, inputField, "baz");
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                executables: expect.objectContaining({
                    replaceHooks: expect.objectContaining({
                        display: expect.arrayContaining([
                            expect.objectContaining({ input: "baz" } as const),
                        ]),
                    }),
                }),
            })
        );
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    test("deletes a hook", async () => {
        const user = userEvent.setup();
        mockCharacter.executables.replaceHooks.display = [
            {
                input: "hookToRemove",
                output: "",
                meta: {
                    type: "string",
                    caseSensitive: false,
                    priority: 0,
                    isInputPatternScripted: false,
                    isOutputScripted: false,
                },
            },
        ];

        render(CharacterHooksSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await user.click(screen.getByText("hookToRemove → (empty)"));

        const delBtn = screen.getByRole("button", { name: /Delete/i });
        expect(delBtn).toBeInTheDocument();
        await user.click(delBtn);

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                /* eslint-disable @typescript-eslint/no-unsafe-assignment */
                executables: expect.objectContaining({
                    replaceHooks: expect.objectContaining({
                        display: [],
                    }),
                }),
                /* eslint-enable @typescript-eslint/no-unsafe-assignment */
            })
        );
    });

    test("handles regex type and case sensitive toggle", async () => {
        const user = userEvent.setup();
        mockCharacter.executables.replaceHooks.display = [
            {
                input: "test",
                output: "",
                meta: {
                    type: "string",
                    caseSensitive: false,
                    priority: 0,
                    isInputPatternScripted: false,
                    isOutputScripted: false,
                },
            },
        ];

        render(CharacterHooksSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await user.click(screen.getByText("test → (empty)"));

        const caseSensitiveCheckbox = screen.getByLabelText("Case Sensitive");
        expect(caseSensitiveCheckbox).toBeInTheDocument();

        const typeSelect = screen.getByLabelText("Type");
        expect(typeSelect).toBeInTheDocument();

        // Use selectOptions (plural)
        await user.selectOptions(typeSelect, "regex");

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                /* eslint-disable @typescript-eslint/no-unsafe-assignment */
                executables: expect.objectContaining({
                    replaceHooks: expect.objectContaining({
                        display: expect.arrayContaining([
                            expect.objectContaining({
                                meta: expect.objectContaining({ type: "regex" }),
                            }),
                        ]),
                    }),
                }),
                /* eslint-enable @typescript-eslint/no-unsafe-assignment */
            })
        );
    });
});
