import type {
    NOVELAI_MODELS,
    NOVELAI_NOISE_SCHEDULES,
    NOVELAI_SAMPLERS,
} from "$constants/novelaiConfig";
import type { NaiAPIParamRequest } from "$types/novelaiRaw";

/**
 *
 */
export type NaiSettings = {
    prompt: string;
    negative_prompt: string;

    model: keyof typeof NOVELAI_MODELS;
    width: number;
    height: number;

    scale: number;
    steps: number;
    noise: number;
    strength: number;
    sampler: (typeof NOVELAI_SAMPLERS)[number];
    seed: number;

    sm: boolean;
    sm_dyn: boolean;

    characterPrompts: Record<string, unknown>[];

    /**
     * Base64 encoded image for img2img or inpainting
     */
    vibeTransferImage?: string;
    baseImage?: string;
    maskImage?: string;

    cfg_rescale: number;
    noise_schedule: (typeof NOVELAI_NOISE_SCHEDULES)[number];
    dynamic_thresholding: boolean;
    dynamic_thresholding_percentile: number;
    dynamic_thresholding_mimic_scale: number;
    controlnet_strength: number;
    legacy: boolean;
    add_original_image: boolean;
    uncond_scale: number;
};
/**
 * Used to send requests to NovelAI API
 * This is a low-level type that maps directly to the API specification.
 * @copyright {@link https://api.novelai.net/docs/}
 */
export type NaiRawRequest = {
    /**
     * Input prompt for the text generation model
     */
    input: string;
    /**
     * Used image generation model
     */
    model: keyof typeof NOVELAI_MODELS;
    /**
     * Generation parameters (model specific)
     */
    parameters: NaiAPIParamRequest;
    /**
     * Custom image generation URL
     */
    url?: string;
    /**
     * Action to use, default is generate
     */
    action?: "generate" | "img2img" | "infill";
};

/**
 * Response from NovelAI API
 * This is a low-level type that maps directly to the API specification.
 * @copyright {@link https://api.novelai.net/docs/}
 */
type NaiRawResponse = {
    /**
     * Incrementing version pointer
     */
    ptr: number;
    /**
     * Generated image in base64
     */
    image: string;
    /**
     * Set to true if the image is final and the generation ended
     */
    final: boolean;
    /**
     * Error from the generation node, if defined. Usually means the end of stream
     */
    error: string;
};
