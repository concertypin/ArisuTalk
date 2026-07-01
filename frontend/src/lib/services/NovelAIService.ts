/**
 * @fileoverview Service for NovelAI image generation API.
 * Communicates with the NovelAI REST API to generate images from text prompts.
 *
 * @see https://docs.novelai.net/image/novelai-image-generation.html
 */

import { Logger } from "@common/logger/Logger";
import type { NovelAIConfig } from "@/lib/types/IDataModel";

/**
 * Request payload sent to the NovelAI `/ai/generate-image` endpoint.
 */
interface NovelAIGenerationRequest {
    input: string;
    model: string;
    parameters: {
        width: number;
        height: number;
        scale: number;
        steps: number;
        seed?: number;
    };
}

const NOVELAI_API_BASE = "https://api.novelai.net";
const GENERATE_IMAGE_ENDPOINT = "/ai/generate-image";

/**
 * Generates an image from a text prompt using the NovelAI API.
 *
 * @param prompt - The text description of the image to generate.
 * @param settings - Configuration for generation (API key, model, dimensions, etc.).
 * @returns A Blob containing the generated image (typically PNG).
 * @throws If the API key is missing, the request fails, or the response is not image data.
 */
export async function generateImage(prompt: string, settings: NovelAIConfig): Promise<Blob> {
    if (!settings.apiKey) {
        throw new Error("NovelAI API key is required");
    }

    const payload: NovelAIGenerationRequest = {
        input: prompt,
        model: settings.model || "nai-diffusion-4",
        parameters: {
            width: settings.width || 1024,
            height: settings.height || 1024,
            scale: settings.scale ?? 7,
            steps: settings.steps || 28,
        },
    };

    // Include seed only if explicitly set (omitting lets the API choose randomly)
    if (settings.seed !== undefined) {
        payload.parameters.seed = settings.seed;
    }

    Logger.debug("[NovelAI] Generating image", {
        model: payload.model,
        dimensions: `${payload.parameters.width}x${payload.parameters.height}`,
    });

    const response = await fetch(`${NOVELAI_API_BASE}${GENERATE_IMAGE_ENDPOINT}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        Logger.error("[NovelAI] Generation failed", {
            status: response.status,
            error: errorText,
        });
        throw new Error(`NovelAI image generation failed (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const blob = await response.blob();

    if (!blob || blob.size === 0) {
        throw new Error("NovelAI returned an empty response");
    }

    Logger.debug("[NovelAI] Image generated successfully", {
        size: blob.size,
        type: contentType,
    });

    // Return with the correct MIME type from the response headers
    return new Blob([blob], { type: contentType });
}
