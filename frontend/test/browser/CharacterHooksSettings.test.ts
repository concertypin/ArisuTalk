/// <reference types="vitest/browser" />

import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterHooksSettings from "@/features/character/components/settingsSubpage/CharacterHooksSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

describe("CharacterHooksSettings Component", () => {
    let mockCharacter: Character;
    let onChangeSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onChangeSpy = vi.fn();
        mockCharacter = {
            id: "char-1",
            specVersion: 0,
            name: "Test Character",
            description: "A test character",
            avatarUrl: "",
            assets: { assets: [] },
            prompt: {
                description: "",
                authorsNote: "",
                lorebook: { config: { tokenLimit: 0 }, data: [] },
            },
            executables: {
                runtimeSetting: { mem: undefined, timeout: 30000 },
                replaceHooks: {
                    display: [],
                    input: [],
                    output: [],
                    request: [],
                },
            },
            metadata: {
                author: "",
                license: "",
                version: "1.0.0",
                distributedOn: "",
                additionalInfo: "",
            },
        };
    });

    test("renders runtime settings correctly", async () => {
        const { getByLabelText, getByText } = render(CharacterHooksSettings, {
            character: mockCharacter,
            // @ts-expect-error - Mock signature mismatch
            onChange: onChangeSpy,
        });

        // Expand Runtime Settings
        await getByText("Runtime Settings").click();

        const memInput = getByLabelText(/Memory \(MB\)/i);
        const timeoutInput = getByLabelText(/Timeout \(ms\)/i);

        await expect.element(memInput).toBeVisible();
        await expect.element(memInput).toHaveValue(null);
        await expect.element(timeoutInput).toHaveValue(30000);
    });

    test("updates runtime settings", async () => {
        const { getByLabelText, getByText } = render(CharacterHooksSettings, {
            character: mockCharacter,
            // @ts-expect-error - Mock signature mismatch
            onChange: onChangeSpy,
        });

        // Expand Runtime Settings
        await getByText("Runtime Settings").click();

        const memInput = getByLabelText(/Memory \(MB\)/i);
        await expect.element(memInput).toBeVisible();

        await memInput.fill("1024");

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                executables: expect.objectContaining({
                    runtimeSetting: expect.objectContaining({
                        mem: 1024,
                    }),
                }),
            })
        );
    });

    test("switches between hook tabs", async () => {
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

        const { getByRole, getByText } = render(CharacterHooksSettings, {
            character: mockCharacter,
            // @ts-expect-error - Mock signature mismatch
            onChange: onChangeSpy,
        });

        await expect.element(getByText("No display hooks.")).toBeVisible();

        const tab = getByRole("tab", { name: /Input/i });
        await tab.click();

        await expect.element(getByText("hi → hello")).toBeVisible();
    });

    test("adds a new hook", async () => {
        const { getByRole } = render(CharacterHooksSettings, {
            character: mockCharacter,
            // @ts-expect-error - Mock signature mismatch
            onChange: onChangeSpy,
        });

        await getByRole("button", { name: /Add Hook/i }).click();

        expect(onChangeSpy).toHaveBeenCalled();
        const calledArg = onChangeSpy.mock.calls[0][0] as Character;
        expect(calledArg.executables.replaceHooks.display).toHaveLength(1);
    });

    test("edits a hook", async () => {
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

        const { getByText, getByLabelText } = render(CharacterHooksSettings, {
            character: mockCharacter,
            // @ts-expect-error - Mock signature mismatch
            onChange: onChangeSpy,
        });

        await getByText("foo → bar").click();

        const inputField = getByLabelText("Input Pattern");
        await expect.element(inputField).toBeVisible();
        await inputField.fill("baz");

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                executables: expect.objectContaining({
                    replaceHooks: expect.objectContaining({
                        display: expect.arrayContaining([
                            expect.objectContaining({ input: "baz" }),
                        ]),
                    }),
                }),
            })
        );
    });

    test("deletes a hook", async () => {
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

        const { getByText, getByRole } = render(CharacterHooksSettings, {
            character: mockCharacter,
            // @ts-expect-error - Mock signature mismatch
            onChange: onChangeSpy,
        });

        await getByText("hookToRemove → (empty)").click();

        const delBtn = getByRole("button", { name: /Delete/i });
        await expect.element(delBtn).toBeVisible();
        await delBtn.click();

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                executables: expect.objectContaining({
                    replaceHooks: expect.objectContaining({
                        display: [],
                    }),
                }),
            })
        );
    });

    test("handles regex type and case sensitive toggle", async () => {
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

        const { getByText, getByLabelText } = render(CharacterHooksSettings, {
            character: mockCharacter,
            // @ts-expect-error - Mock signature mismatch
            onChange: onChangeSpy,
        });

        await getByText("test → (empty)").click();

        const caseSensitiveCheckbox = getByLabelText("Case Sensitive");
        await expect.element(caseSensitiveCheckbox).toBeVisible();

        const typeSelect = getByLabelText("Type");
        await expect.element(typeSelect).toBeVisible();

        // Use selectOptions (plural)
        await typeSelect.selectOptions("regex");

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                executables: expect.objectContaining({
                    replaceHooks: expect.objectContaining({
                        display: expect.arrayContaining([
                            expect.objectContaining({
                                meta: expect.objectContaining({ type: "regex" }),
                            }),
                        ]),
                    }),
                }),
            })
        );
    });
});
