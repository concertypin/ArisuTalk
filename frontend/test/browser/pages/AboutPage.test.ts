import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/svelte";
import AboutPage from "@/components/settingSubpage/AboutPage.svelte";

describe("AboutPage Component", () => {
    test("renders correctly", () => {
        render(AboutPage);

        expect(screen.getByText("ArisuTalk")).toBeInTheDocument();
        expect(screen.getByText("Made with 💖 by concertypin")).toBeInTheDocument();

        // Use regex for version text since it depends on env vars which might be undefined/different in test
        expect(screen.getByText(/Version .* on channel .*/)).toBeInTheDocument();

        const githubLink = screen.getByRole("link", { name: "GitHub" });
        expect(githubLink).toBeInTheDocument();

        const reportLink = screen.getByRole("link", { name: "Report Issue" });
        expect(reportLink).toBeInTheDocument();
    });
});
