/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import WelcomePage from "@/components/WelcomePage.svelte";

// Mock uiState
vi.mock("@/lib/stores/ui.svelte", () => ({
    uiState: {
        openSettingsModal: vi.fn(),
        settingsModalOpen: false,
        closeSettingsModal: vi.fn(),
    },
}));

describe.concurrent("WelcomePage Component", () => {
    test("renders heading and description", async () => {
        const { container } = render(WelcomePage);
        expect(container.textContent).toContain("ArisuTalk");
        expect(container.textContent).toContain("Create and chat with AI characters");
    });

    test("renders Start Chatting and Settings cards", async () => {
        const { container } = render(WelcomePage);
        expect(container.textContent).toContain("Start Chatting");
        expect(container.textContent).toContain("Settings");
    });

    test("calls onStartChat when Start Chatting is clicked", async () => {
        const startChatMock = vi.fn();
        const { container } = render(WelcomePage, {
            onStartChat: startChatMock,
        });

        const buttons = container.querySelectorAll("button.glass-card");
        expect(buttons.length).toBeGreaterThan(0);
        (buttons[0] as HTMLButtonElement).click();
        expect(startChatMock).toHaveBeenCalled();
    });
});
