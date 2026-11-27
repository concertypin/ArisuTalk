/**
 * @fileoverview Tests for the Phonebook store. The real API client runs on top of a stubbed
 * `fetch`, so the tests check the requests that leave the store and how it reacts to answers.
 * Only the character store (another feature's persistence) is replaced.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { phonebookStore } from "@/features/phonebook/stores/phonebookStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { setTokenProvider } from "@/lib/api/client";
import { Logger } from "@common/logger/Logger";
import { requestUrl } from "@test/utils/fetch";

vi.mock("@/features/character/stores/characterStore.svelte", () => ({
    characterStore: { add: vi.fn() },
}));

const BASE_URL = "https://phonebook.test";

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
}

describe("PhonebookStore", () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    /** Method and URL of every request sent so far, e.g. `GET https://phonebook.test/`. */
    function sentRequests(): string[] {
        return fetchMock.mock.calls.map(([url, init]) => `${init?.method} ${requestUrl(url)}`);
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
    });

    afterEach(() => {
        phonebookStore.destroy();
        setTokenProvider(null);
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
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
    });
});
