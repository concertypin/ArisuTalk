/**
 * @fileoverview Component tests for the Phonebook panel. The real phonebook store and API client run
 * on top of a stubbed `fetch`, so each test drives the UI and checks what the user sees and which
 * requests are sent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import PhonebookPanel from "@/features/phonebook/components/PhonebookPanel.svelte";
import {
    phonebookStore,
    type PhonebookEntry,
} from "@/features/phonebook/stores/phonebookStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { setTokenProvider } from "@/lib/api/client";
import { Logger } from "@common/logger/Logger";
import { createTestCharacter } from "@test/utils/character";
import { fillText } from "@test/utils/user";
import { requestUrl } from "@test/utils/fetch";

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
}

function entry(id: string, name: string, description: string): PhonebookEntry {
    return {
        id,
        name,
        description,
        downloads: 3,
        rating: 4,
        characterId: `char-${id}`,
        createdAt: "2026-01-01T00:00:00.000Z",
    };
}

describe("PhonebookPanel", () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    /** `METHOD /path?query` of every request sent so far, without the host. */
    function sentRequests(): string[] {
        return fetchMock.mock.calls.map(([url, init]) => {
            const parsed = new URL(requestUrl(url));
            return `${init?.method} ${parsed.pathname}${parsed.search}`;
        });
    }

    /** Answers the connectivity probe, then delegates to `onApi` for every other path. */
    function backend(onApi: (path: string, init?: RequestInit) => Response | Promise<Response>) {
        fetchMock.mockImplementation(async (url, init) => {
            const { pathname, search } = new URL(requestUrl(url));
            if (pathname === "/") return json("hello");
            return onApi(`${pathname}${search}`, init);
        });
    }

    /** Renders the panel and connects it to the stubbed backend. */
    async function renderConnected() {
        const user = userEvent.setup();
        render(PhonebookPanel);
        await user.click(screen.getByRole("button", { name: "Connect" }));
        await screen.findByText("Connected", { exact: true });
        return user;
    }

    beforeEach(async () => {
        // The store loads from storage asynchronously and would overwrite characters set below.
        await characterStore.initPromise;
        fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        vi.spyOn(Logger, "error").mockImplementation(() => {});
        vi.spyOn(Logger, "warn").mockImplementation(() => {});
        phonebookStore.destroy();
        phonebookStore.searchResults = [];
        phonebookStore.featuredCharacters = [];
        characterStore.characters.length = 0;
        characterStore.characters.push(
            createTestCharacter({ id: "char-1", name: "앨리스" }),
            createTestCharacter({ id: "char-2", name: "밥" })
        );
    });

    afterEach(() => {
        phonebookStore.destroy();
        setTokenProvider(null);
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("connection", () => {
        test("starts idle with an enabled Connect button and no error", () => {
            render(PhonebookPanel);

            screen.getByText("Idle", { exact: true });
            expect(screen.getByRole("button", { name: "Connect" })).toBeEnabled();
            expect(screen.queryByRole("button", { name: "Disconnect" })).not.toBeInTheDocument();
        });

        test("shows Connected and a Disconnect button after a successful connect", async () => {
            backend(() => json({}));

            await renderConnected();

            screen.getByRole("button", { name: "Disconnect" });
            expect(sentRequests()).toEqual(["GET /"]);
        });

        test("disables Connect and swaps the status label while the request is pending", async () => {
            const user = userEvent.setup();
            let release: (response: Response) => void = () => {};
            fetchMock.mockImplementation(
                () => new Promise<Response>((resolve) => (release = resolve))
            );
            render(PhonebookPanel);

            await user.click(screen.getByRole("button", { name: "Connect" }));

            expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
            expect(screen.queryByText("Idle", { exact: true })).not.toBeInTheDocument();

            release(json("hello"));
            await screen.findByText("Connected", { exact: true });
        });

        test("shows the Error state with a message when the backend is unreachable", async () => {
            const user = userEvent.setup();
            fetchMock.mockRejectedValue(new Error("offline"));
            render(PhonebookPanel);

            await user.click(screen.getByRole("button", { name: "Connect" }));

            await screen.findByText("Error", { exact: true });
            screen.getByText("Failed to connect");
            // The user can try again.
            expect(screen.getByRole("button", { name: "Connect" })).toBeEnabled();
        });

        test("returns to Idle after Disconnect", async () => {
            backend(() => json({}));
            const user = await renderConnected();

            await user.click(screen.getByRole("button", { name: "Disconnect" }));

            await screen.findByText("Idle", { exact: true });
            screen.getByRole("button", { name: "Connect" });
        });
    });

    describe("publishing", () => {
        test("lists the local characters in the share dropdown", () => {
            render(PhonebookPanel);

            screen.getByRole("combobox");
            screen.getByRole("option", { name: "앨리스" });
            screen.getByRole("option", { name: "밥" });
        });

        test("keeps Publish disabled until connected and a character is chosen", async () => {
            backend(() => json({}));
            const user = userEvent.setup();
            render(PhonebookPanel);
            const publish = screen.getByRole("button", { name: "Publish to Phonebook" });

            expect(publish).toBeDisabled();

            // A character alone is not enough while disconnected.
            await user.selectOptions(screen.getByRole("combobox"), "char-1");
            expect(publish).toBeDisabled();

            await user.click(screen.getByRole("button", { name: "Connect" }));
            await screen.findByText("Connected", { exact: true });
            expect(publish).toBeEnabled();
        });

        test("keeps Publish disabled when connected but no character is chosen", async () => {
            backend(() => json({}));
            await renderConnected();

            expect(screen.getByRole("button", { name: "Publish to Phonebook" })).toBeDisabled();
        });

        test("posts the chosen character to the backend", async () => {
            let publishedBody: unknown = null;
            backend((path, init) => {
                if (path === "/api/characters" && init?.method === "POST") {
                    publishedBody = typeof init.body === "string" ? JSON.parse(init.body) : null;
                    return json({}, 201);
                }
                return json({}, 404);
            });
            const user = await renderConnected();

            await user.selectOptions(screen.getByRole("combobox"), "char-2");
            await user.click(screen.getByRole("button", { name: "Publish to Phonebook" }));

            await vi.waitFor(() => expect(sentRequests()).toContain("POST /api/characters"));
            expect(publishedBody).toMatchObject({ id: "char-2", name: "밥" });
            expect(
                await screen.findByRole("button", { name: "Publish to Phonebook" })
            ).toBeEnabled();
        });

        test("logs the failure and re-enables Publish when the backend rejects the upload", async () => {
            backend(() => json({ message: "Name already taken" }, 409));
            const user = await renderConnected();

            await user.selectOptions(screen.getByRole("combobox"), "char-1");
            await user.click(screen.getByRole("button", { name: "Publish to Phonebook" }));

            await vi.waitFor(() =>
                expect(Logger.error).toHaveBeenCalledWith(
                    expect.stringContaining("publish"),
                    expect.objectContaining({ message: "Name already taken" })
                )
            );
            expect(
                await screen.findByRole("button", { name: "Publish to Phonebook" })
            ).toBeEnabled();
        });
    });

    describe("search", () => {
        test("disables Search while the query is empty or only whitespace", async () => {
            const user = userEvent.setup();
            render(PhonebookPanel);
            const search = screen.getByRole("button", { name: "Search" });
            expect(search).toBeDisabled();

            await fillText(user, screen.getByRole("textbox"), "   ");
            expect(search).toBeDisabled();

            await fillText(user, screen.getByRole("textbox"), "cat");
            expect(search).toBeEnabled();
        });

        test("sends the encoded query and lists the results", async () => {
            backend((path) =>
                path.startsWith("/api/characters/search")
                    ? json([
                          entry("e1", "고양이 소녀", "고양이 귀를 가진 소녀"),
                          entry("e2", "고양이 버스", "고양이 모양의 버스"),
                      ])
                    : json({}, 404)
            );
            const user = await renderConnected();

            await fillText(user, screen.getByRole("textbox"), "cat & dog");
            await user.click(screen.getByRole("button", { name: "Search" }));

            await screen.findByText("고양이 소녀");
            screen.getByText("고양이 귀를 가진 소녀");
            screen.getByText("고양이 버스");
            expect(sentRequests()).toContain("GET /api/characters/search?q=cat%20%26%20dog");
        });

        test("pressing Enter in the field runs the search", async () => {
            backend((path) =>
                path.startsWith("/api/characters/search")
                    ? json([entry("e1", "고양이 소녀", "설명")])
                    : json({}, 404)
            );
            const user = await renderConnected();

            await fillText(user, screen.getByRole("textbox"), "cat");
            await user.keyboard("{Enter}");

            await screen.findByText("고양이 소녀");
        });

        test("does not search when Enter is pressed on a blank query", async () => {
            backend(() => json([]));
            const user = await renderConnected();
            const before = sentRequests().length;

            await fillText(user, screen.getByRole("textbox"), "   ");
            await user.keyboard("{Enter}");

            expect(sentRequests()).toHaveLength(before);
        });

        test("does not search while disconnected", async () => {
            const user = userEvent.setup();
            render(PhonebookPanel);

            await fillText(user, screen.getByRole("textbox"), "cat");
            await user.click(screen.getByRole("button", { name: "Search" }));

            expect(fetchMock).not.toHaveBeenCalled();
        });

        test("disables Search while searching and shows the results afterwards", async () => {
            let release: (response: Response) => void = () => {};
            fetchMock.mockImplementation(async (url) => {
                if (new URL(requestUrl(url)).pathname === "/") return json("hello");
                return new Promise<Response>((resolve) => (release = resolve));
            });
            const user = await renderConnected();

            await fillText(user, screen.getByRole("textbox"), "cat");
            await user.click(screen.getByRole("button", { name: "Search" }));
            expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();

            release(json([entry("e1", "고양이 소녀", "설명")]));
            await screen.findByText("고양이 소녀");
            expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
        });
    });

    describe("importing", () => {
        test("downloads a result and adds the character to the local store", async () => {
            const downloaded = createTestCharacter({ id: "remote-1", name: "고양이 소녀" });
            backend((path) => {
                if (path.startsWith("/api/characters/search")) {
                    return json([entry("e1", "고양이 소녀", "고양이 귀를 가진 소녀")]);
                }
                if (path === "/api/characters/e1/download") return json({ character: downloaded });
                return json({}, 404);
            });
            const addSpy = vi.spyOn(characterStore, "add").mockResolvedValue(undefined);
            const user = await renderConnected();
            await fillText(user, screen.getByRole("textbox"), "cat");
            await user.click(screen.getByRole("button", { name: "Search" }));
            await screen.findByText("고양이 소녀");

            await user.click(screen.getByRole("button", { name: "Import" }));

            await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1));
            expect(addSpy).toHaveBeenCalledWith(downloaded);
            expect(sentRequests()).toContain("GET /api/characters/e1/download");
        });
    });
});
