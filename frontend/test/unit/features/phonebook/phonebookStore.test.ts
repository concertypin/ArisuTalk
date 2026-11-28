/**
 * @fileoverview Tests for the Phonebook store. The real API client runs on top of a stubbed
 * `fetch`, so the tests check the requests that leave the store and how it reacts to answers.
 * Only the character store (another feature's persistence) is replaced.
 */
import { beforeEach, describe, expect, it, onTestFinished, vi, type Mocked } from "vitest";
import { cloneDeep } from "lodash-es";
import {
    phonebookStore,
    type PhonebookEntry,
} from "@/features/phonebook/stores/phonebookStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { setTokenProvider } from "@/lib/api/client";
import { exampleCharacter } from "@/const/example_data";
import { Logger } from "@common/logger/Logger";
import { requestUrl } from "@test/utils/fetch";

vi.mock("@/features/character/stores/characterStore.svelte", () => ({
    characterStore: { add: vi.fn() } satisfies Partial<Mocked<typeof characterStore>>,
}));

const BASE_URL = "https://phonebook.test";

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
}

function entry(id: string): PhonebookEntry {
    return {
        id,
        name: `Name ${id}`,
        description: `Description ${id}`,
        downloads: 1,
        rating: 4.5,
        characterId: `char-${id}`,
        createdAt: "2026-01-01T00:00:00.000Z",
    };
}

/** Creates a response whose body cannot be read, which makes the API client itself throw. */
function unreadableResponse(message: string): Response {
    const response = new Response("x", { status: 200 });
    vi.spyOn(response, "text").mockRejectedValue(new Error(message));
    return response;
}

describe("PhonebookStore", () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    /** Method and URL of every request sent so far, e.g. `GET https://phonebook.test/`. */
    function sentRequests(): string[] {
        return fetchMock.mock.calls.map(([url, init]) => `${init?.method} ${requestUrl(url)}`);
    }

    /** Puts the store into the `connected` state through its public API. */
    async function connectStore() {
        fetchMock.mockImplementation(async () => json("ok"));
        await phonebookStore.connect();
        expect(phonebookStore.connection).toBe("connected");
        fetchMock.mockReset();
    }

    beforeEach(() => {
        fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        vi.stubEnv("VITE_PHONEBOOK_BASE_URL", BASE_URL);
        vi.spyOn(Logger, "info").mockImplementation(() => {});
        vi.spyOn(Logger, "warn").mockImplementation(() => {});
        vi.spyOn(Logger, "error").mockImplementation(() => {});
        vi.spyOn(Logger, "structured").mockImplementation(() => {});
        phonebookStore.destroy();
        phonebookStore.featuredCharacters = [];
        phonebookStore.searchResults = [];
        vi.mocked(characterStore.add).mockReset();
        onTestFinished(() => {
            phonebookStore.destroy();
            setTokenProvider(null);
            vi.useRealTimers();
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
            vi.restoreAllMocks();
        });
    });

    describe("init", () => {
        it("checks connectivity right away and becomes connected", async () => {
            fetchMock.mockImplementation(async () => json("hello"));

            phonebookStore.init(async () => null);
            await vi.waitFor(() => expect(phonebookStore.connection).toBe("connected"));

            expect(sentRequests()).toEqual([`GET ${BASE_URL}/`]);
        });

        it("registers the token provider for later API requests", async () => {
            fetchMock.mockImplementation(async () => json("hello"));

            phonebookStore.init(async () => "clerk-jwt");
            await vi.waitFor(() => expect(phonebookStore.connection).toBe("connected"));

            const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
            expect(headers.get("Authorization")).toBe("Bearer clerk-jwt");
        });

        it("polls every 30 seconds and ignores a second init call", async () => {
            vi.useFakeTimers();
            fetchMock.mockImplementation(async () => json("hello"));

            phonebookStore.init(async () => null);
            phonebookStore.init(async () => null);
            await vi.advanceTimersByTimeAsync(0);
            expect(fetchMock).toHaveBeenCalledTimes(1);

            await vi.advanceTimersByTimeAsync(29_000);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(1_000);
            expect(fetchMock).toHaveBeenCalledTimes(2);
            await vi.advanceTimersByTimeAsync(30_000);
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });

        it("reports a lost connection found by the periodic check", async () => {
            vi.useFakeTimers();
            fetchMock.mockImplementation(async () => json("hello"));
            phonebookStore.init(async () => null);
            await vi.advanceTimersByTimeAsync(0);
            expect(phonebookStore.connection).toBe("connected");

            fetchMock.mockImplementation(async () => json({ message: "maintenance" }, 503));
            await vi.advanceTimersByTimeAsync(30_000);

            expect(phonebookStore.connection).toBe("error");
            expect(phonebookStore.error).toBe("maintenance");
        });
    });

    describe("destroy", () => {
        it("stops polling and resets the state", async () => {
            vi.useFakeTimers();
            fetchMock.mockImplementation(async () => json("hello"));
            phonebookStore.init(async () => null);
            await vi.advanceTimersByTimeAsync(0);
            expect(phonebookStore.connection).toBe("connected");

            phonebookStore.destroy();
            await vi.advanceTimersByTimeAsync(120_000);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(phonebookStore.connection).toBe("idle");
            expect(phonebookStore.error).toBeNull();
        });

        it("allows init to start again afterwards", async () => {
            vi.useFakeTimers();
            fetchMock.mockImplementation(async () => json("hello"));
            phonebookStore.init(async () => null);
            await vi.advanceTimersByTimeAsync(0);
            phonebookStore.destroy();

            phonebookStore.init(async () => null);
            await vi.advanceTimersByTimeAsync(0);

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(phonebookStore.connection).toBe("connected");
        });
    });

    describe("checkConnectivity", () => {
        it("moves from error back to connected and clears the error", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json({ message: "down" }, 500));
            await phonebookStore.checkConnectivity();
            expect(phonebookStore.connection).toBe("error");

            fetchMock.mockImplementation(async () => json("ok"));
            await phonebookStore.checkConnectivity();

            expect(phonebookStore.connection).toBe("connected");
            expect(phonebookStore.error).toBeNull();
        });

        it("keeps the idle state when the backend is unreachable", async () => {
            fetchMock.mockRejectedValue(new Error("offline"));
            await phonebookStore.checkConnectivity();
            expect(phonebookStore.connection).toBe("idle");
            expect(phonebookStore.error).toBeNull();
        });

        it("records the server message when a connected backend starts failing", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json({ message: "Bad gateway" }, 502));

            await phonebookStore.checkConnectivity();

            expect(phonebookStore.connection).toBe("error");
            expect(phonebookStore.error).toBe("Bad gateway");
        });

        it("records the error message when reading the answer throws", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => unreadableResponse("stream broke"));

            await phonebookStore.checkConnectivity();

            expect(phonebookStore.connection).toBe("error");
            expect(phonebookStore.error).toBe("stream broke");
        });

        it("uses a generic message when something other than an Error is thrown", async () => {
            await connectStore();
            const response = new Response("x", { status: 200 });
            vi.spyOn(response, "text").mockRejectedValue("weird");
            fetchMock.mockImplementation(async () => response);

            await phonebookStore.checkConnectivity();

            expect(phonebookStore.error).toBe("Connection failed");
        });
    });

    describe("connect", () => {
        // Regression: checkConnectivity used to ignore a successful answer while the state was
        // `connecting`, so connect() always ended in the error state.
        it("connects when the backend answers", async () => {
            fetchMock.mockImplementation(async () => json("ok"));

            await phonebookStore.connect();

            expect(phonebookStore.connection).toBe("connected");
            expect(phonebookStore.error).toBeNull();
            expect(sentRequests()).toEqual([`GET ${BASE_URL}/`]);
        });

        it("shows `connecting` while the request is pending", async () => {
            let release: (response: Response) => void = () => {};
            fetchMock.mockImplementation(
                () => new Promise<Response>((resolve) => (release = resolve))
            );

            const pending = phonebookStore.connect();
            expect(phonebookStore.connection).toBe("connecting");

            release(json("ok"));
            await pending;
            expect(phonebookStore.connection).toBe("connected");
        });

        it("ends in the error state with a message when the backend is unreachable", async () => {
            fetchMock.mockRejectedValue(new Error("offline"));

            await phonebookStore.connect();

            expect(phonebookStore.connection).toBe("error");
            expect(phonebookStore.error).toBe("Failed to connect");
        });

        it("does not send another request while connecting or already connected", async () => {
            await connectStore();
            await phonebookStore.connect();
            expect(fetchMock).not.toHaveBeenCalled();
            expect(phonebookStore.connection).toBe("connected");
        });

        it("can retry after an error", async () => {
            fetchMock.mockRejectedValue(new Error("offline"));
            await phonebookStore.connect();
            expect(phonebookStore.connection).toBe("error");

            fetchMock.mockReset();
            fetchMock.mockImplementation(async () => json("ok"));
            await phonebookStore.connect();

            expect(phonebookStore.connection).toBe("connected");
            expect(phonebookStore.error).toBeNull();
        });
    });

    describe("disconnect", () => {
        it("returns to idle, clears the error and stops polling", async () => {
            vi.useFakeTimers();
            fetchMock.mockImplementation(async () => json("hello"));
            phonebookStore.init(async () => null);
            await vi.advanceTimersByTimeAsync(0);

            phonebookStore.disconnect();
            await vi.advanceTimersByTimeAsync(90_000);

            expect(phonebookStore.connection).toBe("idle");
            expect(phonebookStore.error).toBeNull();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("publishCharacter", () => {
        it("refuses to publish while not connected and sends nothing", async () => {
            await expect(phonebookStore.publishCharacter(exampleCharacter)).rejects.toThrow(
                "Not connected to Phonebook"
            );
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("posts the character as JSON and logs the publication", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json({ id: "pb-1" }, 201));

            await phonebookStore.publishCharacter(exampleCharacter);

            expect(sentRequests()).toEqual([`POST ${BASE_URL}/api/characters`]);
            expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(exampleCharacter));
            expect(Logger.structured).toHaveBeenCalledWith("phonebook.character.publish", {
                characterId: exampleCharacter.id,
                name: exampleCharacter.name,
            });
        });

        it("flags `isPublishing` only while the request is in flight", async () => {
            await connectStore();
            let release: (response: Response) => void = () => {};
            fetchMock.mockImplementation(
                () => new Promise<Response>((resolve) => (release = resolve))
            );

            const pending = phonebookStore.publishCharacter(exampleCharacter);
            expect(phonebookStore.isPublishing).toBe(true);

            release(json({}, 201));
            await pending;
            expect(phonebookStore.isPublishing).toBe(false);
        });

        it("throws the server's message on failure and clears `isPublishing`", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json({ message: "Name already taken" }, 409));

            await expect(phonebookStore.publishCharacter(exampleCharacter)).rejects.toThrow(
                "Name already taken"
            );
            expect(phonebookStore.isPublishing).toBe(false);
            expect(Logger.structured).not.toHaveBeenCalled();
        });
    });

    describe("fetchFeatured", () => {
        it("does nothing while not connected", async () => {
            await phonebookStore.fetchFeatured();
            expect(fetchMock).not.toHaveBeenCalled();
            expect(phonebookStore.featuredCharacters).toEqual([]);
        });

        it("stores the featured entries", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json([entry("1"), entry("2")]));

            await phonebookStore.fetchFeatured();

            expect(sentRequests()).toEqual([`GET ${BASE_URL}/api/characters/featured`]);
            expect(phonebookStore.featuredCharacters.map((e) => e.id)).toEqual(["1", "2"]);
        });

        it("keeps the previous list when the backend answers with an error", async () => {
            await connectStore();
            phonebookStore.featuredCharacters = [entry("old")];
            fetchMock.mockImplementation(async () => json({ message: "oops" }, 500));

            await phonebookStore.fetchFeatured();

            expect(phonebookStore.featuredCharacters.map((e) => e.id)).toEqual(["old"]);
        });

        it("keeps the previous list and warns when the request throws", async () => {
            await connectStore();
            phonebookStore.featuredCharacters = [entry("old")];
            fetchMock.mockImplementation(async () => unreadableResponse("stream broke"));

            await phonebookStore.fetchFeatured();

            expect(phonebookStore.featuredCharacters.map((e) => e.id)).toEqual(["old"]);
            expect(Logger.warn).toHaveBeenCalled();
        });
    });

    describe("search", () => {
        it("does nothing while not connected", async () => {
            await phonebookStore.search("cat");
            expect(fetchMock).not.toHaveBeenCalled();
            expect(phonebookStore.isSearching).toBe(false);
        });

        it("URL-encodes the query and stores the results", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json([entry("1")]));

            await phonebookStore.search("고양이 소녀&x=1/");

            expect(sentRequests()).toEqual([
                `GET ${BASE_URL}/api/characters/search?q=%EA%B3%A0%EC%96%91%EC%9D%B4%20%EC%86%8C%EB%85%80%26x%3D1%2F`,
            ]);
            expect(phonebookStore.searchResults.map((e) => e.id)).toEqual(["1"]);
        });

        it("flags `isSearching` only while the request is in flight", async () => {
            await connectStore();
            let release: (response: Response) => void = () => {};
            fetchMock.mockImplementation(
                () => new Promise<Response>((resolve) => (release = resolve))
            );

            const pending = phonebookStore.search("cat");
            expect(phonebookStore.isSearching).toBe(true);

            release(json([]));
            await pending;
            expect(phonebookStore.isSearching).toBe(false);
        });

        it("replaces earlier results with an empty list when nothing matches", async () => {
            await connectStore();
            phonebookStore.searchResults = [entry("old")];
            fetchMock.mockImplementation(async () => json([]));

            await phonebookStore.search("zzz");

            expect(phonebookStore.searchResults).toEqual([]);
        });

        it("clears the results, warns and stops searching when the request throws", async () => {
            await connectStore();
            phonebookStore.searchResults = [entry("old")];
            fetchMock.mockImplementation(async () => unreadableResponse("stream broke"));

            await phonebookStore.search("cat");

            expect(phonebookStore.searchResults).toEqual([]);
            expect(phonebookStore.isSearching).toBe(false);
            expect(Logger.warn).toHaveBeenCalled();
        });
    });

    describe("importCharacter", () => {
        it("refuses to import while not connected and sends nothing", async () => {
            await expect(phonebookStore.importCharacter("e1")).rejects.toThrow(
                "Not connected to Phonebook"
            );
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("downloads the entry and adds the character to the local store", async () => {
            await connectStore();
            const downloaded = cloneDeep(exampleCharacter);
            downloaded.name = "Downloaded";
            fetchMock.mockImplementation(async () => json({ character: downloaded }));

            await phonebookStore.importCharacter("e1");

            expect(sentRequests()).toEqual([`GET ${BASE_URL}/api/characters/e1/download`]);
            expect(characterStore.add).toHaveBeenCalledTimes(1);
            expect(characterStore.add).toHaveBeenCalledWith(downloaded);
            expect(Logger.structured).toHaveBeenCalledWith("phonebook.character.import", {
                entryId: "e1",
                characterId: downloaded.id,
            });
        });

        it("throws the server's message and adds nothing when the download fails", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json({ message: "Entry not found" }, 404));

            await expect(phonebookStore.importCharacter("missing")).rejects.toThrow(
                "Entry not found"
            );
            expect(characterStore.add).not.toHaveBeenCalled();
        });

        it("throws when the backend answers without any character data", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));

            await expect(phonebookStore.importCharacter("e1")).rejects.toThrow(
                "Failed to download character"
            );
            expect(characterStore.add).not.toHaveBeenCalled();
        });

        it("propagates a failure of the local store", async () => {
            await connectStore();
            fetchMock.mockImplementation(async () => json({ character: exampleCharacter }));
            vi.mocked(characterStore.add).mockRejectedValue(new Error("disk full"));

            await expect(phonebookStore.importCharacter("e1")).rejects.toThrow("disk full");
        });
    });
});
