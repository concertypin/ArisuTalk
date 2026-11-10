/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterSidebarItem from "@/features/character/components/CharacterSidebarItem.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

describe("CharacterSidebarItem Component", () => {
    const mockCharacter = {
        id: "char-1",
        specVersion: 0,
        name: "Test Character",
        description: "A test character",
        avatarUrl: undefined,
        assets: { assets: [] },
        prompt: {
            description: "",
            authorsNote: "",
            lorebook: { config: { tokenLimit: 0 }, data: [] },
        },
        executables: {
            runtimeSetting: { mem: undefined, timeout: 30000 },
            replaceHooks: { display: [], input: [], output: [], request: [] },
        },
        metadata: {
            author: undefined,
            license: "",
            version: undefined,
            distributedOn: undefined,
            additionalInfo: undefined,
        },
    } satisfies Character;

    const mockOnClick = vi.fn() satisfies () => void;

    test("renders character initials when no avatar", async () => {
        const { getByText } = renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: false,
            onClick: mockOnClick,
        });

        await expect.element(getByText("TE")).toBeVisible();
    });

    test("renders avatar image when avatarUrl is provided", async () => {
        const characterWithAvatar = {
            ...mockCharacter,
            avatarUrl: "https://example.com/avatar.png",
        } satisfies Character;

        const { getByRole } = renderWithAppContext(CharacterSidebarItem, {
            character: characterWithAvatar,
            active: false,
            onClick: mockOnClick,
        });

        const image = getByRole("img", { name: "Test Character" });
        await expect.element(image).toBeVisible();
        await expect.element(image).toHaveAttribute("src", "https://example.com/avatar.png");
    });

    test("has correct aria-label", async () => {
        const { getByLabelText } = renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: false,
            onClick: mockOnClick,
        });

        const button = getByLabelText("Test Character");
        await expect.element(button).toBeVisible();
    });

    test("calls onClick when clicked", async () => {
        const { getByLabelText } = renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: false,
            onClick: mockOnClick,
        });

        const button = getByLabelText("Test Character");
        await button.click();

        expect(mockOnClick).toHaveBeenCalledOnce();
    });

    test("opens the character settings of an active item instead of calling onClick", async () => {
        const onClick = vi.fn() satisfies () => void;
        const { getByLabelText, appContext } = renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: true,
            onClick,
        });

        await getByLabelText("Settings").click();

        expect(appContext.characterSettingsOpen).toBe(true);
        expect(appContext.editingCharacter?.id).toBe("char-1");
        expect(onClick).not.toHaveBeenCalled();
    });
});
