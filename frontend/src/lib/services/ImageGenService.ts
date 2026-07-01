/**
 * @fileoverview Service for AI image generation API.
 * Communicates with an image generation API (e.g. NovelAI) to generate images from text prompts.
 */

import { Logger } from "@common/logger/Logger";
import type { ImageGenConfig } from "@/lib/types/IDataModel";

/**
 * Request payload sent to the image generation `/ai/generate-image` endpoint.
 */
interface ImageGenRequest {
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

const API_BASE = "https://api.novelai.net";
const GENERATE_IMAGE_ENDPOINT = "/ai/generate-image";

/**
 * Generates an image from a text prompt using the image generation API.
 *
 * @param prompt - The text description of the image to generate.
 * @param settings - Configuration for generation (API key, model, dimensions, etc.).
 * @returns A Blob containing the generated image (typically PNG).
 * @throws If the API key is missing, the request fails, or the response is not image data.
 */
export async function generateImage(prompt: string, settings: ImageGenConfig): Promise<Blob> {
    if (!settings.apiKey) {
        throw new Error("Image generation API key is required");
    }

    const payload: ImageGenRequest = {
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

    Logger.debug("[ImageGen] Generating image", {
        model: payload.model,
        dimensions: `${payload.parameters.width}x${payload.parameters.height}`,
    });

    const response = await fetch(`${API_BASE}${GENERATE_IMAGE_ENDPOINT}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        Logger.error("[ImageGen] Generation failed", {
            status: response.status,
            error: errorText,
        });
        throw new Error(`Image generation failed (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const blob = await response.blob();

    if (!blob || blob.size === 0) {
        throw new Error("Image generation returned an empty response");
    }

    Logger.debug("[ImageGen] Image generated successfully", {
        size: blob.size,
        type: contentType,
    });

    // Return with the correct MIME type from the response headers
    return new Blob([blob], { type: contentType });
}
