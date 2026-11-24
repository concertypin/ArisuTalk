import { test, expect, describe, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import { createTestAppContext, renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterSettingsModal from "@/features/character/components/CharacterSettingsModal.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { Logger } from "@common/logger/Logger";

// Mock dependencies
vi.mock("@/features/character/stores/characterStore.svelte", () => {
    return {
        characterStore: {
            characters: [],
            update: vi.fn().mockResolvedValue(undefined),
            reorder: vi.fn(),
            add: vi.fn().mockResolvedValue(undefined),
        },
    };
});

vi.mock("@common/logger/Logger", () => ({
    Logger: {
        structured: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

describe("CharacterSettingsModal Component", () => {
    let mockCharacter: Character;
    let selectCharacter: (charId: string | null) => void;

    /** Mounts the modal the way `CharacterLayout` does: while the app context marks it as open. */
    function renderModal() {
        return renderWithAppContext(
            CharacterSettingsModal,
            { character: mockCharacter, selectCharacter },
            createTestAppContext({ characterSettingsOpen: true, editingCharacter: mockCharacter })
        );
    }

    beforeEach(() => {
        vi.clearAllMocks();

        mockCharacter = {
            id: "char-1",
            specVersion: 0,
            name: "Test Character",
            description: "A test character",
            avatarUrl: "https://example.com/avatar.png",
            assets: { assets: [] },
            prompt: {
                description: "Character Description",
                authorsNote: "Author's Note",
                lorebook: {
                    config: { tokenLimit: 1000 },
                    data: [
                        {
                            id: "entry-1",
                            name: "Lore Entry",
                            content: "Lore Content",
                            condition: [{ type: "always" }],
                            multipleConditionResolveStrategy: "any",
                            enabled: true,
                            priority: 0,
                        },
                    ],
                },
            },
            executables: {
                runtimeSetting: { mem: undefined, timeout: 30000 },
                replaceHooks: { display: [], input: [], output: [], request: [] },
            },
            metadata: {
                author: "Test Author",
                license: "MIT",
                version: "1.0.0",
                distributedOn: "https://example.com",
                additionalInfo: "Notes",
            },
        };

        selectCharacter = vi.fn() satisfies (charId: string | null) => void;

        // Initialize characterStore.characters for the index lookups
        characterStore.characters = [mockCharacter];
    });

    test("renders modal when open", () => {
        renderModal();

        // jsdom hides a <dialog> without `open`, so this fails if `showModal()` never ran.
        expect(screen.getByRole("dialog")).toBeVisible();
        // Check header
        expect(
            screen.getByRole("heading", { level: 2, name: "Test Character Settings" })
        ).toBeInTheDocument();

        const tabs = within(screen.getByRole("list")).getAllByRole("button");
        expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual([
            "Basic",
            "Prompt",
            "Lorebook",
            "Assets",
            "Metadata",
            "Magic",
            "Advanced",
        ]);
    });

    test("switches tabs correctly", async () => {
        const user = userEvent.setup();
        renderModal();

        // Initial tab is basic
        expect(screen.getByLabelText("Name", { exact: true })).toBeInTheDocument();

        // Switch to Prompt tab
        const promptTab = screen.getByRole("button", { name: /^Prompt$/i });
        await user.click(promptTab);

        // Wait for tab content
        expect(screen.getByRole("heading", { name: /Prompt Configuration/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Character Prompt Description/i)).toBeInTheDocument();

        // Switch to Lorebook tab
        const lorebookTab = screen.getByRole("button", { name: /^Lorebook$/i });
        await user.click(lorebookTab);
        expect(screen.getByRole("heading", { name: "Lorebook", level: 3 })).toBeInTheDocument();
        expect(screen.getByText(/Entries \(1\)/i)).toBeInTheDocument();
    });

    test("closes modal when close button is clicked", async () => {
        const user = userEvent.setup();
        const { appContext } = renderModal();

        const closeButton = screen.getByText("Close", { exact: true });
        await user.click(closeButton);

        expect(appContext.characterSettingsOpen).toBe(false);
        expect(appContext.editingCharacter).toBeNull();
    });

    test("autosaves when changes are made", async () => {
        const user = userEvent.setup();
        renderModal();

        const nameInput = screen.getByLabelText("Name", { exact: true });
        await fillText(user, nameInput, "Updated Name");

        // The save runs after the 300ms debounce; `waitFor` polls up to its 1000ms default timeout.
        await waitFor(() =>
            expect(characterStore.update).toHaveBeenCalledWith(
                0,
                expect.objectContaining({
                    name: "Updated Name",
                })
            )
        );

        expect(Logger.structured).toHaveBeenCalledWith("character.autosave", expect.anything());
    });

    test("handles lorebook entry addition", async () => {
        const user = userEvent.setup();
        renderModal();

        // Switch to Lorebook tab
        await user.click(screen.getByRole("button", { name: /^Lorebook$/i }));

        // Click Add Entry
        const addButton = screen.getByRole("button", { name: /Add Entry/i });
        await user.click(addButton);

        // Check if new entry appears
        expect(
            screen.getByRole("heading", { level: 4, name: /Entries \(2\)/i })
        ).toBeInTheDocument();
    });

    test("opens the dialog once, however often the character is edited", async () => {
        const user = userEvent.setup();
        const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, "showModal");
        try {
            renderModal();
            const nameInput = screen.getByLabelText("Name", { exact: true });

            await fillText(user, nameInput, "Updated Name");
            await fillText(user, nameInput, "Updated Name Again");
            expect(nameInput).toHaveValue("Updated Name Again");

            const openLogs = vi
                .mocked(Logger.structured)
                .mock.calls.filter(([event]) => event === "modal.open");
            expect(openLogs).toHaveLength(1);
            expect(showModalSpy).toHaveBeenCalledTimes(1);
        } finally {
            showModalSpy.mockRestore();
        }
    });

    test("shows only the subpage heading as an h3, without a duplicate character-name heading", async () => {
        const user = userEvent.setup();
        renderModal();

        expect(
            screen.getByRole("heading", { level: 3, name: "Basic Information" })
        ).toBeInTheDocument();

        const h3Texts = Array.from(document.querySelectorAll("h3")).map((h) =>
            h.textContent.trim()
        );
        expect(h3Texts).toEqual(["Basic Information"]);

        await user.click(screen.getByRole("button", { name: /^Prompt$/i }));
        expect(
            screen.getByRole("heading", { level: 3, name: /Prompt Configuration/i })
        ).toBeInTheDocument();
        expect(document.querySelectorAll("h3").length).toBe(1);
    });

    test("highlights the active tab with menu-active and moves it on click", async () => {
        const user = userEvent.setup();
        renderModal();

        const basic = screen.getByRole("button", { name: /^Basic$/i });
        const prompt = screen.getByRole("button", { name: /^Prompt$/i });

        expect(basic).toHaveClass("menu-active");
        expect(prompt).not.toHaveClass("menu-active");

        await user.click(prompt);

        expect(prompt).toHaveClass("menu-active");
        expect(basic).not.toHaveClass("menu-active");
    });
});
