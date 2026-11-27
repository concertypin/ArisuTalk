/**
 * @fileoverview Tests for the NovelAI image generation request. `fetch` is stubbed, so the real
 * API is never contacted.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { generateImage } from "@/lib/services/ImageGenService";
import { ImageGenConfigSchema, type ImageGenConfig } from "@/lib/types/IDataModel";
import { Logger } from "@common/logger/Logger";
import { requestUrl } from "@test/utils/fetch";

/** A config with the schema defaults applied, plus overrides. */
function settings(overrides: Partial<ImageGenConfig> = {}): ImageGenConfig {
    return { ...ImageGenConfigSchema.parse({ apiKey: "key-123" }), ...overrides };
}

function imageResponse(bytes = 4, contentType?: string): Response {
    return new Response(new Uint8Array(bytes), {
        status: 200,
        headers: contentType ? { "content-type": contentType } : {},
    });
}

describe("generateImage", () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    /** The URL, init and parsed JSON payload of the single `fetch` call. */
    function sentRequest() {
        const call = fetchMock.mock.calls[0];
        if (!call) throw new Error("fetch was not called");
        const [url, init] = call;
        const payload: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : null;
        return { url: requestUrl(url), init: init ?? {}, payload };
    }

    beforeEach(() => {
        fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        vi.spyOn(Logger, "debug").mockImplementation(() => {});
        vi.spyOn(Logger, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    test("rejects before any request when the API key is empty", async () => {
        await expect(generateImage("a cat", settings({ apiKey: "" }))).rejects.toThrow(
            "API key is required"
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test("posts the prompt to the NovelAI endpoint with a bearer key", async () => {
        fetchMock.mockResolvedValue(imageResponse());
        await generateImage("a cat", settings());

        const { url, init, payload } = sentRequest();
        expect(url).toBe("https://api.novelai.net/ai/generate-image");
        expect(init.method).toBe("POST");
        const headers = new Headers(init.headers);
        expect(headers.get("Authorization")).toBe("Bearer key-123");
        expect(headers.get("Content-Type")).toBe("application/json");
        expect(payload).toMatchObject({ input: "a cat" });
    });

    test("sends the schema defaults and omits the seed when none is set", async () => {
        fetchMock.mockResolvedValue(imageResponse());
        await generateImage("a cat", settings());

        expect(sentRequest().payload).toEqual({
            input: "a cat",
            model: "nai-diffusion-4",
            parameters: { width: 1024, height: 1024, scale: 7, steps: 28 },
        });
    });

    test("sends the configured parameters including the seed", async () => {
        fetchMock.mockResolvedValue(imageResponse());
        await generateImage(
            "a dog",
            settings({
                model: "nai-diffusion-3",
                width: 512,
                height: 768,
                scale: 5.5,
                steps: 40,
                seed: 1234,
            })
        );

        expect(sentRequest().payload).toEqual({
            input: "a dog",
            model: "nai-diffusion-3",
            parameters: { width: 512, height: 768, scale: 5.5, steps: 40, seed: 1234 },
        });
    });

    test("falls back to 1024x1024 and 28 steps when size and steps are zero", async () => {
        fetchMock.mockResolvedValue(imageResponse());
        await generateImage("x", settings({ width: 0, height: 0, steps: 0 }));

        expect(sentRequest().payload).toMatchObject({
            parameters: { width: 1024, height: 1024, steps: 28 },
        });
    });

    test("keeps a scale of 0 and a seed of 0 instead of replacing them with defaults", async () => {
        fetchMock.mockResolvedValue(imageResponse());
        await generateImage("x", settings({ scale: 0, seed: 0 }));

        expect(sentRequest().payload).toMatchObject({ parameters: { scale: 0, seed: 0 } });
    });

    test("returns the image bytes tagged with the response content type", async () => {
        fetchMock.mockResolvedValue(imageResponse(6, "image/webp"));
        const blob = await generateImage("x", settings());
        expect(blob.type).toBe("image/webp");
        expect(blob.size).toBe(6);
    });

    test("assumes image/png when the response has no content type", async () => {
        fetchMock.mockResolvedValue(imageResponse(3));
        const blob = await generateImage("x", settings());
        expect(blob.type).toBe("image/png");
    });

    test("throws with the status and server text on an HTTP error and logs it", async () => {
        fetchMock.mockResolvedValue(new Response("Invalid token", { status: 401 }));
        await expect(generateImage("x", settings())).rejects.toThrow(
            "Image generation failed (401): Invalid token"
        );
        expect(Logger.error).toHaveBeenCalledWith(
            expect.stringContaining("Generation failed"),
            expect.objectContaining({ status: 401, error: "Invalid token" })
        );
    });

    test("falls back to `Unknown error` when the error body cannot be read", async () => {
        const unreadable = new Response("ignored", { status: 500 });
        vi.spyOn(unreadable, "text").mockRejectedValue(new Error("stream broke"));
        fetchMock.mockResolvedValue(unreadable);
        await expect(generateImage("x", settings())).rejects.toThrow(
            "Image generation failed (500): Unknown error"
        );
    });

    test("throws when the API answers 200 with an empty body", async () => {
        fetchMock.mockResolvedValue(new Response(new Uint8Array(0), { status: 200 }));
        await expect(generateImage("x", settings())).rejects.toThrow("empty response");
    });

    test("propagates a network failure from fetch", async () => {
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
        await expect(generateImage("x", settings())).rejects.toThrow("Failed to fetch");
    });
});
