/// <reference types="vitest/browser" />
import { test, expect, describe } from "vitest";
import { render } from "vitest-browser-svelte";
import SNSFeedCard from "@/features/sns/SNSFeedCard.svelte";

describe.concurrent("SNSFeedCard Component", () => {
    test("renders with default props", async () => {
        const { getByText } = render(SNSFeedCard);
        await expect.element(getByText("Hello from the SNS mode!")).toBeVisible();
        await expect.element(getByText("User")).toBeVisible();
        await expect.element(getByText("1m ago")).toBeVisible();
    });

    test("renders custom content and author", async () => {
        const { getByText } = render(SNSFeedCard, {
            content: "Custom post content",
            author: "TestUser",
            timestamp: "5m ago",
        });
        await expect.element(getByText("Custom post content")).toBeVisible();
        await expect.element(getByText("TestUser")).toBeVisible();
        await expect.element(getByText("5m ago")).toBeVisible();
    });

    test("displays hashtags when provided", async () => {
        const { getByText } = render(SNSFeedCard, {
            tags: ["test", "vitest"],
        });
        await expect.element(getByText("#test")).toBeVisible();
        await expect.element(getByText("#vitest")).toBeVisible();
    });

    test("shows like and comment counts", async () => {
        const { getByText } = render(SNSFeedCard, {
            likes: 42,
            comments: 7,
        });
        await expect.element(getByText("42")).toBeVisible();
        await expect.element(getByText("7")).toBeVisible();
    });
});
