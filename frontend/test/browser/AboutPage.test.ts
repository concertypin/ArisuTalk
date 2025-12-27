
/// <reference types="vitest/browser" />
import { test, expect, describe } from "vitest";
import { render } from "vitest-browser-svelte";
import AboutPage from "@/components/settingSubpage/AboutPage.svelte";

describe("AboutPage Component", () => {
    test("renders correctly", async () => {
        const { getByText, getByRole } = render(AboutPage);

        await expect.element(getByText("ArisuTalk")).toBeVisible();
        await expect.element(getByText("Made with 💖 by concertypin")).toBeVisible();

        // Use regex for version text since it depends on env vars which might be undefined/different in test
        await expect.element(getByText(/Version .* on channel .*/)).toBeVisible();

        const githubLink = getByRole("link", { name: "GitHub" });
        await expect.element(githubLink).toBeVisible();

        const reportLink = getByRole("link", { name: "Report Issue" });
        await expect.element(reportLink).toBeVisible();
    });
});
