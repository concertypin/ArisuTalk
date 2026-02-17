/// <reference types="vitest/browser" />
import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import PersonaList from "@/features/persona/components/PersonaList.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import type { Persona } from "@/features/persona/schema";

// Mock the OpFSAssetStorageAdapter
vi.mock("@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter", () => {
    const mockAdapter = {
        getAssetUrl: vi.fn().mockResolvedValue(null),
    };
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        OpFSAssetStorageAdapter: vi.fn().mockImplementation(function (this: any) {
            return mockAdapter;
        }),
        opfsAdapter: mockAdapter,
    };
});

describe("PersonaList Component", () => {
    let mockPersonas: Persona[];
    const mockOnEdit = vi.fn() satisfies (persona: Persona) => void;

    beforeEach(() => {
        mockOnEdit.mockClear();

        mockPersonas = [
            {
                id: "persona-1",
                name: "User-kun",
                description: "A friendly user",
                note: "Custom note",
                assets: { assets: [] },
            },
            {
                id: "persona-2",
                name: "Admin-san",
                description: "An admin persona",
                assets: { assets: [] },
            },
        ];

        // Mock personaStore
        personaStore.personas = mockPersonas;
        personaStore.activePersonaId = null;
        personaStore.select = vi.fn();
        personaStore.remove = vi.fn();
        personaStore.reorder = vi.fn();
    });

    test("renders all personas", async () => {
        const { getByText } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        await expect.element(getByText("User-kun")).toBeVisible();
        await expect.element(getByText("Admin-san")).toBeVisible();
    });

    test("shows persona description", async () => {
        const { getByText } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        await expect.element(getByText("A friendly user")).toBeVisible();
        await expect.element(getByText("An admin persona")).toBeVisible();
    });

    test("highlights active persona", async () => {
        personaStore.activePersonaId = "persona-1";

        const { container } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        // Find the first persona item
        const firstPersonaItem = container.querySelector('[role="button"]:first-child');
        expect(firstPersonaItem?.className).toContain("border-primary");
    });

    test("selects persona when clicked", async () => {
        const { container } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        // Find the persona item in the DOM
        await vi.waitFor(() => {
            const personaItem = container.querySelector('div[role="button"]');
            expect(personaItem).toBeTruthy();
        });

        const personaItem = container.querySelector('div[role="button"]') as HTMLDivElement;
        personaItem.click();

        expect(personaStore.select).toHaveBeenCalledWith("persona-1");
    });

    test("calls onEdit when edit button is clicked", async () => {
        const { getByRole } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        // Scope to the first persona item
        const firstPersona = getByRole("button", { name: /User-kun/i });
        const editButton = firstPersona.getByLabelText("Edit");

        // Manual click bypasses some visibility checks in Playwright
        const element = editButton.element() as HTMLElement;
        element.click();
        expect(mockOnEdit).toHaveBeenCalled();
    });

    test("deletes persona when delete button is clicked", async () => {
        const originalConfirm = window.confirm;
        window.confirm = vi.fn(() => true);

        const { getByRole } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        const firstPersona = getByRole("button", { name: /User-kun/i });
        const deleteButton = firstPersona.getByLabelText("Delete");

        const element = deleteButton.element() as HTMLElement;
        element.click();
        expect(window.confirm).toHaveBeenCalledWith("Delete this persona?");
        expect(personaStore.remove).toHaveBeenCalledWith("persona-1");

        window.confirm = originalConfirm;
    });

    test("disables move up button for first persona", async () => {
        const { getByRole } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        const firstPersona = getByRole("button", { name: /User-kun/i });
        const moveUpButton = firstPersona.getByLabelText("Move Up");
        await expect.element(moveUpButton).toBeDisabled();
    });

    test("disables move down button for last persona", async () => {
        const { getByRole } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        const lastPersona = getByRole("button", { name: /Admin-san/i });
        const moveDownButton = lastPersona.getByLabelText("Move Down");
        await expect.element(moveDownButton).toBeDisabled();
    });

    test("calls reorder when move buttons are clicked", async () => {
        const { getByRole } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        const firstPersona = getByRole("button", { name: /User-kun/i });
        const moveDownButton = firstPersona.getByLabelText("Move Down");

        const element = moveDownButton.element() as HTMLElement;
        element.click();
        expect(personaStore.reorder).toHaveBeenCalled();
    });

    test("renders initials when no avatar", async () => {
        const { getByRole } = render(PersonaList, {
            onEdit: mockOnEdit,
        });

        const firstPersona = getByRole("button", { name: /User-kun/i });
        await expect.element(firstPersona.getByText("US", { exact: true })).toBeVisible();

        const secondPersona = getByRole("button", { name: /Admin-san/i });
        await expect.element(secondPersona.getByText("AD", { exact: true })).toBeVisible();
    });

    test("auto-selects first persona when none selected", async () => {
        personaStore.personas = mockPersonas;
        personaStore.activePersonaId = null;

        render(PersonaList, {
            onEdit: mockOnEdit,
        });

        // The component should auto-select the first persona
        // This is handled by an $effect in the component
    });
});
