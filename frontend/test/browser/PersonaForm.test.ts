import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import PersonaForm from "@/features/persona/components/PersonaForm.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import type { Persona } from "@/features/persona/schema";

// Mock the personaStore
vi.mock("@/features/persona/stores/personaStore.svelte", () => {
    const mockStore = {
        personas: [],
        activePersonaId: null,
        add: vi.fn() satisfies () => void,
        update: vi.fn() satisfies () => void,
    };
    return {
        personaStore: mockStore,
    };
});

describe("PersonaForm Component", () => {
    let mockPersona: Persona;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPersona = {
            id: "persona-1",
            name: "Test Persona",
            description: "A test persona",
            note: "Test note",
            assets: { assets: [] },
        };

        personaStore.personas = [];
        personaStore.add = vi.fn() satisfies () => void;
        personaStore.update = vi.fn() satisfies () => void;
    });

    test("renders create form when no persona is provided", async () => {
        const { getByRole, getByLabelText } = render(PersonaForm, {
            onSave: vi.fn(),
            onCancel: vi.fn(),
        });

        await expect.element(getByRole("heading", { name: "Create New Persona" })).toBeVisible();
        await expect.element(getByLabelText(/Name/i)).toBeVisible();
        await expect.element(getByLabelText(/Description/i)).toBeVisible();
        await expect.element(getByLabelText(/Note/i)).toBeVisible();
    });

    test("renders edit form when persona is provided", async () => {
        const { getByRole, getByLabelText } = render(PersonaForm, {
            persona: mockPersona,
            onSave: vi.fn(),
            onCancel: vi.fn(),
        });

        await expect.element(getByRole("heading", { name: "Edit Persona" })).toBeVisible();
        const nameInput = getByLabelText(/Name/i);
        await expect.element(nameInput).toHaveValue("Test Persona");
    });

    test("populates form with persona data", async () => {
        const { getByLabelText } = render(PersonaForm, {
            persona: mockPersona,
            onSave: vi.fn(),
            onCancel: vi.fn(),
        });

        await expect.element(getByLabelText(/Name/i)).toHaveValue("Test Persona");
        await expect.element(getByLabelText(/Description/i)).toHaveValue("A test persona");
        await expect.element(getByLabelText(/Note/i)).toHaveValue("Test note");
    });

    test("calls personaStore.add when creating new persona", async () => {
        const mockOnSave = vi.fn();
        const { getByLabelText, getByRole } = render(PersonaForm, {
            onSave: mockOnSave,
            onCancel: vi.fn(),
        });

        const nameInput = getByLabelText(/Name/i);
        const descriptionInput = getByLabelText(/Description/i);

        await nameInput.fill("New Persona");
        await descriptionInput.fill("New description");

        const submitButton = getByRole("button", { name: /Save/i });
        await submitButton.click();

        expect(personaStore.add).toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalled();
    });

    test("calls personaStore.update when editing persona", async () => {
        const mockOnSave = vi.fn();
        const { getByLabelText, getByRole } = render(PersonaForm, {
            persona: mockPersona,
            onSave: mockOnSave,
            onCancel: vi.fn(),
        });

        const nameInput = getByLabelText(/Name/i);
        await nameInput.fill("Updated Name");

        const submitButton = getByRole("button", { name: /Save/i });
        await submitButton.click();

        expect(personaStore.update).toHaveBeenCalledWith("persona-1", expect.any(Object));
        expect(mockOnSave).toHaveBeenCalled();
    });

    test("calls onCancel when cancel button is clicked", async () => {
        const mockOnCancel = vi.fn();
        const { getByRole } = render(PersonaForm, {
            persona: mockPersona,
            onSave: vi.fn(),
            onCancel: mockOnCancel,
        });

        const cancelButton = getByRole("button", { name: /Cancel/i });
        await cancelButton.click();

        expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    test("shows error message when name is empty", async () => {
        const mockOnSave = vi.fn();
        const { getByLabelText, getByRole, getByText } = render(PersonaForm, {
            onSave: mockOnSave,
            onCancel: vi.fn(),
        });

        const nameInput = getByLabelText(/Name/i);
        await nameInput.fill(""); // Clear name

        const submitButton = getByRole("button", { name: /Save/i });
        await submitButton.click();

        const errorMessage = getByText(/validation failed/i);
        await expect.element(errorMessage).toBeVisible();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    test("handles save button click", async () => {
        const mockOnSave = vi.fn();
        const { getByRole } = render(PersonaForm, {
            persona: mockPersona,
            onSave: mockOnSave,
            onCancel: vi.fn(),
        });

        const submitButton = getByRole("button", { name: /Save/i });
        await submitButton.click();

        expect(mockOnSave).toHaveBeenCalled();
    });

    test("handles cancel button click", async () => {
        const mockOnCancel = vi.fn();
        const { getByRole } = render(PersonaForm, {
            persona: mockPersona,
            onSave: vi.fn(),
            onCancel: mockOnCancel,
        });

        const cancelButton = getByRole("button", { name: /Cancel/i });
        await cancelButton.click();

        expect(mockOnCancel).toHaveBeenCalledOnce();
    });
});
