import { test, expect, describe, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import PersonaList from "@/features/persona/components/PersonaList.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import type { Persona } from "@/features/persona/schema";

// Mock the OpFSAssetStorageAdapter
vi.mock("@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter", () => {
    const mockAdapter = {
        getAssetUrl: vi.fn().mockResolvedValue(null),
    };
    return {
        // oxlint-disable-next-line typescript/no-explicit-any
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

    test("renders all personas", () => {
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        expect(screen.getByText("User-kun")).toBeInTheDocument();
        expect(screen.getByText("Admin-san")).toBeInTheDocument();
    });

    test("shows persona description", () => {
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        expect(screen.getByText("A friendly user")).toBeInTheDocument();
        expect(screen.getByText("An admin persona")).toBeInTheDocument();
    });

    test("highlights active persona", () => {
        personaStore.activePersonaId = "persona-1";

        const { container } = render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        // Find the first persona item
        const firstPersonaItem = container.querySelector('[role="button"]:first-child');
        expect(firstPersonaItem?.className).toContain("border-primary");
    });

    test("selects persona when clicked", async () => {
        const user = userEvent.setup();
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        await user.click(screen.getByRole("button", { name: /User-kun/i }));

        expect(personaStore.select).toHaveBeenCalledWith("persona-1");
    });

    test("calls onEdit when edit button is clicked", async () => {
        const user = userEvent.setup();
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        // Scope to the first persona item
        const firstPersona = screen.getByRole("button", { name: /User-kun/i });
        const editButton = within(firstPersona).getByLabelText("Edit");

        await user.click(editButton);
        expect(mockOnEdit).toHaveBeenCalled();
    });

    test("deletes persona when delete button is clicked", async () => {
        const user = userEvent.setup();
        const originalConfirm = window.confirm;
        window.confirm = vi.fn(() => true);

        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const firstPersona = screen.getByRole("button", { name: /User-kun/i });
        const deleteButton = within(firstPersona).getByLabelText("Delete");

        await user.click(deleteButton);
        expect(window.confirm).toHaveBeenCalledWith("Delete this persona?");
        expect(personaStore.remove).toHaveBeenCalledWith("persona-1");

        window.confirm = originalConfirm;
    });

    test("disables move up button for first persona", () => {
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const firstPersona = screen.getByRole("button", { name: /User-kun/i });
        const moveUpButton = within(firstPersona).getByLabelText("Move Up");
        expect(moveUpButton).toBeDisabled();
    });

    test("disables move down button for last persona", () => {
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const lastPersona = screen.getByRole("button", { name: /Admin-san/i });
        const moveDownButton = within(lastPersona).getByLabelText("Move Down");
        expect(moveDownButton).toBeDisabled();
    });

    test("calls reorder when move buttons are clicked", async () => {
        const user = userEvent.setup();
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const firstPersona = screen.getByRole("button", { name: /User-kun/i });
        const moveDownButton = within(firstPersona).getByLabelText("Move Down");

        await user.click(moveDownButton);
        expect(personaStore.reorder).toHaveBeenCalled();
    });

    test("renders initials when no avatar", () => {
        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const firstPersona = screen.getByRole("button", { name: /User-kun/i });
        expect(within(firstPersona).getByText("US", { exact: true })).toBeInTheDocument();

        const secondPersona = screen.getByRole("button", { name: /Admin-san/i });
        expect(within(secondPersona).getByText("AD", { exact: true })).toBeInTheDocument();
    });

    test("auto-selects first persona when none selected", async () => {
        personaStore.personas = mockPersonas;
        personaStore.activePersonaId = null;
        personaStore.select = vi.fn();

        render(PersonaList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        await waitFor(() => {
            expect(personaStore.select).toHaveBeenCalledWith("persona-1");
        });
    });
});
