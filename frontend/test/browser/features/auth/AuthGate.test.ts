import { describe, it, expect } from "vitest";
import { createRawSnippet } from "svelte";
import { render, screen } from "@testing-library/svelte";
import AuthGate from "@/features/auth/components/AuthGate.svelte";

/** A snippet that renders the given HTML, standing in for the app content the gate wraps. */
function content(html: string) {
    return createRawSnippet(() => ({ render: () => html }));
}

describe("AuthGate", () => {
    // Authentication is a placeholder for now: the gate must not hide the app from anyone.
    it("renders its children without requiring a sign-in", () => {
        render(AuthGate, {
            props: { children: content('<button type="button">채팅 열기</button>') },
        });

        expect(screen.getByRole("button", { name: "채팅 열기" })).toBeEnabled();
    });
});
