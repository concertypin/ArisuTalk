/**
 * @fileoverview Behavior of the Phonebook API client: URL building, auth header, body encoding and
 * response/error mapping. `fetch` is stubbed, so nothing reaches the network.
 */
import { afterEach, assert, beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "@/lib/api/client";
import { Logger } from "@common/logger/Logger";
import { requestUrl } from "@test/utils/fetch";

const BASE_URL = "https://phonebook.test";

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

/** Reads the `[url, init]` pair of the n-th `fetch` call. */
function callAt(fetchMock: FetchMock, index = 0) {
    const call = fetchMock.mock.calls[index];
    if (!call) throw new Error(`fetch was not called ${index + 1} time(s)`);
    const [input, init] = call;
    return { url: requestUrl(input), init: init ?? {} };
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
}

/** Reads the `file` entry of a multipart request body as a File, or null. */
function uploadedFile(init: RequestInit): File | null {
    if (!(init.body instanceof FormData)) return null;
    const file = init.body.get("file");
    return file instanceof File ? file : null;
}

describe("api client requests", () => {
    let fetchMock: FetchMock;

    beforeEach(() => {
        fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        vi.stubEnv("VITE_PHONEBOOK_BASE_URL", BASE_URL);
        vi.spyOn(Logger, "warn").mockImplementation(() => {});
        vi.spyOn(Logger, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        apiClient.setTokenProvider(null);
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe("URL and method", () => {
        test("prefixes the path with the configured base URL", async () => {
            fetchMock.mockResolvedValue(jsonResponse({ ok: 1 }));
            await apiClient.get("/api/characters");
            const { url, init } = callAt(fetchMock);
            expect(url).toBe(`${BASE_URL}/api/characters`);
            expect(init.method).toBe("GET");
        });

        test("falls back to the production Phonebook host when the base URL env is empty", async () => {
            vi.stubEnv("VITE_PHONEBOOK_BASE_URL", "");
            fetchMock.mockResolvedValue(jsonResponse({}));
            await apiClient.get("/x");
            expect(callAt(fetchMock).url).toBe("https://phonebook.back.arisutalk.moe/x");
        });

        test.each([
            ["post", () => apiClient.post("/p", { a: 1 }), "POST"],
            ["patch", () => apiClient.patch("/p", { a: 1 }), "PATCH"],
            ["del", () => apiClient.del("/p"), "DELETE"],
        ])("%s sends a %s request", async (_name, send, method) => {
            fetchMock.mockResolvedValue(jsonResponse({}));
            await send();
            expect(callAt(fetchMock).init.method).toBe(method);
        });
    });

    describe("request body", () => {
        test("serializes the body as JSON and sets the content type", async () => {
            fetchMock.mockResolvedValue(jsonResponse({}));
            await apiClient.post("/items", { name: "Kei", tags: ["a", "b"] });
            const { init } = callAt(fetchMock);
            expect(init.body).toBe(JSON.stringify({ name: "Kei", tags: ["a", "b"] }));
            expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
        });

        test("sends no body and no content type when none is given", async () => {
            fetchMock.mockResolvedValue(jsonResponse({}));
            await apiClient.post("/api/check");
            const { init } = callAt(fetchMock);
            expect(init.body).toBeUndefined();
            expect(new Headers(init.headers).has("Content-Type")).toBe(false);
        });

        test("still serializes a falsy body such as 0 or an empty string", async () => {
            fetchMock.mockImplementation(async () => jsonResponse({}));
            await apiClient.post("/items", 0);
            await apiClient.post("/items", "");
            expect(callAt(fetchMock, 0).init.body).toBe("0");
            expect(callAt(fetchMock, 1).init.body).toBe('""');
        });

        test("uploadBlob posts multipart form data with the given filename and no JSON content type", async () => {
            fetchMock.mockResolvedValue(jsonResponse({ id: "a1" }));
            const blob = new Blob(["png-bytes"], { type: "image/png" });

            const res = await apiClient.uploadBlob("/api/upload", blob, "avatar.png");

            const { init } = callAt(fetchMock);
            expect(init.method).toBe("POST");
            expect(uploadedFile(init)?.name).toBe("avatar.png");
            expect(new Headers(init.headers).has("Content-Type")).toBe(false);
            expect(res).toEqual({ ok: true, status: 200, data: { id: "a1" } });
        });

        test("uploadBlob names the file `blob` when no filename is given", async () => {
            fetchMock.mockResolvedValue(jsonResponse({}));
            await apiClient.uploadBlob("/api/upload", new Blob(["x"]));
            expect(uploadedFile(callAt(fetchMock).init)?.name).toBe("blob");
        });
    });

    describe("auth token", () => {
        test("adds a bearer token from the registered provider on every request", async () => {
            const provider = vi.fn<() => Promise<string | null>>().mockResolvedValue("jwt-1");
            apiClient.setTokenProvider(provider);
            fetchMock.mockImplementation(async () => jsonResponse({}));

            await apiClient.get("/a");
            await apiClient.get("/b");

            expect(provider).toHaveBeenCalledTimes(2);
            expect(new Headers(callAt(fetchMock, 0).init.headers).get("Authorization")).toBe(
                "Bearer jwt-1"
            );
            expect(new Headers(callAt(fetchMock, 1).init.headers).get("Authorization")).toBe(
                "Bearer jwt-1"
            );
        });

        test("sends the request unauthenticated when the provider returns null", async () => {
            apiClient.setTokenProvider(async () => null);
            fetchMock.mockResolvedValue(jsonResponse({}));
            await apiClient.get("/a");
            expect(new Headers(callAt(fetchMock).init.headers).has("Authorization")).toBe(false);
        });

        test("sends the request unauthenticated and logs a warning when the provider throws", async () => {
            const failure = new Error("clerk not ready");
            apiClient.setTokenProvider(async () => {
                throw failure;
            });
            fetchMock.mockResolvedValue(jsonResponse({ fine: true }));

            const res = await apiClient.get("/a");

            expect(res.ok).toBe(true);
            expect(new Headers(callAt(fetchMock).init.headers).has("Authorization")).toBe(false);
            expect(Logger.warn).toHaveBeenCalledWith(
                expect.stringContaining("auth token"),
                failure
            );
        });

        test("stops sending a token after the provider is cleared", async () => {
            apiClient.setTokenProvider(async () => "jwt");
            apiClient.setTokenProvider(null);
            fetchMock.mockResolvedValue(jsonResponse({}));
            await apiClient.get("/a");
            expect(new Headers(callAt(fetchMock).init.headers).has("Authorization")).toBe(false);
        });
    });

    describe("response mapping", () => {
        test("returns the parsed JSON body of a successful response", async () => {
            fetchMock.mockResolvedValue(jsonResponse({ list: [1, 2, 3] }, 201));
            const res = await apiClient.get<{ list: number[] }>("/a");
            expect(res).toEqual({ ok: true, status: 201, data: { list: [1, 2, 3] } });
        });

        test("returns null data for 204 No Content", async () => {
            fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
            const res = await apiClient.post("/api/check");
            expect(res).toEqual({ ok: true, status: 204, data: null });
        });

        test("uses the message field of a JSON error body", async () => {
            fetchMock.mockResolvedValue(jsonResponse({ message: "Character not found" }, 404));
            const res = await apiClient.get("/a");
            expect(res).toEqual({ ok: false, status: 404, error: "Character not found" });
        });

        test.each([
            ["has no message field", { code: 7 }],
            ["has a non-string message", { message: 42 }],
            ["is not an object", "plain string"],
            ["is null", null],
        ])("falls back to a status message when a JSON error body %s", async (_name, body) => {
            fetchMock.mockResolvedValue(jsonResponse(body, 500));
            const res = await apiClient.get("/a");
            expect(res).toEqual({
                ok: false,
                status: 500,
                error: "Request failed with status 500",
            });
        });

        test("returns the raw text as the error when a response is not JSON", async () => {
            fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 }));
            const res = await apiClient.get("/a");
            expect(res).toEqual({ ok: false, status: 502, error: "Bad Gateway" });
        });

        test("falls back to a status message when a non-JSON response is empty", async () => {
            fetchMock.mockResolvedValue(new Response("", { status: 503 }));
            const res = await apiClient.get("/a");
            expect(res).toEqual({
                ok: false,
                status: 503,
                error: "Request failed with status 503",
            });
        });

        test("treats a successful response with an invalid JSON body as an error", async () => {
            fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));
            const res = await apiClient.get("/a");
            expect(res).toEqual({ ok: false, status: 200, error: "<html>" });
        });
    });

    describe("network failures", () => {
        test("reports status 0 with the error message and logs it", async () => {
            fetchMock.mockRejectedValue(new Error("Failed to fetch"));
            const res = await apiClient.get("/a");
            expect(res).toEqual({ ok: false, status: 0, error: "Failed to fetch" });
            expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining("GET /a"));
        });

        test("uses a generic message when a non-Error value is thrown", async () => {
            fetchMock.mockRejectedValue("boom");
            const res = await apiClient.del("/a");
            expect(res).toEqual({ ok: false, status: 0, error: "Network error" });
        });
    });

    describe("getRaw", () => {
        test("returns the untouched Response so callers can read non-JSON bodies", async () => {
            const response = new Response("binary", { status: 200 });
            fetchMock.mockResolvedValue(response);
            const res = await apiClient.getRaw("/api/assets/1");
            assert(res.ok, "getRaw should succeed");
            expect(res.data).toBe(response);
            expect(await res.data.text()).toBe("binary");
        });

        test("does not turn an HTTP error status into an error result", async () => {
            fetchMock.mockResolvedValue(new Response("nope", { status: 404 }));
            const res = await apiClient.getRaw("/api/assets/1");
            expect(res.ok).toBe(true);
            expect(res.status).toBe(404);
        });

        test("reports network failures like the other methods", async () => {
            fetchMock.mockRejectedValue(new Error("offline"));
            const res = await apiClient.getRaw("/a");
            expect(res).toEqual({ ok: false, status: 0, error: "offline" });
        });
    });
});
