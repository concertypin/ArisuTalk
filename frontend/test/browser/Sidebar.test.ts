import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { expectTypeOf } from "vitest";
import Sidebar from "@/components/Sidebar.svelte";
import { uiState } from "@/lib/stores/ui.svelte";

// Mock uiState
vi.mock("@/lib/stores/ui.svelte", () => ({
    uiState: {
        openSettingsModal: vi.fn(),
        settingsModalOpen: false,
        closeSettingsModal: vi.fn(),
    },
}));

describe("Sidebar Component", () => {
    test("renders correctly", async () => {
        const { getByText } = render(Sidebar);
        await expect.element(getByText("ArisuTalk")).toBeVisible();
    });

    test("toggles sidebar", async () => {
        const toggleMock = vi.fn();
        const { getByLabelText } = render(Sidebar, {
            onToggle: toggleMock,
            collapsed: false,
        });

        const toggleBtn = getByLabelText("Collapse sidebar");
        await toggleBtn.click();
        expect(toggleMock).toHaveBeenCalled();
    });

    test("opens settings modal", async () => {
        vi.spyOn(uiState, "openSettingsModal");
        const { getByText } = render(Sidebar);

        await getByText("Settings").click();
        expect(uiState.openSettingsModal).toHaveBeenCalled();
    });

    test("types check", () => {
        expectTypeOf(uiState.openSettingsModal).toBeFunction();
        expectTypeOf(uiState.settingsModalOpen).toBeBoolean();
    });
});
