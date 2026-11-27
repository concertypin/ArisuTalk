import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/svelte";
import SNSFeedCard from "@/features/sns/SNSFeedCard.svelte";

describe("SNSFeedCard Component", () => {
    test("renders with default props", () => {
        render(SNSFeedCard);
        expect(screen.getByText("Hello from the SNS mode!")).toBeInTheDocument();
        expect(screen.getByText("User")).toBeInTheDocument();
        expect(screen.getByText("1m ago")).toBeInTheDocument();
    });

    test("renders custom content and author", () => {
        render(SNSFeedCard, {
            props: {
                content: "Custom post content",
                author: "TestUser",
                timestamp: "5m ago",
            },
        });
        expect(screen.getByText("Custom post content")).toBeInTheDocument();
        expect(screen.getByText("TestUser")).toBeInTheDocument();
        expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    test("displays hashtags when provided", () => {
        render(SNSFeedCard, {
            props: {
                tags: ["test", "vitest"],
            },
        });
        expect(screen.getByText("#test")).toBeInTheDocument();
        expect(screen.getByText("#vitest")).toBeInTheDocument();
    });

    test("shows like and comment counts", () => {
        render(SNSFeedCard, {
            props: {
                likes: 42,
                comments: 7,
            },
        });
        expect(screen.getByText("42")).toBeInTheDocument();
        expect(screen.getByText("7")).toBeInTheDocument();
    });
});
