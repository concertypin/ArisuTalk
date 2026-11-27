import { test, expect, describe, vi } from "vitest";
import { screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
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

    const mockOnClick = vi.fn<() => void>();

    test("renders character initials when no avatar", () => {
        renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: false,
            onClick: mockOnClick,
        });

        expect(screen.getByText("TE")).toBeInTheDocument();
    });

    test("renders avatar image when avatarUrl is provided", () => {
        const characterWithAvatar = {
            ...mockCharacter,
            avatarUrl: "https://example.com/avatar.png",
        } satisfies Character;

        renderWithAppContext(CharacterSidebarItem, {
            character: characterWithAvatar,
            active: false,
            onClick: mockOnClick,
        });

        const image = screen.getByRole("img", { name: "Test Character" });
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "https://example.com/avatar.png");
    });

    test("has correct aria-label", () => {
        renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: false,
            onClick: mockOnClick,
        });

        const button = screen.getByLabelText("Test Character");
        expect(button).toBeInTheDocument();
    });

    test("calls onClick when clicked", async () => {
        const user = userEvent.setup();
        renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: false,
            onClick: mockOnClick,
        });

        const button = screen.getByLabelText("Test Character");
        await user.click(button);

        expect(mockOnClick).toHaveBeenCalledOnce();
    });

    test("opens the character settings of an active item instead of calling onClick", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn<() => void>();
        const { appContext } = renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active: true,
            onClick,
        });

        await user.click(screen.getByLabelText("Settings"));

        expect(appContext.characterSettingsOpen).toBe(true);
        expect(appContext.editingCharacter?.id).toBe("char-1");
        expect(onClick).not.toHaveBeenCalled();
    });

    // The pill's pixel size is Tailwind's concern. This only checks that it follows the `active` prop.
    test.each([true, false])("marks the pill when active is %s", (active) => {
        renderWithAppContext(CharacterSidebarItem, {
            character: mockCharacter,
            active,
            onClick: mockOnClick,
        });

        expect(screen.getByTestId("active-pill")).toHaveAttribute("data-active", String(active));
    });
});
