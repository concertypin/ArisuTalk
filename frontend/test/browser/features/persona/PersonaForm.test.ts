import { test, expect, describe, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
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
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

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
        mockOnSave.mockClear();
        mockOnCancel.mockClear();
    });

    test("renders create form when no persona is provided", () => {
        render(PersonaForm, {
            props: {
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        expect(screen.getByRole("heading", { name: "Create New Persona" })).toBeInTheDocument();
        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Note/i)).toBeInTheDocument();
    });

    test("renders edit form when persona is provided", () => {
        render(PersonaForm, {
            props: {
                persona: mockPersona,
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        expect(screen.getByRole("heading", { name: "Edit Persona" })).toBeInTheDocument();
        const nameInput = screen.getByLabelText(/Name/i);
        expect(nameInput).toHaveValue("Test Persona");
    });

    test("populates form with persona data", () => {
        render(PersonaForm, {
            props: {
                persona: mockPersona,
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        expect(screen.getByLabelText(/Name/i)).toHaveValue("Test Persona");
        expect(screen.getByLabelText(/Description/i)).toHaveValue("A test persona");
        expect(screen.getByLabelText(/Note/i)).toHaveValue("Test note");
    });

    test("calls personaStore.add when creating new persona", async () => {
        const user = userEvent.setup();
        render(PersonaForm, {
            props: {
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        const nameInput = screen.getByLabelText(/Name/i);
        const descriptionInput = screen.getByLabelText(/Description/i);

        await fillText(user, nameInput, "New Persona");
        await fillText(user, descriptionInput, "New description");

        const submitButton = screen.getByRole("button", { name: /Save/i });
        await user.click(submitButton);

        expect(personaStore.add).toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalled();
    });

    test("calls personaStore.update when editing persona", async () => {
        const user = userEvent.setup();
        render(PersonaForm, {
            props: {
                persona: mockPersona,
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        const nameInput = screen.getByLabelText(/Name/i);
        await fillText(user, nameInput, "Updated Name");

        const submitButton = screen.getByRole("button", { name: /Save/i });
        await user.click(submitButton);

        expect(personaStore.update).toHaveBeenCalledWith("persona-1", expect.any(Object));
        expect(mockOnSave).toHaveBeenCalled();
    });

    test("calls onCancel when cancel button is clicked", async () => {
        const user = userEvent.setup();
        render(PersonaForm, {
            props: {
                persona: mockPersona,
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        const cancelButton = screen.getByRole("button", { name: /Cancel/i });
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    test("shows error message when name is empty", async () => {
        const user = userEvent.setup();
        render(PersonaForm, {
            props: {
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        const nameInput = screen.getByLabelText(/Name/i);
        await fillText(user, nameInput, ""); // Clear name

        const submitButton = screen.getByRole("button", { name: /Save Persona/i });
        await user.click(submitButton);

        const errorMessage = screen.getByText(/Name is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    test("handles save button click", async () => {
        const user = userEvent.setup();
        render(PersonaForm, {
            props: {
                persona: mockPersona,
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        const submitButton = screen.getByRole("button", { name: /Save/i });
        await user.click(submitButton);

        expect(mockOnSave).toHaveBeenCalled();
    });

    test("handles cancel button click", async () => {
        const user = userEvent.setup();
        render(PersonaForm, {
            props: {
                persona: mockPersona,
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        const cancelButton = screen.getByRole("button", { name: /Cancel/i });
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledOnce();
    });
});
