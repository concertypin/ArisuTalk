/// <reference types="vitest/browser" />
import { test, expect, describe } from "vitest";
import { render } from "vitest-browser-svelte";
import SNSProfile from "@/features/sns/SNSProfile.svelte";

describe.concurrent("SNSProfile Component", () => {
    test("renders profile header with name", async () => {
        const { container } = render(SNSProfile);
        const heading = container.querySelector("h1");
        expect(heading?.textContent).toContain("Han Jieyon");
    });

    test("displays secret badge", async () => {
        const { container } = render(SNSProfile);
        // Look for "Secret" text in the badge area
        const badge = container.querySelector(".badge-pill");
        expect(badge?.textContent).toContain("Secret");
    });

    test("shows profile stats", async () => {
        const { getByText } = render(SNSProfile);
        await expect.element(getByText("12")).toBeVisible(); // posts count
        await expect.element(getByText("Followers")).toBeVisible();
        await expect.element(getByText("Following")).toBeVisible();
    });

    test("renders tab navigation", async () => {
        const { container } = render(SNSProfile);
        const nav = container.querySelector("nav");
        expect(nav?.textContent).toContain("Posts");
        expect(nav?.textContent).toContain("Secrets");
        expect(nav?.textContent).toContain("Tags");
    });

    test("switches to secrets tab", async () => {
        const { getByText } = render(SNSProfile);

        // Click Secrets tab
        const secretsTab = getByText("Secrets");
        await secretsTab.click();
        await expect.element(getByText("Secret posts are private")).toBeVisible();
    });

    test("displays frequent tags in header", async () => {
        const { container } = render(SNSProfile);
        const header = container.querySelector("header");
        expect(header?.textContent).toContain("#daily");
        expect(header?.textContent).toContain("#hello");
    });
});
