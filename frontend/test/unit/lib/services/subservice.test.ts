/**
 * @fileoverview Tests for the cloud backend integration layer. Only `fetch` is stubbed, so the real
 * API client runs and the tests check the requests the service sends and how it maps the answers.
 */
import { afterEach, assert, beforeEach, describe, expect, test, vi } from "vitest";
import { setTokenProvider } from "@/lib/api/client";
import { checkHealth, getUserProfile, updateUserProfile } from "@/lib/services/subservice";
import { Logger } from "@common/logger/Logger";
import { requestUrl } from "@test/utils/fetch";

const BASE_URL = "https://phonebook.test";

describe("subservice", () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    /** URL and method of the n-th `fetch` call. */
    function requestAt(index = 0) {
        const call = fetchMock.mock.calls[index];
        if (!call) throw new Error(`fetch was not called ${index + 1} time(s)`);
        const [url, init] = call;
        return { url: requestUrl(url), method: init?.method, headers: new Headers(init?.headers) };
    }

    beforeEach(() => {
        fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        vi.stubEnv("VITE_PHONEBOOK_BASE_URL", BASE_URL);
        vi.spyOn(Logger, "error").mockImplementation(() => {});
        vi.spyOn(Logger, "info").mockImplementation(() => {});
    });

    afterEach(() => {
        setTokenProvider(null);
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe("checkHealth", () => {
        test("asks the unauthenticated root endpoint and reports connected with the server message", async () => {
            fetchMock.mockResolvedValue(new Response(JSON.stringify("Hello"), { status: 200 }));

            const res = await checkHealth();

            expect(requestAt()).toMatchObject({ url: `${BASE_URL}/`, method: "GET" });
            expect(res).toEqual({
                ok: true,
                status: 200,
                data: { connected: true, message: "Hello" },
            });
        });

        test("forwards the status and error message of an HTTP failure", async () => {
            fetchMock.mockResolvedValue(
                new Response(JSON.stringify({ message: "maintenance" }), { status: 503 })
            );
            const res = await checkHealth();
            expect(res).toEqual({ ok: false, status: 503, error: "maintenance" });
        });

        test("reports a network failure as an error result instead of throwing", async () => {
            fetchMock.mockRejectedValue(new Error("offline"));
            const res = await checkHealth();
            expect(res).toEqual({ ok: false, status: 0, error: "offline" });
        });
    });

    describe("getUserProfile", () => {
        test("validates the session with an authenticated POST /api/check and returns a minimal profile", async () => {
            setTokenProvider(async () => "jwt-abc");
            fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

            const res = await getUserProfile();

            const request = requestAt();
            expect(request).toMatchObject({ url: `${BASE_URL}/api/check`, method: "POST" });
            expect(request.headers.get("Authorization")).toBe("Bearer jwt-abc");
            expect(res).toEqual({
                ok: true,
                status: 200,
                data: { name: "User", authUid: "authenticated", role: "known" },
            });
        });

        test("forwards an authorization failure instead of returning a profile", async () => {
            fetchMock.mockResolvedValue(
                new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
            );
            const res = await getUserProfile();
            expect(res).toEqual({ ok: false, status: 401, error: "Unauthorized" });
        });
    });

    describe("updateUserProfile", () => {
        test("answers 501 because the backend has no profile endpoint yet, without sending a request", async () => {
            const res = await updateUserProfile({ name: "New name" });
            assert(!res.ok, "update should not succeed yet");
            expect(res.status).toBe(501);
            expect(res.error).toContain("not yet available");
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
