import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import SNSProfile from "@/features/sns/SNSProfile.svelte";

describe("SNSProfile Component", () => {
    test("renders profile header with name", () => {
        const { container } = render(SNSProfile);
        const heading = container.querySelector("h1");
        expect(heading?.textContent).toContain("Han Jieyon");
    });

    test("displays secret badge", () => {
        const { container } = render(SNSProfile);
        // Look for "Secret" text in the badge area
        const badge = container.querySelector(".badge-pill");
        expect(badge?.textContent).toContain("Secret");
    });

    test("shows profile stats", () => {
        render(SNSProfile);
        expect(screen.getByText("12")).toBeInTheDocument(); // posts count
        expect(screen.getByText("Followers")).toBeInTheDocument();
        expect(screen.getByText("Following")).toBeInTheDocument();
    });

    test("renders tab navigation", () => {
        const { container } = render(SNSProfile);
        const nav = container.querySelector("nav");
        expect(nav?.textContent).toContain("Posts");
        expect(nav?.textContent).toContain("Secrets");
        expect(nav?.textContent).toContain("Tags");
    });

    test("switches to secrets tab", async () => {
        const user = userEvent.setup();
        render(SNSProfile);

        // Click Secrets tab
        const secretsTab = screen.getByText("Secrets");
        await user.click(secretsTab);
        expect(screen.getByText("Secret posts are private")).toBeInTheDocument();
    });

    test("displays frequent tags in header", () => {
        const { container } = render(SNSProfile);
        const header = container.querySelector("header");
        expect(header?.textContent).toContain("#daily");
        expect(header?.textContent).toContain("#hello");
    });
});
